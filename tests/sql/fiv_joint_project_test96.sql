-- Run against the installed migration; all fixtures roll back. Requires an approved test-context medical actor.
begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where access_status='Aprovado' and role='Vice Diretor / Dev' limit 1),true);
insert into public.patient_registry(passport,name) values('QA-FIV-G-96','Teste FIV Gestante'),('QA-FIV-D-96','Teste FIV Doadora'),('QA-FIV-U-96','Teste FIV Sem Vinculo');
insert into public.patient_doctor_links(patient_passport,doctor_id,specialty) values('QA-FIV-G-96',auth.uid(),'Ginecologia'),('QA-FIV-D-96',auth.uid(),'Ginecologia');
set local role authenticated;
do $$
declare
 result jsonb; master uuid; donor uuid; versions jsonb; failed boolean; current_actor uuid:=auth.uid();
 steps jsonb:='[{"number":1,"fiv_step_id":"00000000-0000-4000-8000-000000000961","fiv_recipient":"gestante","title":"Etapa G","marker":"Etapa 1","date":"2026-10-08","planned_text":"Conteudo so gestante"},{"number":2,"fiv_step_id":"00000000-0000-4000-8000-000000000962","fiv_recipient":"doadora","title":"Etapa D","marker":"Etapa 2","date":"2026-10-09","planned_text":"Conteudo so doadora"}]';
begin
 result:=public.save_fiv_patient_project('00000000-0000-4000-8000-000000000960',null,'QA-FIV-G-96','QA-FIV-D-96','Medica QA','2026-10-08','2026-11-08',null,steps,true,false,'{}');
 master:=(result->>'gestante_plan_id')::uuid; donor:=(result->>'doadora_plan_id')::uuid;
 if master is null or donor is null then raise exception 'QA: participantes ausentes'; end if;
 if (select count(*) from public.clinical_followup_plans where fiv_project_id=master)<>2 then raise exception 'QA: projeto duplicado'; end if;
 if exists(select 1 from public.clinical_followup_plans where id=master and consultation_schedule::text like '%so doadora%') or exists(select 1 from public.clinical_followup_plans where id=donor and consultation_schedule::text like '%so gestante%') then raise exception 'QA: vazamento de conteudo'; end if;
 if not exists(select 1 from public.clinical_followup_plans where id=master and planning_released_snapshot is not null) or exists(select 1 from public.clinical_followup_plans where id=donor and portal_released_at is not null) then raise exception 'QA: liberacao compartilhada'; end if;
 if (select count(*) from public.clinical_followup_occurrences where plan_id in(master,donor))<>2 then raise exception 'QA: etapas incorretas'; end if;
 select jsonb_object_agg(id,updated_at) into versions from public.clinical_followup_plans where fiv_project_id=master;
 result:=public.save_fiv_patient_project(master,master,'QA-FIV-G-96','QA-FIV-D-96','Medica QA','2026-10-08','2026-11-08',null,jsonb_set(steps,'{0,planned_text}','"Rascunho alterado gestante"'),false,true,versions);
 if not exists(select 1 from public.clinical_followup_plans where id=master and planning_released_snapshot::text like '%Conteudo so gestante%') then raise exception 'QA: alteracao republicada indevidamente'; end if;
 if not exists(select 1 from public.clinical_followup_plans where id=donor and planning_released_snapshot::text like '%Conteudo so doadora%') then raise exception 'QA: doadora nao liberada'; end if;
 failed:=false;
 begin perform public.save_fiv_patient_project(master,master,'QA-FIV-G-96','QA-FIV-D-96','Medica QA','2026-10-08','2026-11-08',null,steps,false,false,versions); exception when others then failed:=true; end;
 if not failed then raise exception 'QA: versao antiga aceita'; end if;
 failed:=false;
 begin perform public.save_fiv_patient_project(gen_random_uuid(),null,'QA-FIV-G-96','QA-FIV-U-96','Medica QA','2026-10-08','2026-11-08',null,steps,false,false,'{}'); exception when others then failed:=true; end;
 if not failed then raise exception 'QA: paciente sem vinculo aceita'; end if;
 select jsonb_object_agg(id,updated_at) into versions from public.clinical_followup_plans where fiv_project_id=master;
 failed:=false;
 begin perform public.save_fiv_patient_project(master,master,'QA-FIV-G-96','QA-FIV-G-96','Medica QA','2026-10-08','2026-11-08',null,steps,false,false,versions); exception when others then failed:=true; end;
 if not failed then raise exception 'QA: mesmo paciente em dois papeis'; end if;
 -- Rollback both plans if donor has an invalid date; gestante's first update must not remain.
 failed:=false;
 begin perform public.save_fiv_patient_project(master,master,'QA-FIV-G-96','QA-FIV-D-96','Medica QA','2026-10-08','2026-11-08',null,jsonb_set(steps,'{1,date}','"data-invalida"'),false,false,versions); exception when others then failed:=true; end;
 if not failed then raise exception 'QA: data invalida aceita'; end if;
 if exists(select 1 from public.clinical_followup_plans where id=master and consultation_schedule::text not like '%Rascunho alterado gestante%') then raise exception 'QA: falha parcial alterou a gestante'; end if;
 -- A constraint failure in donor synchronization rolls back the prior gestante update.
 failed:=false;
 begin perform public.save_fiv_patient_project(master,master,'QA-FIV-G-96','QA-FIV-D-96','Medica QA','2026-10-08','2026-11-08',null,steps||jsonb_build_array(jsonb_set(jsonb_set(steps->1,'{fiv_step_id}','"00000000-0000-4000-8000-000000000964"'),'{number}','3')),false,false,versions); exception when unique_violation then failed:=true; end;
 if not failed then raise exception 'QA: datas duplicadas aceitas'; end if;
 if exists(select 1 from public.clinical_followup_plans where id=master and consultation_schedule::text not like '%Rascunho alterado gestante%') then raise exception 'QA: salvamento parcial após falha da doadora'; end if;
 -- Solo gestante remains supported.
 result:=public.save_fiv_patient_project('00000000-0000-4000-8000-000000000963',null,'QA-FIV-G-96',null,'Medica QA','2026-10-08','2026-11-08',null,jsonb_build_array(steps->0),false,false,'{}');
 if result->>'doadora_plan_id' is not null then raise exception 'QA: doadora obrigatoria'; end if;
 perform public.delete_fiv_patient_project(master);
 if exists(select 1 from public.clinical_followup_plans where fiv_project_id=master) then raise exception 'QA: exclusao parcial do projeto'; end if;
end $$;
reset role;

rollback;
