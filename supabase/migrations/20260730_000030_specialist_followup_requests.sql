-- Optimiza a localização de solicitações de acompanhamento direcionadas a médicos.
create index if not exists appointments_requested_doctor_status_idx
  on public.appointments ((payload->>'requestedDoctorId'), status, created_at desc)
  where payload ? 'requestedDoctorId';
