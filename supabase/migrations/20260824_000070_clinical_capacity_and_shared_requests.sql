-- HPSR v1.0.296 — capacidade clínica por médico/especialidade,
-- aceite/recusa concorrente de solicitações e publicação inclusiva de horários.

alter table public.profiles
  add column if not exists specialty_capacity jsonb not null default '{}'::jsonb;

comment on column public.profiles.specialty_capacity is
  'Limites de capacidade clínica por especialidade. Ex.: {"Obstetrícia":5,"Ginecologia":5}. A ocupação é derivada dos registros ativos.';

create or replace function public.hpsr_clinical_capacity(
  p_doctor_id uuid,
  p_specialty text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := 5;
  v_appointments integer := 0;
  v_followups integer := 0;
  v_used integer := 0;
  v_available integer := 0;
  v_specialty text := trim(coalesce(p_specialty, ''));
  v_config jsonb;
  v_doctor_name text := '';
begin
  if p_doctor_id is null or v_specialty = '' then
    return jsonb_build_object('limit', 0, 'used', 0, 'available', 0, 'full', true);
  end if;

  select coalesce(p.specialty_capacity, '{}'::jsonb), coalesce(p.name, '') into v_config, v_doctor_name
    from public.profiles p
   where p.id = p_doctor_id
     and coalesce(p.access_status, 'Aprovado') = 'Aprovado';

  if not found then
    return jsonb_build_object('limit', 0, 'used', 0, 'available', 0, 'full', true);
  end if;

  if v_config ? v_specialty then
    begin
      v_limit := greatest(0, least(99, (v_config ->> v_specialty)::integer));
    exception when others then
      v_limit := 5;
    end;
  end if;

  select count(*)::integer into v_appointments
    from public.appointments a
   where trim(coalesce(a.payload->>'specialty', '')) = v_specialty
     and coalesce(a.payload->>'flowType', 'Consulta comum') <> 'Exames'
     and a.status in ('Aceita','Agendada','Confirmada','Reagendamento aceito','Em atendimento','Adiada','Atrasada')
     and nullif(trim(coalesce(a.payload->>'followupPlanId','')), '') is null
     and (
       nullif(trim(coalesce(a.payload->>'doctorId','')), '') = p_doctor_id::text
       or nullif(trim(coalesce(a.payload->>'acceptedById','')), '') = p_doctor_id::text
       or (v_doctor_name <> '' and lower(trim(coalesce(a.payload->>'physician', a.payload->>'doctor', ''))) = lower(trim(v_doctor_name)))
     );

  select count(*)::integer into v_followups
    from public.clinical_followup_plans fp
   where fp.doctor_id = p_doctor_id
     and trim(coalesce(fp.specialty, '')) = v_specialty
     and fp.status in ('Ativo','Em andamento');

  v_used := v_appointments + v_followups;
  v_available := greatest(v_limit - v_used, 0);

  return jsonb_build_object(
    'limit', v_limit,
    'used', v_used,
    'available', v_available,
    'full', v_available <= 0
  );
end;
$$;

revoke all on function public.hpsr_clinical_capacity(uuid,text) from public, anon;
grant execute on function public.hpsr_clinical_capacity(uuid,text) to service_role;

create or replace function public.hpsr_specialty_capacity_candidates(p_specialty text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_specialty text := trim(coalesce(p_specialty, ''));
  v_result jsonb;
begin
  if v_specialty = '' then return '[]'::jsonb; end if;

  select coalesce(jsonb_agg(item order by (item->>'available')::integer desc, item->>'doctorName'), '[]'::jsonb)
    into v_result
    from (
      select jsonb_build_object(
        'doctorId', p.id,
        'doctorName', p.name,
        'specialty', v_specialty,
        'limit', (cap.value->>'limit')::integer,
        'used', (cap.value->>'used')::integer,
        'available', (cap.value->>'available')::integer,
        'full', (cap.value->>'full')::boolean
      ) as item
      from public.profiles p
      cross join lateral (select public.hpsr_clinical_capacity(p.id, v_specialty) as value) cap
      where coalesce(p.access_status, 'Aprovado') = 'Aprovado'
        and exists (
          select 1 from regexp_split_to_table(coalesce(p.specialty,''), '\\s*[,;/|]\\s*') token
           where lower(trim(token)) = lower(v_specialty)
        )
        and (cap.value->>'available')::integer > 0
    ) candidates;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.hpsr_specialty_capacity_candidates(text) from public, anon;
grant execute on function public.hpsr_specialty_capacity_candidates(text) to service_role;

create or replace function public.hpsr_my_clinical_capacity(p_specialty text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object('limit',0,'used',0,'available',0,'full',true,'error','Sessão inválida.');
  end if;
  if not exists (select 1 from public.profiles p where p.id=v_user_id and coalesce(p.access_status,'Aprovado')='Aprovado') then
    return jsonb_build_object('limit',0,'used',0,'available',0,'full',true,'error','Perfil profissional inválido.');
  end if;
  return public.hpsr_clinical_capacity(v_user_id, p_specialty);
end;
$$;

revoke all on function public.hpsr_my_clinical_capacity(text) from public, anon;
grant execute on function public.hpsr_my_clinical_capacity(text) to authenticated;

create or replace function public.hpsr_claim_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.appointments%rowtype;
  v_profile public.profiles%rowtype;
  v_specialty text;
  v_capacity jsonb;
  v_payload jsonb;
  v_now timestamptz := now();
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão médica inválida.');
  end if;

  select * into v_profile from public.profiles
   where id = v_user and coalesce(access_status,'Aprovado') = 'Aprovado';
  if not found then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Perfil profissional não autorizado.');
  end if;

  select * into v_row from public.appointments where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Solicitação não encontrada.');
  end if;

  if v_row.status not in ('Solicitação enviada','Aguardando análise','Acompanhamento aguardando confirmação') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_CLAIMED', 'error', 'Esta solicitação já foi assumida por outro profissional.');
  end if;

  v_specialty := trim(coalesce(v_row.payload->>'specialty',''));
  if v_specialty = '' or not exists (
    select 1 from regexp_split_to_table(coalesce(v_profile.specialty,''), '\\s*[,;/|]\\s*') token
     where lower(trim(token)) = lower(v_specialty)
  ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Esta solicitação não pertence às suas especialidades.');
  end if;

  if exists (
    select 1 from jsonb_array_elements_text(coalesce(v_row.payload->'declinedBy','[]'::jsonb)) x
     where x = v_user::text
  ) then
    return jsonb_build_object('ok', false, 'code', 'DECLINED_BY_USER', 'error', 'Você já recusou esta solicitação.');
  end if;

  v_capacity := public.hpsr_clinical_capacity(v_user, v_specialty);
  if coalesce((v_capacity->>'available')::integer,0) <= 0 then
    return jsonb_build_object('ok', false, 'code', 'CAPACITY_FULL', 'error', 'Sem vagas no momento para esta especialidade.');
  end if;

  v_payload := coalesce(v_row.payload, '{}'::jsonb) || jsonb_build_object(
    'doctorId', v_user::text,
    'physician', coalesce(v_profile.name,'Médico'),
    'doctor', coalesce(v_profile.name,'Médico'),
    'acceptedById', v_user::text,
    'acceptedByName', coalesce(v_profile.name,'Médico'),
    'acceptedAt', v_now,
    'doctorNotificationUnread', false,
    'updatedAt', v_now,
    'answer', case when coalesce(v_row.payload->>'flowType','') = 'Exames' then 'Solicitação de exame aceita. O médico responsável entrará em contato diretamente.' else 'Solicitação aceita. O médico responsável entrará em contato para combinar o atendimento.' end
  );

  update public.appointments
     set status = 'Aceita', payload = v_payload, updated_at = v_now
   where id = p_request_id;

  return jsonb_build_object('ok', true, 'status', 'Aceita', 'doctorId', v_user, 'doctorName', v_profile.name, 'capacity', public.hpsr_clinical_capacity(v_user, v_specialty));
end;
$$;

revoke all on function public.hpsr_claim_clinical_request(text) from public, anon;
grant execute on function public.hpsr_claim_clinical_request(text) to authenticated;

create or replace function public.hpsr_decline_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.appointments%rowtype;
  v_profile public.profiles%rowtype;
  v_specialty text;
  v_payload jsonb;
  v_declined jsonb;
  v_remaining jsonb;
  v_now timestamptz := now();
begin
  if v_user is null then return jsonb_build_object('ok', false, 'error', 'Sessão médica inválida.'); end if;
  select * into v_profile from public.profiles where id=v_user and coalesce(access_status,'Aprovado')='Aprovado';
  if not found then return jsonb_build_object('ok', false, 'error', 'Perfil profissional não autorizado.'); end if;

  select * into v_row from public.appointments where id=p_request_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada.'); end if;
  if v_row.status not in ('Solicitação enviada','Aguardando análise','Acompanhamento aguardando confirmação') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_CLAIMED', 'error', 'Esta solicitação já foi assumida por outro profissional.');
  end if;

  v_specialty := trim(coalesce(v_row.payload->>'specialty',''));
  if not exists (select 1 from regexp_split_to_table(coalesce(v_profile.specialty,''), '\\s*[,;/|]\\s*') token where lower(trim(token))=lower(v_specialty)) then
    return jsonb_build_object('ok', false, 'error', 'Esta solicitação pertence a outra especialidade.');
  end if;

  select coalesce(jsonb_agg(distinct value), '[]'::jsonb) into v_declined
    from (
      select value from jsonb_array_elements_text(coalesce(v_row.payload->'declinedBy','[]'::jsonb))
      union all select v_user::text
    ) q;

  v_payload := coalesce(v_row.payload,'{}'::jsonb) || jsonb_build_object('declinedBy', v_declined, 'updatedAt', v_now);
  update public.appointments set payload=v_payload, updated_at=v_now where id=p_request_id;

  select coalesce(jsonb_agg(c), '[]'::jsonb) into v_remaining
    from jsonb_array_elements(public.hpsr_specialty_capacity_candidates(v_specialty)) c
   where not (v_declined ? (c->>'doctorId'));

  if jsonb_array_length(v_remaining)=0 then
    update public.appointments
       set status='Recusada',
           payload=v_payload || jsonb_build_object('answer','Nenhum profissional com vaga aceitou esta solicitação no momento. Entre em contato com o Hospital São Rafael para nova orientação.'),
           updated_at=v_now
     where id=p_request_id;
    return jsonb_build_object('ok', true, 'status', 'Recusada', 'closed', true);
  end if;

  return jsonb_build_object('ok', true, 'status', v_row.status, 'closed', false);
end;
$$;

revoke all on function public.hpsr_decline_clinical_request(text) from public, anon;
grant execute on function public.hpsr_decline_clinical_request(text) to authenticated;

create or replace function public.publish_clinical_availability(
  p_doctor_name text,
  p_specialty text,
  p_start_date date,
  p_end_date date,
  p_start_time time without time zone,
  p_end_time time without time zone,
  p_slot_duration_minutes integer default 60,
  p_daily_limit integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_id uuid := auth.uid();
  v_series_id uuid;
  v_slot_count integer := 0;
  v_requested_count integer := 0;
  v_conflict_count integer := 0;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_doctor_id is null then return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão médica inválida. Entre novamente no sistema.'); end if;
  if not exists (select 1 from public.profiles p where p.id=v_doctor_id and coalesce(p.access_status,'Aprovado')='Aprovado') then return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Não foi possível validar o perfil médico para publicar horários.'); end if;
  if p_start_date is null or p_end_date is null or p_start_date > p_end_date then return jsonb_build_object('ok', false, 'code', 'INVALID_DATES', 'error', 'Informe uma data válida.'); end if;
  if p_start_date < v_today then return jsonb_build_object('ok', false, 'code', 'PAST_DATE', 'error', 'Não é possível publicar horários em datas anteriores a hoje.'); end if;
  if p_start_time is null or p_end_time is null or p_end_time < p_start_time then return jsonb_build_object('ok', false, 'code', 'INVALID_TIME', 'error', 'O último horário não pode ser anterior ao primeiro.'); end if;
  if coalesce(p_slot_duration_minutes,0)<10 or p_slot_duration_minutes>240 then return jsonb_build_object('ok', false, 'code', 'INVALID_DURATION', 'error', 'A duração do atendimento deve ficar entre 10 e 240 minutos.'); end if;
  if coalesce(p_daily_limit,0)<1 or p_daily_limit>5 then return jsonb_build_object('ok', false, 'code', 'INVALID_LIMIT', 'error', 'O limite diário deve ficar entre 1 e 5 horários.'); end if;
  if nullif(trim(coalesce(p_doctor_name,'')),'') is null then return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR_NAME', 'error', 'Não foi possível identificar o nome do médico.'); end if;
  if nullif(trim(coalesce(p_specialty,'')),'') is null or p_specialty ~ '[,;/|]' then return jsonb_build_object('ok', false, 'code', 'INVALID_SPECIALTY', 'error', 'Selecione uma única especialidade para esta publicação.'); end if;

  perform pg_advisory_xact_lock(hashtext('hpsr-publish-availability:' || v_doctor_id::text));

  with requested_slots as (
    select (((day_value::date+p_start_time)+make_interval(mins=>slot_number*p_slot_duration_minutes)) at time zone 'America/Sao_Paulo') starts_at,
           (((day_value::date+p_start_time)+make_interval(mins=>(slot_number+1)*p_slot_duration_minutes)) at time zone 'America/Sao_Paulo') ends_at
      from generate_series(p_start_date,p_end_date,interval '1 day') day_value
      cross join generate_series(0,p_daily_limit-1) slot_number
     where make_interval(mins=>slot_number*p_slot_duration_minutes) <= (p_end_time-p_start_time)
  ) select count(*) into v_requested_count from requested_slots;
  if v_requested_count=0 then return jsonb_build_object('ok', false, 'code', 'NO_SLOTS', 'error', 'A faixa informada não contém horários válidos.'); end if;

  with requested_slots as (
    select (((day_value::date+p_start_time)+make_interval(mins=>slot_number*p_slot_duration_minutes)) at time zone 'America/Sao_Paulo') starts_at
      from generate_series(p_start_date,p_end_date,interval '1 day') day_value
      cross join generate_series(0,p_daily_limit-1) slot_number
     where make_interval(mins=>slot_number*p_slot_duration_minutes) <= (p_end_time-p_start_time)
  ) select count(*) into v_conflict_count from requested_slots r join public.clinical_appointment_slots s on s.doctor_id=v_doctor_id and s.starts_at=r.starts_at;
  if v_conflict_count>0 then return jsonb_build_object('ok', false, 'code', 'SCHEDULE_CONFLICT', 'error', 'Já existe horário publicado para você em parte desta faixa. Ajuste os horários para evitar sobreposição.'); end if;

  insert into public.clinical_availability_series(doctor_id,doctor_name,specialty,start_date,end_date,start_time,end_time,slot_duration_minutes,weekday,daily_limit,status,created_at,updated_at)
  values(v_doctor_id,trim(p_doctor_name),trim(p_specialty),p_start_date,p_end_date,p_start_time,p_end_time,p_slot_duration_minutes,extract(dow from p_start_date)::smallint,p_daily_limit,'Ativa',now(),now()) returning id into v_series_id;

  with requested_slots as (
    select (((day_value::date+p_start_time)+make_interval(mins=>slot_number*p_slot_duration_minutes)) at time zone 'America/Sao_Paulo') starts_at,
           (((day_value::date+p_start_time)+make_interval(mins=>(slot_number+1)*p_slot_duration_minutes)) at time zone 'America/Sao_Paulo') ends_at
      from generate_series(p_start_date,p_end_date,interval '1 day') day_value
      cross join generate_series(0,p_daily_limit-1) slot_number
     where make_interval(mins=>slot_number*p_slot_duration_minutes) <= (p_end_time-p_start_time)
  ), inserted as (
    insert into public.clinical_appointment_slots(series_id,doctor_id,doctor_name,specialty,starts_at,ends_at,status,created_at,updated_at)
    select v_series_id,v_doctor_id,trim(p_doctor_name),trim(p_specialty),starts_at,ends_at,'Disponível',now(),now() from requested_slots returning id
  ) select count(*) into v_slot_count from inserted;
  if v_slot_count<>v_requested_count then raise exception 'Falha ao publicar todos os horários solicitados.'; end if;
  return jsonb_build_object('ok',true,'series_id',v_series_id,'slot_count',v_slot_count,'start_date',p_start_date,'end_date',p_end_date,'specialty',trim(p_specialty));
exception when unique_violation then raise exception 'Já existe horário publicado para você em parte desta faixa.';
end;
$$;

revoke all on function public.publish_clinical_availability(text,text,date,date,time,time,integer,integer) from public, anon;
grant execute on function public.publish_clinical_availability(text,text,date,date,time,time,integer,integer) to authenticated;
