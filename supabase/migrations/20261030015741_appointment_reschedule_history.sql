-- Preserve each dated appointment as history; make the replacement atomically.
create or replace function public.hpsr_reschedule_with_history(
 p_appointment_id text, p_request_id uuid, p_new_date date default null,
 p_new_time time without time zone default null, p_reason text default null,
 p_notes text default null, p_expected_updated_at timestamptz default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 v_user uuid := auth.uid(); v_actor public.profiles%rowtype;
 v_old public.appointments%rowtype; v_doctor uuid; v_name text; v_new_id text;
 v_waiting boolean; v_new_payload jsonb; v_old_payload jsonb; v_history_status text;
 v_label text; v_slot public.clinical_appointment_slots%rowtype; v_target public.clinical_appointment_slots%rowtype; v_occurrence uuid;
 v_now timestamptz := now(); v_date text; v_time text;
begin
 if v_user is null then raise exception 'Sessão médica inválida.'; end if;
 select * into v_actor from public.profiles where id=v_user and access_status='Aprovado';
 if v_actor.id is null or not public.is_hpsr_staff() then raise exception 'Acesso profissional não autorizado.'; end if;
 if p_request_id is null then raise exception 'Identificador da operação é obrigatório.'; end if;
 select * into v_old from public.appointments where id=p_appointment_id for update;
 if v_old.id is null then raise exception 'Consulta não encontrada.'; end if;
 v_doctor := nullif(coalesce(v_old.payload->>'doctorId',v_old.payload->>'acceptedById',''),'')::uuid;
 if v_doctor is null then
  select id into v_doctor from public.profiles where access_status='Aprovado'
   and lower(trim(name))=lower(trim(coalesce(v_old.payload->>'physician',v_old.payload->>'doctor','')))
   and (select count(*) from public.profiles where access_status='Aprovado' and lower(trim(name))=lower(trim(coalesce(v_old.payload->>'physician',v_old.payload->>'doctor',''))))=1;
 end if;
 if v_doctor is null then raise exception 'Não foi possível identificar o médico responsável.'; end if;
 if v_doctor<>v_user and not public.is_hpsr_schedule_manager() then raise exception 'Sem permissão para reagendar esta consulta.'; end if;
 if v_old.payload->>'rescheduleRequestId'=p_request_id::text or v_old.payload->>'lastRescheduleRequestId'=p_request_id::text then
  return jsonb_build_object('ok',true,'appointment_id',coalesce(v_old.payload->>'rescheduledToId',v_old.id),'already_saved',true);
 end if;
 if coalesce(v_old.payload->>'scheduleArchived','false')='true' or nullif(v_old.payload->>'rescheduledToId','') is not null then
  raise exception 'Esta consulta já está no histórico. Abra o agendamento vinculado para continuar.';
 end if;
 if p_expected_updated_at is not null and v_old.updated_at<>p_expected_updated_at then raise exception 'A consulta foi alterada. Atualize a agenda antes de continuar.'; end if;
 if v_old.status in ('Realizada','Concluída','Concluído') then raise exception 'Uma consulta realizada deve permanecer no histórico. Crie um novo atendimento.'; end if;
 if coalesce(v_old.payload->>'flowType','')='Exames' then raise exception 'Solicitações de exames não usam o reagendamento de consultas.'; end if;
 if nullif(trim(p_reason),'') is null or length(p_reason)>200 or length(coalesce(p_notes,''))>4000 then raise exception 'Informe um motivo válido e uma observação de até 4000 caracteres.'; end if;
 if (p_new_date is null)<>(p_new_time is null) then raise exception 'Informe a data e o horário juntos, ou deixe ambos para depois.'; end if;
 if p_new_date is not null and ((p_new_date+p_new_time) at time zone 'America/Sao_Paulo')<=v_now then raise exception 'O novo horário deve estar no futuro.'; end if;
 select name into v_name from public.profiles where id=v_doctor and access_status='Aprovado';
 if not found then raise exception 'O médico responsável não está com acesso ativo.'; end if;
 -- Serialize this workflow for a doctor's agenda and for the patient's specialty.
 perform pg_advisory_xact_lock(hashtextextended('hpsr-reschedule-doctor:'||v_doctor::text,0));
 perform pg_advisory_xact_lock(hashtextextended('hpsr-active-booking:'||public.hpsr_normalize_passport(v_old.passport)||':'||public.hpsr_normalize_specialty(v_old.payload->>'specialty'),0));
 if p_new_date is not null and exists (
  select 1 from public.appointments a where a.id<>v_old.id
   and coalesce(a.payload->>'doctorId',a.payload->>'acceptedById','')=v_doctor::text
   and public.hpsr_is_active_patient_booking(a.status)
   and coalesce(a.payload->>'awaitingReschedule','false')<>'true'
   and coalesce(nullif(a.payload->>'date',''),a.payload->>'preferredDate','')=p_new_date::text
   and abs(extract(epoch from (coalesce(nullif(a.payload->>'time',''),nullif(a.payload->>'preferredTime',''),'00:00')::time-p_new_time)))<3600
 ) then raise exception 'Já existe outro atendimento próximo desse horário na agenda do médico responsável.'; end if;
 if p_new_date is not null and exists (
  select 1 from public.clinical_appointment_slots s where s.doctor_id=v_doctor
   and s.status in ('Ocupado','Bloqueado') and coalesce(s.appointment_id,'')<>v_old.id
   and s.starts_at<((p_new_date+p_new_time) at time zone 'America/Sao_Paulo')+interval '1 hour'
   and s.ends_at>((p_new_date+p_new_time) at time zone 'America/Sao_Paulo')
 ) then raise exception 'O novo horário coincide com uma vaga ocupada ou bloqueada.'; end if;
 v_waiting := coalesce(v_old.payload->>'awaitingReschedule','false')='true';
 if v_waiting and p_new_date is null then raise exception 'Esta consulta já está aguardando um novo horário.'; end if;
 v_new_id := case when v_waiting then v_old.id else 'reschedule-'||p_request_id::text end;
 v_date := case when p_new_date is null then '' else p_new_date::text end;
 v_time := case when p_new_time is null then '' else to_char(p_new_time,'HH24:MI') end;
 v_occurrence := nullif(v_old.payload->>'occurrenceId','')::uuid;
 select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into v_new_payload from jsonb_each(v_old.payload)
 where key !~ '^(attendance|appointmentManagement|patientNotification|doctorNotification|reschedul|previous|proposed|patientResponse|patientAlternative)'
 and key not in ('slotId','date','time','preferredDate','preferredTime','preferredPeriod','syncedScheduleId','sourceRequestId','scheduleArchived','archivedAt','archivedBy','archivedReason','answer');
 if p_new_date is not null then
  select * into v_target from public.clinical_appointment_slots s where s.doctor_id=v_doctor
   and s.status='Disponível' and s.starts_at=((p_new_date+p_new_time) at time zone 'America/Sao_Paulo')
   and public.hpsr_normalize_specialty(s.specialty)=public.hpsr_normalize_specialty(v_old.payload->>'specialty')
   and (s.series_id is null or exists(select 1 from public.clinical_availability_series where id=s.series_id and coalesce(status,'Ativa')='Ativa'))
   order by s.id limit 1 for update;
 end if;
 v_new_payload := v_new_payload || jsonb_build_object(
  'doctorId',v_doctor,'doctor',v_name,'physician',v_name,'date',v_date,'preferredDate',v_date,
  'time',v_time,'preferredTime',v_time,'preferredPeriod',v_time,'awaitingReschedule',p_new_date is null,
  'previousAppointmentId',case when v_waiting then v_old.payload->>'previousAppointmentId' else v_old.id end,
  'sourceRequestId',case when v_waiting then v_old.payload->>'sourceRequestId' else v_old.id end,
  'rescheduleReason',trim(p_reason),'rescheduleNotes',coalesce(trim(p_notes),''),
  'rescheduledAt',v_now,'rescheduledBy',v_actor.name,'lastRescheduleRequestId',p_request_id,
  'appointmentManagementStatus',case when p_new_date is null then 'Aguardando reagendamento' else 'Novo horário confirmado' end,
  'patientNotificationTitle',case when p_new_date is null then 'Aguardando novo horário' else 'Novo agendamento confirmado' end,
  'patientNotification',case when p_new_date is null then 'O horário anterior foi encerrado. Aguarde o contato do médico para combinar uma nova data.' else 'Nova consulta em '||to_char(p_new_date,'DD/MM/YYYY')||' às '||v_time||' (Brasília).' end,
  'patientNotificationAt',v_now,'updatedAt',v_now);
 if v_target.id is not null then v_new_payload := v_new_payload || jsonb_build_object('slotId',v_target.id); end if;
 if not v_waiting then
  select * into v_slot from public.clinical_appointment_slots where appointment_id=v_old.id limit 1 for update;
  v_history_status := case when p_reason='Paciente não compareceu' then 'Não compareceu' else 'Cancelada' end;
  v_label := case when p_reason='Paciente não compareceu' then 'Paciente faltou' when p_reason='Paciente não respondeu' then 'Sem resposta' else 'Horário encerrado para reagendamento' end;
  v_old_payload := v_old.payload - 'slotId' - 'occurrenceId' - 'patientNotificationTitle' - 'patientNotification' - 'patientNotificationAt' - 'proposedDate' - 'proposedTime' || jsonb_build_object(
   'date',case when v_old.status='Reagendamento aceito' then coalesce(nullif(v_old.payload->>'proposedDate',''),v_old.payload->>'preferredDate',v_old.payload->>'date') else coalesce(v_old.payload->>'preferredDate',v_old.payload->>'date') end,
   'preferredDate',case when v_old.status='Reagendamento aceito' then coalesce(nullif(v_old.payload->>'proposedDate',''),v_old.payload->>'preferredDate',v_old.payload->>'date') else coalesce(v_old.payload->>'preferredDate',v_old.payload->>'date') end,
   'time',case when v_old.status='Reagendamento aceito' then coalesce(nullif(v_old.payload->>'proposedTime',''),v_old.payload->>'time',v_old.payload->>'preferredTime') else coalesce(v_old.payload->>'time',v_old.payload->>'preferredTime') end,
   'preferredTime',case when v_old.status='Reagendamento aceito' then coalesce(nullif(v_old.payload->>'proposedTime',''),v_old.payload->>'time',v_old.payload->>'preferredTime') else coalesce(v_old.payload->>'time',v_old.payload->>'preferredTime') end,
   'scheduleArchived',true,'archivedAt',v_now,'archivedBy',v_actor.name,'archivedReason',trim(p_reason),
   'previousSlotId',v_old.payload->>'slotId','previousOccurrenceId',v_occurrence,
   'rescheduledToId',v_new_id,'rescheduleRequestId',p_request_id,
   'appointmentManagementStatus',v_label,'appointmentManagementNote',coalesce(trim(p_notes),''),
   'attendanceSituation',v_label,'attendanceStatus',v_history_status,'attendanceSummary',trim(p_reason)||case when nullif(trim(p_notes),'') is null then '' else ': '||trim(p_notes) end,
   'updatedAt',v_now);
  -- Original dates and clinical records stay attached to this historical ID.
  update public.appointments set status=v_history_status,payload=v_old_payload,updated_at=v_now where id=v_old.id;
  if v_slot.id is not null then
   update public.clinical_appointment_slots set
    status=case when v_slot.starts_at>v_now and exists(select 1 from public.clinical_availability_series where id=v_slot.series_id and coalesce(status,'Ativa')='Ativa') then 'Disponível' else 'Encerrado' end,
    appointment_id=null,patient_passport=null,patient_name=null,booked_at=null,updated_at=v_now where id=v_slot.id;
  end if;
  insert into public.appointments(id,passport,patient,status,payload,created_at,updated_at)
  values(v_new_id,v_old.passport,v_old.patient,case when p_new_date is null then 'Aceita' else 'Confirmada' end,v_new_payload,v_now,v_now);
 else
  update public.appointments set status='Confirmada',payload=v_new_payload,updated_at=v_now where id=v_old.id;
 end if;
 if v_occurrence is not null then
  update public.clinical_followup_occurrences set planned_date=coalesce(p_new_date,planned_date),slot_id=v_target.id,
   appointment_id=v_new_id,status=case when p_new_date is null then 'Aguardando reagendamento' else 'Confirmada' end,updated_at=v_now
   where id=v_occurrence and appointment_id=v_old.id;
  if not found then raise exception 'O vínculo de acompanhamento mudou ou não pôde ser atualizado.'; end if;
 end if;
 insert into public.system_activities(module,action,description,actor,reference)
 values('Agenda Clínica','Reagendamento com histórico',trim(p_reason)||case when p_new_date is null then ' — aguardando novo horário.' else ' — novo horário: '||p_new_date::text||' '||v_time end,v_actor.name,v_old.id);
 return jsonb_build_object('ok',true,'appointment_id',v_new_id,'previous_appointment_id',case when v_waiting then v_old.payload->>'previousAppointmentId' else v_old.id end,'awaiting_reschedule',p_new_date is null);
end;
$$;
revoke all on function public.hpsr_reschedule_with_history(text,uuid,date,time without time zone,text,text,timestamptz) from public,anon;
grant execute on function public.hpsr_reschedule_with_history(text,uuid,date,time without time zone,text,text,timestamptz) to authenticated;
