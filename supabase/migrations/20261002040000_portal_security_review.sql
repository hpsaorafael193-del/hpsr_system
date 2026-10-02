-- v1.0.463 - Auditoria: o Portal usa as rotas protegidas com service_role.
-- Impede leitura e edição direta da tabela de acesso por qualquer paciente autenticado.
-- Perfis desligados deixam de satisfazer a permissão genérica de funcionário.
-- Sem alterações ou exclusões de registros.
BEGIN;
CREATE OR REPLACE FUNCTION public.is_hpsr_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.access_status = 'Aprovado'
  );
$fn$;
REVOKE ALL ON FUNCTION public.is_hpsr_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_hpsr_staff() TO authenticated, service_role;

DROP POLICY IF EXISTS "authenticated patient portal access" ON public.patient_portal_access;
DROP POLICY IF EXISTS "staff reads patient portal access" ON public.patient_portal_access;
DROP POLICY IF EXISTS "internal inserts patient portal access" ON public.patient_portal_access;
DROP POLICY IF EXISTS "internal updates patient portal access" ON public.patient_portal_access;
DROP POLICY IF EXISTS "internal deletes patient portal access" ON public.patient_portal_access;
CREATE POLICY "staff reads patient portal access" ON public.patient_portal_access
  FOR SELECT TO authenticated USING (public.is_hpsr_staff());
CREATE POLICY "internal inserts patient portal access" ON public.patient_portal_access
  FOR INSERT TO authenticated WITH CHECK (public.hpsr_can_access_internal());
CREATE POLICY "internal updates patient portal access" ON public.patient_portal_access
  FOR UPDATE TO authenticated USING (public.hpsr_can_access_internal())
  WITH CHECK (public.hpsr_can_access_internal());
CREATE POLICY "internal deletes patient portal access" ON public.patient_portal_access
  FOR DELETE TO authenticated USING (public.hpsr_can_access_internal());

-- TRUNCATE não obedece a RLS: nunca conceder diretamente para usuários do Portal.
REVOKE TRUNCATE ON TABLE public.clinical_records, public.appointments,
 public.patient_portal_access, public.patient_registry, public.patient_accounts,
 public.patient_guardian_links, public.clinical_followup_plans
FROM anon, authenticated;
COMMIT;
