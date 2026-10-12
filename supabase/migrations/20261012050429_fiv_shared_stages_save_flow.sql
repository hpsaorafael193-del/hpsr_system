-- Etapas conjuntas com isolamento de cronograma e liberação por paciente.
CREATE OR REPLACE FUNCTION public.save_fiv_patient_project(p_project_id uuid, p_plan_id uuid, p_gestante text, p_doadora text, p_doctor_name text, p_start date, p_end date, p_notes text, p_steps jsonb, p_release_gestante boolean, p_release_doadora boolean, p_expected_versions jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
 actor uuid := auth.uid(); project uuid; role_name text; patient_passport_value text; patient_name_value text;
 participant public.clinical_followup_plans%rowtype; current_occ public.clinical_followup_occurrences%rowtype;
 schedule jsonb; versions jsonb; release_snapshot jsonb; step jsonb; stamp timestamptz := clock_timestamp();
 master_id uuid; donor_id uuid; release_requested boolean; existing_master public.clinical_followup_plans%rowtype;
begin
 if actor is null then raise exception 'Sessão médica obrigatória.'; end if;
 p_gestante:=upper(trim(p_gestante)); p_doadora:=nullif(upper(trim(p_doadora)),'');
 if p_gestante='' or p_gestante is null or p_gestante=p_doadora then raise exception 'Gestante e doadora devem ser pacientes diferentes.'; end if;
 if not public.hpsr_can_manage_reproductive_patient(actor,p_gestante,'in_vitro') or (p_doadora is not null and not public.hpsr_can_manage_reproductive_patient(actor,p_doadora,'in_vitro')) then raise exception 'É necessário vínculo ativo de Ginecologia com cada paciente.'; end if;
 if p_start is null or p_end is null or p_end<p_start or trim(coalesce(p_doctor_name,''))='' then raise exception 'Confira médico e período do projeto.'; end if;
 if jsonb_typeof(p_steps) is distinct from 'array' or jsonb_array_length(p_steps) not between 1 and 40 then raise exception 'Cronograma FIV inválido.'; end if;
 if exists(select 1 from jsonb_array_elements(p_steps) s where s->>'fiv_recipient' is null or s->>'fiv_recipient' not in ('gestante','doadora','ambas') or s->>'fiv_step_id' is null or coalesce(s->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') then raise exception 'Confira paciente, identificador e data de cada etapa.'; end if;
 -- Um ID compartilhado pode existir uma vez em cada paciente, mas nunca duas vezes na mesma.
 if exists(select 1 from jsonb_array_elements(p_steps) s cross join lateral unnest(case when s->>'fiv_recipient'='ambas' then array['gestante','doadora'] else array[s->>'fiv_recipient'] end) role(recipient) group by role.recipient,s->>'fiv_step_id' having count(*)>1) then raise exception 'Há identificadores de etapa repetidos para a mesma paciente.'; end if;
 if p_doadora is null and exists(select 1 from jsonb_array_elements(p_steps) s where s->>'fiv_recipient' in ('doadora','ambas')) then raise exception 'Selecione a doadora ou destine suas etapas à gestante.'; end if;
 if p_plan_id is not null then
  select * into existing_master from public.clinical_followup_plans where id=p_plan_id and doctor_id=actor for update;
  if not found or existing_master.plan_type<>'in_vitro' or existing_master.patient_passport<>p_gestante or existing_master.fiv_role='doadora' then raise exception 'Projeto não encontrado ou paciente incompatível.'; end if;
  project:=coalesce(existing_master.fiv_project_id,existing_master.id);
 else project:=coalesce(p_project_id,gen_random_uuid()); end if;
 perform pg_advisory_xact_lock(hashtextextended(project::text,0));
 -- Lock all records and require the versions actually reviewed in the UI.
 for participant in select * from public.clinical_followup_plans where (fiv_project_id=project or id=p_plan_id) and doctor_id=actor order by id for update loop
  if (p_expected_versions->>participant.id::text)::timestamptz is distinct from participant.updated_at then raise exception 'Este projeto mudou em outra sessão. Reabra antes de salvar.'; end if;
  if participant.fiv_role='doadora' and participant.patient_passport is distinct from p_doadora then raise exception 'A doadora de um projeto salvo não pode ser removida ou substituída.'; end if;
 end loop;
 for role_name in select unnest(array['gestante','doadora']) loop
  patient_passport_value:=case when role_name='gestante' then p_gestante else p_doadora end;
  if patient_passport_value is null then continue; end if;
  select name into patient_name_value from public.patient_registry where public.patient_registry.passport=patient_passport_value;
  if not found then raise exception 'Paciente não encontrada no cadastro.'; end if;
  select coalesce(jsonb_agg((s.value - 'fiv_recipient') || jsonb_build_object('number',s.n,'fiv_order',s.position,'fiv_recipient',role_name,'description',coalesce(s.value->>'planned_text',s.value->>'description','')) order by s.position),'[]'::jsonb) into schedule
  from (select value,position,row_number() over(order by position) n from jsonb_array_elements(p_steps) with ordinality a(value,position) where value->>'fiv_recipient' in (role_name,'ambas')) s;
  if jsonb_array_length(schedule)=0 then raise exception 'Defina ao menos uma etapa para cada participante.'; end if;
  select * into participant from public.clinical_followup_plans where doctor_id=actor and (fiv_project_id=project and fiv_role=role_name or role_name='gestante' and id=p_plan_id) for update;
  if not found then
   insert into public.clinical_followup_plans(id,doctor_id,doctor_name,patient_passport,patient_name,specialty,plan_type,frequency,interval_days,start_date,end_date,total_consultations,total_weeks,status,fiv_project_id,fiv_role,consultation_schedule)
   values(case when role_name='gestante' then project else gen_random_uuid() end,actor,p_doctor_name,patient_passport_value,patient_name_value,'Ginecologia','in_vitro','Personalizada',7,p_start,p_end,jsonb_array_length(schedule),5,'Ativo',project,role_name,'[]') returning * into participant;
  elsif participant.patient_passport<>patient_passport_value then raise exception 'A identidade da participante deve permanecer a mesma.'; end if;
  if role_name='gestante' then master_id:=participant.id; else donor_id:=participant.id; end if;
  release_requested:=case when role_name='gestante' then coalesce(p_release_gestante,false) else coalesce(p_release_doadora,false) end;
  versions:=coalesce(participant.planning_document_versions,'[]') || jsonb_build_array(jsonb_build_object('at',stamp,'start_date',participant.start_date,'end_date',participant.end_date,'consultation_schedule',participant.consultation_schedule,'planning_notes',participant.planning_notes));
  if release_requested and participant.planning_released_snapshot is not null then versions:=versions||jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',participant.planning_released_snapshot)); end if;
  release_snapshot:=jsonb_build_object('patient_name',patient_name_value,'patient_passport',patient_passport_value,'doctor_name',p_doctor_name,'specialty','Ginecologia','start_date',p_start,'end_date',p_end,'planning_notes',null,'consultation_schedule',schedule,'total_consultations',jsonb_array_length(schedule),'plan_type','in_vitro');
  for current_occ in select * from public.clinical_followup_occurrences where plan_id=participant.id and doctor_id=actor for update loop
   if not exists(select 1 from jsonb_array_elements(schedule) s where (current_occ.fiv_step_id is not null and (s->>'fiv_step_id')::uuid=current_occ.fiv_step_id) or (current_occ.fiv_step_id is null and (s->>'number')::int=current_occ.step_number)) then
    if current_occ.appointment_id is not null or current_occ.slot_id is not null or nullif(trim(coalesce(current_occ.planned_text,'')),'') is not null or nullif(trim(coalesce(current_occ.evolution_text,'')),'') is not null or nullif(trim(coalesce(current_occ.medical_observation_text,'')),'') is not null or nullif(trim(coalesce(current_occ.conduct_text,'')),'') is not null or coalesce(current_occ.followup_report,'{}')<>'{}'::jsonb or current_occ.individual_released_at is not null or current_occ.individual_released_snapshot is not null or current_occ.individual_document_path is not null or current_occ.individual_released_document_path is not null then raise exception 'Uma etapa possui dados ou agendamento e não pode ser removida ou transferida para outra paciente.'; end if;
    delete from public.clinical_followup_occurrences where id=current_occ.id;
   end if;
  end loop;
  update public.clinical_followup_plans set doctor_name=p_doctor_name,patient_name=patient_name_value,start_date=p_start,end_date=p_end,planning_notes=nullif(trim(p_notes),''),consultation_schedule=schedule,total_consultations=jsonb_array_length(schedule),schedule_confirmed_at=stamp,planning_document_path=null,planning_document_versions=versions,fiv_project_id=project,fiv_role=role_name,updated_at=stamp,
   portal_released_at=case when release_requested then stamp else portal_released_at end,planning_released_document_path=case when release_requested then null else planning_released_document_path end,planning_released_snapshot=case when release_requested then release_snapshot else planning_released_snapshot end
   where id=participant.id and doctor_id=actor;
  if not found then raise exception 'Não foi possível atualizar a participante.'; end if;
  for step in select value from jsonb_array_elements(schedule) loop
   select * into current_occ from public.clinical_followup_occurrences where plan_id=participant.id and doctor_id=actor and (fiv_step_id=(step->>'fiv_step_id')::uuid or fiv_step_id is null and step_number=(step->>'number')::int) for update;
   if found then
    if (current_occ.appointment_id is not null or current_occ.slot_id is not null) and current_occ.planned_date is distinct from (step->>'date')::date then raise exception 'A etapa já tem agendamento. Ajuste o agendamento antes de alterar sua data.'; end if;
    update public.clinical_followup_occurrences set fiv_step_id=(step->>'fiv_step_id')::uuid,step_number=(step->>'number')::int,planned_date=(step->>'date')::date,rp_marker=step->>'marker',step_title=step->>'title',planned_text=coalesce(step->>'planned_text',step->>'description',''),updated_at=stamp where id=current_occ.id and doctor_id=actor;
    if not found then raise exception 'Não foi possível atualizar a etapa.'; end if;
   else
    insert into public.clinical_followup_occurrences(plan_id,doctor_id,patient_passport,patient_name,specialty,planned_date,step_number,rp_marker,step_title,planned_text,status,fiv_step_id)
    values(participant.id,actor,patient_passport_value,patient_name_value,'Ginecologia',(step->>'date')::date,(step->>'number')::int,step->>'marker',step->>'title',coalesce(step->>'planned_text',step->>'description',''),'Planejada',(step->>'fiv_step_id')::uuid);
   end if;
  end loop;
 end loop;
 return jsonb_build_object('project_id',project,'gestante_plan_id',master_id,'doadora_plan_id',donor_id);
end $function$;
revoke all on function public.save_fiv_patient_project(uuid,uuid,text,text,text,date,date,text,jsonb,boolean,boolean,jsonb) from public,anon;
grant execute on function public.save_fiv_patient_project(uuid,uuid,text,text,text,date,date,text,jsonb,boolean,boolean,jsonb) to authenticated;
