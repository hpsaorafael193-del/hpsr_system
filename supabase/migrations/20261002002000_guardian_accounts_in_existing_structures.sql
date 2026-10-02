-- v1.0.456 — Cadastro infantil: reaproveitar patient_registry, patient_accounts,
-- patient_portal_access e patient_guardian_links. Preparada; aplicar somente após autorização.
-- Nenhum prontuário ou vínculo existente é excluído e nenhuma tabela é criada.
BEGIN;

-- Uma conta do Portal também pode pertencer a um responsável sem prontuário próprio.
ALTER TABLE public.patient_accounts ALTER COLUMN patient_passport DROP NOT NULL;
ALTER TABLE public.patient_accounts ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.patient_portal_access ALTER COLUMN patient_passport DROP NOT NULL;
ALTER TABLE public.patient_portal_access
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS patient_portal_access_user_id_unique
  ON public.patient_portal_access (user_id) WHERE user_id IS NOT NULL;
UPDATE public.patient_portal_access p SET user_id = a.user_id
FROM public.patient_accounts a
WHERE a.patient_passport = p.patient_passport AND p.user_id IS NULL;

-- Os vínculos antigos continuam identificados pelo passaporte do responsável.
-- Os novos são identificados diretamente pela conta (com ou sem passaporte próprio).
ALTER TABLE public.patient_guardian_links ALTER COLUMN guardian_passport DROP NOT NULL;
ALTER TABLE public.patient_guardian_links
  ADD COLUMN IF NOT EXISTS guardian_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS additional_guardian_name text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_note text;
CREATE UNIQUE INDEX IF NOT EXISTS patient_guardian_child_user_unique
  ON public.patient_guardian_links (child_passport, guardian_user_id)
  WHERE guardian_user_id IS NOT NULL;
UPDATE public.patient_guardian_links l SET guardian_user_id = a.user_id
FROM public.patient_accounts a WHERE a.patient_passport = l.guardian_passport
  AND l.guardian_user_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.patient_guardian_links other_link
    WHERE other_link.child_passport = l.child_passport AND other_link.guardian_user_id = a.user_id);

-- Aprovação exclusiva da Diretora e do Vice-Diretor / Dev com acesso ativo.
CREATE OR REPLACE FUNCTION public.hpsr_can_manage_guardian_links()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.access_status = 'Aprovado'
      AND p.role IN ('Diretora', 'Vice Diretor / Dev'));
$fn$;
REVOKE ALL ON FUNCTION public.hpsr_can_manage_guardian_links() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hpsr_can_manage_guardian_links() TO authenticated, service_role;
DROP POLICY IF EXISTS "staff guardian links" ON public.patient_guardian_links;
DROP POLICY IF EXISTS "guardian links staff read" ON public.patient_guardian_links;
DROP POLICY IF EXISTS "guardian links direction insert" ON public.patient_guardian_links;
DROP POLICY IF EXISTS "guardian links direction update" ON public.patient_guardian_links;
DROP POLICY IF EXISTS "guardian links direction delete" ON public.patient_guardian_links;
CREATE POLICY "guardian links staff read" ON public.patient_guardian_links
  FOR SELECT TO authenticated USING (public.is_hpsr_staff());
CREATE POLICY "guardian links direction insert" ON public.patient_guardian_links
  FOR INSERT TO authenticated WITH CHECK (public.hpsr_can_manage_guardian_links());
CREATE POLICY "guardian links direction update" ON public.patient_guardian_links
  FOR UPDATE TO authenticated USING (public.hpsr_can_manage_guardian_links())
  WITH CHECK (public.hpsr_can_manage_guardian_links());
CREATE POLICY "guardian links direction delete" ON public.patient_guardian_links
  FOR DELETE TO authenticated USING (public.hpsr_can_manage_guardian_links());

-- Histórico administrativo reutiliza system_activities, sem criar tabela de auditoria.
CREATE OR REPLACE FUNCTION public.hpsr_audit_guardian_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $audit$
DECLARE v_previous text; v_actor text;
BEGIN
  v_previous := CASE WHEN TG_OP = 'INSERT' THEN 'novo' ELSE OLD.access_status END;
  IF TG_OP = 'INSERT' OR v_previous IS DISTINCT FROM NEW.access_status THEN
    SELECT p.name INTO v_actor FROM public.profiles p WHERE p.id = (SELECT auth.uid());
    INSERT INTO public.system_activities(id,module,action,description,actor,reference,created_at)
    VALUES ('HPSR-GUARD-' || gen_random_uuid()::text,'Cadastro infantil','Vínculo familiar',
      'Vínculo familiar: ' || v_previous || ' → ' || NEW.access_status,
      coalesce(v_actor,'Sistema'),NEW.id::text,now());
  END IF;
  RETURN NEW;
END;
$audit$;
DROP TRIGGER IF EXISTS trg_hpsr_audit_guardian_decision ON public.patient_guardian_links;
CREATE TRIGGER trg_hpsr_audit_guardian_decision AFTER INSERT OR UPDATE
ON public.patient_guardian_links FOR EACH ROW
EXECUTE FUNCTION public.hpsr_audit_guardian_decision();

-- Criação atômica: localizar ou criar a criança e registrar o pedido sem acesso clínico.
-- Esta RPC é exclusiva do backend com service_role após autenticação da conta.
CREATE OR REPLACE FUNCTION public.hpsr_register_child_by_guardian(
  p_guardian_user_id uuid, p_child_passport text, p_child_name text,
  p_age text, p_relationship text, p_additional_guardian_name text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE
  v_passport text := upper(trim(p_child_passport));
  v_name text := trim(regexp_replace(p_child_name, '\s+', ' ', 'g'));
  v_age text := trim(p_age);
  v_guardian public.patient_accounts%ROWTYPE;
  v_account_name text;
  v_existing_name text;
  v_link public.patient_guardian_links%ROWTYPE;
BEGIN
  IF (SELECT auth.role()) <> 'service_role' THEN
    RAISE EXCEPTION 'Operação administrativa não autorizada.' USING ERRCODE = '42501';
  END IF;
  IF length(v_passport) < 1 OR length(v_passport) > 80 OR length(v_name) < 2 OR length(v_name) > 160
    OR v_age !~ '^[0-9]{1,3} (mes|meses|ano|anos)$'
    OR length(trim(p_relationship)) < 2
  THEN RAISE EXCEPTION 'Confira nome, passaporte, idade e parentesco.' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_guardian FROM public.patient_accounts WHERE user_id = p_guardian_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conta do responsável não encontrada.' USING ERRCODE = '42501'; END IF;
  IF v_guardian.patient_passport = v_passport THEN
    RAISE EXCEPTION 'O responsável não pode vincular seu próprio passaporte como criança.' USING ERRCODE = '22023';
  END IF;
  v_account_name := v_guardian.display_name;
  IF v_account_name IS NULL AND v_guardian.patient_passport IS NOT NULL THEN
    SELECT name INTO v_account_name FROM public.patient_registry WHERE passport = v_guardian.patient_passport;
  END IF;
  INSERT INTO public.patient_registry(passport,name,age,follow_up)
  VALUES(v_passport,v_name,v_age,'Rotina') ON CONFLICT (passport) DO NOTHING;
  SELECT name INTO v_existing_name FROM public.patient_registry WHERE passport = v_passport FOR UPDATE;
  IF lower(trim(v_existing_name)) <> lower(v_name) THEN
    RAISE EXCEPTION 'Passaporte já cadastrado com dados divergentes. Solicite conferência da Direção.' USING ERRCODE = '23505';
  END IF;
  -- Cadastro antigo sem idade: completar somente se ainda não houver informação.
  UPDATE public.patient_registry SET age = v_age, updated_at = now()
  WHERE passport = v_passport AND nullif(trim(coalesce(age,'')),'') IS NULL;
  -- Reaproveita um vínculo legado com o passaporte do próprio responsável, se houver.
  SELECT * INTO v_link FROM public.patient_guardian_links
  WHERE child_passport = v_passport AND
    (guardian_user_id = p_guardian_user_id OR
      (v_guardian.patient_passport IS NOT NULL AND guardian_passport = v_guardian.patient_passport))
  ORDER BY (guardian_user_id = p_guardian_user_id) DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    IF v_link.access_status IN ('suspended','ended') THEN
      RAISE EXCEPTION 'Este vínculo precisa de revisão pela Direção.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.patient_guardian_links SET
      guardian_user_id = p_guardian_user_id,
      guardian_name = coalesce(nullif(v_account_name,''),guardian_name),
      additional_guardian_name = nullif(trim(coalesce(p_additional_guardian_name,'')),''),
      updated_at = now()
    WHERE id = v_link.id;
    RETURN jsonb_build_object('passport',v_passport,'status',v_link.access_status,'already_registered',true);
  END IF;
  INSERT INTO public.patient_guardian_links (
    child_passport, guardian_passport, guardian_user_id,guardian_name,relationship,
    additional_guardian_name,access_status,portal_access
  ) VALUES (
    v_passport,v_guardian.patient_passport,p_guardian_user_id,v_account_name,
    trim(p_relationship),nullif(trim(coalesce(p_additional_guardian_name,'')),''),'pending',false
  );
  RETURN jsonb_build_object('passport',v_passport,'status','pending','already_registered',false);
END;
$fn$;
REVOKE ALL ON FUNCTION public.hpsr_register_child_by_guardian(uuid,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hpsr_register_child_by_guardian(uuid,text,text,text,text,text) TO service_role;
COMMIT;
