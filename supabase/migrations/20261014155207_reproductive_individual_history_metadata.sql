begin;
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
 clinical:=jsonb_build_object('title',case when plan.plan_type='in_vitro' then 'Fertilização in vitro · Etapa ' else 'Gestacional · Consulta ' end||visit.step_number,'patient',jsonb_build_object('name',plan.patient_name,'passport',plan.patient_passport),'doctor',jsonb_build_object('name',plan.doctor_name),'followupPlanId',plan.id,'followupOccurrenceId',visit.id,'planType',plan.plan_type,'specialty',plan.specialty,'stepNumber',visit.step_number,'marker',p_update->>'rp_marker','plannedDate',visit.planned_date,'planning',new_text,'evolution',p_update->>'evolution_text','medicalObservation',p_update->>'medical_observation_text','examsPerformed',p_update#>>'{followup_report,exams_performed}','examExplanation',p_update#>>'{followup_report,exam_explanation}','patientObservations',p_update#>>'{followup_report,patient_observations}');
 insert into public.clinical_records(id,patient_passport,record_type,payload,created_by,is_confidential,updated_at) values(v_record,plan.patient_passport,case when plan.plan_type='in_vitro' then 'Evolução FIV' else 'Evolução obstétrica' end,clinical,actor,true,stamp)
 on conflict(id) do update set payload=excluded.payload,is_confidential=true,updated_at=excluded.updated_at;
 return jsonb_build_object('id',visit.id,'updated_at',stamp,'plan_updated_at',plan.updated_at,'individual_released_at',case when p_release is true then stamp when p_release is false then null else visit.individual_released_at end,'individual_released_snapshot',case when p_release is true then snapshot when p_release is false then null else visit.individual_released_snapshot end);
end $$;
revoke all on function public.save_reproductive_individual_atomic(uuid,jsonb,boolean,timestamptz) from public,anon;
grant execute on function public.save_reproductive_individual_atomic(uuid,jsonb,boolean,timestamptz) to authenticated;
commit;
