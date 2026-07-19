-- Torna patient_registry o cadastro institucional autoritativo e importa cadastros legados.

insert into public.patient_registry (passport, name, age, blood_type, city_phone, email, created_at, updated_at)
select distinct on (normalized_passport)
  normalized_passport,
  patient_name,
  age,
  blood_type,
  city_phone,
  email,
  coalesce(created_at, now()),
  now()
from (
  select
    upper(trim(coalesce(
      nullif(patient_passport, ''),
      nullif(payload->>'passport', ''),
      nullif(payload->>'patientPassport', ''),
      nullif(payload->>'patient_passport', ''),
      nullif(payload->'patient'->>'passport', '')
    ))) as normalized_passport,
    coalesce(
      nullif(payload->'patient'->>'name', ''),
      nullif(payload->>'patientName', ''),
      nullif(payload->>'name', ''),
      'Paciente não identificado'
    ) as patient_name,
    coalesce(nullif(payload->'patient'->>'age', ''), nullif(payload->>'age', '')) as age,
    coalesce(nullif(payload->'patient'->>'bloodType', ''), nullif(payload->>'bloodType', '')) as blood_type,
    coalesce(nullif(payload->'patient'->>'cityPhone', ''), nullif(payload->>'cityPhone', ''), nullif(payload->>'phone', '')) as city_phone,
    coalesce(nullif(payload->'patient'->>'email', ''), nullif(payload->>'patientEmail', ''), nullif(payload->>'email', '')) as email,
    created_at
  from public.clinical_records

  union all

  select
    upper(trim(coalesce(
      nullif(passport, ''),
      nullif(payload->>'passport', ''),
      nullif(payload->>'patientPassport', ''),
      nullif(payload->>'patient_passport', ''),
      nullif(payload->'patient'->>'passport', '')
    ))) as normalized_passport,
    coalesce(nullif(patient, ''), nullif(payload->'patient'->>'name', ''), nullif(payload->>'patientName', ''), 'Paciente não identificado') as patient_name,
    coalesce(nullif(payload->'patient'->>'age', ''), nullif(payload->>'age', '')) as age,
    coalesce(nullif(payload->'patient'->>'bloodType', ''), nullif(payload->>'bloodType', '')) as blood_type,
    coalesce(nullif(payload->'patient'->>'cityPhone', ''), nullif(payload->>'cityPhone', ''), nullif(payload->>'phone', '')) as city_phone,
    coalesce(nullif(payload->'patient'->>'email', ''), nullif(payload->>'patientEmail', ''), nullif(payload->>'email', '')) as email,
    created_at
  from public.appointments
) source
where normalized_passport is not null and normalized_passport <> ''
order by normalized_passport, created_at desc nulls last
on conflict (passport) do update set
  name = case when patient_registry.name = 'Paciente não identificado' then excluded.name else patient_registry.name end,
  age = coalesce(nullif(patient_registry.age, ''), excluded.age),
  blood_type = coalesce(nullif(patient_registry.blood_type, ''), excluded.blood_type),
  city_phone = coalesce(nullif(patient_registry.city_phone, ''), excluded.city_phone),
  email = coalesce(nullif(patient_registry.email, ''), excluded.email),
  updated_at = now();
