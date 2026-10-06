-- v1.1.16-test.4
-- Corrige a criação/alteração de vínculos clínicos pelo cliente autenticado.
-- O trigger trg_enforce_patient_link_capacity executa como invoker e precisa
-- conseguir chamar a função auxiliar de capacidade. Mantemos anon/public sem
-- acesso direto e preservamos service_role.

revoke execute on function public.hpsr_clinical_capacity(uuid, text) from public, anon;
grant execute on function public.hpsr_clinical_capacity(uuid, text) to authenticated, service_role;
