-- v1.1.7: uma única conclusão por faixa etária da caderneta infantil.
-- Registros antigos por vacina/dose permanecem intocados e fora desta restrição.
CREATE UNIQUE INDEX IF NOT EXISTS ux_hpsr_childhood_vaccination_stage_v117
ON public.clinical_records (patient_passport, ((payload #>> '{vaccine,slotId}')))
WHERE record_type='Vacina'
AND payload #>> '{vaccine,group}' = 'crianca'
AND payload #>> '{vaccine,dose}' = 'Etapa completa'
AND (payload #>> '{vaccine,slotId}') IS NOT NULL;

COMMENT ON INDEX public.ux_hpsr_childhood_vaccination_stage_v117
IS 'Garante um único registro de etapa infantil por paciente; histórico de doses individuais antigas preservado.';
