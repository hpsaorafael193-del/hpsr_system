create schema hpsr_notice_private;
revoke all on schema hpsr_notice_private from public,anon;
grant usage on schema hpsr_notice_private to authenticated;
create table public.internal_notices(
 id uuid primary key default gen_random_uuid(),request_id uuid not null,created_by uuid not null references public.profiles(id),sender_name text not null,
 audience text not null check(audience in ('patients','doctors')),title text not null check(length(title) between 3 and 120),body text not null check(length(body) between 5 and 3000),
 recipients jsonb not null check(jsonb_typeof(recipients)='array' and jsonb_array_length(recipients) between 1 and 500),created_at timestamptz not null default now(),unique(created_by,request_id)
);
create table public.internal_notice_deliveries(
 id uuid primary key default gen_random_uuid(),notice_id uuid not null references public.internal_notices(id),patient_passport text references public.patient_registry(passport),doctor_id uuid references public.profiles(id),read_at timestamptz,created_at timestamptz not null default now(),
 check((patient_passport is not null)::int+(doctor_id is not null)::int=1)
);
create unique index internal_notice_patient_unique on public.internal_notice_deliveries(notice_id,patient_passport) where patient_passport is not null;
create unique index internal_notice_doctor_unique on public.internal_notice_deliveries(notice_id,doctor_id) where doctor_id is not null;
create index internal_notice_deliveries_patient_idx on public.internal_notice_deliveries(patient_passport) where patient_passport is not null;
create index internal_notice_deliveries_doctor_idx on public.internal_notice_deliveries(doctor_id) where doctor_id is not null;
create index internal_notices_created_idx on public.internal_notices(created_at desc);
alter table public.internal_notices enable row level security;
alter table public.internal_notice_deliveries enable row level security;
revoke all on public.internal_notices,public.internal_notice_deliveries from public,anon,authenticated;
grant select on public.internal_notices,public.internal_notice_deliveries to authenticated;
grant update(read_at) on public.internal_notice_deliveries to authenticated;
grant all on public.internal_notices,public.internal_notice_deliveries to service_role;
-- Recipient snapshots remain private to the authorized Internal administration.
create policy notice_admin_read on public.internal_notices for select to authenticated using ((select public.hpsr_can_access_internal()));
create policy notice_delivery_read on public.internal_notice_deliveries for select to authenticated using ((select public.hpsr_can_access_internal()) or ((select public.is_hpsr_staff()) and doctor_id=(select auth.uid())));
create policy notice_mark_read on public.internal_notice_deliveries for update to authenticated using ((select public.is_hpsr_staff()) and doctor_id=(select auth.uid())) with check ((select public.is_hpsr_staff()) and doctor_id=(select auth.uid()));

create function hpsr_notice_private.candidates(p_audience text,p_filter text,p_search text,p_offset int)
returns table(id text,label text,detail text) language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno.' using errcode='42501';end if;
 if p_audience not in ('patients','doctors') or p_filter not in ('all','waiting_pediatrics','pediatrics_requests') then raise exception 'Filtro inválido.';end if;
 if p_audience='patients' then
 return query select p.passport,p.name,'Passaporte '||p.passport from public.patient_registry p
 where (p.name ilike '%'||left(coalesce(p_search,''),100)||'%' or p.passport ilike '%'||left(coalesce(p_search,''),100)||'%')
 and (p_filter='all' or exists(select 1 from public.appointments a where a.passport=p.passport and lower(btrim(a.payload->>'specialty')) in ('pediatria','pediatra')
 and (p_filter='pediatrics_requests' or lower(btrim(a.status)) not in ('arquivado','arquivada','cancelada','cancelado','recusada','recusado','rejeitada','rejeitado','concluída','concluído','concluida','concluido','finalizada','finalizado','atendida','atendido','encerrada','encerrado'))))
 order by p.name,p.passport limit 100 offset greatest(0,least(coalesce(p_offset,0),10000));
 else
 return query select p.id::text,p.name,p.role||case when coalesce(p.specialty,'')<>'' then ' · '||p.specialty else '' end from public.profiles p
 where p.access_status='Aprovado' and p.role in ('Médico Clínico','Médico Especialista','Médico Supervisor','Médico Plantonista','Médico Cirurgião','Diretor Clínico','Diretora','Vice Diretor','Vice Diretor / Dev')
 and (p.name ilike '%'||left(coalesce(p_search,''),100)||'%' or p.passport ilike '%'||left(coalesce(p_search,''),100)||'%')
 order by p.name,p.id limit 100 offset greatest(0,least(coalesce(p_offset,0),10000));
 end if;
end;$$;
create function public.hpsr_notice_candidates(p_audience text,p_filter text default 'all',p_search text default '',p_offset int default 0)
returns table(id text,label text,detail text) language sql stable security invoker set search_path='' as $$select * from hpsr_notice_private.candidates(p_audience,p_filter,p_search,p_offset)$$;

create function hpsr_notice_private.send(p_request uuid,p_audience text,p_title text,p_body text,p_targets text[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare target_ids text[]; snapshots jsonb; found_count int; ref uuid; existing public.internal_notices%rowtype; actor text; title_text text:=btrim(p_title); body_text text:=btrim(p_body);
begin
 if auth.uid() is null or not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno.' using errcode='42501';end if;
 if p_request is null or p_audience not in ('patients','doctors') or length(coalesce(title_text,'')) not between 3 and 120 or length(coalesce(body_text,'')) not between 5 and 3000 then raise exception 'Informe público, título e mensagem válidos.' using errcode='22023';end if;
 select array_agg(id order by id) into target_ids from(select distinct case when p_audience='patients' then upper(btrim(v)) else lower(btrim(v)) end id from unnest(p_targets) v where btrim(v)<>'') s;
 if coalesce(cardinality(target_ids),0) not between 1 and 500 then raise exception 'Selecione de 1 a 500 destinatários.' using errcode='22023';end if;
 -- The same reviewed submission can be retried without a second delivery.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request::text,0));
 select * into existing from public.internal_notices where created_by=auth.uid() and request_id=p_request;
 if found then
  if existing.audience<>p_audience or existing.title<>title_text or existing.body<>body_text or (select array_agg(value->>'id' order by value->>'id') from jsonb_array_elements(existing.recipients)) is distinct from target_ids then raise exception 'Identificação do envio já utilizada para outro conteúdo.' using errcode='22023';end if;
  return jsonb_build_object('id',existing.id,'count',jsonb_array_length(existing.recipients),'already_sent',true);
 end if;
 if p_audience='patients' then
 select count(*),jsonb_agg(jsonb_build_object('id',p.passport,'label',p.name) order by p.passport) into found_count,snapshots from public.patient_registry p where p.passport=any(target_ids);
 else
 select count(*),jsonb_agg(jsonb_build_object('id',p.id::text,'label',p.name) order by p.id::text) into found_count,snapshots from public.profiles p where p.id::text=any(target_ids) and p.access_status='Aprovado' and p.role in ('Médico Clínico','Médico Especialista','Médico Supervisor','Médico Plantonista','Médico Cirurgião','Diretor Clínico','Diretora','Vice Diretor','Vice Diretor / Dev');
 end if;
 if found_count<>cardinality(target_ids) then raise exception 'Algum destinatário não está mais disponível. Revise a seleção.' using errcode='22023';end if;
 select p.name into actor from public.profiles p where p.id=auth.uid();
 insert into public.internal_notices(request_id,created_by,sender_name,audience,title,body,recipients) values(p_request,auth.uid(),actor,p_audience,title_text,body_text,snapshots) returning id into ref;
 if p_audience='patients' then insert into public.internal_notice_deliveries(notice_id,patient_passport) select ref,unnest(target_ids);
 else insert into public.internal_notice_deliveries(notice_id,doctor_id) select ref,id::uuid from unnest(target_ids) id;end if;
 insert into public.system_activities(id,module,action,description,actor,reference) values('HPSR-NOTICE-'||ref::text,'Interno','Comunicado enviado',title_text||' · '||found_count::text||' destinatários · '||p_audience,actor,ref::text);
 return jsonb_build_object('id',ref,'count',found_count,'already_sent',false);
end;$$;
create function public.hpsr_send_notice(p_request uuid,p_audience text,p_title text,p_body text,p_targets text[]) returns jsonb language sql security invoker set search_path='' as $$select hpsr_notice_private.send(p_request,p_audience,p_title,p_body,p_targets)$$;

create function hpsr_notice_private.inbox() returns table(id uuid,title text,body text,sender_name text,created_at timestamptz,read_at timestamptz) language sql stable security definer set search_path='' as $$
 select d.id,n.title,n.body,n.sender_name,n.created_at,d.read_at from public.internal_notice_deliveries d join public.internal_notices n on n.id=d.notice_id
 where auth.uid() is not null and public.is_hpsr_staff() and d.doctor_id=auth.uid() order by n.created_at desc limit 100;
$$;
create function public.hpsr_notice_inbox() returns table(id uuid,title text,body text,sender_name text,created_at timestamptz,read_at timestamptz) language sql stable security invoker set search_path='' as $$select * from hpsr_notice_private.inbox()$$;
revoke all on all functions in schema hpsr_notice_private from public,anon;
grant execute on all functions in schema hpsr_notice_private to authenticated;
revoke all on function public.hpsr_notice_candidates(text,text,text,int),public.hpsr_send_notice(uuid,text,text,text,text[]),public.hpsr_notice_inbox() from public,anon;
grant execute on function public.hpsr_notice_candidates(text,text,text,int),public.hpsr_send_notice(uuid,text,text,text,text[]),public.hpsr_notice_inbox() to authenticated;
