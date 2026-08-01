-- Triagem de novos cadastros reutilizando patient_registry e patient_portal_access.
-- Não cria uma estrutura clínica paralela: follow_up continua sendo a classificação
-- e portal_specialties continua preservando a compatibilidade das agendas antigas.

alter table public.patient_portal_access
  add column if not exists triage_status text not null default 'Classificado',
  add column if not exists schedule_assignments jsonb not null default '[]'::jsonb;

alter table public.patient_portal_access
  drop constraint if exists patient_portal_access_triage_status_valid;

alter table public.patient_portal_access
  add constraint patient_portal_access_triage_status_valid
  check (triage_status in ('Pendente', 'Classificado'));

alter table public.patient_portal_access
  drop constraint if exists patient_portal_access_schedule_assignments_array;

alter table public.patient_portal_access
  add constraint patient_portal_access_schedule_assignments_array
  check (jsonb_typeof(schedule_assignments) = 'array');

create index if not exists idx_patient_portal_access_pending_triage
  on public.patient_portal_access (created_at desc)
  where triage_status = 'Pendente';

comment on column public.patient_portal_access.triage_status is
  'Indica se o novo cadastro realizado no Portal do Paciente já foi revisado pela equipe.';

comment on column public.patient_portal_access.schedule_assignments is
  'Vínculos leves de agenda no formato doctor_id, doctor_name e specialty. Reutiliza o acesso existente do portal.';

create or replace function public.classify_patient_portal_access(
  target_passport text,
  target_classification text,
  target_specialties text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  passport_key text := upper(regexp_replace(trim(coalesce(target_passport, '')), '\s+', '', 'g'));
  normalized_classification text := lower(trim(coalesce(target_classification, '')));
  doctor_name_value text;
  cleaned_specialties text[];
  current_assignments jsonb;
  next_assignments jsonb;
  specialty_value text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if normalized_classification not in ('rotineiro', 'acompanhamento') then
    raise exception 'Invalid classification';
  end if;

  select coalesce(name, 'Médico') into doctor_name_value
    from public.profiles
   where id = auth.uid();

  select coalesce(array_agg(distinct trim(value)) filter (where trim(value) <> ''), '{}'::text[])
    into cleaned_specialties
    from unnest(coalesce(target_specialties, '{}'::text[])) value;

  if normalized_classification = 'acompanhamento' and cardinality(cleaned_specialties) = 0 then
    raise exception 'At least one specialty is required';
  end if;

  select coalesce(schedule_assignments, '[]'::jsonb)
    into current_assignments
    from public.patient_portal_access
   where patient_passport = passport_key
   for update;

  if not found then
    raise exception 'Patient portal access not found';
  end if;

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into next_assignments
    from jsonb_array_elements(current_assignments) item
   where coalesce(item->>'doctor_id', '') <> auth.uid()::text;

  if normalized_classification = 'acompanhamento' then
    foreach specialty_value in array cleaned_specialties loop
      next_assignments := next_assignments || jsonb_build_array(jsonb_build_object(
        'doctor_id', auth.uid()::text,
        'doctor_name', coalesce(doctor_name_value, 'Médico'),
        'specialty', specialty_value
      ));
    end loop;
  end if;

  update public.patient_registry
     set follow_up = case when jsonb_array_length(next_assignments) > 0 then 'Especializado' else 'Rotina' end,
         portal_specialties = case
           when normalized_classification = 'acompanhamento' then (
             select coalesce(array_agg(distinct specialty order by specialty), '{}'::text[])
               from unnest(coalesce(portal_specialties, '{}'::text[]) || cleaned_specialties) specialty
              where trim(specialty) <> ''
           )
           else portal_specialties
         end,
         updated_at = now()
   where passport = passport_key;

  update public.patient_portal_access
     set triage_status = 'Classificado',
         schedule_assignments = next_assignments,
         updated_at = now()
   where patient_passport = passport_key;

  return jsonb_build_object(
    'passport', passport_key,
    'classification', normalized_classification,
    'assignments', next_assignments
  );
end;
$$;

revoke all on function public.classify_patient_portal_access(text, text, text[]) from public, anon;
grant execute on function public.classify_patient_portal_access(text, text, text[]) to authenticated;

create or replace function public.patient_portal_slot_allowed(
  target_passport text,
  target_doctor_id uuid,
  target_specialty text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with access_data as (
    select coalesce(schedule_assignments, '[]'::jsonb) assignments
      from public.patient_portal_access
     where patient_passport = upper(regexp_replace(trim(coalesce(target_passport, '')), '\s+', '', 'g'))
  ), explicit_access as (
    select item
      from access_data, jsonb_array_elements(assignments) item
  )
  select case
    when exists (select 1 from explicit_access) then exists (
      select 1
        from explicit_access
       where item->>'doctor_id' = target_doctor_id::text
         and (
           public.hpsr_normalize_specialty(item->>'specialty') = public.hpsr_normalize_specialty(target_specialty)
           or public.hpsr_normalize_specialty(item->>'specialty') like '%' || public.hpsr_normalize_specialty(target_specialty) || '%'
           or public.hpsr_normalize_specialty(target_specialty) like '%' || public.hpsr_normalize_specialty(item->>'specialty') || '%'
         )
    )
    else exists (
      select 1
        from unnest(public.patient_portal_allowed_specialties(target_passport)) allowed
       where public.hpsr_normalize_specialty(allowed) = public.hpsr_normalize_specialty(target_specialty)
          or public.hpsr_normalize_specialty(allowed) like '%' || public.hpsr_normalize_specialty(target_specialty) || '%'
          or public.hpsr_normalize_specialty(target_specialty) like '%' || public.hpsr_normalize_specialty(allowed) || '%'
    )
  end;
$$;

revoke all on function public.patient_portal_slot_allowed(text, uuid, text) from public, anon;
grant execute on function public.patient_portal_slot_allowed(text, uuid, text) to authenticated, service_role;

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
  with access_data as (
    select coalesce(schedule_assignments, '[]'::jsonb) assignments
      from public.patient_portal_access
     where patient_passport = upper(regexp_replace(trim(coalesce(target_passport, '')), '\s+', '', 'g'))
  ), explicit_access as (
    select item->>'doctor_id' doctor_id,
           public.hpsr_normalize_specialty(item->>'specialty') specialty
      from access_data, jsonb_array_elements(assignments) item
     where coalesce(item->>'doctor_id', '') <> ''
       and public.hpsr_normalize_specialty(item->>'specialty') <> ''
  ), access_mode as (
    select exists(select 1 from explicit_access) has_explicit
  ), fallback_allowed as (
    select public.hpsr_normalize_specialty(value) specialty
      from unnest(public.patient_portal_allowed_specialties(target_passport)) value
     where public.hpsr_normalize_specialty(value) <> ''
  )
  select s.id, s.doctor_id, s.doctor_name, s.specialty, s.starts_at, s.ends_at, s.status
    from public.clinical_appointment_slots s
    cross join access_mode mode
   where s.status = 'Disponível'
     and s.starts_at > cutoff_at
     and (
       (mode.has_explicit and exists (
         select 1
           from explicit_access access
          where access.doctor_id = s.doctor_id::text
            and (
              access.specialty = public.hpsr_normalize_specialty(s.specialty)
              or access.specialty like '%' || public.hpsr_normalize_specialty(s.specialty) || '%'
              or public.hpsr_normalize_specialty(s.specialty) like '%' || access.specialty || '%'
            )
       ))
       or
       (not mode.has_explicit and exists (
         select 1
           from fallback_allowed access
          where access.specialty = public.hpsr_normalize_specialty(s.specialty)
             or access.specialty like '%' || public.hpsr_normalize_specialty(s.specialty) || '%'
             or public.hpsr_normalize_specialty(s.specialty) like '%' || access.specialty || '%'
       ))
     )
   order by s.starts_at asc, s.doctor_name asc
   limit least(greatest(coalesce(max_rows, 300), 1), 500);
$$;

comment on function public.patient_portal_available_slots(text, timestamptz, integer) is
  'Prioriza vínculos explícitos de médico e especialidade; mantém a compatibilidade histórica quando o paciente ainda não possui vínculo explícito.';
