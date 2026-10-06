-- v1.1.8: sem migração dos dados, cadernetas gestacionais na Obstetra.
CREATE OR REPLACE FUNCTION public.hpsr_can_manage_gestational_vaccination()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $f$
 SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid())
  AND p.access_status='Aprovado'
  AND p.role IN ('Médico Clínico','Médico Especialista','Médico Plantonista','Médico Cirurgião','Diretor Clínico','Diretora','Vice Diretor','Vice Diretor / Dev')
  AND EXISTS (SELECT 1 FROM regexp_split_to_table(coalesce(p.specialty,''),'[,;/|]+') AS specialty_name
   WHERE public.hpsr_normalize_specialty(specialty_name) IN ('obstetra','ginecologia','obstetricia e ginecologia')));
$f$;
REVOKE ALL ON FUNCTION public.hpsr_can_manage_gestational_vaccination() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hpsr_can_manage_gestational_vaccination() TO authenticated;
CREATE OR REPLACE FUNCTION public.hpsr_guard_gestational_vaccination_writes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $f$
DECLARE old_gestational boolean := false; new_gestational boolean := false;
BEGIN
 IF TG_OP IN ('UPDATE','DELETE') THEN
  old_gestational := OLD.record_type IN ('Vacina','CadernetaVacinal') AND (OLD.payload #>> '{vaccine,group}'='gestante' OR OLD.payload->>'cardModel'='gestante');
 END IF;
 IF TG_OP IN ('INSERT','UPDATE') THEN
  new_gestational := NEW.record_type IN ('Vacina','CadernetaVacinal') AND (NEW.payload #>> '{vaccine,group}'='gestante' OR NEW.payload->>'cardModel'='gestante');
 END IF;
 IF (old_gestational OR new_gestational) AND coalesce(auth.role(),'') <> 'service_role' AND NOT public.hpsr_can_manage_gestational_vaccination() THEN
  RAISE EXCEPTION 'A vacinação gestacional é exclusiva de médicos aprovados com Obstetrícia ou Ginecologia.' USING ERRCODE='42501';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END;
$f$;
DROP TRIGGER IF EXISTS zz_hpsr_guard_gestational_vaccination_writes ON public.clinical_records;
CREATE TRIGGER zz_hpsr_guard_gestational_vaccination_writes BEFORE INSERT OR UPDATE OR DELETE ON public.clinical_records FOR EACH ROW EXECUTE FUNCTION public.hpsr_guard_gestational_vaccination_writes();
DROP POLICY IF EXISTS "gestational vaccination specialty read v118" ON public.clinical_records;
CREATE POLICY "gestational vaccination specialty read v118" ON public.clinical_records AS RESTRICTIVE FOR SELECT TO authenticated
USING (NOT (record_type IN ('Vacina','CadernetaVacinal') AND (payload #>> '{vaccine,group}'='gestante' OR payload->>'cardModel'='gestante')) OR public.hpsr_can_manage_gestational_vaccination());
