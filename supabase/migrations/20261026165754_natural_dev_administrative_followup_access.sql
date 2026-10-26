-- Natural permission of the existing Vice Diretor / Dev role, explicitly authorized by the user.
-- Existing owners and links are retained; no transfer, switch, temporary mode or new authorship columns.
create or replace function public.can_administer_reproductive_followup() returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='Vice Diretor / Dev' and access_status='Aprovado');
$$;
revoke all on function public.can_administer_reproductive_followup() from public,anon;
grant execute on function public.can_administer_reproductive_followup() to authenticated;
CREATE OR REPLACE FUNCTION public.hpsr_can_manage_reproductive_patient(target_doctor uuid, target_passport text, target_kind text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_profile public.profiles%rowtype;
  v_is_full_admin boolean := false;
  v_has_specialty boolean := false;
begin
  if target_doctor is not null and nullif(trim(target_passport),'') is not null and target_kind in ('gestacional','in_vitro') and public.can_administer_reproductive_followup() then return true; end if;
  if target_doctor is null
     or target_doctor is distinct from auth.uid()
     or nullif(btrim(coalesce(target_passport, '')), '') is null
     or target_kind not in ('gestacional','in_vitro') then
    return false;
  end if;

  select * into v_profile
    from public.profiles p
   where p.id = target_doctor
     and coalesce(p.access_status, '') = 'Aprovado';
  if not found then return false; end if;

  v_is_full_admin := v_profile.role in ('Diretora', 'Vice Diretor / Dev');

  if not v_is_full_admin then
    if v_profile.role not in ('Médico Especialista', 'Médico Supervisor', 'Médico Plantonista', 'Médico Cirurgião', 'Diretor Clínico', 'Vice Diretor') then
      return false;
    end if;

    select exists (
      select 1
        from regexp_split_to_table(coalesce(v_profile.specialty, ''), E'[,;/|\\n]+') token(value)
       where public.hpsr_reproductive_specialty_matches(token.value, target_kind)
    ) into v_has_specialty;
    if not v_has_specialty then return false; end if;
  end if;

  return exists (
    select 1
      from public.patient_doctor_links l
     where l.doctor_id = target_doctor
       and upper(btrim(l.patient_passport)) = upper(btrim(target_passport))
       and public.hpsr_reproductive_specialty_matches(l.specialty, target_kind)
  );
end;
$function$;
alter policy "hpsr reproductive occurrence delete guard" on public.clinical_followup_occurrences
using(public.hpsr_normalize_specialty(specialty) not in ('obstetra','ginecologia') or (doctor_id=(select auth.uid()) and public.hpsr_can_access_obstetra()) or (public.can_administer_reproductive_followup() and appointment_id is null and slot_id is null and nullif(trim(coalesce(planned_text,'')),'') is null and nullif(trim(coalesce(evolution_text,'')),'') is null and nullif(trim(coalesce(medical_observation_text,'')),'') is null and nullif(trim(coalesce(conduct_text,'')),'') is null and coalesce(followup_report,'{}')='{}'::jsonb and individual_released_at is null and individual_released_snapshot is null));
alter policy "hpsr reproductive clinical update guard" on public.clinical_records
using(record_type not in ('Evolução obstétrica','Evolução FIV') or created_by=(select auth.uid()) or public.can_administer_reproductive_followup() or exists(select 1 from public.clinical_followup_plans p where p.id::text=payload->>'followupPlanId' and p.doctor_id=(select auth.uid()) and p.patient_passport=clinical_records.patient_passport and public.hpsr_can_manage_reproductive_patient(p.doctor_id,p.patient_passport,p.plan_type)))
with check(record_type not in ('Evolução obstétrica','Evolução FIV') or created_by=(select auth.uid()) or public.can_administer_reproductive_followup() or exists(select 1 from public.clinical_followup_plans p where p.id::text=payload->>'followupPlanId' and p.doctor_id=(select auth.uid()) and p.patient_passport=clinical_records.patient_passport and public.hpsr_can_manage_reproductive_patient(p.doctor_id,p.patient_passport,p.plan_type)));
CREATE OR REPLACE FUNCTION public.save_reproductive_individual_atomic(p_occurrence_id uuid, p_update jsonb, p_release boolean, p_expected_updated_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); visit public.clinical_followup_occurrences%rowtype; plan public.clinical_followup_plans%rowtype; stamp timestamptz:=clock_timestamp(); versions jsonb; new_schedule jsonb; new_text text; snapshot jsonb; clinical jsonb; v_record text; actor_profile public.profiles%rowtype; admin_edit boolean:=false;
begin
 select * into actor_profile from public.profiles where id=actor and access_status='Aprovado';
 if actor_profile.id is null then raise exception 'Profissional não autorizado.' using errcode='42501'; end if;
 admin_edit:=public.can_administer_reproductive_followup();
 select * into visit from public.clinical_followup_occurrences where id=p_occurrence_id;
 if actor is null or visit.id is null or (visit.doctor_id<>actor and not admin_edit) then raise exception 'Consulta não autorizada.' using errcode='42501'; end if;
 -- Ordem de locks igual ao salvamento integral: plano antes das consultas.
 select * into plan from public.clinical_followup_plans where id=visit.plan_id for update;
 if plan.doctor_id<>visit.doctor_id or plan.patient_passport<>visit.patient_passport or (plan.doctor_id<>actor and not admin_edit) or plan.plan_type not in ('gestacional','in_vitro') or not public.hpsr_can_manage_reproductive_patient(actor,plan.patient_passport,plan.plan_type) then raise exception 'Autorização clínica e vínculo ativo obrigatórios.' using errcode='42501'; end if;
 select * into visit from public.clinical_followup_occurrences where id=p_occurrence_id for update;
 if visit.updated_at is distinct from p_expected_updated_at or p_expected_updated_at is null then raise exception 'Consulta alterada em outra sessão. Reabra o registro atual; seu rascunho foi mantido.' using errcode='40001'; end if;
 if jsonb_typeof(p_update) is distinct from 'object' then raise exception 'Dados individuais inválidos.'; end if;
 new_text:=coalesce(p_update->>'planned_text','');
 versions:=coalesce(visit.individual_document_versions,'[]')||jsonb_build_array(jsonb_build_object('at',stamp,'planned_text',visit.planned_text,'evolution_text',visit.evolution_text,'medical_observation_text',visit.medical_observation_text,'conduct_text',visit.conduct_text,'followup_report',visit.followup_report,'author',coalesce(visit.followup_report->'_author',jsonb_build_object('id',plan.doctor_id,'name',plan.doctor_name)),'saved_by',actor,'saved_by_name',actor_profile.name));
 if p_release is not null and visit.individual_released_snapshot is not null then versions:=versions||jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',visit.individual_released_snapshot)); end if;
 snapshot:=p_update->'individual_released_snapshot';
 if p_release is true and (jsonb_typeof(snapshot) is distinct from 'object' or snapshot->>'occurrence_id' is distinct from visit.id::text or snapshot->>'plan_id' is distinct from plan.id::text) then raise exception 'Snapshot individual inválido.'; end if;
 if p_release is true then snapshot:=snapshot||jsonb_build_object('doctor_name',actor_profile.name,'responsible_doctor_name',plan.doctor_name,'responsible_doctor_id',plan.doctor_id,'performed_by',actor); end if;
 update public.clinical_followup_occurrences set planned_text=nullif(new_text,''),evolution_text=nullif(p_update->>'evolution_text',''),medical_observation_text=nullif(p_update->>'medical_observation_text',''),followup_report=(coalesce(p_update->'followup_report','{}')-'_author')||jsonb_build_object('_author',jsonb_build_object('id',actor,'name',actor_profile.name,'at',stamp)),rp_marker=p_update->>'rp_marker',step_title=p_update->>'step_title',individual_document_path=null,individual_document_versions=versions,
  individual_released_at=case when p_release is true then stamp when p_release is false then null else individual_released_at end,
  individual_released_document_path=case when p_release is not null then null else individual_released_document_path end,
  individual_released_snapshot=case when p_release is true then snapshot when p_release is false then null else individual_released_snapshot end,updated_at=stamp where id=visit.id and doctor_id=plan.doctor_id;
 if not found then raise exception 'Consulta não foi salva.'; end if;
 select jsonb_agg(case when (s.value->>'number')::int=visit.step_number then s.value||jsonb_build_object('planned_text',new_text,'description',new_text) else s.value end order by s.n) into new_schedule from jsonb_array_elements(coalesce(plan.consultation_schedule,'[]')) with ordinality s(value,n);
 if not exists(select 1 from jsonb_array_elements(coalesce(plan.consultation_schedule,'[]')) s where (s->>'number')::int=visit.step_number) then raise exception 'Consulta ausente no planejamento integral. Nenhuma alteração foi salva.'; end if;
 if new_schedule is distinct from plan.consultation_schedule then
  update public.clinical_followup_plans set consultation_schedule=new_schedule,planning_document_path=null,planning_document_versions=coalesce(planning_document_versions,'[]')||jsonb_build_array(jsonb_build_object('at',stamp,'consultation_schedule',plan.consultation_schedule,'start_date',plan.start_date,'end_date',plan.end_date,'planning_notes',plan.planning_notes,'saved_by',actor,'saved_by_name',actor_profile.name)),updated_at=stamp where id=plan.id and doctor_id=plan.doctor_id;
  if not found then raise exception 'Integral não foi atualizado.'; end if;
  plan.updated_at:=stamp;
 end if;
 v_record:='followup-'||visit.id::text;
 clinical:=jsonb_build_object('title',case when plan.plan_type='in_vitro' then 'Fertilização in vitro · Etapa ' else 'Gestacional · Consulta ' end||visit.step_number,'patient',jsonb_build_object('name',plan.patient_name,'passport',plan.patient_passport),'doctor',jsonb_build_object('id',actor,'name',actor_profile.name),'responsibleDoctor',jsonb_build_object('id',plan.doctor_id,'name',plan.doctor_name),'followupPlanId',plan.id,'followupOccurrenceId',visit.id,'planType',plan.plan_type,'specialty',plan.specialty,'stepNumber',visit.step_number,'marker',p_update->>'rp_marker','plannedDate',visit.planned_date,'planning',new_text,'evolution',p_update->>'evolution_text','medicalObservation',p_update->>'medical_observation_text','examsPerformed',p_update#>>'{followup_report,exams_performed}','examExplanation',p_update#>>'{followup_report,exam_explanation}','patientObservations',p_update#>>'{followup_report,patient_observations}');
 insert into public.clinical_records(id,patient_passport,record_type,payload,created_by,is_confidential,updated_at) values(v_record,plan.patient_passport,case when plan.plan_type='in_vitro' then 'Evolução FIV' else 'Evolução obstétrica' end,clinical,actor,true,stamp)
 on conflict(id) do update set payload=excluded.payload,is_confidential=true,updated_at=excluded.updated_at;
 return jsonb_build_object('id',visit.id,'updated_at',stamp,'plan_updated_at',plan.updated_at,'individual_released_at',case when p_release is true then stamp when p_release is false then null else visit.individual_released_at end,'individual_released_snapshot',case when p_release is true then snapshot when p_release is false then null else visit.individual_released_snapshot end);
end $function$;
CREATE OR REPLACE FUNCTION public.save_gestational_planning_atomic(p_plan_id uuid, p_passport text, p_doctor_name text, p_start date, p_end date, p_notes text, p_steps jsonb, p_release boolean, p_expected_updated_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); owner_id uuid:=auth.uid(); actor_name text; previous public.clinical_followup_plans%rowtype; current_visit public.clinical_followup_occurrences%rowtype;
 target uuid:=coalesce(p_plan_id,gen_random_uuid()); v_name text; step jsonb; stamp timestamptz:=clock_timestamp(); versions jsonb; snapshot jsonb;
begin
 select name into actor_name from public.profiles where id=actor;
 if actor is null or not public.hpsr_can_manage_reproductive_patient(actor,p_passport,'gestacional') then raise exception 'Vínculo de Obstetrícia e autorização médica obrigatórios.' using errcode='42501'; end if;
 if p_start is null or p_end is null or p_end<p_start or nullif(trim(p_doctor_name),'') is null or p_release is null then raise exception 'Confira médico, datas e liberação.'; end if;
 if jsonb_typeof(p_steps) is distinct from 'array' then raise exception 'Cronograma inválido.'; end if;
 if jsonb_array_length(p_steps) not between 1 and 100 then raise exception 'Inclua entre 1 e 100 consultas.'; end if;
 if exists(select 1 from jsonb_array_elements(p_steps) with ordinality s(value,n) where (value->>'number')::int is distinct from n::int or coalesce(value->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') then raise exception 'Numeração ou datas inválidas.'; end if;
 if (select count(distinct (value->>'date')::date) from jsonb_array_elements(p_steps))<>jsonb_array_length(p_steps) then raise exception 'Consultas com datas repetidas.'; end if;
 select * into previous from public.clinical_followup_plans where id=target for update;
 if found then
  if public.can_administer_reproductive_followup() then owner_id:=previous.doctor_id; p_doctor_name:=previous.doctor_name; end if;
  if previous.doctor_id<>owner_id or previous.patient_passport<>p_passport or previous.plan_type<>'gestacional' then raise exception 'Planejamento pertence a outro contexto.' using errcode='42501'; end if;
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
 versions:=coalesce(previous.planning_document_versions,'[]')||case when previous.id is not null then jsonb_build_array(jsonb_build_object('at',stamp,'start_date',previous.start_date,'end_date',previous.end_date,'consultation_schedule',previous.consultation_schedule,'planning_notes',previous.planning_notes,'saved_by',actor,'saved_by_name',actor_name)) else '[]'::jsonb end;
 if previous.planning_released_snapshot is not null then versions:=versions||jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',previous.planning_released_snapshot)); end if;
 snapshot:=jsonb_build_object('patient_name',v_name,'patient_passport',p_passport,'doctor_name',p_doctor_name,'specialty','Obstetra','start_date',p_start,'end_date',p_end,'planning_notes',null,'consultation_schedule',p_steps,'total_consultations',jsonb_array_length(p_steps),'plan_type','gestacional');
 if previous.id is null then
  insert into public.clinical_followup_plans(id,doctor_id,doctor_name,patient_passport,patient_name,specialty,plan_type,frequency,interval_days,start_date,end_date,total_consultations,total_weeks,status) values(target,actor,p_doctor_name,p_passport,v_name,'Obstetra','gestacional','Personalizada',7,p_start,p_end,jsonb_array_length(p_steps),40,'Ativo');
 end if;
 update public.clinical_followup_plans set doctor_name=p_doctor_name,patient_name=v_name,start_date=p_start,end_date=p_end,planning_notes=nullif(trim(p_notes),''),consultation_schedule=p_steps,total_consultations=jsonb_array_length(p_steps),schedule_confirmed_at=stamp,planning_document_path=null,planning_document_versions=versions,portal_released_at=case when p_release then stamp end,planning_released_snapshot=case when p_release then snapshot end,planning_released_document_path=null,updated_at=stamp where id=target and doctor_id=owner_id;
 if not found then raise exception 'Planejamento não foi salvo.'; end if;
 delete from public.clinical_followup_occurrences o where o.plan_id=target and not exists(select 1 from jsonb_array_elements(p_steps) s where (s->>'number')::int=o.step_number);
 for step in select value from jsonb_array_elements(p_steps) loop
  select * into current_visit from public.clinical_followup_occurrences where plan_id=target and step_number=(step->>'number')::int for update;
  if found then
   update public.clinical_followup_occurrences set planned_date=(step->>'date')::date,rp_marker=step->>'marker',step_title=step->>'title',planned_text=coalesce(step->>'planned_text',step->>'description',''),updated_at=stamp where id=current_visit.id and doctor_id=owner_id;
   if not found then raise exception 'Consulta não foi atualizada.'; end if;
  else
   insert into public.clinical_followup_occurrences(plan_id,doctor_id,patient_passport,patient_name,specialty,planned_date,step_number,rp_marker,step_title,planned_text,status) values(target,owner_id,p_passport,v_name,'Obstetra',(step->>'date')::date,(step->>'number')::int,step->>'marker',step->>'title',coalesce(step->>'planned_text',step->>'description',''),'Planejada');
  end if;
 end loop;
 return jsonb_build_object('id',target,'updated_at',stamp,'released',p_release);
end $function$;
CREATE OR REPLACE FUNCTION public.save_fiv_patient_project(p_project_id uuid, p_plan_id uuid, p_gestante text, p_doadora text, p_doctor_name text, p_start date, p_end date, p_notes text, p_steps jsonb, p_release_gestante boolean, p_release_doadora boolean, p_expected_versions jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
 actor uuid := auth.uid(); owner_id uuid:=auth.uid(); actor_name text; project uuid; role_name text; patient_passport_value text; patient_name_value text;
 participant public.clinical_followup_plans%rowtype; current_occ public.clinical_followup_occurrences%rowtype;
 schedule jsonb; versions jsonb; release_snapshot jsonb; step jsonb; stamp timestamptz := clock_timestamp();
 master_id uuid; donor_id uuid; release_requested boolean; existing_master public.clinical_followup_plans%rowtype;
begin
 select name into actor_name from public.profiles where id=actor;
 if p_plan_id is not null and public.can_administer_reproductive_followup() then
  select doctor_id,doctor_name into owner_id,p_doctor_name from public.clinical_followup_plans where id=p_plan_id;
  if not found then raise exception 'Projeto não encontrado.'; end if;
 end if;
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
  select * into existing_master from public.clinical_followup_plans where id=p_plan_id and doctor_id=owner_id for update;
  if not found or existing_master.plan_type<>'in_vitro' or existing_master.patient_passport<>p_gestante or existing_master.fiv_role='doadora' then raise exception 'Projeto não encontrado ou paciente incompatível.'; end if;
  project:=coalesce(existing_master.fiv_project_id,existing_master.id);
 else project:=coalesce(p_project_id,gen_random_uuid()); end if;
 perform pg_advisory_xact_lock(hashtextextended(project::text,0));
 -- Lock all records and require the versions actually reviewed in the UI.
 for participant in select * from public.clinical_followup_plans where (fiv_project_id=project or id=p_plan_id) and doctor_id=owner_id order by id for update loop
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
  select * into participant from public.clinical_followup_plans where doctor_id=owner_id and (fiv_project_id=project and fiv_role=role_name or role_name='gestante' and id=p_plan_id) for update;
  if not found then
   insert into public.clinical_followup_plans(id,doctor_id,doctor_name,patient_passport,patient_name,specialty,plan_type,frequency,interval_days,start_date,end_date,total_consultations,total_weeks,status,fiv_project_id,fiv_role,consultation_schedule)
   values(case when role_name='gestante' then project else gen_random_uuid() end,owner_id,p_doctor_name,patient_passport_value,patient_name_value,'Ginecologia','in_vitro','Personalizada',7,p_start,p_end,jsonb_array_length(schedule),5,'Ativo',project,role_name,'[]') returning * into participant;
  elsif participant.patient_passport<>patient_passport_value then raise exception 'A identidade da participante deve permanecer a mesma.'; end if;
  if role_name='gestante' then master_id:=participant.id; else donor_id:=participant.id; end if;
  release_requested:=case when role_name='gestante' then coalesce(p_release_gestante,false) else coalesce(p_release_doadora,false) end;
  versions:=coalesce(participant.planning_document_versions,'[]') || jsonb_build_array(jsonb_build_object('at',stamp,'start_date',participant.start_date,'end_date',participant.end_date,'consultation_schedule',participant.consultation_schedule,'planning_notes',participant.planning_notes,'saved_by',actor,'saved_by_name',actor_name));
  if release_requested and participant.planning_released_snapshot is not null then versions:=versions||jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',participant.planning_released_snapshot)); end if;
  release_snapshot:=jsonb_build_object('patient_name',patient_name_value,'patient_passport',patient_passport_value,'doctor_name',p_doctor_name,'specialty','Ginecologia','start_date',p_start,'end_date',p_end,'planning_notes',null,'consultation_schedule',schedule,'total_consultations',jsonb_array_length(schedule),'plan_type','in_vitro');
  for current_occ in select * from public.clinical_followup_occurrences where plan_id=participant.id and doctor_id=owner_id for update loop
   if not exists(select 1 from jsonb_array_elements(schedule) s where (current_occ.fiv_step_id is not null and (s->>'fiv_step_id')::uuid=current_occ.fiv_step_id) or (current_occ.fiv_step_id is null and (s->>'number')::int=current_occ.step_number)) then
    if current_occ.appointment_id is not null or current_occ.slot_id is not null or nullif(trim(coalesce(current_occ.planned_text,'')),'') is not null or nullif(trim(coalesce(current_occ.evolution_text,'')),'') is not null or nullif(trim(coalesce(current_occ.medical_observation_text,'')),'') is not null or nullif(trim(coalesce(current_occ.conduct_text,'')),'') is not null or coalesce(current_occ.followup_report,'{}')<>'{}'::jsonb or current_occ.individual_released_at is not null or current_occ.individual_released_snapshot is not null or current_occ.individual_document_path is not null or current_occ.individual_released_document_path is not null then raise exception 'Uma etapa possui dados ou agendamento e não pode ser removida ou transferida para outra paciente.'; end if;
    delete from public.clinical_followup_occurrences where id=current_occ.id;
   end if;
  end loop;
  update public.clinical_followup_plans set doctor_name=p_doctor_name,patient_name=patient_name_value,start_date=p_start,end_date=p_end,planning_notes=nullif(trim(p_notes),''),consultation_schedule=schedule,total_consultations=jsonb_array_length(schedule),schedule_confirmed_at=stamp,planning_document_path=null,planning_document_versions=versions,fiv_project_id=project,fiv_role=role_name,updated_at=stamp,
   portal_released_at=case when release_requested then stamp else portal_released_at end,planning_released_document_path=case when release_requested then null else planning_released_document_path end,planning_released_snapshot=case when release_requested then release_snapshot else planning_released_snapshot end
   where id=participant.id and doctor_id=owner_id;
  if not found then raise exception 'Não foi possível atualizar a participante.'; end if;
  for step in select value from jsonb_array_elements(schedule) loop
   select * into current_occ from public.clinical_followup_occurrences where plan_id=participant.id and doctor_id=owner_id and (fiv_step_id=(step->>'fiv_step_id')::uuid or fiv_step_id is null and step_number=(step->>'number')::int) for update;
   if found then
    if (current_occ.appointment_id is not null or current_occ.slot_id is not null) and current_occ.planned_date is distinct from (step->>'date')::date then raise exception 'A etapa já tem agendamento. Ajuste o agendamento antes de alterar sua data.'; end if;
    update public.clinical_followup_occurrences set fiv_step_id=(step->>'fiv_step_id')::uuid,step_number=(step->>'number')::int,planned_date=(step->>'date')::date,rp_marker=step->>'marker',step_title=step->>'title',planned_text=coalesce(step->>'planned_text',step->>'description',''),updated_at=stamp where id=current_occ.id and doctor_id=owner_id;
    if not found then raise exception 'Não foi possível atualizar a etapa.'; end if;
   else
    insert into public.clinical_followup_occurrences(plan_id,doctor_id,patient_passport,patient_name,specialty,planned_date,step_number,rp_marker,step_title,planned_text,status,fiv_step_id)
    values(participant.id,owner_id,patient_passport_value,patient_name_value,'Ginecologia',(step->>'date')::date,(step->>'number')::int,step->>'marker',step->>'title',coalesce(step->>'planned_text',step->>'description',''),'Planejada',(step->>'fiv_step_id')::uuid);
   end if;
  end loop;
 end loop;
 return jsonb_build_object('project_id',project,'gestante_plan_id',master_id,'doadora_plan_id',donor_id);
end $function$;
CREATE OR REPLACE FUNCTION public.save_fiv_patient_project_release_state(p_project_id uuid, p_plan_id uuid, p_gestante text, p_doadora text, p_doctor_name text, p_start date, p_end date, p_notes text, p_steps jsonb, p_release_gestante boolean, p_release_doadora boolean, p_expected_versions jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  result jsonb;
  participant public.clinical_followup_plans%rowtype;
  target_id uuid;
  released boolean;
  stamp timestamptz := clock_timestamp();
begin
  if auth.uid() is null then raise exception 'Sessão médica obrigatória.' using errcode='42501'; end if;
  if p_release_gestante is null or p_release_doadora is null then
    raise exception 'Informe o estado de liberação de cada paciente.' using errcode='22023';
  end if;
  -- Preserva autorização clínica, vínculos, participantes, cronograma, locks e versões.
  result := public.save_fiv_patient_project(p_project_id,p_plan_id,p_gestante,p_doadora,
    p_doctor_name,p_start,p_end,p_notes,p_steps,p_release_gestante,p_release_doadora,p_expected_versions);
  for target_id, released in
    select (result->>'gestante_plan_id')::uuid, p_release_gestante
    union all
    select (result->>'doadora_plan_id')::uuid, p_release_doadora
  loop
    if target_id is null then continue; end if;
    select * into participant from public.clinical_followup_plans
      where id=target_id and (doctor_id=auth.uid() or public.can_administer_reproductive_followup()) and plan_type='in_vitro' for update;
    if not found then raise exception 'Participante não autorizada.' using errcode='42501'; end if;
    if not released then
      update public.clinical_followup_plans set
        planning_document_versions=coalesce(planning_document_versions,'[]'::jsonb)
          || case when planning_released_snapshot is not null
            then jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',planning_released_snapshot))
            else '[]'::jsonb end,
        portal_released_at=null, planning_released_document_path=null, planning_released_snapshot=null,
        updated_at=clock_timestamp()
      where id=target_id and (doctor_id=auth.uid() or public.can_administer_reproductive_followup());
      if not found then raise exception 'Retirada de liberação não confirmada.' using errcode='42501'; end if;
    end if;
  end loop;
  -- Não toca nas liberações das etapas, nem nas da outra paciente fora deste projeto.
  return result || jsonb_build_object('gestante_released',p_release_gestante,
    'doadora_released',(result->>'doadora_plan_id') is not null and p_release_doadora);
end;
$function$;
revoke all on function public.save_reproductive_individual_atomic(uuid,jsonb,boolean,timestamptz) from public,anon;
grant execute on function public.save_reproductive_individual_atomic(uuid,jsonb,boolean,timestamptz) to authenticated;