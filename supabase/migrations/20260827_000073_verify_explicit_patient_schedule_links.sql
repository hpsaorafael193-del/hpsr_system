-- Produção: migration 20260827224149 verify_explicit_patient_schedule_links
-- Vínculo explícito paciente + médico + especialidade é a fonte de verdade
-- para visibilidade da agenda no Portal do Paciente.

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
  v_passport text := public.hpsr_normalize_passport(target_passport);
  v_specialty text := trim(coalesce(target_specialty, ''));
  v_name text := trim(coalesce(target_doctor_name, ''));
  v_assignments jsonb := '[]'::jsonb;
  v_cleaned jsonb := '[]'::jsonb;
  v_persisted jsonb := '[]'::jsonb;
  v_access_enabled boolean := false;
  v_matches integer := 0;
  v_rows integer := 0;
begin
  if v_user is null then
    raise exception 'Sessão não encontrada';
  end if;

  if not public.is_hpsr_internal_link_manager() then
    raise exception 'Somente o Diretor Técnico / Dev pode gerenciar vínculos de agenda';
  end if;

  if v_passport = '' or target_doctor_id is null or v_specialty = '' then
    raise exception 'Paciente, médico e especialidade são obrigatórios';
  end if;

  select coalesce(schedule_assignments, '[]'::jsonb), coalesce(access_enabled, true)
    into v_assignments, v_access_enabled
    from public.patient_portal_access
   where public.hpsr_normalize_passport(patient_passport) = v_passport
   for update;

  if not found then
    raise exception 'Paciente sem acesso ao Portal do Paciente';
  end if;

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into v_cleaned
    from jsonb_array_elements(v_assignments) item
   where coalesce(item->>'doctor_id', '') <> target_doctor_id::text
      or public.hpsr_normalize_specialty(item->>'specialty') <> public.hpsr_normalize_specialty(v_specialty);

  if target_enabled then
    v_cleaned := v_cleaned || jsonb_build_array(
      jsonb_build_object(
        'doctor_id', target_doctor_id::text,
        'doctor_name', coalesce(nullif(v_name, ''), 'Médico responsável'),
        'specialty', v_specialty,
        'source', 'internal_manual',
        'managed_by', v_user::text,
        'managed_at', now()
      )
    );
  end if;

  update public.patient_portal_access
     set schedule_assignments = v_cleaned,
         updated_at = now()
   where public.hpsr_normalize_passport(patient_passport) = v_passport;

  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'Não foi possível persistir o vínculo do paciente';
  end if;

  select coalesce(schedule_assignments, '[]'::jsonb)
    into v_persisted
    from public.patient_portal_access
   where public.hpsr_normalize_passport(patient_passport) = v_passport;

  select count(*)
    into v_matches
    from jsonb_array_elements(v_persisted) item
   where item->>'doctor_id' = target_doctor_id::text
     and public.hpsr_normalize_specialty(item->>'specialty') = public.hpsr_normalize_specialty(v_specialty);

  if target_enabled and v_matches <> 1 then
    raise exception 'O vínculo não foi confirmado após o salvamento. Tente novamente.';
  end if;

  if not target_enabled and v_matches <> 0 then
    raise exception 'A remoção do vínculo não foi confirmada. Tente novamente.';
  end if;

  return jsonb_build_object(
    'ok', true,
    'linked', target_enabled,
    'verified', true,
    'portal_access', v_access_enabled,
    'warning', case
      when target_enabled and not v_access_enabled then 'Vínculo salvo, mas o acesso do paciente ao Portal está desativado.'
      else null
    end,
    'assignments', v_persisted
  );
end;
$function$;

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
      from public.patient_portal_access pa
      cross join lateral jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item
     where public.hpsr_normalize_passport(pa.patient_passport) = public.hpsr_normalize_passport(target_passport)
       and coalesce(pa.access_enabled, true)
       and item->>'doctor_id' = target_doctor_id::text
       and public.hpsr_normalize_specialty(item->>'specialty') = public.hpsr_normalize_specialty(target_specialty)
  );
$function$;

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
  with explicit_access as (
    select
      item->>'doctor_id' as doctor_id,
      public.hpsr_normalize_specialty(item->>'specialty') as specialty
    from public.patient_portal_access pa
    cross join lateral jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item
    where public.hpsr_normalize_passport(pa.patient_passport) = public.hpsr_normalize_passport(target_passport)
      and coalesce(pa.access_enabled, true)
      and coalesce(item->>'doctor_id', '') <> ''
      and public.hpsr_normalize_specialty(item->>'specialty') <> ''
  )
  select s.id, s.doctor_id, s.doctor_name, s.specialty, s.starts_at, s.ends_at, s.status
    from public.clinical_appointment_slots s
   where s.status = 'Disponível'
     and s.starts_at > cutoff_at
     and exists (
       select 1
         from explicit_access access
        where access.doctor_id = s.doctor_id::text
          and access.specialty = public.hpsr_normalize_specialty(s.specialty)
     )
   order by s.starts_at asc, s.doctor_name asc
   limit least(greatest(coalesce(max_rows, 300), 1), 500);
$function$;

revoke all on function public.patient_portal_slot_allowed(text, uuid, text) from public, anon;
grant execute on function public.patient_portal_slot_allowed(text, uuid, text) to authenticated, service_role;

revoke all on function public.patient_portal_available_slots(text, timestamptz, integer) from public, anon;
grant execute on function public.patient_portal_available_slots(text, timestamptz, integer) to authenticated, service_role;
