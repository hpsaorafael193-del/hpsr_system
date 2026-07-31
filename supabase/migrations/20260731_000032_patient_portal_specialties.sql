-- Especialidades que liberam agendas no Portal do Paciente.
-- O vínculo é feito diretamente no prontuário e não depende de planejamento clínico.

alter table public.patient_registry
  add column if not exists portal_specialties text[] not null default '{}'::text[];

comment on column public.patient_registry.portal_specialties is
  'Especialidades cujos horários publicados podem ser visualizados e reservados pelo paciente no portal.';

create index if not exists idx_patient_registry_portal_specialties
  on public.patient_registry using gin (portal_specialties);
