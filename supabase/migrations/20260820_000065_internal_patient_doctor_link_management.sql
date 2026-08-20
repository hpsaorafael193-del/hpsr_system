-- Gestão administrativa de vínculos paciente -> médico -> especialidade.
-- Não cria nova fonte de dados: apenas expõe, de forma consolidada, os vínculos
-- leves existentes em patient_portal_access.schedule_assignments e os planos
-- formais já existentes em clinical_followup_plans.

create or replace function public.list_patient_schedule_links()
returns table (
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
set search_path = public
as $$
  with allowed as (
    select public.is_hpsr_schedule_manager() as ok
  ), access_flags as (
    select
      public.hpsr_normalize_passport(pa.patient_passport) as patient_passport,
      bool_or(coalesce(pa.access_enabled, true)) as portal_access
    from public.patient_portal_access pa
    group by public.hpsr_normalize_passport(pa.patient_passport)
  ), assignment_rows as (
    select
      public.hpsr_normalize_passport(pa.patient_passport) as patient_passport,
      item->>'doctor_id' as doctor_id,
      coalesce(nullif(trim(item->>'doctor_name'), ''), p.name, 'Médico responsável') as doctor_name,
      trim(coalesce(item->>'specialty', '')) as specialty,
      true as has_schedule_link,
      coalesce(pa.access_enabled, true) as portal_access
    from public.patient_portal_access pa
    cross join lateral jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item
    left join public.profiles p on p.id::text = item->>'doctor_id'
    cross join allowed
    where allowed.ok
      and coalesce(pa.access_enabled, true)
      and coalesce(item->>'doctor_id', '') <> ''
      and trim(coalesce(item->>'specialty', '')) <> ''
  ), plan_rows as (
    select
      public.hpsr_normalize_passport(fp.patient_passport) as patient_passport,
      fp.doctor_id::text as doctor_id,
      coalesce(nullif(trim(fp.doctor_name), ''), p.name, 'Médico responsável') as doctor_name,
      trim(coalesce(fp.specialty, '')) as specialty,
      count(*)::integer as active_plan_count,
      coalesce(af.portal_access, false) as portal_access
    from public.clinical_followup_plans fp
    left join public.profiles p on p.id = fp.doctor_id
    left join access_flags af on af.patient_passport = public.hpsr_normalize_passport(fp.patient_passport)
    cross join allowed
    where allowed.ok
      and coalesce(fp.status, 'Ativo') <> 'Arquivado'
      and fp.doctor_id is not null
      and trim(coalesce(fp.specialty, '')) <> ''
    group by public.hpsr_normalize_passport(fp.patient_passport), fp.doctor_id, fp.doctor_name, p.name, trim(coalesce(fp.specialty, '')), af.portal_access
  ), keys as (
    select patient_passport, doctor_id, public.hpsr_normalize_specialty(specialty) specialty_key from assignment_rows
    union
    select patient_passport, doctor_id, public.hpsr_normalize_specialty(specialty) specialty_key from plan_rows
  )
  select
    k.patient_passport,
    coalesce(nullif(trim(pr.name), ''), 'Paciente') as patient_name,
    k.doctor_id,
    coalesce(ar.doctor_name, pl.doctor_name, dp.name, 'Médico responsável') as doctor_name,
    coalesce(ar.specialty, pl.specialty, '') as specialty,
    (ar.patient_passport is not null) as has_schedule_link,
    coalesce(pl.active_plan_count, 0) as active_plan_count,
    coalesce(ar.portal_access, pl.portal_access, false) as portal_access
  from keys k
  left join assignment_rows ar
    on ar.patient_passport = k.patient_passport
   and ar.doctor_id = k.doctor_id
   and public.hpsr_normalize_specialty(ar.specialty) = k.specialty_key
  left join plan_rows pl
    on pl.patient_passport = k.patient_passport
   and pl.doctor_id = k.doctor_id
   and public.hpsr_normalize_specialty(pl.specialty) = k.specialty_key
  left join public.patient_registry pr
    on public.hpsr_normalize_passport(pr.passport) = k.patient_passport
  left join public.profiles dp on dp.id::text = k.doctor_id
  order by coalesce(nullif(trim(pr.name), ''), k.patient_passport), coalesce(ar.doctor_name, pl.doctor_name, dp.name), coalesce(ar.specialty, pl.specialty);
$$;

revoke all on function public.list_patient_schedule_links() from public, anon;
grant execute on function public.list_patient_schedule_links() to authenticated, service_role;
comment on function public.list_patient_schedule_links() is
  'Lista de forma consolidada os vínculos administrativos de agenda e acompanhamentos formais para gestores autorizados, sem criar nova fonte persistente.';
