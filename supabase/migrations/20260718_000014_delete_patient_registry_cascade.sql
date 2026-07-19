-- Exclusão institucional de paciente e de todos os dados diretamente vinculados ao passaporte.
-- A operação é atômica e só pode ser executada por usuários autenticados.

create or replace function public.delete_patient_registry_cascade(target_passport text)
returns table (
  deleted_registry integer,
  deleted_clinical_records integer,
  deleted_appointments integer,
  deleted_portal_access integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_passport text;
  registry_count integer := 0;
  records_count integer := 0;
  appointments_count integer := 0;
  portal_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  normalized_passport := upper(regexp_replace(trim(coalesce(target_passport, '')), '\\s+', '', 'g'));
  if normalized_passport = '' then
    raise exception 'Passaporte inválido.' using errcode = '22023';
  end if;

  delete from public.clinical_records
  where upper(regexp_replace(trim(coalesce(patient_passport, '')), '\\s+', '', 'g')) = normalized_passport
     or upper(regexp_replace(trim(coalesce(payload->>'passport', '')), '\\s+', '', 'g')) = normalized_passport
     or upper(regexp_replace(trim(coalesce(payload->>'patientPassport', '')), '\\s+', '', 'g')) = normalized_passport
     or upper(regexp_replace(trim(coalesce(payload->>'patient_passport', '')), '\\s+', '', 'g')) = normalized_passport
     or upper(regexp_replace(trim(coalesce(payload->'patient'->>'passport', '')), '\\s+', '', 'g')) = normalized_passport;
  get diagnostics records_count = row_count;

  delete from public.appointments
  where upper(regexp_replace(trim(coalesce(passport, '')), '\\s+', '', 'g')) = normalized_passport
     or upper(regexp_replace(trim(coalesce(payload->>'passport', '')), '\\s+', '', 'g')) = normalized_passport
     or upper(regexp_replace(trim(coalesce(payload->>'patientPassport', '')), '\\s+', '', 'g')) = normalized_passport
     or upper(regexp_replace(trim(coalesce(payload->>'patient_passport', '')), '\\s+', '', 'g')) = normalized_passport
     or upper(regexp_replace(trim(coalesce(payload->'patient'->>'passport', '')), '\\s+', '', 'g')) = normalized_passport;
  get diagnostics appointments_count = row_count;

  -- Códigos e sessões são apagados automaticamente por ON DELETE CASCADE.
  delete from public.patient_portal_access
  where upper(regexp_replace(trim(coalesce(patient_passport, '')), '\\s+', '', 'g')) = normalized_passport;
  get diagnostics portal_count = row_count;

  delete from public.patient_registry
  where upper(regexp_replace(trim(coalesce(passport, '')), '\\s+', '', 'g')) = normalized_passport;
  get diagnostics registry_count = row_count;

  if registry_count = 0 and records_count = 0 and appointments_count = 0 and portal_count = 0 then
    raise exception 'Paciente não encontrado.' using errcode = 'P0002';
  end if;

  return query select registry_count, records_count, appointments_count, portal_count;
end;
$$;

revoke all on function public.delete_patient_registry_cascade(text) from public, anon;
grant execute on function public.delete_patient_registry_cascade(text) to authenticated;

comment on function public.delete_patient_registry_cascade(text) is
  'Exclui permanentemente cadastro institucional, prontuários, consultas e acesso ao portal vinculados a um passaporte.';
