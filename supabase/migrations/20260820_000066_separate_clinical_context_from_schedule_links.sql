-- Separa classificação clínica de vínculo de agenda e restringe a gestão de terceiros
-- ao Diretor Técnico / Dev. Não cria nova fonte persistente.

create or replace function public.is_hpsr_internal_link_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with current_profile as (
    select p.id, p.passport, p.role
      from public.profiles p
     where p.id = auth.uid()
     limit 1
  ), resolved_roles as (
    select
      lower(regexp_replace(replace(coalesce(cp.role, ''), '-', ' '), '[[:space:]]+', ' ', 'g')) as profile_role,
      lower(regexp_replace(replace(coalesce(tm.hospital_role, ''), '-', ' '), '[[:space:]]+', ' ', 'g')) as member_role,
      lower(regexp_replace(replace(coalesce(tm.payload->>'hospitalRole', ''), '-', ' '), '[[:space:]]+', ' ', 'g')) as payload_role,
      lower(regexp_replace(replace(coalesce(tm.payload->>'systemRole', ''), '-', ' '), '[[:space:]]+', ' ', 'g')) as system_role
    from current_profile cp
    left join public.team_members tm
      on tm.id = cp.id::text
      or (cp.passport is not null and tm.passport = cp.passport)
  )
  select exists (
    select 1
      from resolved_roles r
     where r.profile_role = 'diretor técnico / dev'
        or r.member_role = 'diretor técnico / dev'
        or r.payload_role = 'diretor técnico / dev'
        or r.system_role = 'diretor técnico / dev'
  );
$$;

revoke all on function public.is_hpsr_internal_link_manager() from public, anon;
grant execute on function public.is_hpsr_internal_link_manager() to authenticated, service_role;

-- Mantém médicos aptos a criar/remover vínculos próprios pelos fluxos clínicos já existentes
-- (aceite de consulta e planejamento). Só o Diretor Técnico / Dev pode gerir vínculo
-- apontando para outro médico.
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
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_passport text := public.hpsr_normalize_passport(target_passport);
  v_specialty text := trim(coalesce(target_specialty, ''));
  v_name text := trim(coalesce(target_doctor_name, ''));
  v_assignments jsonb := '[]'::jsonb;
  v_cleaned jsonb := '[]'::jsonb;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;
  if v_passport = '' or target_doctor_id is null or v_specialty = '' then
    raise exception 'Paciente, médico e especialidade são obrigatórios';
  end if;

  if target_doctor_id <> v_user and not public.is_hpsr_internal_link_manager() then
    raise exception 'Somente o setor interno pode gerenciar vínculos de outros médicos';
  end if;

  select coalesce(schedule_assignments, '[]'::jsonb)
    into v_assignments
    from public.patient_portal_access
   where public.hpsr_normalize_passport(patient_passport) = v_passport
   for update;

  if not found then raise exception 'Paciente sem acesso ativo ao Portal do Paciente'; end if;

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into v_cleaned
    from jsonb_array_elements(v_assignments) item
   where coalesce(item->>'doctor_id', '') <> target_doctor_id::text
      or public.hpsr_normalize_specialty(item->>'specialty') <> public.hpsr_normalize_specialty(v_specialty);

  if target_enabled then
    v_cleaned := v_cleaned || jsonb_build_array(jsonb_build_object(
      'doctor_id', target_doctor_id::text,
      'doctor_name', coalesce(nullif(v_name, ''), 'Médico responsável'),
      'specialty', v_specialty
    ));
  end if;

  update public.patient_portal_access
     set schedule_assignments = v_cleaned,
         updated_at = now()
   where public.hpsr_normalize_passport(patient_passport) = v_passport;

  return jsonb_build_object('ok', true, 'linked', target_enabled, 'assignments', v_cleaned);
end;
$$;

revoke all on function public.set_patient_schedule_link(text, uuid, text, text, boolean) from public, anon;
grant execute on function public.set_patient_schedule_link(text, uuid, text, text, boolean) to authenticated, service_role;

-- Classificação de Pendentes passa a ser somente contexto do prontuário.
-- schedule_assignments é deliberadamente preservado e nunca é criado/removido aqui.
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
  passport_key text := public.hpsr_normalize_passport(target_passport);
  normalized_classification text := lower(trim(coalesce(target_classification, '')));
  cleaned_specialties text[];
  current_assignments jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if normalized_classification not in ('rotineiro', 'acompanhamento') then raise exception 'Invalid classification'; end if;

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
   where public.hpsr_normalize_passport(patient_passport) = passport_key
   returning coalesce(schedule_assignments, '[]'::jsonb) into current_assignments;

  if not found then raise exception 'Patient portal access not found'; end if;

  return jsonb_build_object(
    'passport', passport_key,
    'classification', normalized_classification,
    'assignments', current_assignments,
    'schedule_links_changed', false
  );
end;
$$;

-- A visão administrativa de vínculos fica disponível apenas para o setor interno.
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
    select public.is_hpsr_internal_link_manager() as ok
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

comment on function public.classify_patient_portal_access(text, text, text[]) is
  'Classifica apenas o contexto clínico do prontuário. Não cria, remove nem altera vínculos de agenda.';
comment on function public.list_patient_schedule_links() is
  'Lista vínculos administrativos de agenda e planos formais exclusivamente para o Diretor Técnico / Dev.';
