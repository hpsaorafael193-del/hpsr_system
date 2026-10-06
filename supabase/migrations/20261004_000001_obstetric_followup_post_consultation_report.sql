-- v1.1.4: relatório complementar após consulta Gestacional/FIV.
-- Aplicada ao Supabase oficial. Armazena campos privados e compartilháveis no mesmo registro,
-- mas a API do Portal lê SOMENTE a cópia explícita individual_released_snapshot.
ALTER TABLE public.clinical_followup_occurrences
  ADD COLUMN IF NOT EXISTS followup_report jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.clinical_followup_occurrences.followup_report IS
  'Registro pós-consulta com exames, explicação, observações compartilháveis e rascunho privado. Não expor diretamente no Portal.';
