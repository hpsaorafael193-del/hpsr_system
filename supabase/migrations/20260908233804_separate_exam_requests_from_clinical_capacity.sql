-- v1.0.337 — Correção: exames possuem regras próprias e não consomem capacidade clínica.
-- Mantém limites das consultas/acompanhamentos intactos.

create or replace function public.hpsr_patient_has_active_booking(
  target_passport text,
  target_specialty text,
  exclude_appointment_id text default null
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
      from public.appointments a
     where public.hpsr_normalize_passport(a.passport) = public.hpsr_normalize_passport(target_passport)
       and public.hpsr_normalize_specialty(a.payload->>'specialty') = public.hpsr_normalize_specialty(target_specialty)
       and (exclude_appointment_id is null or a.id <> exclude_appointment_id)
       and coalesce(a.payload->>'source', '') in ('patient_portal', 'clinical_availability')
       and coalesce(a.payload->>'flowType', 'Consulta comum') <> 'Exames'
       and public.hpsr_is_active_patient_booking(a.status)
  );
$function$;

create or replace function public.hpsr_guard_single_active_patient_booking()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  passport_key text;
  specialty_key text;
begin
  if coalesce(new.payload->>'source', '') not in ('patient_portal', 'clinical_availability')
     or coalesce(new.payload->>'flowType', 'Consulta comum') = 'Exames'
     or not public.hpsr_is_active_patient_booking(new.status) then
    return new;
  end if;

  passport_key := public.hpsr_normalize_passport(new.passport);
  specialty_key := public.hpsr_normalize_specialty(new.payload->>'specialty');
  if passport_key = '' or specialty_key = '' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and coalesce(old.payload->>'source', '') in ('patient_portal', 'clinical_availability')
     and coalesce(old.payload->>'flowType', 'Consulta comum') <> 'Exames'
     and public.hpsr_is_active_patient_booking(old.status)
     and public.hpsr_normalize_passport(old.passport) = passport_key
     and public.hpsr_normalize_specialty(old.payload->>'specialty') = specialty_key then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('hpsr-active-booking:' || passport_key || ':' || specialty_key));

  if exists (
    select 1
      from public.appointments a
     where public.hpsr_normalize_passport(a.passport) = passport_key
       and public.hpsr_normalize_specialty(a.payload->>'specialty') = specialty_key
       and a.id <> new.id
       and coalesce(a.payload->>'source', '') in ('patient_portal', 'clinical_availability')
       and coalesce(a.payload->>'flowType', 'Consulta comum') <> 'Exames'
       and public.hpsr_is_active_patient_booking(a.status)
  ) then
    raise exception using
      errcode = '23505',
      message = 'O paciente já possui uma consulta ativa nesta especialidade.';
  end if;

  return new;
end;
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
  if v_specialty = '' or not exists (
    select 1 from regexp_split_to_table(coalesce(v_profile.specialty,''), '[,;/|]+') token
    where lower(trim(token)) = lower(v_specialty)
  ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Esta solicitação não pertence às suas especialidades.');
  end if;

  v_requested_doctor := nullif(trim(coalesce(v_row.payload->>'requestedDoctorId','')), '');
  if v_requested_doctor is not null and v_requested_doctor <> v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'REQUESTED_OTHER_DOCTOR', 'error', 'Este acompanhamento foi direcionado a outro médico.');
  end if;

  v_declined := coalesce(v_row.payload->'declinedBy', '[]'::jsonb);
  if v_declined ? v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'DECLINED', 'error', 'Você já recusou esta solicitação.');
  end if;

  v_flow_type := coalesce(v_row.payload->>'flowType', 'Consulta comum');

  -- Exames têm fila própria: não consomem nem dependem da capacidade clínica de consultas.
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

create or replace function public.book_patient_schedule_slot(
  target_passport text,
  target_slot_id uuid,
  target_plan_id uuid default null::uuid,
  target_doctor_id uuid default null::uuid,
  target_specialty text default null::text,
  requested_by_passport text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  passport_key text := public.hpsr_normalize_passport(target_passport);
  requester_key text := public.hpsr_normalize_passport(coalesce(requested_by_passport, target_passport));
  v_slot public.clinical_appointment_slots%rowtype;
  v_existing public.appointments%rowtype;
  v_other_scheduled public.appointments%rowtype;
  v_plan public.clinical_followup_plans%rowtype;
  v_occurrence public.clinical_followup_occurrences%rowtype;
  v_patient_name text;
  v_appointment_id text;
  v_time text;
  v_payload jsonb;
  v_specialty text;
  v_doctor_name text;
  v_allowed boolean := false;
  v_flow_type text;
BEGIN
  IF passport_key = '' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_PATIENT', 'error', 'Paciente inválido.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('hpsr-schedule-book:' || passport_key));

  SELECT * INTO v_slot
    FROM public.clinical_appointment_slots
   WHERE id = target_slot_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'SLOT_NOT_FOUND', 'error', 'Este horário não foi encontrado.');
  END IF;

  IF v_slot.status <> 'Disponível' THEN
    IF v_slot.appointment_id IS NOT NULL
       AND public.hpsr_normalize_passport(v_slot.patient_passport) = passport_key
       AND EXISTS (
         SELECT 1
           FROM public.appointments a
          WHERE a.id = v_slot.appointment_id
            AND public.hpsr_is_active_patient_booking(a.status)
       ) THEN
      RETURN jsonb_build_object(
        'ok', true,
        'appointment_id', v_slot.appointment_id,
        'doctor_name', v_slot.doctor_name,
        'starts_at', v_slot.starts_at,
        'already_booked', true
      );
    END IF;

    RETURN jsonb_build_object('ok', false, 'code', 'SLOT_UNAVAILABLE', 'error', 'Este horário não está mais disponível.');
  END IF;

  IF target_doctor_id IS NOT NULL AND target_doctor_id <> v_slot.doctor_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'DOCTOR_MISMATCH', 'error', 'Este horário não pertence ao médico selecionado.');
  END IF;

  v_specialty := coalesce(nullif(trim(target_specialty), ''), v_slot.specialty);
  IF public.hpsr_normalize_specialty(v_specialty) <> public.hpsr_normalize_specialty(v_slot.specialty) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'SPECIALTY_MISMATCH', 'error', 'Este horário não pertence à especialidade selecionada.');
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM public.patient_portal_access pa,
           jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item
     WHERE public.hpsr_normalize_passport(pa.patient_passport) = passport_key
       AND coalesce(pa.access_enabled, true)
       AND item->>'doctor_id' = v_slot.doctor_id::text
       AND public.hpsr_normalize_specialty(item->>'specialty')
           = public.hpsr_normalize_specialty(v_slot.specialty)
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED', 'error', 'Este horário não pertence a um médico vinculado a este paciente.');
  END IF;

  IF v_slot.starts_at <= now() + interval '24 hours' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'BOOKING_CLOSED', 'error', 'Este horário já está dentro da janela de 24 horas e não aceita nova confirmação pelo Portal.');
  END IF;

  SELECT * INTO v_other_scheduled
    FROM public.appointments a
   WHERE public.hpsr_normalize_passport(a.passport) = passport_key
     AND public.hpsr_normalize_specialty(a.payload->>'specialty')
         = public.hpsr_normalize_specialty(v_specialty)
     AND coalesce(a.payload->>'flowType', 'Consulta comum') <> 'Exames'
     AND a.status IN ('Agendada','Confirmada','Reagendamento aceito','Em atendimento','Adiada','Atrasada')
     AND a.id <> coalesce(v_slot.appointment_id, '')
   ORDER BY a.updated_at DESC, a.created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF v_other_scheduled.id IS NOT NULL THEN
    IF coalesce(v_other_scheduled.payload->>'slotId', '') = v_slot.id::text THEN
      RETURN jsonb_build_object(
        'ok', true,
        'appointment_id', v_other_scheduled.id,
        'doctor_name', coalesce(v_other_scheduled.payload->>'doctor', v_slot.doctor_name),
        'starts_at', v_slot.starts_at,
        'already_booked', true
      );
    END IF;
    RETURN jsonb_build_object('ok', false, 'code', 'ACTIVE_BOOKING', 'error', 'Você já possui uma consulta marcada nesta especialidade.');
  END IF;

  SELECT * INTO v_existing
    FROM public.appointments a
   WHERE public.hpsr_normalize_passport(a.passport) = passport_key
     AND public.hpsr_normalize_specialty(a.payload->>'specialty')
         = public.hpsr_normalize_specialty(v_specialty)
     AND coalesce(a.payload->>'source', '') = 'patient_portal'
     AND coalesce(a.payload->>'flowType', 'Consulta comum') <> 'Exames'
     AND a.status IN ('Solicitação enviada','Aguardando análise','Acompanhamento aguardando confirmação','Aceita')
     AND (
       coalesce(a.payload->>'acceptedById', a.payload->>'doctorId', '') = v_slot.doctor_id::text
       OR coalesce(a.payload->>'requestedDoctorId', '') = v_slot.doctor_id::text
       OR coalesce(a.payload->>'acceptedById', a.payload->>'doctorId', a.payload->>'requestedDoctorId', '') = ''
     )
   ORDER BY
     CASE a.status
       WHEN 'Aceita' THEN 0
       WHEN 'Acompanhamento aguardando confirmação' THEN 1
       WHEN 'Aguardando análise' THEN 2
       ELSE 3
     END,
     a.updated_at DESC,
     a.created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF target_plan_id IS NOT NULL THEN
    SELECT * INTO v_plan
      FROM public.clinical_followup_plans
     WHERE id = target_plan_id
       AND public.hpsr_normalize_passport(patient_passport) = passport_key
       AND doctor_id = v_slot.doctor_id
       AND public.hpsr_normalize_specialty(specialty) = public.hpsr_normalize_specialty(v_specialty)
       AND coalesce(status, 'Ativo') <> 'Arquivado'
     FOR UPDATE;
  ELSE
    SELECT * INTO v_plan
      FROM public.clinical_followup_plans
     WHERE public.hpsr_normalize_passport(patient_passport) = passport_key
       AND doctor_id = v_slot.doctor_id
       AND public.hpsr_normalize_specialty(specialty) = public.hpsr_normalize_specialty(v_specialty)
       AND coalesce(status, 'Ativo') <> 'Arquivado'
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1
     FOR UPDATE;
  END IF;

  IF v_plan.id IS NOT NULL THEN
    SELECT * INTO v_occurrence
      FROM public.clinical_followup_occurrences
     WHERE plan_id = v_plan.id
       AND slot_id IS NULL
       AND appointment_id IS NULL
       AND coalesce(status, '') NOT IN ('Consulta realizada','Realizada','Concluída','Concluído','Cancelada','Cancelado','Não compareceu')
     ORDER BY planned_date ASC, created_at ASC
     LIMIT 1
     FOR UPDATE;
  END IF;

  SELECT name INTO v_patient_name
    FROM public.patient_registry
   WHERE public.hpsr_normalize_passport(passport) = passport_key
   LIMIT 1;

  v_patient_name := coalesce(nullif(trim(v_patient_name), ''), v_existing.patient, 'Paciente');
  v_doctor_name := v_slot.doctor_name;
  v_appointment_id := coalesce(
    v_existing.id,
    'HPSR-AGENDA-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );
  v_time := to_char(v_slot.starts_at at time zone 'America/Sao_Paulo', 'HH24:MI');
  v_flow_type := coalesce(
    nullif(v_existing.payload->>'flowType', ''),
    CASE WHEN v_plan.id IS NOT NULL THEN 'Acompanhamento' ELSE 'Consulta vinculada' END
  );

  v_payload := coalesce(v_existing.payload, '{}'::jsonb)
    || jsonb_build_object(
      'patient', v_patient_name,
      'passport', passport_key,
      'requestedByPassport', requester_key,
      'requestedByRelationship', CASE WHEN requester_key = passport_key THEN 'Titular' ELSE 'Responsável' END,
      'specialty', v_specialty,
      'physician', v_doctor_name,
      'doctor', v_doctor_name,
      'doctorId', v_slot.doctor_id,
      'acceptedById', v_slot.doctor_id::text,
      'acceptedByName', v_doctor_name,
      'acceptedAt', coalesce(v_existing.payload->'acceptedAt', to_jsonb(now())),
      'preferredDate', to_char(v_slot.starts_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
      'date', to_char(v_slot.starts_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
      'time', v_time,
      'preferredPeriod', v_time,
      'reason', coalesce(nullif(v_existing.payload->>'reason', ''), CASE WHEN v_plan.id IS NOT NULL THEN 'Retorno de acompanhamento' ELSE 'Consulta com médico vinculado' END),
      'flowType', v_flow_type,
      'source', 'clinical_availability',
      'schedulingMode', 'linked_patient_self_booking',
      'slotId', v_slot.id,
      'planId', CASE WHEN v_plan.id IS NOT NULL THEN v_plan.id ELSE NULL END,
      'occurrenceId', CASE WHEN v_occurrence.id IS NOT NULL THEN v_occurrence.id ELSE NULL END,
      'followupPlanId', coalesce(CASE WHEN v_plan.id IS NOT NULL THEN v_plan.id::text ELSE NULL END, v_existing.payload->>'followupPlanId'),
      'presenceConfirmed', true,
      'doctorNotification', 'Horário escolhido e confirmado pelo paciente',
      'doctorNotificationUnread', true,
      'updatedAt', now()
    );

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.appointments
       SET status = 'Confirmada',
           patient = v_patient_name,
           payload = v_payload,
           updated_at = now()
     WHERE id = v_existing.id;
  ELSE
    INSERT INTO public.appointments(id, passport, patient, status, payload, created_at, updated_at)
    VALUES(v_appointment_id, passport_key, v_patient_name, 'Confirmada', v_payload, now(), now());
  END IF;

  UPDATE public.clinical_appointment_slots
     SET status = 'Ocupado',
         patient_passport = passport_key,
         patient_name = v_patient_name,
         appointment_id = v_appointment_id,
         booked_at = now(),
         updated_at = now()
   WHERE id = v_slot.id;

  IF v_occurrence.id IS NOT NULL THEN
    UPDATE public.clinical_followup_occurrences
       SET status = 'Confirmada',
           slot_id = v_slot.id,
           appointment_id = v_appointment_id,
           updated_at = now()
     WHERE id = v_occurrence.id;
  END IF;

  INSERT INTO public.system_activities(module, action, description, actor, reference)
  VALUES(
    'Agenda Clínica',
    'Horário confirmado pelo paciente',
    format('%s confirmou %s com %s em %s às %s.', v_patient_name, v_specialty, v_doctor_name, to_char(v_slot.starts_at at time zone 'America/Sao_Paulo','DD/MM/YYYY'), v_time),
    v_patient_name,
    v_appointment_id
  );

  RETURN jsonb_build_object(
    'ok', true,
    'appointment_id', v_appointment_id,
    'doctor_name', v_doctor_name,
    'starts_at', v_slot.starts_at,
    'reused_request', v_existing.id IS NOT NULL,
    'linked_occurrence', v_occurrence.id IS NOT NULL
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ACTIVE_BOOKING', 'error', 'Você já possui uma consulta marcada nesta especialidade.');
END;
$function$;

-- Reclassifica apenas solicitações ATIVAS que se declaram explicitamente psicotécnico,
-- deixando consultas psicológicas reais e histórico finalizado intactos.
update public.appointments
   set payload = coalesce(payload, '{}'::jsonb)
       || jsonb_build_object(
            'flowType', 'Exames',
            'requestKind', 'exam',
            'examReclassifiedAt', now(),
            'examReclassifiedReason', 'psychotechnical_legacy_correction',
            'updatedAt', now()
          ),
       updated_at = now()
 where coalesce(payload->>'flowType', 'Consulta comum') <> 'Exames'
   and status in (
     'Solicitação enviada','Aguardando análise','Acompanhamento aguardando confirmação','Aceita',
     'Agendada','Confirmada','Reagendamento aceito','Em atendimento','Adiada','Atrasada'
   )
   and translate(
         lower(coalesce(payload->>'reason','')),
         'áàâãäéèêëíìîïóòôõöúùûüç',
         'aaaaaeeeeiiiiooooouuuuc'
       ) ~ 'psico[[:space:]-]*tecnic';

comment on function public.hpsr_patient_has_active_booking(text,text,text) is
  'Consulta ativa por paciente/especialidade; solicitações de Exames são independentes e não participam desta trava.';
comment on function public.hpsr_claim_clinical_request(text) is
  'Aceita solicitações clínicas; Exames não dependem de capacidade de consultas.';
