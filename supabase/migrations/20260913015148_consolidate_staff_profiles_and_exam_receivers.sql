-- v1.0.359 — Consolida a equipe em profiles e amplia a fila de exames para Médico Clínico.

alter table public.profiles
  add column if not exists staff_metadata jsonb not null default '{}'::jsonb;

comment on column public.profiles.staff_metadata is
  'Metadados administrativos complementares da equipe. Identidade, cargo, especialidade, contato e status profissional permanecem nas colunas canônicas de profiles.';

-- Preserva os metadados administrativos dos registros que possuem profile correspondente,
-- sem copiar novamente os campos canônicos de identidade/cargo/especialidade.
update public.profiles p
set staff_metadata = coalesce(p.staff_metadata, '{}'::jsonb) || jsonb_strip_nulls(
  jsonb_build_object(
    'department', nullif(tm.payload->>'department', ''),
    'joinedAt', coalesce(nullif(tm.payload->>'joinedAt', ''), tm.created_at::text),
    'contractStatus', nullif(tm.payload->>'contractStatus', ''),
    'contractDurationDays', tm.payload->'contractDurationDays',
    'permissions', tm.payload->'permissions',
    'warnings', tm.payload->'warnings',
    'suspensions', tm.payload->'suspensions',
    'history', tm.payload->'history',
    'deactivatedAt', nullif(tm.payload->>'deactivatedAt', ''),
    'deactivationReason', nullif(tm.payload->>'deactivationReason', '')
  )
)
from public.team_members tm
where tm.id = p.id::text
   or (p.passport is not null and tm.passport = p.passport);

-- Registros antigos sem conta/profile são preservados em um arquivo explicitamente não operacional.
create table if not exists public.staff_unlinked_legacy (
  id text primary key,
  passport text,
  name text not null,
  hospital_role text,
  status text,
  snapshot jsonb not null default '{}'::jsonb,
  original_created_at timestamptz,
  original_updated_at timestamptz,
  archived_at timestamptz not null default now(),
  archive_reason text not null default 'Registro legado sem profile/autenticação correspondente'
);

insert into public.staff_unlinked_legacy (
  id, passport, name, hospital_role, status, snapshot,
  original_created_at, original_updated_at, archived_at, archive_reason
)
select
  tm.id,
  tm.passport,
  tm.name,
  tm.hospital_role,
  tm.status,
  tm.payload,
  tm.created_at,
  tm.updated_at,
  now(),
  'Preservado durante consolidação da equipe em profiles; não participa de permissões nem fluxos clínicos.'
from public.team_members tm
where not exists (
  select 1
  from public.profiles p
  where p.id::text = tm.id
     or (p.passport is not null and p.passport = tm.passport)
)
on conflict (id) do update set
  passport = excluded.passport,
  name = excluded.name,
  hospital_role = excluded.hospital_role,
  status = excluded.status,
  snapshot = excluded.snapshot,
  original_created_at = excluded.original_created_at,
  original_updated_at = excluded.original_updated_at,
  archived_at = excluded.archived_at,
  archive_reason = excluded.archive_reason;

alter table public.staff_unlinked_legacy enable row level security;
revoke all on public.staff_unlinked_legacy from public, anon, authenticated;
grant select on public.staff_unlinked_legacy to service_role;

-- Administração de equipe passa a gravar apenas profiles + staff_metadata.
create or replace function public.admin_update_team_member(target_profile_id uuid, member_payload jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  resolved_role text;
  resolved_specialty text;
  resolved_service_status text;
  resolved_passport text;
  resolved_name text;
  resolved_crm text;
  resolved_city_phone text;
  resolved_discord text;
  resolved_email text;
  administrative_metadata jsonb;
begin
  if not public.is_access_admin() then
    raise exception 'Administrative access required';
  end if;

  resolved_role := coalesce(nullif(member_payload->>'hospitalRole', ''), nullif(member_payload->>'role', ''));
  resolved_specialty := nullif(member_payload->>'specialty', '');
  resolved_service_status := coalesce(nullif(member_payload->>'serviceStatus', ''), nullif(member_payload->>'service_status', ''));
  resolved_passport := nullif(member_payload->>'passport', '');
  resolved_name := nullif(member_payload->>'name', '');
  resolved_crm := nullif(member_payload->>'crm', '');
  resolved_city_phone := nullif(member_payload->>'cityPhone', '');
  resolved_discord := nullif(member_payload->>'radio', '');
  resolved_email := nullif(member_payload->>'email', '');

  administrative_metadata := jsonb_strip_nulls(jsonb_build_object(
    'department', nullif(member_payload->>'department', ''),
    'joinedAt', nullif(member_payload->>'joinedAt', ''),
    'contractStatus', nullif(member_payload->>'contractStatus', ''),
    'contractDurationDays', member_payload->'contractDurationDays',
    'permissions', member_payload->'permissions',
    'warnings', member_payload->'warnings',
    'suspensions', member_payload->'suspensions',
    'history', member_payload->'history'
  ));

  update public.profiles
  set
    name = coalesce(resolved_name, name),
    passport = coalesce(resolved_passport, passport),
    crm = coalesce(resolved_crm, crm),
    role = coalesce(resolved_role, role),
    specialty = coalesce(resolved_specialty, specialty),
    city_phone = coalesce(public.hpsr_normalize_city_phone(resolved_city_phone), city_phone),
    discord = coalesce(public.hpsr_normalize_patient_discord(resolved_discord), discord),
    email = coalesce(resolved_email, email),
    service_status = coalesce(resolved_service_status, service_status),
    staff_metadata = coalesce(staff_metadata, '{}'::jsonb) || administrative_metadata,
    updated_at = now()
  where id = target_profile_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$function$;

create or replace function public.admin_deactivate_team_member(target_profile_id uuid, deactivation_reason text default 'Desligamento administrativo')
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    staff_metadata = coalesce(staff_metadata, '{}'::jsonb) || jsonb_build_object(
      'contractStatus', 'Desligado',
      'deactivatedAt', now(),
      'deactivationReason', normalized_reason
    ),
    updated_at = now()
  where id = target_profile_id;

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
    id, module, action, description, actor, reference, created_at
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
$function$;

-- Permissões passam a consultar exclusivamente profiles.
create or replace function public.is_access_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.access_status = 'Aprovado'
      and p.role in ('Diretor Técnico / Dev', 'Diretora', 'Vice Diretor')
  );
$function$;

create or replace function public.is_hpsr_internal_link_manager()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.access_status = 'Aprovado'
      and p.role = 'Diretor Técnico / Dev'
  );
$function$;

create or replace function public.is_hpsr_schedule_manager()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.access_status = 'Aprovado'
      and p.role in ('Diretora', 'Vice Diretor', 'Diretor Técnico / Dev')
  );
$function$;

-- Médico Clínico pode receber qualquer solicitação de exame. Demais profissionais
-- continuam elegíveis quando a especialidade solicitada pertence ao seu perfil.
create or replace function public.hpsr_can_receive_exam_request(target_doctor_id uuid, target_specialty text)
returns boolean
language sql
stable
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_doctor_id
      and p.access_status = 'Aprovado'
      and (
        p.role = 'Médico Clínico'
        or public.hpsr_doctor_has_specialty(p.id, target_specialty)
      )
  );
$function$;

create or replace function public.hpsr_claim_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_row public.appointments%rowtype;
  v_specialty text;
  v_capacity jsonb;
  v_now timestamptz := now();
  v_declined jsonb := '[]'::jsonb;
  v_flow_type text;
  v_plan_id uuid;
  v_requested_doctor text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão médica inválida.');
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  if not found or coalesce(v_profile.access_status, 'Aprovado') <> 'Aprovado' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Perfil profissional inválido.');
  end if;

  select * into v_row from public.appointments where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Solicitação não encontrada.');
  end if;

  if v_row.status not in ('Solicitação enviada','Aguardando análise','Acompanhamento aguardando confirmação') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_CLAIMED', 'error', 'Esta solicitação já foi assumida por outro profissional.');
  end if;

  v_specialty := trim(coalesce(v_row.payload->>'specialty',''));
  v_flow_type := coalesce(nullif(trim(v_row.payload->>'flowType'), ''), 'Consulta comum');

  if v_specialty = '' then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Especialidade da solicitação não informada.');
  end if;

  if v_flow_type = 'Exames' then
    if not public.hpsr_can_receive_exam_request(v_user_id, v_specialty) then
      return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Seu perfil não está habilitado para receber esta solicitação de exame.');
    end if;
  elsif not public.hpsr_doctor_has_specialty(v_user_id, v_specialty) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Esta solicitação não pertence às especialidades permitidas para o seu cargo/perfil.');
  end if;

  v_requested_doctor := nullif(trim(coalesce(v_row.payload->>'requestedDoctorId','')), '');
  if v_requested_doctor is not null and v_requested_doctor <> v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'REQUESTED_OTHER_DOCTOR', 'error', 'Este acompanhamento foi direcionado a outro médico.');
  end if;

  v_declined := coalesce(v_row.payload->'declinedBy', '[]'::jsonb);
  if v_declined ? v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'DECLINED', 'error', 'Você já recusou esta solicitação.');
  end if;

  if v_flow_type <> 'Exames' then
    v_capacity := public.hpsr_clinical_capacity(v_user_id, v_specialty);
    if coalesce((v_capacity->>'available')::integer,0) <= 0 then
      return jsonb_build_object('ok', false, 'code', 'NO_CAPACITY', 'error', 'Você está sem vagas no momento para esta especialidade.');
    end if;
  end if;

  if v_flow_type in ('Acompanhamento','Acompanhamento com especialista') then
    select f.id into v_plan_id
      from public.clinical_followup_plans f
     where f.doctor_id = v_user_id
       and upper(trim(f.patient_passport)) = upper(trim(v_row.passport))
       and lower(trim(f.specialty)) = lower(v_specialty)
       and f.status in ('Ativo','Em andamento','Pendente de planejamento')
     order by f.created_at desc
     limit 1;

    if v_plan_id is null then
      insert into public.clinical_followup_plans(
        doctor_id, doctor_name, patient_passport, patient_name, specialty,
        frequency, interval_days, start_date, end_date, total_consultations,
        total_weeks, status, updated_at
      ) values (
        v_user_id, coalesce(v_profile.name,'Médico'), upper(trim(v_row.passport)),
        coalesce(v_row.patient, v_row.payload->>'patient', 'Não informado'), v_specialty,
        'Semanal', 7, current_date, null, null, null, 'Pendente de planejamento', v_now
      ) returning id into v_plan_id;
    end if;
  end if;

  update public.appointments
     set status = 'Aceita',
         payload = coalesce(v_row.payload,'{}'::jsonb) || jsonb_build_object(
           'doctorId', v_user_id::text,
           'physician', v_profile.name,
           'doctor', v_profile.name,
           'acceptedById', v_user_id::text,
           'acceptedByName', v_profile.name,
           'acceptedAt', v_now,
           'doctorNotificationUnread', false,
           'updatedAt', v_now,
           'followupPlanId', case when v_plan_id is not null then v_plan_id::text else coalesce(v_row.payload->>'followupPlanId','') end,
           'answer', case
             when v_flow_type = 'Exames' then 'Solicitação de exame aceita. O médico responsável entrará em contato diretamente.'
             when v_flow_type in ('Acompanhamento','Acompanhamento com especialista') then 'Solicitação de acompanhamento aceita. O acompanhamento foi vinculado ao médico responsável e o planejamento será organizado pela equipe médica.'
             else 'Solicitação aceita. O médico responsável entrará em contato para combinar o atendimento.'
           end
         ),
         updated_at = v_now
   where id = p_request_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'Aceita',
    'doctorId', v_user_id,
    'doctorName', v_profile.name,
    'flowType', v_flow_type,
    'followupPlanId', v_plan_id,
    'capacityApplied', v_flow_type <> 'Exames',
    'capacity', case when v_flow_type = 'Exames' then null else public.hpsr_clinical_capacity(v_user_id, v_specialty) end
  );
end;
$function$;

create or replace function public.hpsr_decline_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_row public.appointments%rowtype;
  v_specialty text;
  v_flow_type text;
  v_requested_doctor text;
  v_declined jsonb := '[]'::jsonb;
  v_remaining integer := 0;
  v_now timestamptz := now();
  v_answer text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão médica inválida.');
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  if not found or coalesce(v_profile.access_status, 'Aprovado') <> 'Aprovado' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Perfil profissional inválido.');
  end if;

  select * into v_row from public.appointments where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Solicitação não encontrada.');
  end if;

  if v_row.status not in ('Solicitação enviada', 'Aguardando análise', 'Acompanhamento aguardando confirmação') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_RESOLVED', 'error', 'Esta solicitação já foi resolvida ou saiu da fila inicial.');
  end if;

  v_specialty := trim(coalesce(v_row.payload->>'specialty', ''));
  v_flow_type := coalesce(nullif(trim(v_row.payload->>'flowType'), ''), 'Consulta comum');

  if v_flow_type = 'Exames' then
    if not public.hpsr_can_receive_exam_request(v_user_id, v_specialty) then
      return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Seu perfil não está habilitado para receber esta solicitação de exame.');
    end if;
  elsif v_specialty = '' or not public.hpsr_doctor_has_specialty(v_user_id, v_specialty) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Esta solicitação não pertence às especialidades permitidas para o seu cargo/perfil.');
  end if;

  v_requested_doctor := nullif(trim(coalesce(v_row.payload->>'requestedDoctorId', '')), '');
  if v_requested_doctor is not null and v_requested_doctor <> v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'REQUESTED_OTHER_DOCTOR', 'error', 'Este acompanhamento foi direcionado a outro médico.');
  end if;

  v_declined := coalesce(v_row.payload->'declinedBy', '[]'::jsonb);
  if v_declined ? v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'DECLINED', 'error', 'Você já recusou esta solicitação.');
  end if;

  select coalesce(jsonb_agg(distinct value), '[]'::jsonb)
    into v_declined
    from (
      select value from jsonb_array_elements_text(v_declined)
      union all select v_user_id::text
    ) d(value);

  if v_requested_doctor is not null then
    v_remaining := 0;
  elsif v_flow_type = 'Exames' then
    select count(*)::integer
      into v_remaining
      from public.profiles p
     where public.hpsr_can_receive_exam_request(p.id, v_specialty)
       and not (v_declined ? p.id::text);
  else
    select count(*)::integer
      into v_remaining
      from public.profiles p
     where p.access_status = 'Aprovado'
       and public.hpsr_doctor_has_specialty(p.id, v_specialty)
       and coalesce((public.hpsr_clinical_capacity(p.id, v_specialty)->>'available')::integer, 0) > 0
       and not (v_declined ? p.id::text);
  end if;

  if v_remaining = 0 then
    v_answer := case
      when v_requested_doctor is not null then
        'O médico solicitado não poderá assumir este acompanhamento no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
      when v_flow_type = 'Exames' then
        'Nenhum profissional elegível aceitou esta solicitação de exame no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
      else
        'Nenhum profissional com vaga aceitou esta solicitação no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
    end;

    update public.appointments
       set status = 'Recusada',
           payload = coalesce(v_row.payload, '{}'::jsonb) || jsonb_build_object(
             'declinedBy', v_declined,
             'answer', v_answer,
             'doctorNotificationUnread', false,
             'updatedAt', v_now
           ),
           updated_at = v_now
     where id = p_request_id;

    return jsonb_build_object('ok', true, 'status', 'Recusada', 'closed', true, 'flowType', v_flow_type, 'remainingCandidates', 0);
  end if;

  update public.appointments
     set payload = coalesce(v_row.payload, '{}'::jsonb) || jsonb_build_object('declinedBy', v_declined, 'updatedAt', v_now),
         updated_at = v_now
   where id = p_request_id;

  return jsonb_build_object('ok', true, 'status', v_row.status, 'closed', false, 'flowType', v_flow_type, 'remainingCandidates', v_remaining);
end;
$function$;

revoke all on function public.hpsr_can_receive_exam_request(uuid, text) from public, anon;
grant execute on function public.hpsr_can_receive_exam_request(uuid, text) to authenticated, service_role;
revoke all on function public.hpsr_claim_clinical_request(text) from public, anon;
grant execute on function public.hpsr_claim_clinical_request(text) to authenticated;
revoke all on function public.hpsr_decline_clinical_request(text) from public, anon;
grant execute on function public.hpsr_decline_clinical_request(text) to authenticated;

-- A tabela duplicada deixa de existir após migração e arquivamento dos registros sem profile.
drop table public.team_members;

-- Funções que existiam apenas para proteger/normalizar a tabela removida não são mais necessárias.
drop function if exists public.protect_system_owner_team_member_role();
drop function if exists public.hpsr_enforce_team_member_specialty_by_role();

comment on table public.profiles is
  'Fonte operacional única da equipe autenticada do Hospital São Rafael. Dados administrativos complementares ficam em staff_metadata.';
comment on table public.staff_unlinked_legacy is
  'Arquivo somente histórico de antigos registros de equipe sem profile/auth correspondente. Não participa de permissões, agenda ou fluxos clínicos.';
