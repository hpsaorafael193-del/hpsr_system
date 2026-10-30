alter table public.pediatric_followups add column frequency text not null default 'quinzenal' check(frequency in ('semanal','quinzenal','mensal','personalizado'));
grant insert(frequency),update(frequency) on public.pediatric_followups to authenticated;
create table public.pediatric_plan_publications(
 id uuid primary key default gen_random_uuid(),plan_id uuid not null references public.pediatric_followups(id),
 patient_passport text not null references public.patient_registry(passport),doctor_id uuid not null references public.profiles(id),
 visit_id text, snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),published boolean not null default true,
 published_at timestamptz not null default now(),published_by uuid not null references public.profiles(id)
);
create index pediatric_publication_patient_idx on public.pediatric_plan_publications(patient_passport,published,published_at desc);
create index pediatric_publication_plan_idx on public.pediatric_plan_publications(plan_id);
alter table public.pediatric_plan_publications enable row level security;
revoke all on public.pediatric_plan_publications from public,anon,authenticated;
grant select,insert on public.pediatric_plan_publications to authenticated;
grant update(published) on public.pediatric_plan_publications to authenticated;
grant all on public.pediatric_plan_publications to service_role;
create policy pediatric_publication_read on public.pediatric_plan_publications for select to authenticated using(public.hpsr_pediatric_access() and (doctor_id=(select auth.uid()) or public.hpsr_pediatric_write(doctor_id,patient_passport)));
create policy pediatric_publication_insert on public.pediatric_plan_publications for insert to authenticated with check(published_by=(select auth.uid()) and exists(select 1 from public.pediatric_followups p where p.id=plan_id and p.patient_passport=pediatric_plan_publications.patient_passport and p.doctor_id=pediatric_plan_publications.doctor_id and public.hpsr_pediatric_write(p.doctor_id,p.patient_passport)));
create policy pediatric_publication_update on public.pediatric_plan_publications for update to authenticated using(public.hpsr_pediatric_write(doctor_id,patient_passport)) with check(public.hpsr_pediatric_write(doctor_id,patient_passport));
create function public.hpsr_publish_pediatric_plan(p_plan uuid,p_expected timestamptz,p_visit text default null) returns uuid language plpgsql security invoker set search_path='' as $$
declare p public.pediatric_followups; v jsonb; visits jsonb:='[]'; result uuid;
begin
 select * into p from public.pediatric_followups where id=p_plan for update;
 if not found or not public.hpsr_pediatric_write(p.doctor_id,p.patient_passport) then raise exception 'Sem autorização para publicar este planejamento.' using errcode='42501';end if;
 if p_expected is null or p.updated_at<>p_expected then raise exception 'O planejamento foi alterado. Atualize antes de publicar.';end if;
 for v in select value from jsonb_array_elements(p.consultations) loop
  if p_visit is null or v->>'id'=p_visit then
   visits:=visits||jsonb_build_array(jsonb_build_object('id',v->>'id','kind',coalesce(v->>'kind','consultation'),'date',v->>'date','title',v->>'title','planned',v->>'planned','exams',coalesce(v->>'exams',''),'vaccines',coalesce(v->>'vaccines',''),'instructions',coalesce(v->>'instructions',''),'observations',coalesce(v->>'observations','')));
  end if;
 end loop;
 if jsonb_array_length(visits)=0 then raise exception 'Nenhum atendimento selecionado.';end if;
 update public.pediatric_plan_publications set published=false where plan_id=p.id and visit_id is not distinct from p_visit and published;
 insert into public.pediatric_plan_publications(plan_id,patient_passport,doctor_id,visit_id,snapshot,published_by)
 values(p.id,p.patient_passport,p.doctor_id,p_visit,jsonb_build_object('version',1,'patient',p.patient_name,'passport',p.patient_passport,'doctor',p.doctor_name,'title',p.title,'frequency',p.frequency,'visits',visits),auth.uid()) returning id into result;
 return result;
end;$$;
revoke all on function public.hpsr_publish_pediatric_plan(uuid,timestamptz,text) from public,anon;
grant execute on function public.hpsr_publish_pediatric_plan(uuid,timestamptz,text) to authenticated;
