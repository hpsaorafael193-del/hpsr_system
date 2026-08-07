-- Migration consolidada das versões 1.0.177 a 1.0.205.
-- Pressupõe que as migrations até 20260802_000041 já foram aplicadas.
-- É idempotente e representa somente o estado final necessário, sem criar
-- tabelas intermediárias de histórico de leitos.

alter table public.time_clock_entries
  add column if not exists close_requested_at timestamptz;

create index if not exists time_clock_entries_pending_close_idx
  on public.time_clock_entries(close_requested_at)
  where closed_at is null and close_requested_at is not null;


-- Fonte consolidada: 20260803_000043_stabilize_patient_registry_and_time_clock.sql
-- Estabiliza o acesso institucional aos pacientes, reduz erros esperados no log
-- e mantém o encerramento diferido do ponto sem falhar quando a sessão já sumiu.

-- Restaura grants que podem ter sido removidos ou não aplicados no ambiente publicado.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.patient_registry to authenticated;

do $$
begin
  if to_regclass('public.patient_portal_access') is not null then
    execute 'grant select, insert, update, delete on table public.patient_portal_access to authenticated';
  end if;
  if to_regclass('public.patient_portal_accounts') is not null then
    execute 'grant select, insert, update, delete on table public.patient_portal_accounts to authenticated';
  end if;
end;
$$;

-- Reaplica a política institucional sem liberar pacientes comuns para administração.
drop policy if exists "staff patient registry" on public.patient_registry;
create policy "staff patient registry" on public.patient_registry
for all to authenticated
using (public.is_hpsr_staff())
with check (public.is_hpsr_staff());

-- Leitura centralizada usada pelo seletor global. Evita depender diretamente dos
-- grants da tabela no cliente e mantém a validação de integrante da equipe.
create or replace function public.list_patient_registry_staff()
returns table (
  passport text,
  name text,
  age text,
  blood_type text,
  city_phone text,
  email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_hpsr_staff() then
    return;
  end if;

  return query
  select p.passport, p.name, p.age, p.blood_type, p.city_phone, p.email, p.created_at
  from public.patient_registry p
  order by p.created_at desc;
end;
$$;

-- Cadastro rápido centralizado. O passaporte continua sendo a chave única e
-- registros existentes são atualizados em vez de duplicados.
create or replace function public.upsert_patient_registry_staff(
  p_passport text,
  p_name text,
  p_age text default null,
  p_blood_type text default null,
  p_city_phone text default null,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_passport text := upper(trim(coalesce(p_passport, '')));
  v_name text := trim(coalesce(p_name, ''));
  v_row public.patient_registry%rowtype;
begin
  if auth.uid() is null or not public.is_hpsr_staff() then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if v_passport = '' or v_name = '' then
    raise exception 'Nome e documento são obrigatórios.';
  end if;

  insert into public.patient_registry(passport, name, age, blood_type, city_phone, email)
  values (
    v_passport,
    v_name,
    nullif(trim(coalesce(p_age, '')), ''),
    nullif(trim(coalesce(p_blood_type, '')), ''),
    nullif(trim(coalesce(p_city_phone, '')), ''),
    nullif(lower(trim(coalesce(p_email, ''))), '')
  )
  on conflict (passport) do update set
    name = excluded.name,
    age = coalesce(excluded.age, public.patient_registry.age),
    blood_type = coalesce(excluded.blood_type, public.patient_registry.blood_type),
    city_phone = coalesce(excluded.city_phone, public.patient_registry.city_phone),
    email = coalesce(excluded.email, public.patient_registry.email),
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object('ok', true, 'passport', v_row.passport, 'name', v_row.name);
end;
$$;

revoke all on function public.list_patient_registry_staff() from public;
revoke all on function public.upsert_patient_registry_staff(text, text, text, text, text, text) from public;
grant execute on function public.list_patient_registry_staff() to authenticated;
grant execute on function public.upsert_patient_registry_staff(text, text, text, text, text, text) to authenticated;

-- Chamadas de pagehide podem chegar depois que o token foi descartado. Isso é
-- um estado esperado do navegador, portanto não deve gerar P0001 nem alterar dados.
create or replace function public.time_clock_request_deferred_close()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('active', false, 'scheduled', false, 'reason', 'no_session');
  end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1
  for update;

  if v_entry.id is null then
    return jsonb_build_object('active', false, 'scheduled', false);
  end if;

  update public.time_clock_entries
  set close_requested_at = v_now,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object(
    'active', true,
    'scheduled', true,
    'closeAfter', v_now + interval '3 minutes'
  );
end;
$$;

create or replace function public.time_clock_heartbeat(p_close boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
  v_deadline timestamptz;
begin
  if v_user is null then
    return jsonb_build_object('active', false, 'closed', false, 'reason', 'no_session');
  end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1
  for update;

  if v_entry.id is null then
    return jsonb_build_object('active', false, 'closed', false);
  end if;

  if p_close then
    perform public.time_clock_close_entry_at(v_entry.id, v_now);
    return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_now);
  end if;

  if v_entry.close_requested_at is not null then
    v_deadline := v_entry.close_requested_at + interval '3 minutes';
    if v_now >= v_deadline then
      perform public.time_clock_close_entry_at(v_entry.id, v_deadline);
      return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_deadline);
    end if;
  end if;

  update public.time_clock_entries
  set last_heartbeat_at = v_now,
      close_requested_at = null,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object('active', true, 'closed', false, 'heartbeatAt', v_now);
end;
$$;

grant execute on function public.time_clock_request_deferred_close() to authenticated;
grant execute on function public.time_clock_heartbeat(boolean) to authenticated;


-- Fonte consolidada: 20260804_000044_obstetric_history_and_time_clock_action_guard.sql
-- Protege ações de pausa/retorno/finalização contra estado visual desatualizado.
-- A função reaproveita o ponto aberto existente e cancela qualquer fechamento
-- diferido antes da ação solicitada, sem criar polling ou consultas recorrentes.

create or replace function public.time_clock_prepare_action()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('active', false, 'reason', 'no_session');
  end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc
  limit 1
  for update;

  if v_entry.id is null then
    update public.profiles
    set service_status = 'Fora de serviço', updated_at = v_now
    where id = v_user and service_status <> 'Fora de serviço';

    return jsonb_build_object('active', false, 'reason', 'no_open_entry');
  end if;

  update public.time_clock_entries
  set close_requested_at = null,
      last_heartbeat_at = v_now,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object(
    'active', true,
    'entryId', v_entry.id,
    'status', v_entry.status
  );
end;
$$;

revoke all on function public.time_clock_prepare_action() from public;
grant execute on function public.time_clock_prepare_action() to authenticated;


-- Fonte consolidada: 20260804_000045_safe_clinical_plan_edit_delete.sql
-- Edição/exclusão atômica dos planejamentos clínicos.
-- Planejamentos são apenas previsões; consultas já confirmadas são preservadas.

create or replace function public.save_clinical_followup_plan(
  p_plan_id uuid,
  p_doctor_name text,
  p_patient_passport text,
  p_patient_name text,
  p_specialty text,
  p_frequency text,
  p_interval_days integer,
  p_start_date date,
  p_end_date date,
  p_total_consultations integer,
  p_total_weeks integer,
  p_planned_dates date[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan_id uuid;
  v_preserved integer := 0;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;
  if coalesce(array_length(p_planned_dates,1),0)=0 then raise exception 'Nenhuma data prevista informada'; end if;

  if p_plan_id is null then
    insert into public.clinical_followup_plans(
      doctor_id,doctor_name,patient_passport,patient_name,specialty,frequency,interval_days,
      start_date,end_date,total_consultations,total_weeks,status,updated_at
    ) values (
      v_user,p_doctor_name,p_patient_passport,p_patient_name,p_specialty,p_frequency,p_interval_days,
      p_start_date,p_end_date,p_total_consultations,p_total_weeks,'Ativo',now()
    ) returning id into v_plan_id;
  else
    select id into v_plan_id from public.clinical_followup_plans
      where id=p_plan_id and doctor_id=v_user for update;
    if v_plan_id is null then raise exception 'Planejamento não encontrado ou sem permissão'; end if;

    select count(*) into v_preserved from public.clinical_followup_occurrences
      where plan_id=v_plan_id and (appointment_id is not null or slot_id is not null);

    update public.clinical_followup_plans set
      doctor_name=p_doctor_name, patient_passport=p_patient_passport, patient_name=p_patient_name,
      specialty=p_specialty, frequency=p_frequency, interval_days=p_interval_days,
      start_date=p_start_date, end_date=p_end_date, total_consultations=p_total_consultations,
      total_weeks=p_total_weeks, status='Ativo', updated_at=now()
    where id=v_plan_id;

    delete from public.clinical_followup_occurrences
      where plan_id=v_plan_id and appointment_id is null and slot_id is null;
  end if;

  insert into public.clinical_followup_occurrences(
    plan_id,doctor_id,patient_passport,patient_name,specialty,planned_date,status,updated_at
  )
  select v_plan_id,v_user,p_patient_passport,p_patient_name,p_specialty,d,'Planejada',now()
  from unnest(p_planned_dates) d
  on conflict (plan_id,planned_date) do nothing;

  return jsonb_build_object('plan_id',v_plan_id,'preserved_confirmed',v_preserved);
end;
$$;

create or replace function public.delete_clinical_followup_plan(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_preserved integer := 0;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;
  perform 1 from public.clinical_followup_plans where id=p_plan_id and doctor_id=v_user for update;
  if not found then raise exception 'Planejamento não encontrado ou sem permissão'; end if;

  select count(*) into v_preserved from public.clinical_followup_occurrences
    where plan_id=p_plan_id and (appointment_id is not null or slot_id is not null);

  delete from public.clinical_followup_occurrences
    where plan_id=p_plan_id and appointment_id is null and slot_id is null;

  if v_preserved > 0 then
    update public.clinical_followup_plans set status='Arquivado',updated_at=now() where id=p_plan_id;
    return jsonb_build_object('archived',true,'preserved_confirmed',v_preserved);
  end if;

  delete from public.clinical_followup_plans where id=p_plan_id;
  return jsonb_build_object('archived',false,'preserved_confirmed',0);
end;
$$;

revoke all on function public.save_clinical_followup_plan(uuid,text,text,text,text,text,integer,date,date,integer,integer,date[]) from public,anon;
grant execute on function public.save_clinical_followup_plan(uuid,text,text,text,text,text,integer,date,date,integer,integer,date[]) to authenticated;
revoke all on function public.delete_clinical_followup_plan(uuid) from public,anon;
grant execute on function public.delete_clinical_followup_plan(uuid) to authenticated;


-- Fonte consolidada: 20260804_000046_archive_deactivated_staff_requests.sql
-- Arquiva cadastros de profissionais desligados na mesma transação do desligamento.
-- Evita que registros antigos retornem como pendentes e gerem notificações.
create or replace function public.admin_deactivate_team_member(
  target_profile_id uuid,
  deactivation_reason text default 'Desligamento administrativo'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  member_name text;
  member_passport text;
  normalized_reason text;
begin
  if not public.is_access_admin() then
    raise exception 'Administrative access required';
  end if;

  normalized_reason := coalesce(nullif(trim(deactivation_reason), ''), 'Desligamento administrativo');

  select p.name into actor_name
  from public.profiles p
  where p.id = auth.uid();

  select p.name, p.passport into member_name, member_passport
  from public.profiles p
  where p.id = target_profile_id;

  if member_name is null then
    raise exception 'Profile not found';
  end if;

  update public.profiles
  set
    access_status = 'Desligado',
    service_status = 'Fora de serviço',
    updated_at = now()
  where id = target_profile_id;

  update public.team_members
  set
    status = 'Desligado',
    payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
      'contractStatus', 'Desligado',
      'serviceStatus', 'Fora de serviço',
      'deactivatedAt', now(),
      'deactivationReason', normalized_reason
    ),
    updated_at = now()
  where id = target_profile_id::text;

  update public.staff_registration_requests
  set
    status = case when status = 'Recusado' then status else 'Aprovado' end,
    payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
      'hiddenAt', now(),
      'hiddenBy', coalesce(actor_name, auth.uid()::text),
      'hiddenReason', normalized_reason,
      'archivedByDeactivation', true,
      'doctorNotificationUnread', false
    ),
    updated_at = now()
  where auth_user_id = target_profile_id
     or (member_passport is not null and passport = member_passport)
     or (member_passport is not null and coalesce(payload->>'passport', '') = member_passport);

  insert into public.system_activities (
    id,
    module,
    action,
    description,
    actor,
    reference,
    created_at
  ) values (
    gen_random_uuid()::text,
    'Direção',
    'Desligamento de membro',
    member_name || ' foi desligado. Motivo: ' || normalized_reason,
    coalesce(actor_name, auth.uid()::text),
    target_profile_id::text,
    now()
  );
end;
$$;

revoke all on function public.admin_deactivate_team_member(uuid, text) from public;
grant execute on function public.admin_deactivate_team_member(uuid, text) to authenticated;


-- Estado atual e histórico consolidado da Gestão de Leitos.
create table if not exists public.hospital_bed_history (
  id uuid primary key default gen_random_uuid(),
  bed_id text not null references public.hospital_beds(id) on delete cascade,
  event_type text not null,
  patient_name text,
  patient_passport text,
  doctor_name text,
  visitor_name text,
  visitor_passport text,
  visitor_age text,
  relation text,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.hospital_bed_history enable row level security;

drop policy if exists "staff bed history access" on public.hospital_bed_history;
create policy "staff bed history access"
  on public.hospital_bed_history for all to authenticated
  using (public.is_hpsr_staff())
  with check (public.is_hpsr_staff());

grant select, insert, update, delete on public.hospital_bed_history to authenticated;

create index if not exists hospital_bed_history_bed_created_idx
  on public.hospital_bed_history (bed_id, created_at desc);
create index if not exists hospital_bed_history_patient_idx
  on public.hospital_bed_history (patient_passport, created_at desc)
  where patient_passport is not null;
create index if not exists hospital_bed_history_event_type_idx
  on public.hospital_bed_history (event_type, created_at desc);

insert into public.hospital_beds (id, status, payload)
values
  ('leito-normal-01', 'vago', '{"label":"Leito Normal 01","type":"normal"}'::jsonb),
  ('leito-normal-02', 'vago', '{"label":"Leito Normal 02","type":"normal"}'::jsonb),
  ('leito-gestante-01', 'vago', '{"label":"Leito Gestante","type":"gestante"}'::jsonb),
  ('leito-infantil-01', 'vago', '{"label":"Leito Infantil 01","type":"infantil"}'::jsonb),
  ('leito-infantil-02', 'vago', '{"label":"Leito Infantil 02","type":"infantil"}'::jsonb)
on conflict (id) do nothing;

-- Atualiza o leito e registra o histórico na mesma transação e em uma única RPC.
create or replace function public.save_hospital_bed_staff(
  p_bed_id text,
  p_status text,
  p_payload jsonb,
  p_event_type text,
  p_patient_name text default null,
  p_patient_passport text default null,
  p_doctor_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_history public.hospital_bed_history%rowtype;
begin
  if auth.uid() is null or not public.is_hpsr_staff() then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if nullif(trim(coalesce(p_bed_id, '')), '') is null then
    raise exception 'Leito não informado.';
  end if;
  if p_status not in ('vago', 'ocupado') then
    raise exception 'Status de leito inválido.';
  end if;

  insert into public.hospital_beds(id, status, payload, updated_at)
  values (p_bed_id, p_status, coalesce(p_payload, '{}'::jsonb), now())
  on conflict (id) do update set
    status = excluded.status,
    payload = excluded.payload,
    updated_at = excluded.updated_at;

  insert into public.hospital_bed_history(
    bed_id, event_type, patient_name, patient_passport, doctor_name, payload, created_by
  ) values (
    p_bed_id, p_event_type, nullif(trim(coalesce(p_patient_name, '')), ''),
    nullif(upper(trim(coalesce(p_patient_passport, ''))), ''),
    nullif(trim(coalesce(p_doctor_name, '')), ''),
    jsonb_build_object(
      'label', p_payload->>'label',
      'expectedDischarge', p_payload->>'expectedDischarge',
      'generalState', p_payload->>'generalState'
    ),
    auth.uid()
  ) returning * into v_history;

  return jsonb_build_object('ok', true, 'history', to_jsonb(v_history));
end;
$$;

create or replace function public.register_hospital_bed_visit_staff(
  p_bed_id text,
  p_patient_name text,
  p_patient_passport text,
  p_visitor_name text,
  p_visitor_passport text default null,
  p_visitor_age text default null,
  p_relation text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_history public.hospital_bed_history%rowtype;
begin
  if auth.uid() is null or not public.is_hpsr_staff() then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if nullif(trim(coalesce(p_visitor_name, '')), '') is null then
    raise exception 'Nome do visitante é obrigatório.';
  end if;
  if not exists (select 1 from public.hospital_beds where id = p_bed_id and status = 'ocupado') then
    raise exception 'O leito não está ocupado.';
  end if;

  insert into public.hospital_bed_history(
    bed_id, event_type, patient_name, patient_passport,
    visitor_name, visitor_passport, visitor_age, relation, notes, created_by
  ) values (
    p_bed_id, 'visit', nullif(trim(coalesce(p_patient_name, '')), ''),
    nullif(upper(trim(coalesce(p_patient_passport, ''))), ''),
    trim(p_visitor_name), nullif(upper(trim(coalesce(p_visitor_passport, ''))), ''),
    nullif(trim(coalesce(p_visitor_age, '')), ''),
    nullif(trim(coalesce(p_relation, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''), auth.uid()
  ) returning * into v_history;

  return jsonb_build_object('ok', true, 'history', to_jsonb(v_history));
end;
$$;

revoke all on function public.save_hospital_bed_staff(text,text,jsonb,text,text,text,text) from public, anon;
grant execute on function public.save_hospital_bed_staff(text,text,jsonb,text,text,text,text) to authenticated;
revoke all on function public.register_hospital_bed_visit_staff(text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.register_hospital_bed_visit_staff(text,text,text,text,text,text,text,text) to authenticated;

-- Estatísticas atualizadas ajudam o planejador do PostgreSQL após a migration.
analyze public.patient_registry;
analyze public.time_clock_entries;
analyze public.clinical_followup_plans;
analyze public.clinical_followup_occurrences;
analyze public.hospital_beds;
analyze public.hospital_bed_history;
