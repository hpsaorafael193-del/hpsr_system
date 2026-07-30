-- Compatibilidade retroativa do fluxo de acompanhamento e horários publicados.
-- Reaproveita planos, ocorrências, séries e vagas criados em versões anteriores.
-- Não cria novas tabelas e limita a retrocompatibilidade a ocorrências futuras/recentes.

-- 1. Normalização dos passaportes para o mesmo padrão usado pelo Portal do Paciente.
update public.clinical_followup_plans
   set patient_passport = upper(regexp_replace(trim(patient_passport), '\s+', '', 'g')),
       updated_at = now()
 where patient_passport is distinct from upper(regexp_replace(trim(patient_passport), '\s+', '', 'g'));

update public.clinical_followup_occurrences
   set patient_passport = upper(regexp_replace(trim(patient_passport), '\s+', '', 'g')),
       updated_at = now()
 where patient_passport is distinct from upper(regexp_replace(trim(patient_passport), '\s+', '', 'g'));

update public.clinical_appointment_slots
   set patient_passport = upper(regexp_replace(trim(patient_passport), '\s+', '', 'g')),
       updated_at = now()
 where patient_passport is not null
   and patient_passport is distinct from upper(regexp_replace(trim(patient_passport), '\s+', '', 'g'));

-- 2. Harmoniza ocorrências antigas com os dados do plano original.
update public.clinical_followup_occurrences o
   set doctor_id = p.doctor_id,
       patient_passport = upper(regexp_replace(trim(p.patient_passport), '\s+', '', 'g')),
       patient_name = coalesce(nullif(trim(o.patient_name), ''), p.patient_name),
       specialty = coalesce(nullif(trim(o.specialty), ''), p.specialty),
       updated_at = now()
  from public.clinical_followup_plans p
 where o.plan_id = p.id
   and (
     o.doctor_id is distinct from p.doctor_id
     or o.patient_passport is distinct from upper(regexp_replace(trim(p.patient_passport), '\s+', '', 'g'))
     or nullif(trim(o.patient_name), '') is null
     or nullif(trim(o.specialty), '') is null
   );

-- 3. Converte estados antigos ainda abertos para o estado atual reconhecido pelo portal.
update public.clinical_followup_occurrences
   set status = 'Planejada', updated_at = now()
 where status in ('Pendente', 'Ativa', 'Ativo')
   and slot_id is null
   and appointment_id is null
   and planned_date >= ((now() at time zone 'America/Sao_Paulo')::date - 1);

-- 4. Projeta séries publicadas anteriormente sobre as datas reais dos acompanhamentos.
-- Cada série gera no máximo 5 vagas por ocorrência e conflitos são ignorados pela chave doctor_id/starts_at.
with compatible_occurrences as (
  select distinct
         o.doctor_id,
         o.planned_date,
         lower(translate(trim(o.specialty), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç', 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')) as specialty_key,
         o.specialty
    from public.clinical_followup_occurrences o
   where o.planned_date >= ((now() at time zone 'America/Sao_Paulo')::date - 1)
     and o.status in ('Planejada', 'Aguardando abertura', 'Horários disponíveis')
), compatible_series as (
  select s.*,
         lower(translate(trim(s.specialty), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç', 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')) as specialty_key,
         least(coalesce(s.daily_limit, 5), 5) as effective_limit
    from public.clinical_availability_series s
   where s.status in ('Ativa', 'Ativo')
), projected_slots as (
  select
    s.id as series_id,
    s.doctor_id,
    s.doctor_name,
    s.specialty,
    ((o.planned_date + s.start_time) at time zone 'America/Sao_Paulo')
      + (step.index * s.slot_duration_minutes) * interval '1 minute' as starts_at,
    ((o.planned_date + s.start_time) at time zone 'America/Sao_Paulo')
      + ((step.index + 1) * s.slot_duration_minutes) * interval '1 minute' as ends_at
  from compatible_series s
  join compatible_occurrences o
    on o.doctor_id = s.doctor_id
   and o.specialty_key = s.specialty_key
   and o.planned_date between s.start_date and s.end_date
  cross join lateral generate_series(0, greatest(s.effective_limit - 1, 0)) as step(index)
  where s.slot_duration_minutes > 0
    and s.start_time + ((step.index + 1) * s.slot_duration_minutes) * interval '1 minute' <= s.end_time
)
insert into public.clinical_appointment_slots (
  series_id, doctor_id, doctor_name, specialty,
  starts_at, ends_at, status, created_at, updated_at
)
select series_id, doctor_id, doctor_name, specialty,
       starts_at, ends_at, 'Disponível', now(), now()
  from projected_slots
on conflict (doctor_id, starts_at) do nothing;

-- 5. Índice adicional para séries antigas cruzadas por médico, período e status.
create index if not exists clinical_series_legacy_compatibility_idx
  on public.clinical_availability_series (doctor_id, start_date, end_date, status);
