-- Coverage does not transfer ownership or change patient-doctor links.
alter table public.clinical_followup_occurrences
 add column if not exists performed_by uuid references public.profiles(id) on delete set null,
 add column if not exists performed_by_name text,
 add column if not exists performed_at timestamptz;

-- Attribution is assigned from the authenticated profile, never from client-provided identity.
create or replace function hpsr_private.attribute_reproductive_occurrence() returns trigger
language plpgsql security invoker set search_path='' as $$
declare actor_name text;
begin
 if auth.uid() is null then return new; end if;
 if tg_op='UPDATE' then
  if new.evolution_text is not distinct from old.evolution_text and new.medical_observation_text is not distinct from old.medical_observation_text
   and new.followup_report is not distinct from old.followup_report and new.conduct_text is not distinct from old.conduct_text
   and new.performed_by is not distinct from old.performed_by and new.performed_by_name is not distinct from old.performed_by_name and new.performed_at is not distinct from old.performed_at then return new; end if;
 elsif new.performed_by is null then return new;
 end if;
 select name into actor_name from public.profiles where id=auth.uid() and access_status='Aprovado';
 if not found then raise exception 'Profissional inativo.' using errcode='42501'; end if;
 new.performed_by:=auth.uid();new.performed_by_name:=actor_name;new.performed_at:=clock_timestamp();
 return new;
end; $$;
revoke all on function hpsr_private.attribute_reproductive_occurrence() from public,anon,authenticated;
drop trigger if exists attribute_reproductive_occurrence on public.clinical_followup_occurrences;
create trigger attribute_reproductive_occurrence before insert or update on public.clinical_followup_occurrences
for each row execute function hpsr_private.attribute_reproductive_occurrence();

create or replace function public.list_reproductive_planning_responsibles()
returns table(doctor_id uuid,doctor_name text) language sql stable security invoker set search_path='' as $$
 select distinct p.doctor_id,coalesce(nullif(pr.name,''),p.doctor_name) from public.clinical_followup_plans p
 left join public.profiles pr on pr.id=p.doctor_id
 where p.plan_type in ('gestacional','in_vitro') and exists(select 1 from public.profiles me where me.id=(select auth.uid()) and me.access_status='Aprovado' and me.role in ('Diretora','Vice Diretor / Dev'))
 order by 2;
$$;
revoke all on function public.list_reproductive_planning_responsibles() from public,anon;
grant execute on function public.list_reproductive_planning_responsibles() to authenticated;

-- Invoker-only authorization. Normal requests cannot set this transaction-local context.
-- Even inside the RPC it is limited to the original owner, patient, plan and occurrence.
create or replace function public.hpsr_coverage_write_allowed(target_plan uuid,target_doctor uuid,target_passport text,target_occurrence uuid default null)
returns boolean language sql stable security invoker set search_path='' as $$
 select coalesce(
  nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'plan'=target_plan::text
  and nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'doctor'=target_doctor::text
  and nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'passport'=target_passport
  and (target_occurrence is null or nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'occurrence'=target_occurrence::text)
  and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.access_status='Aprovado' and (target_doctor=(select auth.uid()) or p.role in ('Diretora','Vice Diretor / Dev'))),false);
$$;
revoke all on function public.hpsr_coverage_write_allowed(uuid,uuid,text,uuid) from public,anon;
grant execute on function public.hpsr_coverage_write_allowed(uuid,uuid,text,uuid) to authenticated;

create or replace function public.hpsr_coverage_clinical_write_allowed(target_id text,target_passport text,target_payload jsonb)
returns boolean language sql stable security invoker set search_path='' as $$
 select coalesce(target_id='followup-'||(nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'occurrence')
 and target_payload->>'followupPlanId'=nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'plan'
 and target_payload->>'followupOccurrenceId'=nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'occurrence'
 and public.hpsr_coverage_write_allowed(
  (nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'plan')::uuid,
  (nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'doctor')::uuid,target_passport,
  (nullif(current_setting('hpsr.coverage_context',true),'')::jsonb->>'occurrence')::uuid),false);
$$;
revoke all on function public.hpsr_coverage_clinical_write_allowed(text,text,jsonb) from public,anon;
grant execute on function public.hpsr_coverage_clinical_write_allowed(text,text,jsonb) to authenticated;
alter policy "hpsr reproductive clinical update guard" on public.clinical_records
using(record_type not in ('Evolução obstétrica','Evolução FIV') or created_by=(select auth.uid()) or public.hpsr_coverage_clinical_write_allowed(id,patient_passport,payload))
with check(record_type not in ('Evolução obstétrica','Evolução FIV') or created_by=(select auth.uid()) or public.hpsr_coverage_clinical_write_allowed(id,patient_passport,payload));

alter policy "hpsr reproductive occurrence update guard" on public.clinical_followup_occurrences
using (public.hpsr_can_write_reproductive_occurrence(plan_id,doctor_id,patient_passport,specialty) or public.hpsr_coverage_write_allowed(plan_id,doctor_id,patient_passport,id))
with check (public.hpsr_can_write_reproductive_occurrence(plan_id,doctor_id,patient_passport,specialty) or public.hpsr_coverage_write_allowed(plan_id,doctor_id,patient_passport,id));
alter policy "hpsr reproductive plan update guard" on public.clinical_followup_plans
using ((coalesce(plan_type,'') not in ('gestacional','in_vitro') or public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,plan_type)) or public.hpsr_coverage_write_allowed(id,doctor_id,patient_passport))
with check ((coalesce(plan_type,'') not in ('gestacional','in_vitro') or (((plan_type='gestacional' and public.hpsr_normalize_specialty(specialty)='obstetra') or (plan_type='in_vitro' and public.hpsr_normalize_specialty(specialty)='ginecologia')) and public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,plan_type))) or public.hpsr_coverage_write_allowed(id,doctor_id,patient_passport));
drop policy if exists "Scoped administrative coverage update" on public.clinical_followup_plans;
create policy "Scoped administrative coverage update" on public.clinical_followup_plans for update to authenticated
using(public.hpsr_coverage_write_allowed(id,doctor_id,patient_passport)) with check(public.hpsr_coverage_write_allowed(id,doctor_id,patient_passport));
drop policy if exists "Scoped administrative coverage update" on public.clinical_followup_occurrences;
create policy "Scoped administrative coverage update" on public.clinical_followup_occurrences for update to authenticated
using(public.hpsr_coverage_write_allowed(plan_id,doctor_id,patient_passport,id)) with check(public.hpsr_coverage_write_allowed(plan_id,doctor_id,patient_passport,id));

create or replace function public.save_reproductive_individual_atomic(p_occurrence_id uuid,p_update jsonb,p_release boolean,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare actor uuid:=auth.uid(); visit public.clinical_followup_occurrences%rowtype; plan public.clinical_followup_plans%rowtype; stamp timestamptz:=clock_timestamp(); versions jsonb; new_schedule jsonb; new_text text; snapshot jsonb; clinical jsonb; v_record text; actor_profile public.profiles%rowtype; coverage_admin boolean:=false; old_context text;
begin
 select * into actor_profile from public.profiles where id=actor and access_status='Aprovado';
 if actor is null or actor_profile.id is null then raise exception 'Sessão clínica não autorizada.' using errcode='42501'; end if;
 coverage_admin:=actor_profile.role in ('Diretora','Vice Diretor / Dev');
 select * into visit from public.clinical_followup_occurrences where id=p_occurrence_id;
 if actor is null or visit.id is null or (visit.doctor_id<>actor and not coverage_admin) then raise exception 'Consulta não autorizada.' using errcode='42501'; end if;
 old_context:=current_setting('hpsr.coverage_context',true);
 if visit.id is not null then
  perform set_config('hpsr.coverage_context',jsonb_build_object('plan',visit.plan_id,'occurrence',visit.id,'doctor',visit.doctor_id,'passport',visit.patient_passport)::text,true);
 end if;
 -- Ordem de locks igual ao salvamento integral: plano antes das consultas.
 select * into plan from public.clinical_followup_plans where id=visit.plan_id for update;
 if plan.id is null or plan.doctor_id<>visit.doctor_id or plan.patient_passport<>visit.patient_passport or plan.plan_type not in ('gestacional','in_vitro') or (not coverage_admin and (plan.doctor_id<>actor or not public.hpsr_can_manage_reproductive_patient(actor,plan.patient_passport,plan.plan_type))) then raise exception 'Autorização clínica e vínculo ativo obrigatórios.' using errcode='42501'; end if;
 select * into visit from public.clinical_followup_occurrences where id=p_occurrence_id for update;
 if visit.plan_id<>plan.id or visit.doctor_id<>plan.doctor_id or visit.patient_passport<>plan.patient_passport then raise exception 'Contexto da consulta alterado.' using errcode='40001'; end if;
 if visit.updated_at is distinct from p_expected_updated_at or p_expected_updated_at is null then raise exception 'Consulta alterada em outra sessão. Reabra o registro atual; seu rascunho foi mantido.' using errcode='40001'; end if;
 if jsonb_typeof(p_update) is distinct from 'object' then raise exception 'Dados individuais inválidos.'; end if;
 new_text:=coalesce(p_update->>'planned_text','');
 versions:=coalesce(visit.individual_document_versions,'[]')||jsonb_build_array(jsonb_build_object('at',stamp,'planned_text',visit.planned_text,'evolution_text',visit.evolution_text,'medical_observation_text',visit.medical_observation_text,'conduct_text',visit.conduct_text,'followup_report',visit.followup_report,'performed_by',case when visit.performed_by_name is null then plan.doctor_id else visit.performed_by end,'performed_by_name',coalesce(visit.performed_by_name,plan.doctor_name),'performed_at',visit.performed_at,'saved_by',actor,'saved_by_name',actor_profile.name));
 if p_release is not null and visit.individual_released_snapshot is not null then versions:=versions||jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',visit.individual_released_snapshot)); end if;
 snapshot:=p_update->'individual_released_snapshot';
 if p_release is true and (jsonb_typeof(snapshot) is distinct from 'object' or snapshot->>'occurrence_id' is distinct from visit.id::text or snapshot->>'plan_id' is distinct from plan.id::text) then raise exception 'Snapshot individual inválido.'; end if;
 if p_release is true then
  snapshot:=snapshot||jsonb_build_object('doctor_name',actor_profile.name,'performed_by',actor,'performed_by_name',actor_profile.name,'responsible_doctor_id',plan.doctor_id,'responsible_doctor_name',plan.doctor_name,'patient_name',plan.patient_name,'patient_passport',plan.patient_passport,'step_number',visit.step_number,'planned_date',visit.planned_date);
 end if;
 update public.clinical_followup_occurrences set performed_by=actor,performed_by_name=actor_profile.name,performed_at=stamp,planned_text=nullif(new_text,''),evolution_text=nullif(p_update->>'evolution_text',''),medical_observation_text=nullif(p_update->>'medical_observation_text',''),followup_report=coalesce(p_update->'followup_report','{}'),rp_marker=p_update->>'rp_marker',step_title=p_update->>'step_title',individual_document_path=null,individual_document_versions=versions,
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
 clinical:=jsonb_build_object('title',case when plan.plan_type='in_vitro' then 'Fertilização in vitro · Etapa ' else 'Gestacional · Consulta ' end||visit.step_number,'patient',jsonb_build_object('name',plan.patient_name,'passport',plan.patient_passport),'doctor',jsonb_build_object('id',actor,'name',actor_profile.name),'responsibleDoctor',jsonb_build_object('id',plan.doctor_id,'name',plan.doctor_name),'performedBy',actor,'performedAt',stamp,'followupPlanId',plan.id,'followupOccurrenceId',visit.id,'planType',plan.plan_type,'specialty',plan.specialty,'stepNumber',visit.step_number,'marker',p_update->>'rp_marker','plannedDate',visit.planned_date,'planning',new_text,'evolution',p_update->>'evolution_text','medicalObservation',p_update->>'medical_observation_text','examsPerformed',p_update#>>'{followup_report,exams_performed}','examExplanation',p_update#>>'{followup_report,exam_explanation}','patientObservations',p_update#>>'{followup_report,patient_observations}');
 insert into public.clinical_records(id,patient_passport,record_type,payload,created_by,is_confidential,updated_at) values(v_record,plan.patient_passport,case when plan.plan_type='in_vitro' then 'Evolução FIV' else 'Evolução obstétrica' end,clinical,actor,true,stamp)
 on conflict(id) do update set payload=excluded.payload,is_confidential=true,updated_at=excluded.updated_at;
 perform set_config('hpsr.coverage_context',coalesce(old_context,''),true);
 return jsonb_build_object('id',visit.id,'performed_by',actor,'performed_by_name',actor_profile.name,'performed_at',stamp,'updated_at',stamp,'plan_updated_at',plan.updated_at,'individual_released_at',case when p_release is true then stamp when p_release is false then null else visit.individual_released_at end,'individual_released_snapshot',case when p_release is true then snapshot when p_release is false then null else visit.individual_released_snapshot end);
end $$;
revoke all on function public.save_reproductive_individual_atomic(uuid,jsonb,boolean,timestamptz) from public,anon;
grant execute on function public.save_reproductive_individual_atomic(uuid,jsonb,boolean,timestamptz) to authenticated;
