-- Mantém o tipo de acompanhamento no cadastro institucional do paciente.
alter table public.patient_registry
  add column if not exists follow_up text not null default 'Rotina';

alter table public.patient_registry
  drop constraint if exists patient_registry_follow_up_valid;

alter table public.patient_registry
  add constraint patient_registry_follow_up_valid
  check (follow_up in ('Especializado', 'Clínico', 'Rotina'));
