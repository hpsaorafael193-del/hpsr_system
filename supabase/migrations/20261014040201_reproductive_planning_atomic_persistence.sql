begin;
create or replace function public.save_gestational_planning_atomic(p_plan_id uuid,p_passport text,p_doctor_name text,p_start date,p_end date,p_notes text,p_steps jsonb,p_release boolean,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare actor uuid:=auth.uid(); previous public.clinical_followup_plans%rowtype; current_visit public.clinical_followup_occurrences%rowtype;
 target uuid:=coalesce(p_plan_id,gen_random_uuid()); v_name text; step jsonb; stamp timestamptz:=clock_timestamp(); versions jsonb; snapshot jsonb;
begin
 if actor is null or not public.hpsr_can_manage_reproductive_patient(actor,p_passport,'gestacional') then raise exception 'Vínculo de Obstetrícia e autorização médica obrigatórios.' using errcode='42501'; end if;
 if p_start is null or p_end is null or p_end<p_start or nullif(trim(p_doctor_name),'') is null or p_release is null then raise exception 'Confira médico, datas e liberação.'; end if;
 if jsonb_typeof(p_steps) is distinct from 'array' then raise exception 'Cronograma inválido.'; end if;
 if jsonb_array_length(p_steps) not between 1 and 100 then raise exception 'Inclua entre 1 e 100 consultas.'; end if;
 if exists(select 1 from jsonb_array_elements(p_steps) with ordinality s(value,n) where (value->>'number')::int is distinct from n::int or coalesce(value->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') then raise exception 'Numeração ou datas inválidas.'; end if;
 if (select count(distinct (value->>'date')::date) from jsonb_array_elements(p_steps))<>jsonb_array_length(p_steps) then raise exception 'Consultas com datas repetidas.'; end if;
 select * into previous from public.clinical_followup_plans where id=target for update;
 if found then
  if previous.doctor_id<>actor or previous.patient_passport<>p_passport or previous.plan_type<>'gestacional' then raise exception 'Planejamento pertence a outro contexto.' using errcode='42501'; end if;
  if p_expected_updated_at is null or previous.updated_at is distinct from p_expected_updated_at then raise exception 'Planejamento alterado em outra sessão. Reabra a versão atual antes de salvar; seu rascunho foi mantido.' using errcode='40001'; end if;
 elsif p_plan_id is not null then raise exception 'Planejamento não encontrado.'; end if;
 -- Todas as validações precedem escrita; exceções revertem a transação inteira.
 for current_visit in select * from public.clinical_followup_occurrences where plan_id=target for update loop
  select value into step from jsonb_array_elements(p_steps) where (value->>'number')::int=current_visit.step_number;
  if step is null then
   if current_visit.appointment_id is not null or current_visit.slot_id is not null or nullif(trim(coalesce(current_visit.planned_text,'')),'') is not null or nullif(trim(coalesce(current_visit.evolution_text,'')),'') is not null or nullif(trim(coalesce(current_visit.medical_observation_text,'')),'') is not null or nullif(trim(coalesce(current_visit.conduct_text,'')),'') is not null or coalesce(current_visit.followup_report,'{}')<>'{}'::jsonb or current_visit.individual_released_at is not null or current_visit.individual_released_snapshot is not null then raise exception 'Uma consulta com dados não pode ser removida automaticamente.'; end if;
  elsif (current_visit.appointment_id is not null or current_visit.slot_id is not null) and current_visit.planned_date is distinct from (step->>'date')::date then
   raise exception 'A consulta % tem agendamento vinculado. Reagende a consulta antes de alterar sua data planejada.',current_visit.step_number;
  end if;
 end loop;
 select name into v_name from public.patient_registry where passport=p_passport; if v_name is null then raise exception 'Paciente não cadastrado.'; end if;
 versions:=coalesce(previous.planning_document_versions,'[]')||case when previous.id is not null then jsonb_build_array(jsonb_build_object('at',stamp,'start_date',previous.start_date,'end_date',previous.end_date,'consultation_schedule',previous.consultation_schedule,'planning_notes',previous.planning_notes)) else '[]'::jsonb end;
 if previous.planning_released_snapshot is not null then versions:=versions||jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',previous.planning_released_snapshot)); end if;
 snapshot:=jsonb_build_object('patient_name',v_name,'patient_passport',p_passport,'doctor_name',p_doctor_name,'specialty','Obstetra','start_date',p_start,'end_date',p_end,'planning_notes',null,'consultation_schedule',p_steps,'total_consultations',jsonb_array_length(p_steps),'plan_type','gestacional');
 if previous.id is null then
  insert into public.clinical_followup_plans(id,doctor_id,doctor_name,patient_passport,patient_name,specialty,plan_type,frequency,interval_days,start_date,end_date,total_consultations,total_weeks,status) values(target,actor,p_doctor_name,p_passport,v_name,'Obstetra','gestacional','Personalizada',7,p_start,p_end,jsonb_array_length(p_steps),40,'Ativo');
 end if;
 update public.clinical_followup_plans set doctor_name=p_doctor_name,patient_name=v_name,start_date=p_start,end_date=p_end,planning_notes=nullif(trim(p_notes),''),consultation_schedule=p_steps,total_consultations=jsonb_array_length(p_steps),schedule_confirmed_at=stamp,planning_document_path=null,planning_document_versions=versions,portal_released_at=case when p_release then stamp end,planning_released_snapshot=case when p_release then snapshot end,planning_released_document_path=null,updated_at=stamp where id=target and doctor_id=actor;
 if not found then raise exception 'Planejamento não foi salvo.'; end if;
 delete from public.clinical_followup_occurrences o where o.plan_id=target and not exists(select 1 from jsonb_array_elements(p_steps) s where (s->>'number')::int=o.step_number);
 for step in select value from jsonb_array_elements(p_steps) loop
  select * into current_visit from public.clinical_followup_occurrences where plan_id=target and step_number=(step->>'number')::int for update;
  if found then
   update public.clinical_followup_occurrences set planned_date=(step->>'date')::date,rp_marker=step->>'marker',step_title=step->>'title',planned_text=coalesce(step->>'planned_text',step->>'description',''),updated_at=stamp where id=current_visit.id and doctor_id=actor;
   if not found then raise exception 'Consulta não foi atualizada.'; end if;
  else
   insert into public.clinical_followup_occurrences(plan_id,doctor_id,patient_passport,patient_name,specialty,planned_date,step_number,rp_marker,step_title,planned_text,status) values(target,actor,p_passport,v_name,'Obstetra',(step->>'date')::date,(step->>'number')::int,step->>'marker',step->>'title',coalesce(step->>'planned_text',step->>'description',''),'Planejada');
  end if;
 end loop;
 return jsonb_build_object('id',target,'updated_at',stamp,'released',p_release);
end $$;
revoke all on function public.save_gestational_planning_atomic(uuid,text,text,date,date,text,jsonb,boolean,timestamptz) from public,anon;
grant execute on function public.save_gestational_planning_atomic(uuid,text,text,date,date,text,jsonb,boolean,timestamptz) to authenticated;

create or replace function public.save_reproductive_individual_atomic(p_occurrence_id uuid,p_update jsonb,p_release boolean,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare actor uuid:=auth.uid(); visit public.clinical_followup_occurrences%rowtype; plan public.clinical_followup_plans%rowtype; stamp timestamptz:=clock_timestamp(); versions jsonb; new_schedule jsonb; new_text text; snapshot jsonb; clinical jsonb; v_record text;
begin
 select * into visit from public.clinical_followup_occurrences where id=p_occurrence_id;
 if actor is null or visit.id is null or visit.doctor_id<>actor then raise exception 'Consulta não autorizada.' using errcode='42501'; end if;
 -- Ordem de locks igual ao salvamento integral: plano antes das consultas.
 select * into plan from public.clinical_followup_plans where id=visit.plan_id for update;
 if plan.doctor_id<>actor or plan.plan_type not in ('gestacional','in_vitro') or not public.hpsr_can_manage_reproductive_patient(actor,plan.patient_passport,plan.plan_type) then raise exception 'Autorização clínica e vínculo ativo obrigatórios.' using errcode='42501'; end if;
 select * into visit from public.clinical_followup_occurrences where id=p_occurrence_id for update;
 if visit.updated_at is distinct from p_expected_updated_at or p_expected_updated_at is null then raise exception 'Consulta alterada em outra sessão. Reabra o registro atual; seu rascunho foi mantido.' using errcode='40001'; end if;
 if jsonb_typeof(p_update) is distinct from 'object' then raise exception 'Dados individuais inválidos.'; end if;
 new_text:=coalesce(p_update->>'planned_text','');
 versions:=coalesce(visit.individual_document_versions,'[]')||jsonb_build_array(jsonb_build_object('at',stamp,'planned_text',visit.planned_text,'evolution_text',visit.evolution_text,'medical_observation_text',visit.medical_observation_text,'conduct_text',visit.conduct_text,'followup_report',visit.followup_report));
 if p_release is not null and visit.individual_released_snapshot is not null then versions:=versions||jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',visit.individual_released_snapshot)); end if;
 snapshot:=p_update->'individual_released_snapshot';
 if p_release is true and (jsonb_typeof(snapshot) is distinct from 'object' or snapshot->>'occurrence_id' is distinct from visit.id::text or snapshot->>'plan_id' is distinct from plan.id::text) then raise exception 'Snapshot individual inválido.'; end if;
 update public.clinical_followup_occurrences set planned_text=nullif(new_text,''),evolution_text=nullif(p_update->>'evolution_text',''),medical_observation_text=nullif(p_update->>'medical_observation_text',''),followup_report=coalesce(p_update->'followup_report','{}'),rp_marker=p_update->>'rp_marker',step_title=p_update->>'step_title',individual_document_path=null,individual_document_versions=versions,
  individual_released_at=case when p_release is true then stamp when p_release is false then null else individual_released_at end,
  individual_released_document_path=case when p_release is not null then null else individual_released_document_path end,
  individual_released_snapshot=case when p_release is true then snapshot when p_release is false then null else individual_released_snapshot end,updated_at=stamp where id=visit.id and doctor_id=actor;
 if not found then raise exception 'Consulta não foi salva.'; end if;
 select jsonb_agg(case when (s.value->>'number')::int=visit.step_number then s.value||jsonb_build_object('planned_text',new_text,'description',new_text) else s.value end order by s.n) into new_schedule from jsonb_array_elements(coalesce(plan.consultation_schedule,'[]')) with ordinality s(value,n);
 if not exists(select 1 from jsonb_array_elements(coalesce(plan.consultation_schedule,'[]')) s where (s->>'number')::int=visit.step_number) then raise exception 'Consulta ausente no planejamento integral. Nenhuma alteração foi salva.'; end if;
 if new_schedule is distinct from plan.consultation_schedule then
  update public.clinical_followup_plans set consultation_schedule=new_schedule,planning_document_path=null,planning_document_versions=coalesce(planning_document_versions,'[]')||jsonb_build_array(jsonb_build_object('at',stamp,'consultation_schedule',plan.consultation_schedule,'start_date',plan.start_date,'end_date',plan.end_date,'planning_notes',plan.planning_notes)),updated_at=stamp where id=plan.id and doctor_id=actor;
  if not found then raise exception 'Integral não foi atualizado.'; end if;
  plan.updated_at:=stamp;
 end if;
 v_record:='followup-'||visit.id::text;
 clinical:=jsonb_build_object('followupPlanId',plan.id,'followupOccurrenceId',visit.id,'planType',plan.plan_type,'specialty',plan.specialty,'stepNumber',visit.step_number,'marker',p_update->>'rp_marker','plannedDate',visit.planned_date,'planning',new_text,'evolution',p_update->>'evolution_text','medicalObservation',p_update->>'medical_observation_text','examsPerformed',p_update#>>'{followup_report,exams_performed}','examExplanation',p_update#>>'{followup_report,exam_explanation}','patientObservations',p_update#>>'{followup_report,patient_observations}');
 insert into public.clinical_records(id,patient_passport,record_type,payload,created_by,is_confidential,updated_at) values(v_record,plan.patient_passport,case when plan.plan_type='in_vitro' then 'Evolução FIV' else 'Evolução obstétrica' end,clinical,actor,true,stamp)
 on conflict(id) do update set payload=excluded.payload,is_confidential=true,updated_at=excluded.updated_at;
 return jsonb_build_object('id',visit.id,'updated_at',stamp,'plan_updated_at',plan.updated_at,'individual_released_at',case when p_release is true then stamp when p_release is false then null else visit.individual_released_at end,'individual_released_snapshot',case when p_release is true then snapshot when p_release is false then null else visit.individual_released_snapshot end);
end $$;
revoke all on function public.save_reproductive_individual_atomic(uuid,jsonb,boolean,timestamptz) from public,anon;
grant execute on function public.save_reproductive_individual_atomic(uuid,jsonb,boolean,timestamptz) to authenticated;
commit;
