-- Isolated pediatric records; existing reproductive plans and vaccines are unchanged.
create function public.hpsr_pediatric_access() returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.access_status='Aprovado' and (
 p.role in ('Diretora','Vice Diretor','Vice Diretor / Dev') or
 (p.role in ('Médico Especialista','Médico Supervisor','Médico Plantonista','Médico Cirurgião','Diretor Clínico') and p.specialty ~* '(^|[,;|\n])\s*(pediatria|pediatra)\s*([,;|\n]|$)')));
$$;
create function public.hpsr_pediatric_write(p_doctor uuid,p_passport text) returns boolean language sql stable security invoker set search_path='' as $$
 select public.hpsr_pediatric_access() and (
 exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.access_status='Aprovado' and p.role='Vice Diretor / Dev')
 or (p_doctor=(select auth.uid()) and exists(select 1 from public.patient_doctor_links l where l.doctor_id=p_doctor and l.patient_passport=p_passport and lower(btrim(l.specialty)) in ('pediatria','pediatra'))));
$$;
revoke all on function public.hpsr_pediatric_access(),public.hpsr_pediatric_write(uuid,text) from public,anon;
grant execute on function public.hpsr_pediatric_access(),public.hpsr_pediatric_write(uuid,text) to authenticated;
create table public.pediatric_followups(
 id uuid primary key default gen_random_uuid(), patient_passport text not null references public.patient_registry(passport),
 doctor_id uuid not null references public.profiles(id), doctor_name text not null default '',patient_name text not null default '',
 guardian_link_id uuid references public.patient_guardian_links(id),title text not null default 'Acompanhamento de rotina',
 start_date date not null,next_return date,notes text not null default '',status text not null default 'ativo' check(status in ('ativo','concluido')),
 consultations jsonb not null default '[]'::jsonb check(jsonb_typeof(consultations)='array' and jsonb_array_length(consultations) between 1 and 500),
 revisions jsonb not null default '[]'::jsonb,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 updated_by uuid references public.profiles(id),updated_by_name text not null default ''
);
create index pediatric_followups_patient_idx on public.pediatric_followups(patient_passport);
create index pediatric_followups_doctor_idx on public.pediatric_followups(doctor_id);
create index pediatric_followups_guardian_idx on public.pediatric_followups(guardian_link_id);
create unique index pediatric_followups_active_unique on public.pediatric_followups(patient_passport,doctor_id) where status='ativo';
alter table public.pediatric_followups enable row level security;
revoke all on public.pediatric_followups from public,anon,authenticated;
grant select on public.pediatric_followups to authenticated;
grant insert(patient_passport,doctor_id,guardian_link_id,title,start_date,next_return,notes,status,consultations) on public.pediatric_followups to authenticated;
grant update(guardian_link_id,title,start_date,next_return,notes,status,consultations) on public.pediatric_followups to authenticated;
grant all on public.pediatric_followups to service_role;
create policy pediatric_read on public.pediatric_followups for select to authenticated using (
 (select public.hpsr_pediatric_access()) and (doctor_id=(select auth.uid()) or exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('Diretora','Vice Diretor','Vice Diretor / Dev') and p.access_status='Aprovado')));
create policy pediatric_insert on public.pediatric_followups for insert to authenticated with check(doctor_id=(select auth.uid()) and public.hpsr_pediatric_write(doctor_id,patient_passport));
create policy pediatric_update on public.pediatric_followups for update to authenticated using(public.hpsr_pediatric_write(doctor_id,patient_passport)) with check(public.hpsr_pediatric_write(doctor_id,patient_passport));
create function public.hpsr_pediatric_preserve_record() returns trigger language plpgsql security invoker set search_path='' as $$
declare actor text; item jsonb; original jsonb; rewritten jsonb:='[]'::jsonb; ids text[]:='{}'; dates text[]:='{}';
begin
 if auth.uid() is null or not public.hpsr_pediatric_write(new.doctor_id,new.patient_passport) then raise exception 'Acompanhamento pediátrico sem autorização de edição.' using errcode='42501'; end if;
 if tg_op='UPDATE' and (new.doctor_id<>old.doctor_id or new.patient_passport<>old.patient_passport) then raise exception 'O responsável e a criança devem ser preservados.'; end if;
 if new.guardian_link_id is not null and not exists(select 1 from public.patient_guardian_links g where g.id=new.guardian_link_id and g.child_passport=new.patient_passport and g.access_status='authorized') then raise exception 'Responsável não autorizado para esta criança.'; end if;
 select p.name into actor from public.profiles p where p.id=auth.uid();
 if tg_op='INSERT' then
  select p.name into new.doctor_name from public.profiles p where p.id=new.doctor_id;
  select p.name into new.patient_name from public.patient_registry p where p.passport=new.patient_passport;
  new.revisions:='[]';
 else
  new.doctor_name:=old.doctor_name;new.patient_name:=old.patient_name;
  new.revisions:=old.revisions || jsonb_build_array(jsonb_build_object('at',old.updated_at,'by',old.updated_by_name,'snapshot',to_jsonb(old)-'revisions'));
 end if;
 for item in select value from jsonb_array_elements(new.consultations) loop
  if jsonb_typeof(item)<>'object' or coalesce(item->>'id','')='' or coalesce(item->>'date','')!~'^\d{4}-\d{2}-\d{2}$' or coalesce(item->>'status','') not in ('prevista','realizada') then raise exception 'Consulta pediátrica inválida.';end if;
  if item->>'id'=any(ids) or item->>'date'=any(dates) then raise exception 'Consultas repetidas ou na mesma data.';end if;
  if (item->>'date')::date<new.start_date then raise exception 'Consulta anterior ao início do acompanhamento.';end if;
  if item->>'status'='realizada' then
   if coalesce(item->>'actual_date','')!~'^\d{4}-\d{2}-\d{2}$' then raise exception 'Informe a data do atendimento.';end if;
   perform (item->>'actual_date')::date;
   if btrim(coalesce(item->>'health','')||coalesce(item->>'growth','')||coalesce(item->>'routine','')||coalesce(item->>'development','')||coalesce(item->>'prevention','')||coalesce(item->>'conduct',''))='' then raise exception 'Informe o registro da consulta realizada.';end if;
  end if;
  ids:=array_append(ids,item->>'id');dates:=array_append(dates,item->>'date');
  original:=null;
  if tg_op='UPDATE' then select value into original from jsonb_array_elements(old.consultations) where value->>'id'=item->>'id'; end if;
  if original is not null and (original-'author')=(item-'author') then item:=original;
  else item:=(item-'author')||jsonb_build_object('author',jsonb_build_object('id',auth.uid(),'name',actor,'at',clock_timestamp()));end if;
  rewritten:=rewritten||jsonb_build_array(item);
 end loop;
 new.consultations:=rewritten;new.updated_by:=auth.uid();new.updated_by_name:=actor;new.updated_at:=clock_timestamp();
 return new;
end;$$;
revoke all on function public.hpsr_pediatric_preserve_record() from public,anon,authenticated;
create trigger pediatric_preserve_record before insert or update on public.pediatric_followups for each row execute function public.hpsr_pediatric_preserve_record();
