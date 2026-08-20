-- HPSR v1.0.279
-- Corrige a causa raiz das exclusões que retornavam 400 no fim da transação.
-- system_activities.id é TEXT NOT NULL e algumas RPCs legadas registram auditoria
-- sem fornecer id. O default central preserva compatibilidade com todas elas.
alter table public.system_activities
  alter column id set default (gen_random_uuid()::text);

comment on column public.system_activities.id is
  'Identificador textual da atividade. Quando omitido, é gerado automaticamente para preservar operações transacionais que registram auditoria.';
