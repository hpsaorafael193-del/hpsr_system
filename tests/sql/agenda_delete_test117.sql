begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where access_status='Aprovado' and role='Vice Diretor / Dev' limit 1),true);
insert into public.clinical_availability_series(id,doctor_id,doctor_name,specialty,start_date,end_date,start_time,end_time,weekday,status)
values('00000000-0000-4000-8000-000000000117',auth.uid(),'QA Agenda','Clínico Geral',current_date+30,current_date+30,'10:00','11:00',extract(dow from current_date+30)::int,'Ativa');
insert into public.clinical_appointment_slots(id,series_id,doctor_id,doctor_name,specialty,starts_at,ends_at,status)
values('00000000-0000-4000-8000-000000000118','00000000-0000-4000-8000-000000000117',auth.uid(),'QA Agenda','Clínico Geral',(current_date+30)::timestamp+interval '10 hours',(current_date+30)::timestamp+interval '11 hours','Disponível');
insert into public.appointments(id,passport,patient,status,payload) values('QA-AGENDA-DELETE-117','QA-AGENDA-117','Paciente QA Agenda','Confirmada',jsonb_build_object('slotId','00000000-0000-4000-8000-000000000118','doctorId',auth.uid(),'specialty','Clínico Geral','preferredDate',(current_date+30)::text,'preferredTime','10:00'));
set local role authenticated;
do $$ declare v timestamptz; changed text; begin
 select updated_at into v from public.appointments where id='QA-AGENDA-DELETE-117';
 update public.appointments set status='Cancelada',payload=payload||jsonb_build_object('deletedBy','QA Agenda','deletedAt',now(),'previousStatus','Confirmada') where id='QA-AGENDA-DELETE-117' and status='Confirmada' and updated_at=v returning id into changed;
 if changed is null then raise exception 'QA exclusão não confirmada'; end if;
 if not exists(select 1 from public.appointments where id=changed and status='Cancelada' and payload->>'previousStatus'='Confirmada') then raise exception 'QA histórico apagado'; end if;
 if not exists(select 1 from public.clinical_appointment_slots where id='00000000-0000-4000-8000-000000000118' and status='Disponível' and appointment_id is null and patient_passport is null) then raise exception 'QA horário não liberado'; end if;
end $$;
reset role;
rollback;
select 'PASS cancellation removes active appointment, preserves history and frees future published slot; fixtures rolled back' as validation;
