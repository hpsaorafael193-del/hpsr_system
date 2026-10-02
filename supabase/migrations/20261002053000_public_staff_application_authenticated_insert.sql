-- v1.0.464: pacientes autenticados também podem enviar o formulário público.
-- A política é somente INSERT; consulta por passaporte/token continua na RPC existente.
-- A regra de administração e o histórico de candidaturas permanecem inalterados.
BEGIN;
DROP POLICY IF EXISTS "public application insert" ON public.staff_applications;
CREATE POLICY "public application insert"
ON public.staff_applications FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'Pendente'
  AND length(btrim(name)) BETWEEN 2 AND 160
  AND length(btrim(passport)) BETWEEN 1 AND 80
  AND length(btrim(token)) BETWEEN 8 AND 32
  AND length(btrim(id)) BETWEEN 8 AND 96
  AND payload->>'protocol' = id
  AND payload->>'passport' = passport
  AND payload->>'token' = token
  AND coalesce(payload->>'declarationAccepted', 'false') = 'true'
  AND length(btrim(coalesce(payload->>'availability', ''))) > 0
  AND length(btrim(coalesce(payload->>'discord', ''))) > 0
  AND length(btrim(coalesce(payload->>'motivation', ''))) > 0
);
-- As permissões INSERT já existem; não conceder SELECT, UPDATE ou DELETE aos candidatos.
COMMIT;
