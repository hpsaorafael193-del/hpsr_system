-- v1.0.400 — Dados do planejamento gestacional e liberação explícita no Portal do Paciente.
-- Reutiliza a tabela institucional; nenhuma informação anterior é removida.
alter table public.clinical_followup_plans
  add column if not exists planning_notes text,
  add column if not exists portal_released_at timestamptz;

comment on column public.clinical_followup_plans.planning_notes is
  'Observações da médica no planejamento gestacional; exibir à paciente somente após liberação.';
comment on column public.clinical_followup_plans.portal_released_at is
  'Liberação explícita do planejamento gestacional para o Portal do Paciente.';

create index if not exists clinical_followup_obstetric_portal_release_idx
  on public.clinical_followup_plans (patient_passport, portal_released_at desc)
  where specialty = 'Obstetra' and portal_released_at is not null;
