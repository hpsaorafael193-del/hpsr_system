-- Destinatários por conta: responsáveis recebem avisos infantis sem expor a conta da criança.
-- Nenhum comunicado histórico é apagado ou reenviado.
alter table public.internal_notice_deliveries add column recipient_user_id uuid references auth.users(id) on delete cascade;
alter table public.internal_notice_deliveries drop constraint internal_notice_deliveries_check;
alter table public.internal_notice_deliveries add constraint internal_notice_delivery_one_recipient check (
 (patient_passport is not null)::int + (doctor_id is not null)::int + (recipient_user_id is not null)::int = 1
);
create unique index internal_notice_account_unique on public.internal_notice_deliveries(notice_id,recipient_user_id) where recipient_user_id is not null;
create index internal_notice_account_idx on public.internal_notice_deliveries(recipient_user_id) where recipient_user_id is not null;

create function hpsr_notice_private.patient_targets()
returns table(source_passport text,recipient_id uuid,recipient_name text,source_name text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno.' using errcode='42501'; end if;
 return query
 with people as materialized (
 select r.passport,r.name,
   (case when lower(btrim(coalesce(r.age,''))) ~ '^[0-9]{1,3}( (ano|anos|mes|meses))?$' then
      case when lower(r.age) ~ 'mes' then substring(r.age from '[0-9]+')::int < 216 else substring(r.age from '[0-9]+')::int < 18 end
    else false end
    or exists(select 1 from public.patient_guardian_links l where l.child_passport=r.passport)
    or (lower(coalesce(r.follow_up,'')) like '%pediatr%' and not exists(select 1 from public.patient_guardian_links l where l.guardian_passport=r.passport))
    or (coalesce(btrim(r.age),'')='' and exists(select 1 from public.appointments a where a.passport=r.passport and lower(btrim(a.payload->>'specialty')) in ('pediatria','pediatra'))
       and not exists(select 1 from public.patient_guardian_links l join public.patient_accounts a on a.user_id=l.guardian_user_id or (l.guardian_user_id is null and a.patient_passport=l.guardian_passport) where a.patient_passport=r.passport))
   ) as child
 from public.patient_registry r
 ), resolved as (
 select p.passport,a.user_id,coalesce(nullif(a.display_name,''),p.name) as account_name,p.name as patient_name
 from people p join public.patient_accounts a on a.patient_passport=p.passport where not p.child
 union
 select p.passport,a.user_id,coalesce(nullif(a.display_name,''),g.name,'Responsável') as account_name,p.name as patient_name
 from people p join public.patient_guardian_links l on l.child_passport=p.passport
 join public.patient_accounts a on (l.guardian_user_id=a.user_id or (l.guardian_user_id is null and l.guardian_passport=a.patient_passport))
 left join public.patient_registry g on g.passport=a.patient_passport
 where p.child and l.access_status='authorized' and l.portal_access and l.revoked_at is null
 and coalesce(a.patient_passport,'')<>p.passport
 union
 select null::text,a.user_id,coalesce(nullif(a.display_name,''),'Responsável'),'Conta de responsável'
 from public.patient_accounts a where a.patient_passport is null
 )
 select distinct r.passport,r.user_id,r.account_name,r.patient_name from resolved r
 join public.patient_accounts a on a.user_id=r.user_id
 where exists(select 1 from public.patient_portal_access x where x.access_enabled and
 (x.user_id=r.user_id or (x.user_id is null and x.patient_passport=a.patient_passport)));
end; $$;
revoke all on function hpsr_notice_private.patient_targets() from public,anon;
grant execute on function hpsr_notice_private.patient_targets() to authenticated;

create function hpsr_notice_private.candidates_v2(p_audience text,p_filter text,p_search text,p_offset int)
returns table(id text,label text,detail text) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno.' using errcode='42501';end if;
 if p_audience not in ('patients','doctors') or p_filter not in ('all','waiting_pediatrics','pediatrics_requests') then raise exception 'Filtro inválido.';end if;
 if p_audience='patients' then
 return query
 with cohort as materialized (
 select distinct p.passport,p.name from public.patient_registry p where p_filter='all' or exists(
 select 1 from public.appointments a where a.passport=p.passport and lower(btrim(a.payload->>'specialty')) in ('pediatria','pediatra')
 and (p_filter='pediatrics_requests' or lower(btrim(a.status)) not in ('arquivado','arquivada','cancelada','cancelado','recusada','recusado','rejeitada','rejeitado','concluída','concluído','concluida','concluido','finalizada','finalizado','atendida','atendido','encerrada','encerrado')))
 ), targets as materialized (select * from hpsr_notice_private.patient_targets()), candidates as (
 select t.recipient_id::text as target,t.recipient_name as name,
 string_agg(distinct case when t.source_passport is null then 'Conta de responsável' when t.recipient_name<>t.source_name then 'Responsável por '||t.source_name||' · Passaporte '||t.source_passport else 'Passaporte '||t.source_passport end,'; ') as description
 from targets t where (p_filter='all' or exists(select 1 from cohort c where c.passport=t.source_passport))
 and (t.recipient_name ilike '%'||left(coalesce(p_search,''),100)||'%' or t.source_name ilike '%'||left(coalesce(p_search,''),100)||'%' or t.source_passport ilike '%'||left(coalesce(p_search,''),100)||'%')
 group by t.recipient_id,t.recipient_name
 union all
 select 'pending:'||c.passport,c.name,'Sem conta de destinatário ou responsável autorizado. Confira o vínculo em Interno → Vínculos.'
 from cohort c where not exists(select 1 from targets t where t.source_passport=c.passport)
 and (c.name ilike '%'||left(coalesce(p_search,''),100)||'%' or c.passport ilike '%'||left(coalesce(p_search,''),100)||'%')
 ) select c.target,c.name,c.description from candidates c order by c.name,c.target limit 100 offset greatest(0,least(coalesce(p_offset,0),10000));
 else
 return query select p.id::text,p.name,'Passaporte '||coalesce(p.passport,'—')||' · '||p.role||case when coalesce(p.specialty,'')<>'' then ' · '||p.specialty else '' end from public.profiles p
 where p.access_status='Aprovado' and p.role in ('Médico Clínico','Médico Especialista','Médico Supervisor','Médico Plantonista','Médico Cirurgião','Diretor Clínico','Diretora','Vice Diretor','Vice Diretor / Dev')
 and (p.name ilike '%'||left(coalesce(p_search,''),100)||'%' or p.passport ilike '%'||left(coalesce(p_search,''),100)||'%')
 order by p.name,p.id limit 100 offset greatest(0,least(coalesce(p_offset,0),10000));
 end if;
end;$$;

create function hpsr_notice_private.send_accounts(p_request uuid,p_audience text,p_title text,p_body text,p_targets text[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare target_ids text[]; snapshots jsonb; found_count int; ref uuid; existing public.internal_notices%rowtype; actor text; title_text text:=btrim(p_title); body_text text:=btrim(p_body);
begin
 if auth.uid() is null or not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno.' using errcode='42501';end if;
 if p_request is null or p_audience not in ('patients','doctors') or length(coalesce(title_text,'')) not between 3 and 120 or length(coalesce(body_text,'')) not between 5 and 3000 then raise exception 'Informe público, título e mensagem válidos.' using errcode='22023';end if;
 select array_agg(id order by id) into target_ids from(select distinct lower(btrim(v)) id from unnest(p_targets) v where btrim(v)<>'') s;
 if coalesce(cardinality(target_ids),0) not between 1 and 500 then raise exception 'Selecione de 1 a 500 destinatários.' using errcode='22023';end if;
 -- The same reviewed submission can be retried without a second delivery.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request::text,0));
 select * into existing from public.internal_notices where created_by=auth.uid() and request_id=p_request;
 if found then
  if existing.audience<>p_audience or existing.title<>title_text or existing.body<>body_text or (select array_agg(value->>'id' order by value->>'id') from jsonb_array_elements(existing.recipients)) is distinct from target_ids then raise exception 'Identificação do envio já utilizada para outro conteúdo.' using errcode='22023';end if;
  return jsonb_build_object('id',existing.id,'count',jsonb_array_length(existing.recipients),'already_sent',true);
 end if;
 if p_audience='patients' then
 select count(*),jsonb_agg(jsonb_build_object('id',p.recipient_id::text,'label',p.recipient_name) order by p.recipient_id::text) into found_count,snapshots from (select distinct recipient_id,recipient_name from hpsr_notice_private.patient_targets() where recipient_id::text=any(target_ids)) p;
 else
 select count(*),jsonb_agg(jsonb_build_object('id',p.id::text,'label',p.name) order by p.id::text) into found_count,snapshots from public.profiles p where p.id::text=any(target_ids) and p.access_status='Aprovado' and p.role in ('Médico Clínico','Médico Especialista','Médico Supervisor','Médico Plantonista','Médico Cirurgião','Diretor Clínico','Diretora','Vice Diretor','Vice Diretor / Dev');
 end if;
 if found_count<>cardinality(target_ids) then raise exception 'Algum destinatário não está mais disponível. Revise a seleção.' using errcode='22023';end if;
 select p.name into actor from public.profiles p where p.id=auth.uid();
 insert into public.internal_notices(request_id,created_by,sender_name,audience,title,body,recipients) values(p_request,auth.uid(),actor,p_audience,title_text,body_text,snapshots) returning id into ref;
 if p_audience='patients' then insert into public.internal_notice_deliveries(notice_id,recipient_user_id) select ref,id::uuid from unnest(target_ids) id;
 else insert into public.internal_notice_deliveries(notice_id,doctor_id) select ref,id::uuid from unnest(target_ids) id;end if;
 insert into public.system_activities(id,module,action,description,actor,reference) values('HPSR-NOTICE-'||ref::text,'Interno','Comunicado enviado',title_text||' · '||found_count::text||' destinatários · '||p_audience,actor,ref::text);
 return jsonb_build_object('id',ref,'count',found_count,'already_sent',false);
end;$$;

-- Revalida o vínculo e o grupo no momento do envio, inclusive após revisão demorada.
create function hpsr_notice_private.send_filtered(p_request uuid,p_audience text,p_title text,p_body text,p_targets text[],p_filter text) returns jsonb language plpgsql security definer set search_path='' as $$
declare invalid_target boolean;
begin
 if auth.uid() is null or not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno.' using errcode='42501';end if;
 if p_filter is null or p_filter not in ('all','waiting_pediatrics','pediatrics_requests') then raise exception 'Filtro inválido.';end if;
 if p_audience='patients' and p_filter<>'all' then
 select exists(select 1 from unnest(p_targets) wanted where not exists(
 select 1 from hpsr_notice_private.patient_targets() t join public.appointments a on a.passport=t.source_passport
 where t.recipient_id::text=lower(btrim(wanted)) and lower(btrim(a.payload->>'specialty')) in ('pediatria','pediatra')
 and (p_filter='pediatrics_requests' or lower(btrim(a.status)) not in ('arquivado','arquivada','cancelada','cancelado','recusada','recusado','rejeitada','rejeitado','concluída','concluído','concluida','concluido','finalizada','finalizado','atendida','atendido','encerrada','encerrado'))
 )) into invalid_target;
 if invalid_target then raise exception 'Vínculo ou solicitação alterado. Atualize os destinatários e revise o envio.' using errcode='22023';end if;
 end if;
 return hpsr_notice_private.send_accounts(p_request,p_audience,p_title,p_body,p_targets);
end; $$;
create function public.hpsr_send_notice_v2(p_request uuid,p_audience text,p_title text,p_body text,p_targets text[],p_filter text default 'all') returns jsonb language sql security invoker set search_path='' as $$select hpsr_notice_private.send_filtered(p_request,p_audience,p_title,p_body,p_targets,p_filter)$$;
revoke all on function hpsr_notice_private.send_filtered(uuid,text,text,text,text[],text),public.hpsr_send_notice_v2(uuid,text,text,text,text[],text) from public,anon;
grant execute on function hpsr_notice_private.send_filtered(uuid,text,text,text,text[],text),public.hpsr_send_notice_v2(uuid,text,text,text,text[],text) to authenticated;

-- Endpoints novos preservam compatibilidade da versão anterior durante a publicação.
create function public.hpsr_notice_candidates_v2(p_audience text,p_filter text default 'all',p_search text default '',p_offset int default 0)
returns table(id text,label text,detail text) language sql stable security invoker set search_path='' as $$select * from hpsr_notice_private.candidates_v2(p_audience,p_filter,p_search,p_offset)$$;
revoke all on function hpsr_notice_private.candidates_v2(text,text,text,int),hpsr_notice_private.send_accounts(uuid,text,text,text,text[]),public.hpsr_notice_candidates_v2(text,text,text,int) from public,anon;
grant execute on function hpsr_notice_private.candidates_v2(text,text,text,int),hpsr_notice_private.send_accounts(uuid,text,text,text,text[]),public.hpsr_notice_candidates_v2(text,text,text,int) to authenticated;
