-- Índices direcionados ao fluxo de acompanhamento e reserva.
-- Evitam varreduras amplas no portal do paciente e na agenda médica.
create index if not exists clinical_occurrences_patient_schedule_v2_idx
  on public.clinical_followup_occurrences (patient_passport, planned_date, doctor_id, status);

create index if not exists clinical_occurrences_doctor_schedule_v2_idx
  on public.clinical_followup_occurrences (doctor_id, planned_date, status);

create index if not exists clinical_slots_doctor_schedule_v2_idx
  on public.clinical_appointment_slots (doctor_id, starts_at, status);
