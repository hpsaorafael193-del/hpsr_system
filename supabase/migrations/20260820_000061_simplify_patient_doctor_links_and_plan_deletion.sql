-- v1.0.278
-- Simplifica o vínculo paciente <-> médico reutilizando patient_portal_access.schedule_assignments,
-- permite reserva por vínculo leve e corrige exclusão de planejamentos que deixavam o paciente bloqueado.

create or replace function public.set_patient_schedule_link(
  target_passport text,
  target_doctor_id uuid,
  target_doctor_name text,
  target_specialty text,
  target_enabled boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_passport text := public.hpsr_normalize_passport(target_passport);
  v_specialty text := trim(coalesce(target_specialty, ''));
  v_name text := trim(coalesce(target_doctor_name, ''));
  v_assignments jsonb := '[]'::jsonb;
  v_cleaned jsonb := '[]'::jsonb;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;
  if v_passport = '' or target_doctor_id is null or v_specialty = '' then
    raise exception 'Paciente, médico e especialidade são obrigatórios';
  end if;
  if target_doctor_id <> v_user and not public.is_hpsr_schedule_manager() then
    raise exception 'Sem permissão para alterar este vínculo';
  end if;

  select coalesce(schedule_assignments, '[]'::jsonb)
    into v_assignments
    from public.patient_portal_access
   where public.hpsr_normalize_passport(patient_passport) = v_passport
   for update;

  if not found then
    raise exception 'Paciente sem acesso ativo ao Portal do Paciente';
  end if;

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into v_cleaned
    from jsonb_array_elements(v_assignments) item
   where coalesce(item->>'doctor_id', '') <> target_doctor_id::text
      or public.hpsr_normalize_specialty(item->>'specialty') <> public.hpsr_normalize_specialty(v_specialty);

  if target_enabled then
    v_cleaned := v_cleaned || jsonb_build_array(jsonb_build_object(
      'doctor_id', target_doctor_id::text,
      'doctor_name', coalesce(nullif(v_name, ''), 'Médico responsável'),
      'specialty', v_specialty
    ));
  end if;

  update public.patient_portal_access
     set schedule_assignments = v_cleaned,
         updated_at = now()
   where public.hpsr_normalize_passport(patient_passport) = v_passport;

  return jsonb_build_object('ok', true, 'linked', target_enabled, 'assignments', v_cleaned);
end;
$$;

revoke all on function public.set_patient_schedule_link(text, uuid, text, text, boolean) from public, anon;
grant execute on function public.set_patient_schedule_link(text, uuid, text, text, boolean) to authenticated, service_role;

create or replace function public.delete_clinical_followup_plan(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.clinical_followup_plans%rowtype;
  v_occurrences integer := 0;
  v_cancelled_appointments integer := 0;
  v_preserved_appointments integer := 0;
  v_released_slots integer := 0;
  v_actor text;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;

  select * into v_plan
    from public.clinical_followup_plans
   where id = p_plan_id
   for update;

  if v_plan.id is null then raise exception 'Planejamento não encontrado'; end if;
  if v_plan.doctor_id <> v_user and not public.is_hpsr_schedule_manager() then
    raise exception 'Sem permissão para excluir este planejamento';
  end if;

  select count(*) into v_occurrences
    from public.clinical_followup_occurrences
   where plan_id = p_plan_id;

  -- Consultas ainda ativas geradas pelo planejamento são canceladas para não bloquear
  -- novas solicitações. Histórico concluído permanece preservado.
  update public.appointments a
     set status = 'Cancelada',
         payload = coalesce(a.payload, '{}'::jsonb) || jsonb_build_object(
           'cancelReason', 'Planejamento de acompanhamento removido',
           'cancelledByPlanDeletion', true,
           'updatedAt', now()
         ),
         updated_at = now()
   where a.id in (
     select o.appointment_id
       from public.clinical_followup_occurrences o
      where o.plan_id = p_plan_id
        and o.appointment_id is not null
   )
     and public.hpsr_is_active_patient_booking(a.status);
  get diagnostics v_cancelled_appointments = row_count;

  select count(*) into v_preserved_appointments
    from public.clinical_followup_occurrences o
    join public.appointments a on a.id = o.appointment_id
   where o.plan_id = p_plan_id
     and o.appointment_id is not null
     and not public.hpsr_is_active_patient_booking(a.status);

  update public.clinical_appointment_slots s
     set status = 'Disponível',
         patient_passport = null,
         patient_name = null,
         appointment_id = null,
         booked_at = null,
         updated_at = now()
   where s.id in (
     select o.slot_id
       from public.clinical_followup_occurrences o
      where o.plan_id = p_plan_id
        and o.slot_id is not null
   )
     and s.starts_at > now()
     and s.status in ('Ocupado', 'Disponível');
  get diagnostics v_released_slots = row_count;

  -- Remove as referências do planejamento depois de preservar/cancelar o que é consulta real.
  delete from public.clinical_followup_occurrences where plan_id = p_plan_id;
  delete from public.clinical_followup_plans where id = p_plan_id;

  -- O vínculo leve correspondente também é removido quando não existe outro planejamento
  -- ativo do mesmo médico/especialidade para o paciente.
  if not exists (
    select 1 from public.clinical_followup_plans fp
     where public.hpsr_normalize_passport(fp.patient_passport) = public.hpsr_normalize_passport(v_plan.patient_passport)
       and fp.doctor_id = v_plan.doctor_id
       and coalesce(fp.status, 'Ativo') <> 'Arquivado'
       and public.hpsr_normalize_specialty(fp.specialty) = public.hpsr_normalize_specialty(v_plan.specialty)
  ) then
    update public.patient_portal_access pa
       set schedule_assignments = coalesce((
         select jsonb_agg(item)
           from jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item
          where coalesce(item->>'doctor_id', '') <> v_plan.doctor_id::text
             or public.hpsr_normalize_specialty(item->>'specialty') <> public.hpsr_normalize_specialty(v_plan.specialty)
       ), '[]'::jsonb),
           updated_at = now()
     where public.hpsr_normalize_passport(pa.patient_passport) = public.hpsr_normalize_passport(v_plan.patient_passport);
  end if;

  select coalesce(name, role, v_user::text) into v_actor from public.profiles where id = v_user;
  insert into public.system_activities(module, action, description, actor, reference)
  values (
    'Agenda Clínica',
    'Exclusão de planejamento',
    format('Planejamento de %s (%s) removido. %s ocorrência(s), %s consulta(s) ativa(s) cancelada(s), %s consulta(s) históricas preservada(s) e %s vaga(s) futura(s) liberada(s).',
      v_plan.patient_name, v_plan.specialty, v_occurrences, v_cancelled_appointments, v_preserved_appointments, v_released_slots),
    coalesce(v_actor, v_user::text),
    p_plan_id::text
  );

  return jsonb_build_object(
    'deleted', true,
    'deleted_occurrences', v_occurrences,
    'cancelled_appointments', v_cancelled_appointments,
    'preserved_appointments', v_preserved_appointments,
    'released_slots', v_released_slots
  );
end;
$$;

create or replace function public.book_patient_schedule_slot(
  target_passport text,
  target_slot_id uuid,
  target_plan_id uuid default null,
  target_doctor_id uuid default null,
  target_specialty text default null,
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
  v_specialty text;
  v_doctor_name text;
  v_allowed boolean := false;
begin
  if passport_key = '' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_PATIENT', 'error', 'Paciente inválido.');
  end if;
  perform pg_advisory_xact_lock(hashtext('hpsr-schedule-book:' || passport_key));

  select * into v_slot from public.clinical_appointment_slots where id = target_slot_id for update;
  if not found or v_slot.status <> 'Disponível' then
    return jsonb_build_object('ok', false, 'code', 'SLOT_UNAVAILABLE', 'error', 'Este horário não está mais disponível.');
  end if;

  if target_plan_id is not null then
    select * into v_plan from public.clinical_followup_plans
     where id = target_plan_id
       and public.hpsr_normalize_passport(patient_passport) = passport_key
       and coalesce(status, 'Ativo') <> 'Arquivado'
     for update;
    if not found then
      return jsonb_build_object('ok', false, 'code', 'PLAN_NOT_FOUND', 'error', 'Este acompanhamento não está mais disponível.');
    end if;
    v_specialty := v_plan.specialty;
    v_doctor_name := v_plan.doctor_name;
    v_allowed := v_slot.doctor_id = v_plan.doctor_id and exists (
      select 1
        from regexp_split_to_table(coalesce(v_plan.specialty, ''), '[,;/|]+') p
        cross join regexp_split_to_table(coalesce(v_slot.specialty, ''), '[,;/|]+') s
       where public.hpsr_normalize_specialty(p) <> ''
         and public.hpsr_normalize_specialty(s) <> ''
         and (public.hpsr_normalize_specialty(p) = public.hpsr_normalize_specialty(s)
           or public.hpsr_normalize_specialty(p) like '%' || public.hpsr_normalize_specialty(s) || '%'
           or public.hpsr_normalize_specialty(s) like '%' || public.hpsr_normalize_specialty(p) || '%')
    );
  else
    v_specialty := coalesce(nullif(trim(target_specialty), ''), v_slot.specialty);
    v_doctor_name := v_slot.doctor_name;
    v_allowed := (target_doctor_id is null or target_doctor_id = v_slot.doctor_id)
      and exists (
        select 1
          from public.patient_portal_access pa,
               jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item
         where public.hpsr_normalize_passport(pa.patient_passport) = passport_key
           and coalesce(pa.access_enabled, true)
           and item->>'doctor_id' = v_slot.doctor_id::text
           and (
             public.hpsr_normalize_specialty(item->>'specialty') = public.hpsr_normalize_specialty(v_slot.specialty)
             or public.hpsr_normalize_specialty(item->>'specialty') like '%' || public.hpsr_normalize_specialty(v_slot.specialty) || '%'
             or public.hpsr_normalize_specialty(v_slot.specialty) like '%' || public.hpsr_normalize_specialty(item->>'specialty') || '%'
           )
      );
  end if;

  if not v_allowed then
    return jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED', 'error', 'Este horário não pertence a um médico vinculado a este paciente.');
  end if;

  v_slot_date := (v_slot.starts_at at time zone 'America/Sao_Paulo')::date;
  if v_slot_date <= v_today then
    return jsonb_build_object('ok', false, 'code', 'SAME_DAY_CLOSED', 'error', 'Os horários deste dia já fecharam para novas confirmações. Aguarde a próxima agenda do médico.');
  end if;

  if public.hpsr_patient_has_active_booking(passport_key, v_specialty, null) then
    return jsonb_build_object('ok', false, 'code', 'ACTIVE_BOOKING', 'error', 'Você já possui uma consulta ativa nesta especialidade.');
  end if;

  if target_plan_id is not null then
    select * into v_occurrence from public.clinical_followup_occurrences
     where plan_id = v_plan.id and slot_id is null and appointment_id is null
     order by planned_date asc, created_at asc limit 1 for update;
    if not found then
      return jsonb_build_object('ok', false, 'code', 'NO_PENDING_OCCURRENCE', 'error', 'Este acompanhamento não possui um próximo atendimento pendente.');
    end if;
  end if;

  select name into v_patient_name from public.patient_registry
   where public.hpsr_normalize_passport(passport) = passport_key limit 1;
  v_patient_name := coalesce(nullif(trim(v_patient_name), ''), case when target_plan_id is not null then v_plan.patient_name else null end, 'Paciente');
  v_appointment_id := 'HPSR-AGENDA-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_time := to_char(v_slot.starts_at at time zone 'America/Sao_Paulo', 'HH24:MI');

  v_payload := jsonb_build_object(
    'patient', v_patient_name,
    'passport', passport_key,
    'requestedByPassport', requester_key,
    'requestedByRelationship', case when requester_key = passport_key then 'Titular' else 'Responsável' end,
    'specialty', v_specialty,
    'physician', v_doctor_name,
    'doctor', v_doctor_name,
    'doctorId', v_slot.doctor_id,
    'preferredDate', to_char(v_slot_date, 'YYYY-MM-DD'),
    'date', to_char(v_slot_date, 'YYYY-MM-DD'),
    'time', v_time,
    'preferredPeriod', v_time,
    'reason', case when target_plan_id is not null then 'Retorno de acompanhamento' else 'Consulta com médico vinculado' end,
    'flowType', case when target_plan_id is not null then 'Acompanhamento' else 'Consulta vinculada' end,
    'source', 'clinical_availability',
    'schedulingMode', case when target_plan_id is not null then 'followup_self_booking' else 'linked_patient_self_booking' end,
    'slotId', v_slot.id,
    'planId', target_plan_id,
    'occurrenceId', case when target_plan_id is not null then v_occurrence.id else null end,
    'presenceConfirmed', true,
    'doctorNotification', 'Horário escolhido e confirmado pelo paciente',
    'doctorNotificationUnread', true,
    'createdAt', now(),
    'updatedAt', now()
  );

  insert into public.appointments(id, passport, patient, status, payload, created_at, updated_at)
  values(v_appointment_id, passport_key, v_patient_name, 'Confirmada', v_payload, now(), now());

  update public.clinical_appointment_slots
     set status='Ocupado', patient_passport=passport_key, patient_name=v_patient_name,
         appointment_id=v_appointment_id, booked_at=now(), updated_at=now()
   where id=v_slot.id;

  if target_plan_id is not null then
    update public.clinical_followup_occurrences
       set status='Confirmada', slot_id=v_slot.id, appointment_id=v_appointment_id, updated_at=now()
     where id=v_occurrence.id;
  end if;

  return jsonb_build_object('ok', true, 'appointment_id', v_appointment_id, 'doctor_name', v_doctor_name, 'starts_at', v_slot.starts_at);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'code', 'ACTIVE_BOOKING', 'error', 'Você já possui uma consulta ativa nesta especialidade.');
end;
$$;

revoke all on function public.book_patient_schedule_slot(text, uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.book_patient_schedule_slot(text, uuid, uuid, uuid, text, text) to service_role;
