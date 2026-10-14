begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where access_status='Aprovado' and role='Vice Diretor / Dev' limit 1),true);
insert into public.patient_registry(passport,name) values('QA-RELEASE-G118','Gestante QA Release'),('QA-RELEASE-D118','Doadora QA Release'),('QA-RELEASE-P118','Gestacional QA Release');
insert into public.patient_doctor_links(patient_passport,doctor_id,specialty) values('QA-RELEASE-G118',auth.uid(),'Ginecologia'),('QA-RELEASE-D118',auth.uid(),'Ginecologia'),('QA-RELEASE-P118',auth.uid(),'Obstetra');
set local role authenticated;
do $$
declare result jsonb; g uuid; d uuid; versions jsonb; first_visit uuid; donor_visit uuid; failed boolean;
 steps jsonb:='[{"number":1,"fiv_step_id":"00000000-0000-4000-8000-000000001181","fiv_recipient":"ambas","date":"2026-10-14","title":"Etapa 1","marker":"1","planned_text":"Etapa compartilhada 1"},{"number":2,"fiv_step_id":"00000000-0000-4000-8000-000000001182","fiv_recipient":"ambas","date":"2026-10-21","title":"Etapa 2","marker":"2","planned_text":"Etapa compartilhada 2"}]';
begin
 result:=public.save_fiv_patient_project_release_state('00000000-0000-4000-8000-000000001180',null,'QA-RELEASE-G118','QA-RELEASE-D118','Médica QA','2026-10-14','2026-11-14',null,steps,true,true,'{}');
 g:=(result->>'gestante_plan_id')::uuid; d:=(result->>'doadora_plan_id')::uuid;
 if (select count(*) from public.clinical_followup_plans where id in(g,d) and portal_released_at is not null)<>2 then raise exception 'QA liberação de ambas'; end if;
 update public.clinical_followup_occurrences set individual_released_at=clock_timestamp(),individual_released_snapshot='{"planned_text":"Versão individual liberada"}' where plan_id in(g,d);
 select id into first_visit from public.clinical_followup_occurrences where plan_id=g and step_number=1;
 select id into donor_visit from public.clinical_followup_occurrences where plan_id=d and step_number=1;
 select jsonb_object_agg(id,updated_at) into versions from public.clinical_followup_plans where id in(g,d);
 result:=public.save_fiv_patient_project_release_state(g,g,'QA-RELEASE-G118','QA-RELEASE-D118','Médica QA','2026-10-14','2026-11-14',null,steps,false,true,versions);
 if exists(select 1 from public.clinical_followup_plans where id=g and (portal_released_at is not null or planning_released_snapshot is not null or planning_released_document_path is not null)) then raise exception 'QA integral gestante não retirado'; end if;
 if not exists(select 1 from public.clinical_followup_plans where id=d and portal_released_at is not null) then raise exception 'QA doadora afetada'; end if;
 if (select count(*) from public.clinical_followup_occurrences where plan_id in(g,d) and individual_released_at is not null)<>4 then raise exception 'QA retirada do integral afetou individuais'; end if;
 if not exists(select 1 from public.clinical_followup_plans where id=g and planning_document_versions::text like '%released_snapshot%') then raise exception 'QA histórico da folha apagado'; end if;
 failed:=false;
 begin perform public.save_fiv_patient_project_release_state(g,g,'QA-RELEASE-G118','QA-RELEASE-D118','Médica QA','2026-10-14','2026-11-14',null,steps,true,false,versions); exception when others then failed:=true; end;
 if not failed then raise exception 'QA versão antiga aceita'; end if;
 if not exists(select 1 from public.clinical_followup_plans where id=d and portal_released_at is not null) then raise exception 'QA falha retirou doadora parcialmente'; end if;
 select jsonb_object_agg(id,updated_at) into versions from public.clinical_followup_plans where id in(g,d);
 result:=public.save_fiv_patient_project_release_state(g,g,'QA-RELEASE-G118','QA-RELEASE-D118','Médica QA','2026-10-14','2026-11-14',null,steps,true,false,versions);
 if not exists(select 1 from public.clinical_followup_plans where id=g and portal_released_at is not null) or exists(select 1 from public.clinical_followup_plans where id=d and portal_released_at is not null) then raise exception 'QA liberação inversa'; end if;
 -- A liberação individual não altera o integral nem outras etapas/pacientes.
 update public.clinical_followup_occurrences set individual_released_at=null,individual_released_snapshot=null,individual_released_document_path=null where id=first_visit;
 if not exists(select 1 from public.clinical_followup_plans where id=g and portal_released_at is not null) then raise exception 'QA individual retirou integral'; end if;
 if not exists(select 1 from public.clinical_followup_occurrences where id=donor_visit and individual_released_at is not null) or (select count(*) from public.clinical_followup_occurrences where plan_id in(g,d) and individual_released_at is not null)<>3 then raise exception 'QA individual afetou outras'; end if;
 select jsonb_object_agg(id,updated_at) into versions from public.clinical_followup_plans where id in(g,d);
 -- Clientes antigos mantêm a semântica anterior e não sofrem revogação automática.
 result:=public.save_fiv_patient_project(g,g,'QA-RELEASE-G118','QA-RELEASE-D118','Médica QA','2026-10-14','2026-11-14',null,steps,false,false,versions);
 if not exists(select 1 from public.clinical_followup_plans where id=g and portal_released_at is not null) then raise exception 'QA regressão cliente antigo'; end if;
 select jsonb_object_agg(id,updated_at) into versions from public.clinical_followup_plans where id in(g,d);
 result:=public.save_fiv_patient_project_release_state(g,g,'QA-RELEASE-G118','QA-RELEASE-D118','Médica QA','2026-10-14','2026-11-14',null,steps,false,false,versions);
 if exists(select 1 from public.clinical_followup_plans where id in(g,d) and portal_released_at is not null) then raise exception 'QA ambas retiradas'; end if;
 -- Mesmos campos que o salvamento gestacional envia com o switch desmarcado.
 insert into public.clinical_followup_plans(id,doctor_id,doctor_name,patient_passport,patient_name,specialty,plan_type,frequency,interval_days,start_date,end_date,total_consultations,status,portal_released_at,planning_released_snapshot)
 values('00000000-0000-4000-8000-000000001189',auth.uid(),'Médica QA','QA-RELEASE-P118','Gestacional QA Release','Obstetra','gestacional','Personalizada',7,'2026-10-14','2026-11-14',2,'Ativo',clock_timestamp(),'{"patient_name":"Gestacional QA Release"}');
 update public.clinical_followup_plans set portal_released_at=null,planning_released_snapshot=null,planning_released_document_path=null where id='00000000-0000-4000-8000-000000001189';
 if exists(select 1 from public.clinical_followup_plans where id='00000000-0000-4000-8000-000000001189' and portal_released_at is not null) then raise exception 'QA gestacional retirado'; end if;
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','public.save_fiv_patient_project_release_state(uuid,uuid,text,text,text,date,date,text,jsonb,boolean,boolean,jsonb)','execute') then raise exception 'QA acesso anônimo'; end if;
 if (select prosecdef from pg_proc where oid='public.save_fiv_patient_project_release_state(uuid,uuid,text,text,text,date,date,text,jsonb,boolean,boolean,jsonb)'::regprocedure) then raise exception 'QA função ignora RLS'; end if;
end $$;
rollback;
select 'PASS integral/individual revoke, FIV participant independence, history, re-release, stale-version rollback, old-client compatibility and authenticated RLS' as validation;
