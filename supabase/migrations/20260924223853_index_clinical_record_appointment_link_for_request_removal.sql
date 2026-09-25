-- Evita leitura integral de payloads clínicos extensos ao validar
-- vínculos de atendimento antes da exclusão lógica de uma solicitação.
create index if not exists clinical_records_payload_appointment_id_idx
  on public.clinical_records ((payload ->> 'appointmentId'));

comment on index public.clinical_records_payload_appointment_id_idx is
  'Acelera a verificação de registros vinculados antes da remoção administrativa de solicitações pendentes.';
