alter table public.clinical_records
  add column if not exists history_title text,
  add column if not exists history_patient_name text,
  add column if not exists history_doctor_name text;

update public.clinical_records
set
  history_title = coalesce(
    nullif(payload->>'examName', ''),
    nullif(payload->>'documentTitle', ''),
    nullif(payload->>'title', ''),
    record_type,
    'Registro clínico'
  ),
  history_patient_name = coalesce(
    nullif(payload->'patient'->>'name', ''),
    nullif(payload->>'patientName', ''),
    'Paciente não informado'
  ),
  history_doctor_name = coalesce(
    nullif(payload->'doctor'->>'name', ''),
    nullif(payload->>'doctorName', ''),
    'Médico não informado'
  )
where history_title is null
   or history_patient_name is null
   or history_doctor_name is null;

create or replace function public.sync_clinical_record_history_metadata()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.history_title := coalesce(
    nullif(new.payload->>'examName', ''),
    nullif(new.payload->>'documentTitle', ''),
    nullif(new.payload->>'title', ''),
    new.record_type,
    'Registro clínico'
  );

  new.history_patient_name := coalesce(
    nullif(new.payload->'patient'->>'name', ''),
    nullif(new.payload->>'patientName', ''),
    'Paciente não informado'
  );

  new.history_doctor_name := coalesce(
    nullif(new.payload->'doctor'->>'name', ''),
    nullif(new.payload->>'doctorName', ''),
    'Médico não informado'
  );

  return new;
end;
$function$;

drop trigger if exists sync_clinical_record_history_metadata_trigger
on public.clinical_records;

create trigger sync_clinical_record_history_metadata_trigger
before insert or update of payload, record_type
on public.clinical_records
for each row
execute function public.sync_clinical_record_history_metadata();

create index if not exists idx_clinical_records_type_created_at
  on public.clinical_records(record_type, created_at desc);

comment on column public.clinical_records.history_title is
  'Metadado leve para listagens/histórico, evitando leitura do payload JSONB pesado.';
comment on column public.clinical_records.history_patient_name is
  'Nome do paciente em snapshot leve para listagens/histórico.';
comment on column public.clinical_records.history_doctor_name is
  'Nome do profissional em snapshot leve para listagens/histórico.';
