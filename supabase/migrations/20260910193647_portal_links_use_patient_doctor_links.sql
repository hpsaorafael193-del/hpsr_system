-- Mudança 5 — Portal e Agenda passam a usar patient_doctor_links como fonte de verdade.
-- schedule_assignments permanece apenas como dado legado até a limpeza final.

create or replace function public.patient_portal_slot_allowed(
  target_passport text,
  target_doctor_id uuid,
  target_specialty text
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
      from public.patient_doctor_links l
      join public.patient_portal_access pa
        on public.hpsr_normalize_passport(pa.patient_passport)
         = public.hpsr_normalize_passport(l.patient_passport)
     where public.hpsr_normalize_passport(l.patient_passport)
           = public.hpsr_normalize_passport(target_passport)
       and coalesce(pa.access_enabled, true)
       and l.doctor_id = target_doctor_id
       and public.hpsr_normalize_specialty(l.specialty)
           = public.hpsr_normalize_specialty(target_specialty)
  );
$function$;

revoke all on function public.patient_portal_slot_allowed(text, uuid, text) from public, anon;
grant execute on function public.patient_portal_slot_allowed(text, uuid, text) to authenticated, service_role;

create or replace function public.patient_portal_available_slots(
  target_passport text,
  cutoff_at timestamptz,
  max_rows integer default 300
)
returns table(
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
set search_path to 'public'
as $function$
  with active_links as (
    select
      l.doctor_id,
      public.hpsr_normalize_specialty(l.specialty) as specialty
    from public.patient_doctor_links l
    join public.patient_portal_access pa
      on public.hpsr_normalize_passport(pa.patient_passport)
       = public.hpsr_normalize_passport(l.patient_passport)
    where public.hpsr_normalize_passport(l.patient_passport)
          = public.hpsr_normalize_passport(target_passport)
      and coalesce(pa.access_enabled, true)
      and public.hpsr_normalize_specialty(l.specialty) <> ''
  )
  select s.id, s.doctor_id, s.doctor_name, s.specialty, s.starts_at, s.ends_at, s.status
    from public.clinical_appointment_slots s
   where s.status = 'Disponível'
     and s.starts_at > greatest(coalesce(cutoff_at, now()), now() + interval '24 hours')
     and exists (
       select 1
         from active_links l
        where l.doctor_id = s.doctor_id
          and l.specialty = public.hpsr_normalize_specialty(s.specialty)
     )
   order by s.starts_at asc, s.doctor_name asc
   limit least(greatest(coalesce(max_rows, 300), 1), 500);
$function$;

revoke all on function public.patient_portal_available_slots(text, timestamptz, integer) from public, anon;
grant execute on function public.patient_portal_available_slots(text, timestamptz, integer) to authenticated, service_role;

create or replace function public.classify_patient_portal_access(
  target_passport text,
  target_classification text,
  target_specialties text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  passport_key text := public.hpsr_normalize_passport(target_passport);
  normalized_classification text := lower(trim(coalesce(target_classification, '')));
  cleaned_specialties text[];
  current_links jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if normalized_classification not in ('rotineiro', 'acompanhamento') then
    raise exception 'Invalid classification';
  end if;

  select coalesce(array_agg(distinct trim(value)) filter (where trim(value) <> ''), '{}'::text[])
    into cleaned_specialties
    from unnest(coalesce(target_specialties, '{}'::text[])) value;

  if normalized_classification = 'acompanhamento' and cardinality(cleaned_specialties) = 0 then
    raise exception 'At least one specialty is required';
  end if;

  update public.patient_registry
     set follow_up = case when normalized_classification = 'acompanhamento' then 'Especializado' else 'Rotina' end,
         portal_specialties = case when normalized_classification = 'acompanhamento' then cleaned_specialties else '{}'::text[] end,
         updated_at = now()
   where public.hpsr_normalize_passport(passport) = passport_key;

  update public.patient_portal_access
     set triage_status = 'Classificado',
         updated_at = now()
   where public.hpsr_normalize_passport(patient_passport) = passport_key;

  if not found then
    raise exception 'Patient portal access not found';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'doctor_id', l.doctor_id::text,
        'doctor_name', coalesce(nullif(trim(p.name), ''), 'Médico responsável'),
        'specialty', l.specialty,
        'source', 'patient_doctor_links'
      )
      order by coalesce(p.name, ''), l.specialty
    ),
    '[]'::jsonb
  )
  into current_links
  from public.patient_doctor_links l
  left join public.profiles p on p.id = l.doctor_id
  where public.hpsr_normalize_passport(l.patient_passport) = passport_key;

  return jsonb_build_object(
    'passport', passport_key,
    'classification', normalized_classification,
    'assignments', current_links,
    'schedule_links_changed', false,
    'link_source', 'patient_doctor_links'
  );
end;
$function$;

revoke all on function public.classify_patient_portal_access(text, text, text[]) from public, anon;
grant execute on function public.classify_patient_portal_access(text, text, text[]) to authenticated, service_role;
