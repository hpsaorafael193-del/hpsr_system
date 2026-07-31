-- Compatibilidade entre o novo acesso por especialidade e dados antigos.
-- Preserva liberações manuais já existentes e incorpora especialidades históricas
-- de planejamentos, ocorrências, consultas e vagas já reservadas.

create index if not exists idx_clinical_followup_plans_patient_specialty
  on public.clinical_followup_plans (patient_passport, specialty);

create index if not exists idx_appointments_passport_created_at
  on public.appointments (passport, created_at desc);

create or replace function public.hpsr_normalize_specialty(value text)
returns text
language sql
immutable
parallel safe
set search_path = public
as $$
  select case normalized
    when 'clinica geral' then 'clinico geral'
    when 'clinico' then 'clinico geral'
    when 'medico clinico' then 'clinico geral'
    when 'obstetricia' then 'obstetra'
    when 'obstetrica' then 'obstetra'
    when 'ginecologia e obstetricia' then 'obstetra'
    when 'ginecologista e obstetra' then 'obstetra'
    when 'pediatria' then 'pediatra'
    when 'psicologia' then 'psicologa'
    when 'psicologo' then 'psicologa'
    when 'psiquiatria' then 'psiquiatra'
    when 'cardiologista' then 'cardiologia'
    when 'dermatologista' then 'dermatologia'
    when 'ginecologista' then 'ginecologia'
    else normalized
  end
  from (
    select trim(regexp_replace(
      translate(lower(coalesce(value, '')),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'),
      '\s+', ' ', 'g')) as normalized
  ) source;
$$;

create or replace function public.patient_portal_allowed_specialties(target_passport text)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  with patient_key as (
    select upper(regexp_replace(trim(coalesce(target_passport, '')), '\s+', '', 'g')) as value
  ), sources as (
    select unnest(coalesce(p.portal_specialties, '{}'::text[])) as specialty
      from public.patient_registry p, patient_key k
     where p.passport = k.value
    union all
    select fp.specialty
      from public.clinical_followup_plans fp, patient_key k
     where fp.patient_passport = k.value
    union all
    select fo.specialty
      from public.clinical_followup_occurrences fo, patient_key k
     where fo.patient_passport = k.value
    union all
    select a.payload->>'specialty'
      from public.appointments a, patient_key k
     where a.passport = k.value
    union all
    select s.specialty
      from public.clinical_appointment_slots s, patient_key k
     where s.patient_passport = k.value
  ), tokens as (
    select trim(token) as specialty
      from sources
      cross join lateral regexp_split_to_table(coalesce(sources.specialty, ''), '[,;/|]+') token
     where trim(token) <> ''
  )
  select coalesce(array_agg(specialty order by specialty), '{}'::text[])
    from (
      select distinct on (public.hpsr_normalize_specialty(specialty)) specialty
        from tokens
       where public.hpsr_normalize_specialty(specialty) <> ''
       order by public.hpsr_normalize_specialty(specialty), specialty
    ) distinct_specialties;
$$;

comment on function public.patient_portal_allowed_specialties(text) is
  'Retorna especialidades liberadas manualmente e especialidades históricas do paciente para compatibilidade com agendas antigas.';

-- Backfill único e set-based: cada origem histórica é percorrida uma vez.
with source_rows as (
  select p.passport as passport_key, value as specialty
    from public.patient_registry p
    cross join lateral unnest(coalesce(p.portal_specialties, '{}'::text[])) value
  union all
  select fp.patient_passport, fp.specialty from public.clinical_followup_plans fp
  union all
  select fo.patient_passport, fo.specialty from public.clinical_followup_occurrences fo
  union all
  select a.passport, a.payload->>'specialty' from public.appointments a
  union all
  select s.patient_passport, s.specialty
    from public.clinical_appointment_slots s
   where s.patient_passport is not null
), tokens as (
  select upper(regexp_replace(trim(passport_key), '\s+', '', 'g')) as passport_key,
         trim(token) as specialty
    from source_rows
    cross join lateral regexp_split_to_table(coalesce(source_rows.specialty, ''), '[,;/|]+') token
   where trim(coalesce(passport_key, '')) <> ''
     and trim(token) <> ''
), distinct_tokens as (
  select distinct on (passport_key, public.hpsr_normalize_specialty(specialty))
         passport_key, specialty
    from tokens
   where public.hpsr_normalize_specialty(specialty) <> ''
   order by passport_key, public.hpsr_normalize_specialty(specialty), specialty
), aggregated as (
  select passport_key, array_agg(specialty order by specialty) as specialties
    from distinct_tokens
   group by passport_key
)
update public.patient_registry p
   set portal_specialties = aggregated.specialties,
       updated_at = now()
  from aggregated
 where p.passport = aggregated.passport_key
   and aggregated.specialties is distinct from p.portal_specialties;

create or replace function public.patient_portal_available_slots(
  target_passport text,
  cutoff_at timestamptz,
  max_rows integer default 300
)
returns table (
  id uuid,
  doctor_id uuid,
  doctor_name text,
  specialty text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with allowed as (
    select public.hpsr_normalize_specialty(value) as specialty
      from unnest(public.patient_portal_allowed_specialties(target_passport)) value
     where public.hpsr_normalize_specialty(value) <> ''
  )
  select s.id, s.doctor_id, s.doctor_name, s.specialty, s.starts_at, s.ends_at, s.status
    from public.clinical_appointment_slots s
   where s.status = 'Disponível'
     and s.starts_at > cutoff_at
     and exists (
       select 1
         from regexp_split_to_table(coalesce(s.specialty, ''), '[,;/|]+') slot_token
         join allowed a
           on public.hpsr_normalize_specialty(slot_token) = a.specialty
           or public.hpsr_normalize_specialty(slot_token) like '%' || a.specialty || '%'
           or a.specialty like '%' || public.hpsr_normalize_specialty(slot_token) || '%'
     )
   order by s.starts_at asc, s.doctor_name asc
   limit least(greatest(coalesce(max_rows, 300), 1), 500);
$$;

comment on function public.patient_portal_available_slots(text, timestamptz, integer) is
  'Retorna em uma única consulta as vagas compatíveis com as especialidades atuais ou históricas do paciente.';

revoke all on function public.patient_portal_allowed_specialties(text) from public, anon;
revoke all on function public.patient_portal_available_slots(text, timestamptz, integer) from public, anon;
grant execute on function public.patient_portal_allowed_specialties(text) to authenticated, service_role;
grant execute on function public.patient_portal_available_slots(text, timestamptz, integer) to authenticated, service_role;
