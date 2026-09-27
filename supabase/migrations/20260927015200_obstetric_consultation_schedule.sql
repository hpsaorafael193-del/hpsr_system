-- Planejamento das sete etapas obstétricas; preserva planos anteriores e políticas RLS existentes.
alter table public.clinical_followup_plans
  add column if not exists consultation_schedule jsonb;

comment on column public.clinical_followup_plans.consultation_schedule is
  'Etapas e datas do planejamento gestacional definidas pela médica; disponibilizar à paciente apenas após liberação do plano.';
