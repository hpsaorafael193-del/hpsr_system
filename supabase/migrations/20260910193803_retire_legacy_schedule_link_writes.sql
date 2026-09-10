-- Mudança 5 — RPCs legadas de vínculo deixam de usar schedule_assignments.
-- A listagem permanece como compatibilidade de leitura; a escrita antiga é desativada
-- para impedir bypass do histórico e da nova fonte de verdade.

create or replace function public.list_patient_schedule_links()
returns table(
  patient_passport text,
  patient_name text,
  doctor_id text,
  doctor_name text,
  specialty text,
  has_schedule_link boolean,
  active_plan_count integer,
  portal_access boolean
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with allowed as (
    select public.is_hpsr_internal_link_manager() ok
  ),
  access_flags as (
    select
      public.hpsr_normalize_passport(pa.patient_passport) as patient_passport,
      bool_or(coalesce(pa.access_enabled, true)) as portal_access
    from public.patient_portal_access pa
    group by public.hpsr_normalize_passport(pa.patient_passport)
  ),
  link_rows as (
    select
      public.hpsr_normalize_passport(l.patient_passport) as patient_passport,
      l.doctor_id::text as doctor_id,
      coalesce(nullif(trim(p.name), ''), 'Médico responsável') as doctor_name,
      trim(l.specialty) as specialty,
      true as has_schedule_link,
      coalesce(af.portal_access, false) as portal_access
    from public.patient_doctor_links l
    left join public.profiles p on p.id = l.doctor_id
    left join access_flags af
      on af.patient_passport = public.hpsr_normalize_passport(l.patient_passport)
    cross join allowed
    where allowed.ok
      and trim(coalesce(l.specialty, '')) <> ''
  ),
  plan_rows as (
    select
      public.hpsr_normalize_passport(fp.patient_passport) as patient_passport,
      fp.doctor_id::text as doctor_id,
      coalesce(nullif(trim(fp.doctor_name), ''), p.name, 'Médico responsável') as doctor_name,
      trim(coalesce(fp.specialty, '')) as specialty,
      count(*)::integer as active_plan_count,
      coalesce(af.portal_access, false) as portal_access
    from public.clinical_followup_plans fp
    left join public.profiles p on p.id = fp.doctor_id
    left join access_flags af
      on af.patient_passport = public.hpsr_normalize_passport(fp.patient_passport)
    cross join allowed
    where allowed.ok
      and coalesce(fp.status, 'Ativo') <> 'Arquivado'
      and fp.doctor_id is not null
      and trim(coalesce(fp.specialty, '')) <> ''
    group by
      public.hpsr_normalize_passport(fp.patient_passport),
      fp.doctor_id,
      fp.doctor_name,
      p.name,
      trim(coalesce(fp.specialty, '')),
      af.portal_access
  ),
  keys as (
    select patient_passport, doctor_id, public.hpsr_normalize_specialty(specialty) as specialty_key
      from link_rows
    union
    select patient_passport, doctor_id, public.hpsr_normalize_specialty(specialty) as specialty_key
      from plan_rows
  )
  select
    k.patient_passport,
    coalesce(nullif(trim(pr.name), ''), 'Paciente') as patient_name,
    k.doctor_id,
    coalesce(lr.doctor_name, pl.doctor_name, dp.name, 'Médico responsável') as doctor_name,
    coalesce(lr.specialty, pl.specialty, '') as specialty,
    (lr.patient_passport is not null) as has_schedule_link,
    coalesce(pl.active_plan_count, 0) as active_plan_count,
    coalesce(lr.portal_access, pl.portal_access, false) as portal_access
  from keys k
  left join link_rows lr
    on lr.patient_passport = k.patient_passport
   and lr.doctor_id = k.doctor_id
   and public.hpsr_normalize_specialty(lr.specialty) = k.specialty_key
  left join plan_rows pl
    on pl.patient_passport = k.patient_passport
   and pl.doctor_id = k.doctor_id
   and public.hpsr_normalize_specialty(pl.specialty) = k.specialty_key
  left join public.patient_registry pr
    on public.hpsr_normalize_passport(pr.passport) = k.patient_passport
  left join public.profiles dp
    on dp.id::text = k.doctor_id
  order by
    coalesce(nullif(trim(pr.name), ''), k.patient_passport),
    coalesce(lr.doctor_name, pl.doctor_name, dp.name),
    coalesce(lr.specialty, pl.specialty);
$function$;

revoke all on function public.list_patient_schedule_links() from public, anon;
grant execute on function public.list_patient_schedule_links() to authenticated, service_role;

create or replace function public.set_patient_schedule_link(
  target_passport text,
  target_doctor_id uuid,
  target_doctor_name text,
  target_specialty text,
  target_enabled boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Sessão não encontrada';
  end if;

  if not public.is_hpsr_internal_link_manager() then
    raise exception 'Sem permissão para gerenciar vínculos';
  end if;

  return jsonb_build_object(
    'ok', false,
    'code', 'LEGACY_LINK_FLOW_RETIRED',
    'linked', null,
    'verified', true,
    'link_source', 'patient_doctor_links',
    'error', 'Este fluxo antigo foi desativado. Crie, corrija, transfira ou encerre vínculos em Meus Pacientes.'
  );
end;
$function$;

revoke all on function public.set_patient_schedule_link(text, uuid, text, text, boolean) from public, anon;
grant execute on function public.set_patient_schedule_link(text, uuid, text, text, boolean) to authenticated, service_role;

comment on function public.list_patient_schedule_links() is
  'Compatibilidade de leitura baseada em patient_doctor_links. Planos aparecem apenas como contexto clínico.';
comment on function public.set_patient_schedule_link(text, uuid, text, text, boolean) is
  'Fluxo legado de escrita desativado na Mudança 5 para impedir bypass de patient_doctor_links e do histórico.';
