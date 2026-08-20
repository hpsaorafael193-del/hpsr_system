-- Mantém a confirmação do horário alinhada à leitura direta do Portal.
-- Não cria uma nova camada: apenas torna a comparação de especialidade da RPC
-- compatível com campos legados/compostos separados por vírgula, ponto e vírgula,
-- barra ou pipe.

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
     or not exists (
       select 1
         from regexp_split_to_table(coalesce(v_plan.specialty, ''), '[,;/|]+') plan_token
         cross join regexp_split_to_table(coalesce(v_slot.specialty, ''), '[,;/|]+') slot_token
        where public.hpsr_normalize_specialty(plan_token) <> ''
          and public.hpsr_normalize_specialty(slot_token) <> ''
          and (
            public.hpsr_normalize_specialty(plan_token) = public.hpsr_normalize_specialty(slot_token)
            or public.hpsr_normalize_specialty(plan_token) like '%' || public.hpsr_normalize_specialty(slot_token) || '%'
            or public.hpsr_normalize_specialty(slot_token) like '%' || public.hpsr_normalize_specialty(plan_token) || '%'
          )
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
  'Confirma atomicamente uma vaga futura publicada pelo médico do acompanhamento, com compatibilidade de especialidades simples ou compostas.';
