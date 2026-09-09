-- v1.0.344 — Mudança 4: motivos permitidos para encerramento de vínculo.
alter table public.patient_doctor_link_history
  add constraint patient_doctor_link_history_end_reason_allowed
  check (end_reason in (
    'Acompanhamento concluído',
    'Desistência do paciente',
    'Mudança de médico',
    'Impossibilidade de continuidade'
  ));
