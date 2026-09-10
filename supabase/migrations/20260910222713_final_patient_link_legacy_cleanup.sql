-- v1.0.351 — Limpeza final pós Mudanças 1–6.
-- Remove a antiga fonte de vínculo, mantém patient_portal_access apenas para acesso/triagem
-- e elimina compatibilidades que já não possuem consumidores.

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
     set triage_status = 'Classificado', updated_at = now()
   where public.hpsr_normalize_passport(patient_passport) = passport_key;
  if not found then raise exception 'Patient portal access not found'; end if;
  return jsonb_build_object(
    'passport', passport_key,
    'classification', normalized_classification,
    'specialties', case when normalized_classification = 'acompanhamento' then to_jsonb(cleaned_specialties) else '[]'::jsonb end
  );
end;
$function$;

revoke all on function public.classify_patient_portal_access(text, text, text[]) from public, anon;
grant execute on function public.classify_patient_portal_access(text, text, text[]) to authenticated, service_role;

drop function if exists public.list_patient_schedule_links();
drop function if exists public.set_patient_schedule_link(text, uuid, text, text, boolean);

alter table public.patient_portal_access drop column if exists schedule_assignments;

comment on table public.patient_portal_access is
  'Configuração de acesso do Portal do Paciente: e-mail, habilitação e triagem. Vínculos clínicos pertencem exclusivamente a patient_doctor_links.';

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
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado.' using errcode = '42501'; end if;
  normalized_passport := public.hpsr_normalize_passport(target_passport);
  if normalized_passport = '' then raise exception 'Passaporte inválido.' using errcode = '22023'; end if;
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
  delete from public.patient_doctor_link_history where public.hpsr_normalize_passport(patient_passport) = normalized_passport;
  delete from public.patient_doctor_links where public.hpsr_normalize_passport(patient_passport) = normalized_passport;
  delete from public.patient_guardian_links
   where public.hpsr_normalize_passport(child_passport) = normalized_passport
      or public.hpsr_normalize_passport(guardian_passport) = normalized_passport;
  delete from public.patient_accounts where public.hpsr_normalize_passport(patient_passport) = normalized_passport;
  delete from public.patient_portal_access where public.hpsr_normalize_passport(patient_passport) = normalized_passport;
  get diagnostics portal_count = row_count;
  delete from public.patient_registry where public.hpsr_normalize_passport(passport) = normalized_passport;
  get diagnostics registry_count = row_count;
  if registry_count = 0 and records_count = 0 and appointments_count = 0 and portal_count = 0 then
    raise exception 'Paciente não encontrado.' using errcode = 'P0002';
  end if;
  return query select registry_count, records_count, appointments_count, portal_count;
end;
$function$;

comment on function public.classify_patient_portal_access(text, text, text[]) is
  'Classifica o contexto clínico do paciente sem criar, alterar ou retornar vínculos médico-paciente.';
comment on function public.delete_patient_registry_cascade(text) is
  'Exclusão definitiva do cadastro e relações dependentes, incluindo carteira/histórico de vínculos e conta do paciente.';
