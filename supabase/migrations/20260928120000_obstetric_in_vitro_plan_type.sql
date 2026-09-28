-- Separa as modalidades sem duplicar tabelas nem alterar planejamentos existentes.
alter table public.clinical_followup_plans
  add column if not exists plan_type text not null default 'gestacional';

alter table public.clinical_followup_plans
  add constraint clinical_followup_plan_type_check
  check (plan_type in ('gestacional', 'in_vitro'));

comment on column public.clinical_followup_plans.plan_type is
  'Modalidade do planejamento obstétrico: gestacional ou in vitro. Registros anteriores permanecem gestacionais.';
