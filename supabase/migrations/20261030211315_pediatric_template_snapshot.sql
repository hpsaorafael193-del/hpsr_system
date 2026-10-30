alter table public.pediatric_followups add column publication_notes text not null default '' check(length(publication_notes)<=8000);
grant insert(publication_notes),update(publication_notes) on public.pediatric_followups to authenticated;
-- One server-side allowlist shared by preview and publication. No clinical notes or images.
create function public.hpsr_preview_pediatric_plan(p_plan uuid,p_visit text default null) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare p public.pediatric_followups; v jsonb; visits jsonb:='[]'; age_value text; guardian_value text;
begin
 select * into p from public.pediatric_followups where id=p_plan;
 if not found or not public.hpsr_pediatric_access() then raise exception 'Sem autorização para consultar este planejamento.' using errcode='42501';end if;
 select age into age_value from public.patient_registry where passport=p.patient_passport;
 select coalesce(nullif(g.guardian_name,''),r.name,'') into guardian_value from public.patient_guardian_links g left join public.patient_registry r on r.passport=g.guardian_passport where g.id=p.guardian_link_id and g.child_passport=p.patient_passport and g.access_status='authorized';
 for v in select value from jsonb_array_elements(p.consultations) loop
  if (p_visit is not null and v->>'id'=p_visit) or (p_visit is null and coalesce(v->>'kind','consultation')<>'guardian_return') then
   visits:=visits||jsonb_build_array(jsonb_build_object('id',v->>'id','kind',coalesce(v->>'kind','consultation'),'date',v->>'date','title',v->>'title','planned',v->>'planned','exams',coalesce(v->>'exams',''),'vaccines',coalesce(v->>'vaccines',''),'instructions',coalesce(v->>'instructions',''),'observations',coalesce(v->>'observations','')));
  end if;
 end loop;
 if jsonb_array_length(visits)=0 then raise exception 'Nenhum atendimento selecionado.';end if;
 return jsonb_build_object('version',2,'template','pediatric-v1','mode',case when p_visit is null then 'integral' else 'individual' end,'patient',p.patient_name,'passport',p.patient_passport,'age',coalesce(age_value,''),'guardian',coalesce(guardian_value,''),'doctor',p.doctor_name,'title',p.title,'frequency',p.frequency,'observations',p.publication_notes,'visits',visits);
end;$$;
revoke all on function public.hpsr_preview_pediatric_plan(uuid,text) from public,anon;
grant execute on function public.hpsr_preview_pediatric_plan(uuid,text) to authenticated;
create function public.hpsr_publish_pediatric_plan_v2(p_plan uuid,p_expected timestamptz,p_visit text,p_snapshot jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare p public.pediatric_followups; frozen jsonb; result uuid;
begin
 select * into p from public.pediatric_followups where id=p_plan for update;
 if not found or not public.hpsr_pediatric_write(p.doctor_id,p.patient_passport) then raise exception 'Sem autorização para publicar este planejamento.' using errcode='42501';end if;
 if p_expected is null or p.updated_at<>p_expected then raise exception 'O planejamento foi alterado. Atualize antes de publicar.';end if;
 frozen:=public.hpsr_preview_pediatric_plan(p_plan,p_visit);
 if p_snapshot is null or frozen<>p_snapshot then raise exception 'Os dados foram alterados. Gere uma nova prévia antes de publicar.';end if;
 update public.pediatric_plan_publications set published=false where plan_id=p.id and visit_id is not distinct from p_visit and published;
 insert into public.pediatric_plan_publications(plan_id,patient_passport,doctor_id,visit_id,snapshot,published_by) values(p.id,p.patient_passport,p.doctor_id,p_visit,frozen,auth.uid()) returning id into result;
 return result;
end;$$;
revoke all on function public.hpsr_publish_pediatric_plan_v2(uuid,timestamptz,text,jsonb) from public,anon;
grant execute on function public.hpsr_publish_pediatric_plan_v2(uuid,timestamptz,text,jsonb) to authenticated;
