begin;
select set_config('request.jwt.claim.role','service_role',true);
insert into public.patient_registry(passport,name) values('QA-HISTORY122','Paciente QA histórico');
insert into public.clinical_records(id,patient_passport,record_type,payload) values
 ('qa-history-normal122','QA-HISTORY122','Documento','{"documentModelId":"normal","title":"Documento QA"}'),
 ('pediatric-followup-qa122','QA-HISTORY122','Documento','{"documentModelId":"pediatric-followup","title":"Pediátrico QA"}'),
 ('qa-history-exam122','QA-HISTORY122','Exame','{"title":"Exame QA"}');
do $$
begin
 if exists(select 1 from public.clinical_records where id like '%qa122' and not access_metadata_ready) then raise exception 'QA novo registro sem cache'; end if;
 if not exists(select 1 from public.clinical_records where id='pediatric-followup-qa122' and access_document_model_id='pediatric-followup' and access_metadata_ready) then raise exception 'QA metadados incompletos'; end if;
 -- Tentativa de forjar o cache deve ser rederivada do conteúdo real.
 update public.clinical_records set access_document_model_id='normal',access_metadata_ready=false where id='pediatric-followup-qa122';
 if not exists(select 1 from public.clinical_records where id='pediatric-followup-qa122' and access_document_model_id='pediatric-followup' and access_metadata_ready) then raise exception 'QA cache forjável'; end if;
 update public.clinical_records set payload='{"documentModelId":"alterado"}' where id='qa-history-normal122';
 if not exists(select 1 from public.clinical_records where id='qa-history-normal122' and access_document_model_id='alterado') then raise exception 'QA cache desatualizado após edição'; end if;
end $$;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where access_status='Aprovado' and role not in ('Diretora','Vice Diretor','Vice Diretor / Dev') and coalesce(specialty,'') not ilike '%pedi%' limit 1),true);
set local role authenticated;
do $$
begin
 if not public.is_hpsr_staff() or hpsr_private.can_manage_pediatric_followup() then raise exception 'QA perfil precisa ser aprovado sem permissão pediátrica'; end if;
 if exists(select 1 from public.clinical_records where id='pediatric-followup-qa122') then raise exception 'QA documento restrito vazou'; end if;
 if (select count(*) from public.clinical_records where id in ('qa-history-normal122','qa-history-exam122'))<>2 then raise exception 'QA documentos normais bloqueados'; end if;
 update public.clinical_records set payload='{"documentModelId":"normal-autenticado"}' where id='qa-history-normal122';
 if not exists(select 1 from public.clinical_records where id='qa-history-normal122' and access_document_model_id='normal-autenticado' and access_metadata_ready) then raise exception 'QA trigger não funciona como authenticated'; end if;
 update public.clinical_records set access_document_model_id='pediatric-followup',access_metadata_ready=false where id='qa-history-normal122';
 if not exists(select 1 from public.clinical_records where id='qa-history-normal122' and access_document_model_id='normal-autenticado' and access_metadata_ready) then raise exception 'QA cliente forjou cache'; end if;

end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where access_status='Aprovado' and role='Vice Diretor / Dev' limit 1),true);
set local role authenticated;
do $$ begin
 if not exists(select 1 from public.clinical_records where id='pediatric-followup-qa122') then raise exception 'QA direção perdeu acesso'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.clinical_records where id in ('qa-history-normal122','qa-history-exam122','pediatric-followup-qa122')) then raise exception 'QA sessão não autorizada viu registros'; end if;
end $$;
reset role;
rollback;
select 'PASS: metadados automáticos, edição, cache não forjável, staff autorizado, pediatria isolada, direção e sessão sem autorização; rollback' as validation;
