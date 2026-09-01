-- Agenda do Médico / Portal do Paciente: uma única fonte de verdade para reservas.
-- Uma vaga confirmada deixa de ser disponível, mas o compromisso permanece visível
-- para médico e paciente. Reservas não são apagadas quando a publicação é removida.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinical_appointment_slots_appointment_id_fkey'
  ) THEN
    ALTER TABLE public.clinical_appointment_slots
      ADD CONSTRAINT clinical_appointment_slots_appointment_id_fkey
      FOREIGN KEY (appointment_id)
      REFERENCES public.appointments(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS clinical_appointment_slots_appointment_unique_idx
  ON public.clinical_appointment_slots (appointment_id)
  WHERE appointment_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinical_appointment_slots_booking_state_check'
  ) THEN
    ALTER TABLE public.clinical_appointment_slots
      ADD CONSTRAINT clinical_appointment_slots_booking_state_check
      CHECK (
        (
          appointment_id IS NULL
          AND patient_passport IS NULL
          AND patient_name IS NULL
          AND booked_at IS NULL
        )
        OR
        (
          appointment_id IS NOT NULL
          AND patient_passport IS NOT NULL
          AND status <> 'Disponível'
        )
      ) NOT VALID;
    ALTER TABLE public.clinical_appointment_slots
      VALIDATE CONSTRAINT clinical_appointment_slots_booking_state_check;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime'
      AND schemaname='public'
      AND tablename='appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.delete_clinical_availability_series(p_series_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_series public.clinical_availability_series%rowtype;
  v_actor text;
  v_deleted_slots integer := 0;
  v_preserved_bookings integer := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sessão não encontrada'; END IF;

  SELECT * INTO v_series
  FROM public.clinical_availability_series
  WHERE id = p_series_id
  FOR UPDATE;

  IF v_series.id IS NULL THEN RAISE EXCEPTION 'Agenda publicada não encontrada'; END IF;
  IF v_series.doctor_id <> v_user AND NOT public.is_hpsr_schedule_manager() THEN
    RAISE EXCEPTION 'Sem permissão para excluir esta agenda publicada';
  END IF;

  SELECT count(*) INTO v_preserved_bookings
  FROM public.clinical_appointment_slots
  WHERE series_id = p_series_id AND appointment_id IS NOT NULL;

  UPDATE public.clinical_appointment_slots
  SET series_id = NULL, updated_at = now()
  WHERE series_id = p_series_id AND appointment_id IS NOT NULL;

  DELETE FROM public.clinical_appointment_slots
  WHERE series_id = p_series_id AND appointment_id IS NULL;
  GET DIAGNOSTICS v_deleted_slots = ROW_COUNT;

  DELETE FROM public.clinical_availability_series WHERE id = p_series_id;

  SELECT coalesce(name, role, v_user::text) INTO v_actor
  FROM public.profiles WHERE id = v_user;

  INSERT INTO public.system_activities(module, action, description, actor, reference)
  VALUES (
    'Agenda Clínica',
    'Exclusão de agenda publicada',
    format(
      'Publicação %s de %s (%s a %s) removida. %s vaga(s) livre(s) removida(s); %s consulta(s) reservada(s) preservada(s).',
      v_series.specialty, v_series.doctor_name, v_series.start_date, v_series.end_date,
      v_deleted_slots, v_preserved_bookings
    ),
    coalesce(v_actor, v_user::text),
    p_series_id::text
  );

  RETURN jsonb_build_object(
    'deleted', true,
    'deleted_slots', v_deleted_slots,
    'preserved_bookings', v_preserved_bookings
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.hpsr_sync_slot_from_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_slot public.clinical_appointment_slots%rowtype;
  v_slot_id uuid;
  v_series_active boolean := false;
  v_final boolean := false;
BEGIN
  BEGIN
    v_slot_id := nullif(coalesce(new.payload->>'slotId',''), '')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_slot_id := NULL;
  END;

  IF v_slot_id IS NULL THEN
    SELECT * INTO v_slot
    FROM public.clinical_appointment_slots
    WHERE appointment_id = new.id
    LIMIT 1 FOR UPDATE;
  ELSE
    SELECT * INTO v_slot
    FROM public.clinical_appointment_slots
    WHERE id = v_slot_id
    LIMIT 1 FOR UPDATE;
  END IF;

  IF v_slot.id IS NULL THEN RETURN new; END IF;

  v_final := coalesce(trim(new.status),'') IN (
    'Realizada','Concluída','Concluído','Não compareceu','Cancelada',
    'Recusada','Recusado','Arquivado','Encerrado'
  );

  IF new.status = 'Cancelada' THEN
    IF v_slot.series_id IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM public.clinical_availability_series s
        WHERE s.id = v_slot.series_id AND coalesce(s.status,'Ativa') = 'Ativa'
      ) INTO v_series_active;
    END IF;

    IF v_slot.starts_at > now() AND v_series_active THEN
      UPDATE public.clinical_appointment_slots
      SET status='Disponível', patient_passport=NULL, patient_name=NULL,
          appointment_id=NULL, booked_at=NULL, updated_at=now()
      WHERE id=v_slot.id;
    ELSE
      UPDATE public.clinical_appointment_slots
      SET status='Encerrado', updated_at=now()
      WHERE id=v_slot.id;
    END IF;
    RETURN new;
  END IF;

  IF v_final THEN
    UPDATE public.clinical_appointment_slots
    SET status='Encerrado', appointment_id=new.id,
        patient_passport=coalesce(nullif(trim(new.passport),''),v_slot.patient_passport),
        patient_name=coalesce(nullif(trim(new.patient),''),v_slot.patient_name),
        updated_at=now()
    WHERE id=v_slot.id;
    RETURN new;
  END IF;

  UPDATE public.clinical_appointment_slots
  SET status='Ocupado', appointment_id=new.id,
      patient_passport=coalesce(nullif(trim(new.passport),''),v_slot.patient_passport),
      patient_name=coalesce(nullif(trim(new.patient),''),v_slot.patient_name),
      booked_at=coalesce(v_slot.booked_at,now()), updated_at=now()
  WHERE id=v_slot.id;

  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS hpsr_sync_slot_from_appointment ON public.appointments;
CREATE TRIGGER hpsr_sync_slot_from_appointment
AFTER INSERT OR UPDATE OF status, payload, passport, patient
ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.hpsr_sync_slot_from_appointment();

REVOKE ALL ON FUNCTION public.hpsr_sync_slot_from_appointment() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.patient_portal_available_slots(
  target_passport text,
  cutoff_at timestamptz,
  max_rows integer DEFAULT 300
)
RETURNS TABLE(
  id uuid, doctor_id uuid, doctor_name text, specialty text,
  starts_at timestamptz, ends_at timestamptz, status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH explicit_access AS (
    SELECT item->>'doctor_id' AS doctor_id,
           public.hpsr_normalize_specialty(item->>'specialty') AS specialty
    FROM public.patient_portal_access pa
    CROSS JOIN LATERAL jsonb_array_elements(coalesce(pa.schedule_assignments,'[]'::jsonb)) item
    WHERE public.hpsr_normalize_passport(pa.patient_passport)=public.hpsr_normalize_passport(target_passport)
      AND coalesce(pa.access_enabled,true)
      AND coalesce(item->>'doctor_id','')<>''
      AND public.hpsr_normalize_specialty(item->>'specialty')<>''
  )
  SELECT s.id,s.doctor_id,s.doctor_name,s.specialty,s.starts_at,s.ends_at,s.status
  FROM public.clinical_appointment_slots s
  WHERE s.status='Disponível'
    AND s.starts_at > greatest(coalesce(cutoff_at,now()), now()+interval '24 hours')
    AND EXISTS (
      SELECT 1 FROM explicit_access access
      WHERE access.doctor_id=s.doctor_id::text
        AND access.specialty=public.hpsr_normalize_specialty(s.specialty)
    )
  ORDER BY s.starts_at ASC,s.doctor_name ASC
  LIMIT least(greatest(coalesce(max_rows,300),1),500);
$function$;

REVOKE ALL ON FUNCTION public.patient_portal_available_slots(text,timestamptz,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patient_portal_available_slots(text,timestamptz,integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reschedule_clinical_appointment(
  p_appointment_id text,
  p_new_date date,
  p_new_time time without time zone,
  p_reason text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_row public.appointments%rowtype;
  v_profile public.profiles%rowtype;
  v_slot public.clinical_appointment_slots%rowtype;
  v_payload jsonb;
  v_specialty text;
  v_new_start timestamptz;
  v_conflict_id text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','UNAUTHENTICATED','error','Sessão médica inválida.');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id=v_user;
  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','INVALID_DOCTOR','error','Perfil profissional não encontrado.');
  END IF;

  SELECT * INTO v_row FROM public.appointments WHERE id=p_appointment_id FOR UPDATE;
  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','NOT_FOUND','error','Consulta não encontrada.');
  END IF;

  IF NOT (
    coalesce(v_row.payload->>'doctorId','')=v_user::text
    OR coalesce(v_row.payload->>'acceptedById','')=v_user::text
    OR lower(trim(coalesce(v_row.payload->>'physician',v_row.payload->>'doctor','')))=lower(trim(coalesce(v_profile.name,'')))
    OR public.is_hpsr_schedule_manager()
  ) THEN
    RETURN jsonb_build_object('ok',false,'code','NOT_ALLOWED','error','Sem permissão para reagendar esta consulta.');
  END IF;

  IF p_new_date IS NULL OR p_new_time IS NULL THEN
    RETURN jsonb_build_object('ok',false,'code','INVALID_DATE','error','Informe a nova data e o novo horário.');
  END IF;

  v_new_start := ((p_new_date+p_new_time) AT TIME ZONE 'America/Sao_Paulo');
  IF v_new_start <= now() THEN
    RETURN jsonb_build_object('ok',false,'code','PAST_DATE','error','O novo horário deve estar no futuro.');
  END IF;

  v_specialty := coalesce(nullif(trim(v_row.payload->>'specialty'),''),'Clínico Geral');

  SELECT a.id INTO v_conflict_id
  FROM public.appointments a
  WHERE a.id<>v_row.id
    AND coalesce(a.payload->>'doctorId',a.payload->>'acceptedById','')=v_user::text
    AND public.hpsr_is_active_patient_booking(a.status)
    AND coalesce(a.payload->>'date',a.payload->>'preferredDate','')=to_char(p_new_date,'YYYY-MM-DD')
    AND abs(extract(epoch from (
      ((to_char(p_new_date,'YYYY-MM-DD')||' '||coalesce(a.payload->>'time',a.payload->>'preferredTime','00:00'))::timestamp)
      - ((to_char(p_new_date,'YYYY-MM-DD')||' '||to_char(p_new_time,'HH24:MI'))::timestamp)
    )))<3600
  LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok',false,'code','SCHEDULE_CONFLICT','error','Já existe outro atendimento próximo desse horário na sua agenda.');
  END IF;

  SELECT * INTO v_slot
  FROM public.clinical_appointment_slots
  WHERE appointment_id=v_row.id
  LIMIT 1 FOR UPDATE;

  IF v_slot.id IS NOT NULL THEN
    IF v_slot.starts_at>now() AND v_slot.series_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.clinical_availability_series s
      WHERE s.id=v_slot.series_id AND coalesce(s.status,'Ativa')='Ativa'
    ) THEN
      UPDATE public.clinical_appointment_slots
      SET status='Disponível',patient_passport=NULL,patient_name=NULL,
          appointment_id=NULL,booked_at=NULL,updated_at=now()
      WHERE id=v_slot.id;
    ELSE
      UPDATE public.clinical_appointment_slots
      SET status='Encerrado',appointment_id=NULL,updated_at=now()
      WHERE id=v_slot.id;
    END IF;
  END IF;

  v_payload := coalesce(v_row.payload,'{}'::jsonb)-'slotId'
    || jsonb_build_object(
      'preferredDate',to_char(p_new_date,'YYYY-MM-DD'),
      'date',to_char(p_new_date,'YYYY-MM-DD'),
      'preferredTime',to_char(p_new_time,'HH24:MI'),
      'time',to_char(p_new_time,'HH24:MI'),
      'preferredPeriod',to_char(p_new_time,'HH24:MI'),
      'previousDate',coalesce(v_row.payload->>'date',v_row.payload->>'preferredDate'),
      'previousTime',coalesce(v_row.payload->>'time',v_row.payload->>'preferredTime'),
      'rescheduleReason',coalesce(nullif(trim(p_reason),''),'Ajuste combinado com o paciente'),
      'rescheduleNotes',coalesce(trim(p_notes),''),
      'rescheduledAt',now(),
      'rescheduledBy',coalesce(v_profile.name,v_user::text),
      'doctorNotificationUnread',false,
      'updatedAt',now()
    );

  UPDATE public.appointments
  SET status='Confirmada',payload=v_payload,updated_at=now()
  WHERE id=v_row.id;

  IF coalesce(v_row.payload->>'occurrenceId','')<>'' THEN
    UPDATE public.clinical_followup_occurrences
    SET planned_date=p_new_date,slot_id=NULL,appointment_id=v_row.id,
        status='Confirmada',updated_at=now()
    WHERE id=(v_row.payload->>'occurrenceId')::uuid;
  END IF;

  INSERT INTO public.system_activities(module,action,description,actor,reference)
  VALUES(
    'Agenda Clínica','Reagendamento confirmado',
    format('Consulta de %s reagendada para %s às %s.',v_row.patient,to_char(p_new_date,'DD/MM/YYYY'),to_char(p_new_time,'HH24:MI')),
    coalesce(v_profile.name,v_user::text),v_row.id
  );

  RETURN jsonb_build_object(
    'ok',true,'appointment_id',v_row.id,'status','Confirmada',
    'date',to_char(p_new_date,'YYYY-MM-DD'),'time',to_char(p_new_time,'HH24:MI'),
    'specialty',v_specialty
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.reschedule_clinical_appointment(text,date,time without time zone,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reschedule_clinical_appointment(text,date,time without time zone,text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.book_patient_schedule_slot(
  target_passport text,
  target_slot_id uuid,
  target_plan_id uuid DEFAULT NULL::uuid,
  target_doctor_id uuid DEFAULT NULL::uuid,
  target_specialty text DEFAULT NULL::text,
  requested_by_passport text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  passport_key text := public.hpsr_normalize_passport(target_passport);
  requester_key text := public.hpsr_normalize_passport(coalesce(requested_by_passport,target_passport));
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
  IF passport_key='' THEN
    RETURN jsonb_build_object('ok',false,'code','INVALID_PATIENT','error','Paciente inválido.');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('hpsr-schedule-book:'||passport_key));

  SELECT * INTO v_slot
  FROM public.clinical_appointment_slots
  WHERE id=target_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'code','SLOT_NOT_FOUND','error','Este horário não foi encontrado.');
  END IF;

  IF v_slot.status<>'Disponível' THEN
    IF v_slot.appointment_id IS NOT NULL
       AND public.hpsr_normalize_passport(v_slot.patient_passport)=passport_key
       AND EXISTS (
         SELECT 1 FROM public.appointments a
         WHERE a.id=v_slot.appointment_id
           AND public.hpsr_is_active_patient_booking(a.status)
       ) THEN
      RETURN jsonb_build_object(
        'ok',true,
        'appointment_id',v_slot.appointment_id,
        'doctor_name',v_slot.doctor_name,
        'starts_at',v_slot.starts_at,
        'already_booked',true
      );
    END IF;
    RETURN jsonb_build_object('ok',false,'code','SLOT_UNAVAILABLE','error','Este horário não está mais disponível.');
  END IF;

  IF target_doctor_id IS NOT NULL AND target_doctor_id<>v_slot.doctor_id THEN
    RETURN jsonb_build_object('ok',false,'code','DOCTOR_MISMATCH','error','Este horário não pertence ao médico selecionado.');
  END IF;

  v_specialty:=coalesce(nullif(trim(target_specialty),''),v_slot.specialty);
  IF public.hpsr_normalize_specialty(v_specialty)<>public.hpsr_normalize_specialty(v_slot.specialty) THEN
    RETURN jsonb_build_object('ok',false,'code','SPECIALTY_MISMATCH','error','Este horário não pertence à especialidade selecionada.');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.patient_portal_access pa,
         jsonb_array_elements(coalesce(pa.schedule_assignments,'[]'::jsonb)) item
    WHERE public.hpsr_normalize_passport(pa.patient_passport)=passport_key
      AND coalesce(pa.access_enabled,true)
      AND item->>'doctor_id'=v_slot.doctor_id::text
      AND public.hpsr_normalize_specialty(item->>'specialty')=public.hpsr_normalize_specialty(v_slot.specialty)
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok',false,'code','NOT_ALLOWED','error','Este horário não pertence a um médico vinculado a este paciente.');
  END IF;

  IF v_slot.starts_at<=now()+interval '24 hours' THEN
    RETURN jsonb_build_object('ok',false,'code','BOOKING_CLOSED','error','Este horário já está dentro da janela de 24 horas e não aceita nova confirmação pelo Portal.');
  END IF;

  SELECT * INTO v_other_scheduled
  FROM public.appointments a
  WHERE public.hpsr_normalize_passport(a.passport)=passport_key
    AND public.hpsr_normalize_specialty(a.payload->>'specialty')=public.hpsr_normalize_specialty(v_specialty)
    AND a.status IN ('Agendada','Confirmada','Reagendamento aceito','Em atendimento','Adiada','Atrasada')
    AND a.id<>coalesce(v_slot.appointment_id,'')
  ORDER BY a.updated_at DESC,a.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_other_scheduled.id IS NOT NULL THEN
    IF coalesce(v_other_scheduled.payload->>'slotId','')=v_slot.id::text THEN
      RETURN jsonb_build_object(
        'ok',true,
        'appointment_id',v_other_scheduled.id,
        'doctor_name',coalesce(v_other_scheduled.payload->>'doctor',v_slot.doctor_name),
        'starts_at',v_slot.starts_at,
        'already_booked',true
      );
    END IF;
    RETURN jsonb_build_object('ok',false,'code','ACTIVE_BOOKING','error','Você já possui uma consulta marcada nesta especialidade.');
  END IF;

  SELECT * INTO v_existing
  FROM public.appointments a
  WHERE public.hpsr_normalize_passport(a.passport)=passport_key
    AND public.hpsr_normalize_specialty(a.payload->>'specialty')=public.hpsr_normalize_specialty(v_specialty)
    AND coalesce(a.payload->>'source','')='patient_portal'
    AND a.status IN ('Solicitação enviada','Aguardando análise','Acompanhamento aguardando confirmação','Aceita')
    AND (
      coalesce(a.payload->>'acceptedById',a.payload->>'doctorId','')=v_slot.doctor_id::text
      OR coalesce(a.payload->>'requestedDoctorId','')=v_slot.doctor_id::text
      OR coalesce(a.payload->>'acceptedById',a.payload->>'doctorId',a.payload->>'requestedDoctorId','')=''
    )
  ORDER BY
    CASE a.status
      WHEN 'Aceita' THEN 0
      WHEN 'Acompanhamento aguardando confirmação' THEN 1
      WHEN 'Aguardando análise' THEN 2
      ELSE 3
    END,
    a.updated_at DESC,a.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF target_plan_id IS NOT NULL THEN
    SELECT * INTO v_plan
    FROM public.clinical_followup_plans
    WHERE id=target_plan_id
      AND public.hpsr_normalize_passport(patient_passport)=passport_key
      AND doctor_id=v_slot.doctor_id
      AND public.hpsr_normalize_specialty(specialty)=public.hpsr_normalize_specialty(v_specialty)
      AND coalesce(status,'Ativo')<>'Arquivado'
    FOR UPDATE;
  ELSE
    SELECT * INTO v_plan
    FROM public.clinical_followup_plans
    WHERE public.hpsr_normalize_passport(patient_passport)=passport_key
      AND doctor_id=v_slot.doctor_id
      AND public.hpsr_normalize_specialty(specialty)=public.hpsr_normalize_specialty(v_specialty)
      AND coalesce(status,'Ativo')<>'Arquivado'
    ORDER BY updated_at DESC,created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF v_plan.id IS NOT NULL THEN
    SELECT * INTO v_occurrence
    FROM public.clinical_followup_occurrences
    WHERE plan_id=v_plan.id
      AND slot_id IS NULL
      AND appointment_id IS NULL
      AND coalesce(status,'') NOT IN ('Consulta realizada','Realizada','Concluída','Concluído','Cancelada','Cancelado','Não compareceu')
    ORDER BY planned_date ASC,created_at ASC
    LIMIT 1
    FOR UPDATE;
  END IF;

  SELECT name INTO v_patient_name
  FROM public.patient_registry
  WHERE public.hpsr_normalize_passport(passport)=passport_key
  LIMIT 1;

  v_patient_name:=coalesce(nullif(trim(v_patient_name),''),v_existing.patient,'Paciente');
  v_doctor_name:=v_slot.doctor_name;
  v_appointment_id:=coalesce(
    v_existing.id,
    'HPSR-AGENDA-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))
  );
  v_time:=to_char(v_slot.starts_at at time zone 'America/Sao_Paulo','HH24:MI');
  v_flow_type:=coalesce(
    nullif(v_existing.payload->>'flowType',''),
    CASE WHEN v_plan.id IS NOT NULL THEN 'Acompanhamento' ELSE 'Consulta vinculada' END
  );

  v_payload:=coalesce(v_existing.payload,'{}'::jsonb)||jsonb_build_object(
    'patient',v_patient_name,
    'passport',passport_key,
    'requestedByPassport',requester_key,
    'requestedByRelationship',CASE WHEN requester_key=passport_key THEN 'Titular' ELSE 'Responsável' END,
    'specialty',v_specialty,
    'physician',v_doctor_name,
    'doctor',v_doctor_name,
    'doctorId',v_slot.doctor_id,
    'acceptedById',v_slot.doctor_id::text,
    'acceptedByName',v_doctor_name,
    'acceptedAt',coalesce(v_existing.payload->'acceptedAt',to_jsonb(now())),
    'preferredDate',to_char(v_slot.starts_at at time zone 'America/Sao_Paulo','YYYY-MM-DD'),
    'date',to_char(v_slot.starts_at at time zone 'America/Sao_Paulo','YYYY-MM-DD'),
    'time',v_time,
    'preferredPeriod',v_time,
    'reason',coalesce(nullif(v_existing.payload->>'reason',''),CASE WHEN v_plan.id IS NOT NULL THEN 'Retorno de acompanhamento' ELSE 'Consulta com médico vinculado' END),
    'flowType',v_flow_type,
    'source','clinical_availability',
    'schedulingMode','linked_patient_self_booking',
    'slotId',v_slot.id,
    'planId',CASE WHEN v_plan.id IS NOT NULL THEN v_plan.id ELSE NULL END,
    'occurrenceId',CASE WHEN v_occurrence.id IS NOT NULL THEN v_occurrence.id ELSE NULL END,
    'followupPlanId',coalesce(CASE WHEN v_plan.id IS NOT NULL THEN v_plan.id::text ELSE NULL END,v_existing.payload->>'followupPlanId'),
    'presenceConfirmed',true,
    'doctorNotification','Horário escolhido e confirmado pelo paciente',
    'doctorNotificationUnread',true,
    'updatedAt',now()
  );

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.appointments
    SET status='Confirmada',patient=v_patient_name,payload=v_payload,updated_at=now()
    WHERE id=v_existing.id;
  ELSE
    INSERT INTO public.appointments(id,passport,patient,status,payload,created_at,updated_at)
    VALUES(v_appointment_id,passport_key,v_patient_name,'Confirmada',v_payload,now(),now());
  END IF;

  UPDATE public.clinical_appointment_slots
  SET status='Ocupado',patient_passport=passport_key,patient_name=v_patient_name,
      appointment_id=v_appointment_id,booked_at=now(),updated_at=now()
  WHERE id=v_slot.id;

  IF v_occurrence.id IS NOT NULL THEN
    UPDATE public.clinical_followup_occurrences
    SET status='Confirmada',slot_id=v_slot.id,appointment_id=v_appointment_id,updated_at=now()
    WHERE id=v_occurrence.id;
  END IF;

  INSERT INTO public.system_activities(module,action,description,actor,reference)
  VALUES(
    'Agenda Clínica',
    'Horário confirmado pelo paciente',
    format('%s confirmou %s com %s em %s às %s.',v_patient_name,v_specialty,v_doctor_name,to_char(v_slot.starts_at at time zone 'America/Sao_Paulo','DD/MM/YYYY'),v_time),
    v_patient_name,
    v_appointment_id
  );

  RETURN jsonb_build_object(
    'ok',true,
    'appointment_id',v_appointment_id,
    'doctor_name',v_doctor_name,
    'starts_at',v_slot.starts_at,
    'reused_request',v_existing.id IS NOT NULL,
    'linked_occurrence',v_occurrence.id IS NOT NULL
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok',false,'code','ACTIVE_BOOKING','error','Você já possui uma consulta marcada nesta especialidade.');
END;
$function$;

REVOKE ALL ON FUNCTION public.book_patient_schedule_slot(text,uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.book_patient_schedule_slot(text,uuid,uuid,uuid,text,text) TO service_role;
