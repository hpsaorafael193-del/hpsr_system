-- Corrige a visibilidade de horários publicados no Portal do Paciente sem alterar
-- o fluxo de publicação do médico.
--
-- Fonte de verdade:
-- - clinical_appointment_slots = horários efetivamente publicados;
-- - clinical_followup_plans = vínculo paciente x médico x especialidade;
-- - patient_portal_available_slots = elegibilidade centralizada para o Portal;
-- - book_patient_followup_slot = confirmação atômica da vaga.

create or replace function public.patient_portal_slot_allowed(
  target_passport text,
  target_doctor_id uuid,
  target_specialty text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with patient_key as (
    select upper(regexp_replace(trim(coalesce(target_passport, '')), '\s+', '', 'g')) as value
  ), access_data as (
    select coalesce(schedule_assignments, '[]'::jsonb) assignments
      from public.patient_portal_access, patient_key
     where patient_passport = patient_key.value
  ), explicit_access as (
    select item
      from access_data, jsonb_array_elements(assignments) item
  ), active_plan_access as (
    select fp.doctor_id, fp.specialty
      from public.clinical_followup_plans fp, patient_key
     where upper(regexp_replace(trim(coalesce(fp.patient_passport, '')), '\s+', '', 'g')) = patient_key.value
       and coalesce(fp.status, 'Ativo') <> 'Arquivado'
  )
  select
    exists (
      select 1
        from active_plan_access plan_access
       where plan_access.doctor_id = target_doctor_id
         and (
           public.hpsr_normalize_specialty(plan_access.specialty) = public.hpsr_normalize_specialty(target_specialty)
           or public.hpsr_normalize_specialty(plan_access.specialty) like '%' || public.hpsr_normalize_specialty(target_specialty) || '%'
           or public.hpsr_normalize_specialty(target_specialty) like '%' || public.hpsr_normalize_specialty(plan_access.specialty) || '%'
         )
    )
    or (
      exists (select 1 from explicit_access)
      and exists (
        select 1
          from explicit_access
         where item->>'doctor_id' = target_doctor_id::text
           and (
             public.hpsr_normalize_specialty(item->>'specialty') = public.hpsr_normalize_specialty(target_specialty)
             or public.hpsr_normalize_specialty(item->>'specialty') like '%' || public.hpsr_normalize_specialty(target_specialty) || '%'
             or public.hpsr_normalize_specialty(target_specialty) like '%' || public.hpsr_normalize_specialty(item->>'specialty') || '%'
           )
      )
    )
    or (
      not exists (select 1 from explicit_access)
      and not exists (select 1 from active_plan_access)
      and exists (
        select 1
          from unnest(public.patient_portal_allowed_specialties(target_passport)) allowed
         where public.hpsr_normalize_specialty(allowed) = public.hpsr_normalize_specialty(target_specialty)
            or public.hpsr_normalize_specialty(allowed) like '%' || public.hpsr_normalize_specialty(target_specialty) || '%'
            or public.hpsr_normalize_specialty(target_specialty) like '%' || public.hpsr_normalize_specialty(allowed) || '%'
      )
    );
$$;

revoke all on function public.patient_portal_slot_allowed(text, uuid, text) from public, anon;
grant execute on function public.patient_portal_slot_allowed(text, uuid, text) to authenticated, service_role;

create or replace function public.patient_portal_available_slots(
  target_passport text,
  cutoff_at timestamptz,
  max_rows integer default 300
)
returns table (
  id uuid,
  doctor_id uuid,
  doctor_name text,
  specialty text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with patient_key as (
    select upper(regexp_replace(trim(coalesce(target_passport, '')), '\s+', '', 'g')) as value
  ), access_data as (
    select coalesce(schedule_assignments, '[]'::jsonb) assignments
      from public.patient_portal_access, patient_key
     where patient_passport = patient_key.value
  ), explicit_access as (
    select item->>'doctor_id' doctor_id,
           public.hpsr_normalize_specialty(item->>'specialty') specialty
      from access_data, jsonb_array_elements(assignments) item
     where coalesce(item->>'doctor_id', '') <> ''
       and public.hpsr_normalize_specialty(item->>'specialty') <> ''
  ), active_plan_access as (
    select fp.doctor_id::text doctor_id,
           public.hpsr_normalize_specialty(fp.specialty) specialty
      from public.clinical_followup_plans fp, patient_key
     where upper(regexp_replace(trim(coalesce(fp.patient_passport, '')), '\s+', '', 'g')) = patient_key.value
       and coalesce(fp.status, 'Ativo') <> 'Arquivado'
       and fp.doctor_id is not null
       and public.hpsr_normalize_specialty(fp.specialty) <> ''
  ), access_mode as (
    select exists(select 1 from explicit_access) has_explicit,
           exists(select 1 from active_plan_access) has_plan
  ), fallback_allowed as (
    select public.hpsr_normalize_specialty(value) specialty
      from unnest(public.patient_portal_allowed_specialties(target_passport)) value
     where public.hpsr_normalize_specialty(value) <> ''
  )
  select s.id, s.doctor_id, s.doctor_name, s.specialty, s.starts_at, s.ends_at, s.status
    from public.clinical_appointment_slots s
    cross join access_mode mode
   where s.status = 'Disponível'
     and s.starts_at > cutoff_at
     and (
       exists (
         select 1
           from active_plan_access access
          where access.doctor_id = s.doctor_id::text
            and (
              access.specialty = public.hpsr_normalize_specialty(s.specialty)
              or access.specialty like '%' || public.hpsr_normalize_specialty(s.specialty) || '%'
              or public.hpsr_normalize_specialty(s.specialty) like '%' || access.specialty || '%'
            )
       )
       or exists (
         select 1
           from explicit_access access
          where access.doctor_id = s.doctor_id::text
            and (
              access.specialty = public.hpsr_normalize_specialty(s.specialty)
              or access.specialty like '%' || public.hpsr_normalize_specialty(s.specialty) || '%'
              or public.hpsr_normalize_specialty(s.specialty) like '%' || access.specialty || '%'
            )
       )
       or (
         not mode.has_explicit
         and not mode.has_plan
         and exists (
           select 1
             from fallback_allowed access
            where access.specialty = public.hpsr_normalize_specialty(s.specialty)
               or access.specialty like '%' || public.hpsr_normalize_specialty(s.specialty) || '%'
               or public.hpsr_normalize_specialty(s.specialty) like '%' || access.specialty || '%'
         )
       )
     )
   order by s.starts_at asc, s.doctor_name asc
   limit least(greatest(coalesce(max_rows, 300), 1), 500);
$$;

comment on function public.patient_portal_available_slots(text, timestamptz, integer) is
  'Retorna horários futuros publicados e disponíveis. Acompanhamentos ativos autorizam diretamente o médico/especialidade; vínculos explícitos continuam compatíveis e o fallback histórico só é usado quando não há vínculo atual.';

revoke all on function public.patient_portal_available_slots(text, timestamptz, integer) from public, anon;
grant execute on function public.patient_portal_available_slots(text, timestamptz, integer) to authenticated, service_role;

-- A confirmação usa a mesma compatibilidade de especialidade usada pela leitura do Portal.
create or replace function public.book_patient_followup_slot(
  target_passport text,
  target_plan_id uuid,
  target_slot_id uuid,
  requested_by_passport text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  passport_key text := public.hpsr_normalize_passport(target_passport);
  requester_key text := public.hpsr_normalize_passport(coalesce(requested_by_passport, target_passport));
  v_plan public.clinical_followup_plans%rowtype;
  v_slot public.clinical_appointment_slots%rowtype;
  v_occurrence public.clinical_followup_occurrences%rowtype;
  v_patient_name text;
  v_appointment_id text;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_slot_date date;
  v_time text;
  v_payload jsonb;
  v_plan_specialty text;
  v_slot_specialty text;
begin
  if passport_key = '' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_PATIENT', 'error', 'Paciente inválido.');
  end if;

  perform pg_advisory_xact_lock(hashtext('hpsr-followup-book:' || passport_key));

  select * into v_plan
    from public.clinical_followup_plans
   where id = target_plan_id
     and public.hpsr_normalize_passport(patient_passport) = passport_key
     and coalesce(status, 'Ativo') <> 'Arquivado'
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'PLAN_NOT_FOUND', 'error', 'Este acompanhamento não está mais disponível.');
  end if;

  select * into v_slot
    from public.clinical_appointment_slots
   where id = target_slot_id
   for update;

  if not found or v_slot.status <> 'Disponível' then
    return jsonb_build_object('ok', false, 'code', 'SLOT_UNAVAILABLE', 'error', 'Este horário não está mais disponível.');
  end if;

  v_plan_specialty := public.hpsr_normalize_specialty(v_plan.specialty);
  v_slot_specialty := public.hpsr_normalize_specialty(v_slot.specialty);

  if v_slot.doctor_id <> v_plan.doctor_id
     or v_plan_specialty = ''
     or v_slot_specialty = ''
     or not (
       v_slot_specialty = v_plan_specialty
       or v_slot_specialty like '%' || v_plan_specialty || '%'
       or v_plan_specialty like '%' || v_slot_specialty || '%'
     ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED', 'error', 'Este horário não pertence ao médico do seu acompanhamento.');
  end if;

  v_slot_date := (v_slot.starts_at at time zone 'America/Sao_Paulo')::date;
  if v_slot_date <= v_today then
    return jsonb_build_object(
      'ok', false,
      'code', 'SAME_DAY_CLOSED',
      'error', 'Os horários deste dia já fecharam para novas confirmações. Aguarde a próxima agenda do médico.'
    );
  end if;

  if public.hpsr_patient_has_active_booking(passport_key, v_plan.specialty, null) then
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTIVE_BOOKING',
      'error', 'Você já possui uma consulta ativa nesta especialidade. Veja seu agendamento atual antes de escolher outro horário.'
    );
  end if;

  select * into v_occurrence
    from public.clinical_followup_occurrences
   where plan_id = v_plan.id
     and slot_id is null
     and appointment_id is null
   order by planned_date asc, created_at asc
   limit 1
   for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'NO_PENDING_OCCURRENCE',
      'error', 'Este acompanhamento não possui um próximo atendimento pendente. Aguarde uma atualização do médico.'
    );
  end if;

  select name into v_patient_name
    from public.patient_registry
   where public.hpsr_normalize_passport(passport) = passport_key
   limit 1;
  v_patient_name := coalesce(nullif(trim(v_patient_name), ''), v_plan.patient_name, 'Paciente');

  v_appointment_id := 'HPSR-AGENDA-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_time := to_char(v_slot.starts_at at time zone 'America/Sao_Paulo', 'HH24:MI');

  v_payload := jsonb_build_object(
    'patient', v_patient_name,
    'passport', passport_key,
    'requestedByPassport', requester_key,
    'requestedByRelationship', case when requester_key = passport_key then 'Titular' else 'Responsável' end,
    'specialty', v_plan.specialty,
    'physician', v_plan.doctor_name,
    'doctor', v_plan.doctor_name,
    'doctorId', v_plan.doctor_id,
    'preferredDate', to_char(v_slot_date, 'YYYY-MM-DD'),
    'date', to_char(v_slot_date, 'YYYY-MM-DD'),
    'time', v_time,
    'preferredPeriod', v_time,
    'reason', 'Retorno de acompanhamento',
    'flowType', 'Acompanhamento',
    'source', 'clinical_availability',
    'schedulingMode', 'followup_self_booking',
    'slotId', v_slot.id,
    'planId', v_plan.id,
    'occurrenceId', v_occurrence.id,
    'plannedReferenceDate', v_occurrence.planned_date,
    'presenceConfirmed', true,
    'doctorNotification', 'Horário de acompanhamento escolhido e confirmado pelo paciente',
    'doctorNotificationUnread', true,
    'createdAt', now(),
    'updatedAt', now()
  );

  insert into public.appointments(id, passport, patient, status, payload, created_at, updated_at)
  values(v_appointment_id, passport_key, v_patient_name, 'Confirmada', v_payload, now(), now());

  update public.clinical_appointment_slots
     set status = 'Ocupado',
         patient_passport = passport_key,
         patient_name = v_patient_name,
         appointment_id = v_appointment_id,
         booked_at = now(),
         updated_at = now()
   where id = v_slot.id;

  update public.clinical_followup_occurrences
     set status = 'Confirmada',
         slot_id = v_slot.id,
         appointment_id = v_appointment_id,
         updated_at = now()
   where id = v_occurrence.id;

  return jsonb_build_object(
    'ok', true,
    'appointment_id', v_appointment_id,
    'doctor_name', v_plan.doctor_name,
    'starts_at', v_slot.starts_at,
    'occurrence_id', v_occurrence.id
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'ACTIVE_BOOKING', 'error', 'Você já possui uma consulta ativa nesta especialidade.');
end;
$$;

revoke all on function public.book_patient_followup_slot(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.book_patient_followup_slot(text, uuid, uuid, text) to service_role;

comment on function public.book_patient_followup_slot(text, uuid, uuid, text) is
  'Confirma atomicamente uma vaga futura publicada pelo médico do acompanhamento usando a mesma compatibilidade de especialidade do Portal.';
