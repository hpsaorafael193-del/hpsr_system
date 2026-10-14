-- Novo ponto de entrada: false significa retirar a liberação, sem alterar clientes antigos.
-- A rotina original continua disponível com sua semântica histórica de preservação.
begin;
create or replace function public.save_fiv_patient_project_release_state(
  p_project_id uuid, p_plan_id uuid, p_gestante text, p_doadora text,
  p_doctor_name text, p_start date, p_end date, p_notes text, p_steps jsonb,
  p_release_gestante boolean, p_release_doadora boolean, p_expected_versions jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  result jsonb;
  participant public.clinical_followup_plans%rowtype;
  target_id uuid;
  released boolean;
  stamp timestamptz := clock_timestamp();
begin
  if auth.uid() is null then raise exception 'Sessão médica obrigatória.' using errcode='42501'; end if;
  if p_release_gestante is null or p_release_doadora is null then
    raise exception 'Informe o estado de liberação de cada paciente.' using errcode='22023';
  end if;
  -- Preserva autorização clínica, vínculos, participantes, cronograma, locks e versões.
  result := public.save_fiv_patient_project(p_project_id,p_plan_id,p_gestante,p_doadora,
    p_doctor_name,p_start,p_end,p_notes,p_steps,p_release_gestante,p_release_doadora,p_expected_versions);
  for target_id, released in
    select (result->>'gestante_plan_id')::uuid, p_release_gestante
    union all
    select (result->>'doadora_plan_id')::uuid, p_release_doadora
  loop
    if target_id is null then continue; end if;
    select * into participant from public.clinical_followup_plans
      where id=target_id and doctor_id=auth.uid() and plan_type='in_vitro' for update;
    if not found then raise exception 'Participante não autorizada.' using errcode='42501'; end if;
    if not released then
      update public.clinical_followup_plans set
        planning_document_versions=coalesce(planning_document_versions,'[]'::jsonb)
          || case when planning_released_snapshot is not null
            then jsonb_build_array(jsonb_build_object('at',stamp,'released_snapshot',planning_released_snapshot))
            else '[]'::jsonb end,
        portal_released_at=null, planning_released_document_path=null, planning_released_snapshot=null,
        updated_at=clock_timestamp()
      where id=target_id and doctor_id=auth.uid();
      if not found then raise exception 'Retirada de liberação não confirmada.' using errcode='42501'; end if;
    end if;
  end loop;
  -- Não toca nas liberações das etapas, nem nas da outra paciente fora deste projeto.
  return result || jsonb_build_object('gestante_released',p_release_gestante,
    'doadora_released',(result->>'doadora_plan_id') is not null and p_release_doadora);
end;
$function$;
revoke all on function public.save_fiv_patient_project_release_state(uuid,uuid,text,text,text,date,date,text,jsonb,boolean,boolean,jsonb) from public, anon;
grant execute on function public.save_fiv_patient_project_release_state(uuid,uuid,text,text,text,date,date,text,jsonb,boolean,boolean,jsonb) to authenticated;
commit;
