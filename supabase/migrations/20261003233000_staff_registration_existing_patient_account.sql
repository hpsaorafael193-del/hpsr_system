-- Uma identidade Auth pode possuir conta de paciente e um perfil profissional independente.
-- O cadastro profissional de uma conta existente exige senha autenticada e aprovação da Direção.
-- Sem alterar dados clínicos, conta do Portal ou cargos já aprovados.
CREATE OR REPLACE FUNCTION public.submit_staff_registration(request_id text, request_payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_passport text := upper(btrim(coalesce(request_payload->>'passport','')));
  v_name text := btrim(coalesce(request_payload->>'name',''));
  v_crm text := btrim(coalesce(request_payload->>'crm',''));
  v_phone text := btrim(coalesce(request_payload->>'cityPhone',''));
  v_patient_passport text;
  v_existing_status text;
  v_existing_passport text;
  v_existing_request text;
  v_request_id text;
  v_payload jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Entre na sua conta para solicitar o acesso profissional.'; END IF;
  IF v_name = '' OR v_passport = '' OR v_crm = '' THEN
    RAISE EXCEPTION 'Informe nome, passaporte e registro profissional.';
  END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id=v_uid AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Confirme o e-mail da sua conta antes de solicitar acesso profissional.'; END IF;
  -- Nunca confie no e-mail, cargo ou status enviados pelo navegador.
  IF lower(btrim(coalesce(request_payload->>'email',''))) <> v_email THEN
    RAISE EXCEPTION 'O e-mail informado não corresponde à conta autenticada.';
  END IF;
  SELECT patient_passport INTO v_patient_passport FROM public.patient_accounts WHERE user_id=v_uid;
  IF v_patient_passport IS NOT NULL AND public.hpsr_normalize_passport(v_patient_passport) <> public.hpsr_normalize_passport(v_passport) THEN
    RAISE EXCEPTION 'O passaporte informado difere do cadastro do Portal. Procure a Direção.';
  END IF;
  -- Serializa dois envios simultâneos da mesma conta para impedir pedidos duplicados.
  PERFORM pg_advisory_xact_lock(hashtext(v_uid::text));
  SELECT access_status,passport INTO v_existing_status,v_existing_passport
    FROM public.profiles WHERE id=v_uid FOR UPDATE;
  IF v_existing_status='Aprovado' THEN
    RAISE EXCEPTION 'Este usuário já possui acesso profissional aprovado.';
  ELSIF v_existing_status='Desligado' THEN
    RAISE EXCEPTION 'Procure a Direção para reativar seu acesso profissional.';
  ELSIF v_existing_passport IS NOT NULL
       AND public.hpsr_normalize_passport(v_existing_passport) <> public.hpsr_normalize_passport(v_passport) THEN
    RAISE EXCEPTION 'Já existe um cadastro profissional com outro passaporte. Procure a Direção.';
  END IF;
  SELECT id INTO v_existing_request FROM public.staff_registration_requests
    WHERE auth_user_id=v_uid AND status='Pendente' LIMIT 1;
  IF v_existing_request IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.staff_registration_requests
               WHERE id=v_existing_request AND public.hpsr_normalize_passport(passport) <> public.hpsr_normalize_passport(v_passport)) THEN
      RAISE EXCEPTION 'Existe uma solicitação pendente com outro passaporte. Procure a Direção.';
    END IF;
    RETURN; -- pedido já visível na Direção: reenvio não cria duplicação
  END IF;
  IF EXISTS (SELECT 1 FROM public.staff_registration_requests WHERE auth_user_id=v_uid AND status='Recusado') THEN
    RAISE EXCEPTION 'O pedido anterior foi recusado. Procure a Direção para nova avaliação.';
  END IF;
  v_request_id := 'staff-' || replace(gen_random_uuid()::text,'-','');
  v_payload := jsonb_build_object(
    'id',v_request_id,'name',v_name,'email',v_email,'passport',v_passport,
    'crm',v_crm,'cityPhone',v_phone,'discord',btrim(coalesce(request_payload->>'discord','')),
    'specialty','','requestedRole','Estagiário de Enfermagem',
    'createdAt',now(),'status','Pendente'
  );
  INSERT INTO public.profiles(id,name,email,passport,crm,role,specialty,city_phone,discord,access_status,service_status)
  VALUES(v_uid,v_name,v_email,v_passport,v_crm,'Estagiário de Enfermagem',NULL,
         nullif(v_phone,''),nullif(v_payload->>'discord',''),'Pendente','Fora de serviço')
  ON CONFLICT(id) DO UPDATE SET
    name=EXCLUDED.name,passport=EXCLUDED.passport,crm=EXCLUDED.crm,
    role='Estagiário de Enfermagem',specialty=NULL,city_phone=EXCLUDED.city_phone,
    discord=EXCLUDED.discord,access_status='Pendente',updated_at=now();
  INSERT INTO public.staff_registration_requests(
    id,auth_user_id,passport,name,requested_role,status,payload,created_at,updated_at
  ) VALUES(v_request_id,v_uid,v_passport,v_name,'Estagiário de Enfermagem','Pendente',v_payload,now(),now());
END;
$function$;
REVOKE ALL ON FUNCTION public.submit_staff_registration(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_staff_registration(text,jsonb) TO authenticated;
