-- v1.0.278
-- Ao escolher um horário por vínculo leve, reutiliza a solicitação aceita pelo médico
-- em vez de criar uma segunda consulta ou bloquear o paciente pela própria solicitação.

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
  v_existing_appointment public.appointments%rowtype;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_slot_date date;
  v_time text;
  v_payload jsonb;
  v_specialty text;
  v_doctor_name text;
  v_allowed boolean := false;
begin
  if passport_key = '' then return jsonb_build_object('ok',false,'code','INVALID_PATIENT','error','Paciente inválido.'); end if;
  perform pg_advisory_xact_lock(hashtext('hpsr-schedule-book:' || passport_key));

  select * into v_slot from public.clinical_appointment_slots where id=target_slot_id for update;
  if not found or v_slot.status <> 'Disponível' then return jsonb_build_object('ok',false,'code','SLOT_UNAVAILABLE','error','Este horário não está mais disponível.'); end if;

  if target_plan_id is not null then
    select * into v_plan from public.clinical_followup_plans
     where id=target_plan_id and public.hpsr_normalize_passport(patient_passport)=passport_key and coalesce(status,'Ativo')<>'Arquivado'
     for update;
    if not found then return jsonb_build_object('ok',false,'code','PLAN_NOT_FOUND','error','Este acompanhamento não está mais disponível.'); end if;
    v_specialty:=v_plan.specialty; v_doctor_name:=v_plan.doctor_name;
    v_allowed:=v_slot.doctor_id=v_plan.doctor_id and exists(
      select 1 from regexp_split_to_table(coalesce(v_plan.specialty,''),'[,;/|]+') p
      cross join regexp_split_to_table(coalesce(v_slot.specialty,''),'[,;/|]+') s
      where public.hpsr_normalize_specialty(p)<>'' and public.hpsr_normalize_specialty(s)<>''
        and (public.hpsr_normalize_specialty(p)=public.hpsr_normalize_specialty(s)
          or public.hpsr_normalize_specialty(p) like '%'||public.hpsr_normalize_specialty(s)||'%'
          or public.hpsr_normalize_specialty(s) like '%'||public.hpsr_normalize_specialty(p)||'%'));
  else
    v_specialty:=coalesce(nullif(trim(target_specialty),''),v_slot.specialty); v_doctor_name:=v_slot.doctor_name;
    v_allowed:=(target_doctor_id is null or target_doctor_id=v_slot.doctor_id) and exists(
      select 1 from public.patient_portal_access pa,jsonb_array_elements(coalesce(pa.schedule_assignments,'[]'::jsonb)) item
      where public.hpsr_normalize_passport(pa.patient_passport)=passport_key and coalesce(pa.access_enabled,true)
        and item->>'doctor_id'=v_slot.doctor_id::text
        and (public.hpsr_normalize_specialty(item->>'specialty')=public.hpsr_normalize_specialty(v_slot.specialty)
          or public.hpsr_normalize_specialty(item->>'specialty') like '%'||public.hpsr_normalize_specialty(v_slot.specialty)||'%'
          or public.hpsr_normalize_specialty(v_slot.specialty) like '%'||public.hpsr_normalize_specialty(item->>'specialty')||'%'));
  end if;
  if not v_allowed then return jsonb_build_object('ok',false,'code','NOT_ALLOWED','error','Este horário não pertence a um médico vinculado a este paciente.'); end if;

  v_slot_date:=(v_slot.starts_at at time zone 'America/Sao_Paulo')::date;
  if v_slot_date<=v_today then return jsonb_build_object('ok',false,'code','SAME_DAY_CLOSED','error','Os horários deste dia já fecharam para novas confirmações. Aguarde a próxima agenda do médico.'); end if;

  -- Para vínculo leve, a solicitação que o próprio médico recebeu é a consulta que será agendada.
  if target_plan_id is null then
    select * into v_existing_appointment
      from public.appointments a
     where public.hpsr_normalize_passport(a.passport)=passport_key
       and public.hpsr_normalize_specialty(a.payload->>'specialty')=public.hpsr_normalize_specialty(v_specialty)
       and coalesce(a.payload->>'source','')='patient_portal'
       and a.status='Aceita'
       and (a.payload->>'acceptedById'=v_slot.doctor_id::text or a.payload->>'doctorId'=v_slot.doctor_id::text)
     order by a.updated_at desc, a.created_at desc
     limit 1
     for update;
  end if;

  if v_existing_appointment.id is null and public.hpsr_patient_has_active_booking(passport_key,v_specialty,null) then
    return jsonb_build_object('ok',false,'code','ACTIVE_BOOKING','error','Você já possui uma consulta ativa nesta especialidade.');
  end if;

  if target_plan_id is not null then
    select * into v_occurrence from public.clinical_followup_occurrences
     where plan_id=v_plan.id and slot_id is null and appointment_id is null
     order by planned_date asc,created_at asc limit 1 for update;
    if not found then return jsonb_build_object('ok',false,'code','NO_PENDING_OCCURRENCE','error','Este acompanhamento não possui um próximo atendimento pendente.'); end if;
  end if;

  select name into v_patient_name from public.patient_registry where public.hpsr_normalize_passport(passport)=passport_key limit 1;
  v_patient_name:=coalesce(nullif(trim(v_patient_name),''),case when target_plan_id is not null then v_plan.patient_name else null end,'Paciente');
  v_appointment_id:=coalesce(v_existing_appointment.id,'HPSR-AGENDA-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)));
  v_time:=to_char(v_slot.starts_at at time zone 'America/Sao_Paulo','HH24:MI');
  v_payload:=coalesce(v_existing_appointment.payload,'{}'::jsonb)||jsonb_build_object(
    'patient',v_patient_name,'passport',passport_key,'requestedByPassport',requester_key,
    'requestedByRelationship',case when requester_key=passport_key then 'Titular' else 'Responsável' end,
    'specialty',v_specialty,'physician',v_doctor_name,'doctor',v_doctor_name,'doctorId',v_slot.doctor_id,
    'preferredDate',to_char(v_slot_date,'YYYY-MM-DD'),'date',to_char(v_slot_date,'YYYY-MM-DD'),'time',v_time,'preferredPeriod',v_time,
    'reason',case when target_plan_id is not null then 'Retorno de acompanhamento' else coalesce(nullif(v_existing_appointment.payload->>'reason',''),'Consulta com médico vinculado') end,
    'flowType',case when target_plan_id is not null then 'Acompanhamento' else 'Consulta vinculada' end,
    'source','clinical_availability','schedulingMode',case when target_plan_id is not null then 'followup_self_booking' else 'linked_patient_self_booking' end,
    'slotId',v_slot.id,'planId',target_plan_id,'occurrenceId',case when target_plan_id is not null then v_occurrence.id else null end,
    'presenceConfirmed',true,'doctorNotification','Horário escolhido e confirmado pelo paciente','doctorNotificationUnread',true,'updatedAt',now());

  if v_existing_appointment.id is not null then
    update public.appointments set status='Confirmada',patient=v_patient_name,payload=v_payload,updated_at=now() where id=v_existing_appointment.id;
  else
    insert into public.appointments(id,passport,patient,status,payload,created_at,updated_at)
    values(v_appointment_id,passport_key,v_patient_name,'Confirmada',v_payload,now(),now());
  end if;

  update public.clinical_appointment_slots set status='Ocupado',patient_passport=passport_key,patient_name=v_patient_name,appointment_id=v_appointment_id,booked_at=now(),updated_at=now() where id=v_slot.id;
  if target_plan_id is not null then update public.clinical_followup_occurrences set status='Confirmada',slot_id=v_slot.id,appointment_id=v_appointment_id,updated_at=now() where id=v_occurrence.id; end if;
  return jsonb_build_object('ok',true,'appointment_id',v_appointment_id,'doctor_name',v_doctor_name,'starts_at',v_slot.starts_at,'reused_request',v_existing_appointment.id is not null);
exception when unique_violation then return jsonb_build_object('ok',false,'code','ACTIVE_BOOKING','error','Você já possui uma consulta ativa nesta especialidade.');
end;
$$;

revoke all on function public.book_patient_schedule_slot(text,uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.book_patient_schedule_slot(text,uuid,uuid,uuid,text,text) to service_role;
