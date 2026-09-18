create or replace function public.delete_patient_registry_cascade(target_passport text)
returns table(
  deleted_registry integer,
  deleted_clinical_records integer,
  deleted_appointments integer,
  deleted_portal_access integer
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  normalized_passport text;
  registry_count integer := 0;
  records_count integer := 0;
  appointments_count integer := 0;
  portal_count integer := 0;
  v_user_id uuid := auth.uid();
  v_actor_name text;
  v_patient_name text;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  if not public.is_access_admin() then
    raise exception 'Somente a administração pode excluir pacientes do prontuário.' using errcode = '42501';
  end if;

  normalized_passport := public.hpsr_normalize_passport(target_passport);
  if normalized_passport = '' then
    raise exception 'Passaporte inválido.' using errcode = '22023';
  end if;

  select coalesce(nullif(name, ''), v_user_id::text)
    into v_actor_name
    from public.profiles
   where id = v_user_id;
  v_actor_name := coalesce(v_actor_name, v_user_id::text);

  select name
    into v_patient_name
    from public.patient_registry
   where public.hpsr_normalize_passport(passport) = normalized_passport
   limit 1;

  delete from public.clinical_records
  where public.hpsr_normalize_passport(patient_passport) = normalized_passport
     or public.hpsr_normalize_passport(payload->>'passport') = normalized_passport
     or public.hpsr_normalize_passport(payload->>'patientPassport') = normalized_passport
     or public.hpsr_normalize_passport(payload->>'patient_passport') = normalized_passport
     or public.hpsr_normalize_passport(payload->'patient'->>'passport') = normalized_passport;
  get diagnostics records_count = row_count;

  delete from public.appointments
  where public.hpsr_normalize_passport(passport) = normalized_passport
     or public.hpsr_normalize_passport(payload->>'passport') = normalized_passport
     or public.hpsr_normalize_passport(payload->>'patientPassport') = normalized_passport
     or public.hpsr_normalize_passport(payload->>'patient_passport') = normalized_passport
     or public.hpsr_normalize_passport(payload->'patient'->>'passport') = normalized_passport;
  get diagnostics appointments_count = row_count;

  delete from public.patient_doctor_link_history
  where public.hpsr_normalize_passport(patient_passport) = normalized_passport;

  delete from public.patient_doctor_links
  where public.hpsr_normalize_passport(patient_passport) = normalized_passport;

  delete from public.patient_guardian_links
  where public.hpsr_normalize_passport(child_passport) = normalized_passport
     or public.hpsr_normalize_passport(guardian_passport) = normalized_passport;

  delete from public.patient_accounts
  where public.hpsr_normalize_passport(patient_passport) = normalized_passport;

  delete from public.patient_portal_access
  where public.hpsr_normalize_passport(patient_passport) = normalized_passport;
  get diagnostics portal_count = row_count;

  delete from public.patient_registry
  where public.hpsr_normalize_passport(passport) = normalized_passport;
  get diagnostics registry_count = row_count;

  if registry_count = 0 and records_count = 0 and appointments_count = 0 and portal_count = 0 then
    raise exception 'Paciente não encontrado.' using errcode = 'P0002';
  end if;

  insert into public.system_activities(
    id, module, action, description, actor, reference, created_at
  ) values (
    'patient-delete-' || replace(gen_random_uuid()::text, '-', ''),
    'Prontuário',
    'Paciente excluído',
    format(
      'Paciente %s (passaporte %s) excluído administrativamente. %s registro(s) clínico(s), %s consulta(s) e %s acesso(s) ao Portal removidos.',
      coalesce(v_patient_name, 'não identificado'),
      normalized_passport,
      records_count,
      appointments_count,
      portal_count
    ),
    v_actor_name,
    normalized_passport,
    now()
  );

  return query select registry_count, records_count, appointments_count, portal_count;
end;
$function$;

revoke all on function public.delete_patient_registry_cascade(text) from public, anon;
grant execute on function public.delete_patient_registry_cascade(text) to authenticated, service_role;
