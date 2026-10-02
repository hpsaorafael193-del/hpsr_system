-- v1.1.1: A capacidade por especialidade mede pacientes distintos com vínculo ativo,
-- nunca a soma de consultas ou de acompanhamentos do mesmo paciente.
CREATE OR REPLACE FUNCTION public.hpsr_clinical_capacity(p_doctor_id uuid, p_specialty text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_specialty text := public.hpsr_normalize_specialty(p_specialty);
  v_config jsonb := '{}'::jsonb;
  v_limit integer := 5;
  v_used integer := 0;
BEGIN
  IF p_doctor_id IS NULL OR coalesce(v_specialty, '') = '' THEN
    RETURN jsonb_build_object('limit', 0, 'used', 0, 'available', 0, 'full', true);
  END IF;

  SELECT coalesce(p.specialty_capacity, '{}'::jsonb)
    INTO v_config
    FROM public.profiles p
   WHERE p.id = p_doctor_id
     AND coalesce(p.access_status, 'Aprovado') = 'Aprovado';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('limit', 0, 'used', 0, 'available', 0, 'full', true);
  END IF;

  -- Aceita as chaves atuais da capacidade mesmo quando a grafia da especialidade varia.
  BEGIN
    SELECT greatest(0, least(99, (entry.value)::integer))
      INTO v_limit
      FROM jsonb_each_text(v_config) entry
     WHERE public.hpsr_normalize_specialty(entry.key) = v_specialty
     LIMIT 1;
    v_limit := coalesce(v_limit, 5);
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    v_limit := 5;
  END;

  -- A própria tabela de vínculos representa apenas vínculos ativos;
  -- seu encerramento os transfere ao histórico e remove daqui.
  SELECT count(DISTINCT public.hpsr_normalize_passport(l.patient_passport))::integer
    INTO v_used
    FROM public.patient_doctor_links l
   WHERE l.doctor_id = p_doctor_id
     AND public.hpsr_normalize_specialty(l.specialty) = v_specialty;

  RETURN jsonb_build_object(
    'limit', v_limit,
    'used', v_used,
    'available', greatest(v_limit - v_used, 0),
    'full', v_used >= v_limit
  );
END;
$function$;

-- Impede cadastrar um sexto vínculo por engano, inclusive via edição ou transferência.
-- A trava por médico/especialidade protege contra cadastros simultâneos.
CREATE OR REPLACE FUNCTION public.hpsr_enforce_patient_link_capacity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_specialty text := public.hpsr_normalize_specialty(NEW.specialty);
  v_passport text := public.hpsr_normalize_passport(NEW.patient_passport);
  v_snapshot jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.doctor_id = NEW.doctor_id
       AND public.hpsr_normalize_specialty(OLD.specialty) = v_specialty
       AND public.hpsr_normalize_passport(OLD.patient_passport) = v_passport THEN
      RETURN NEW;
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(NEW.doctor_id::text), hashtext(v_specialty));

  -- Correções cadastrais de um vínculo já contabilizado não consomem outra vaga.
  IF EXISTS (
    SELECT 1 FROM public.patient_doctor_links l
     WHERE l.doctor_id = NEW.doctor_id
       AND public.hpsr_normalize_specialty(l.specialty) = v_specialty
       AND public.hpsr_normalize_passport(l.patient_passport) = v_passport
       AND (TG_OP = 'INSERT' OR l.id <> NEW.id)
  ) THEN
    RETURN NEW;
  END IF;

  v_snapshot := public.hpsr_clinical_capacity(NEW.doctor_id, NEW.specialty);
  IF (v_snapshot->>'full')::boolean THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'CAPACIDADE_VINCULOS_ESGOTADA: Este médico atingiu o limite de pacientes vinculados nessa especialidade.';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_enforce_patient_link_capacity ON public.patient_doctor_links;
CREATE TRIGGER trg_enforce_patient_link_capacity
  BEFORE INSERT OR UPDATE OF doctor_id, specialty, patient_passport
  ON public.patient_doctor_links
  FOR EACH ROW
  EXECUTE FUNCTION public.hpsr_enforce_patient_link_capacity();
