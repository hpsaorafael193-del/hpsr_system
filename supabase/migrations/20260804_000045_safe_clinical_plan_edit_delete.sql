-- Edição/exclusão atômica dos planejamentos clínicos.
-- Planejamentos são apenas previsões; consultas já confirmadas são preservadas.

create or replace function public.save_clinical_followup_plan(
  p_plan_id uuid,
  p_doctor_name text,
  p_patient_passport text,
  p_patient_name text,
  p_specialty text,
  p_frequency text,
  p_interval_days integer,
  p_start_date date,
  p_end_date date,
  p_total_consultations integer,
  p_total_weeks integer,
  p_planned_dates date[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan_id uuid;
  v_preserved integer := 0;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;
  if coalesce(array_length(p_planned_dates,1),0)=0 then raise exception 'Nenhuma data prevista informada'; end if;

  if p_plan_id is null then
    insert into public.clinical_followup_plans(
      doctor_id,doctor_name,patient_passport,patient_name,specialty,frequency,interval_days,
      start_date,end_date,total_consultations,total_weeks,status,updated_at
    ) values (
      v_user,p_doctor_name,p_patient_passport,p_patient_name,p_specialty,p_frequency,p_interval_days,
      p_start_date,p_end_date,p_total_consultations,p_total_weeks,'Ativo',now()
    ) returning id into v_plan_id;
  else
    select id into v_plan_id from public.clinical_followup_plans
      where id=p_plan_id and doctor_id=v_user for update;
    if v_plan_id is null then raise exception 'Planejamento não encontrado ou sem permissão'; end if;

    select count(*) into v_preserved from public.clinical_followup_occurrences
      where plan_id=v_plan_id and (appointment_id is not null or slot_id is not null);

    update public.clinical_followup_plans set
      doctor_name=p_doctor_name, patient_passport=p_patient_passport, patient_name=p_patient_name,
      specialty=p_specialty, frequency=p_frequency, interval_days=p_interval_days,
      start_date=p_start_date, end_date=p_end_date, total_consultations=p_total_consultations,
      total_weeks=p_total_weeks, status='Ativo', updated_at=now()
    where id=v_plan_id;

    delete from public.clinical_followup_occurrences
      where plan_id=v_plan_id and appointment_id is null and slot_id is null;
  end if;

  insert into public.clinical_followup_occurrences(
    plan_id,doctor_id,patient_passport,patient_name,specialty,planned_date,status,updated_at
  )
  select v_plan_id,v_user,p_patient_passport,p_patient_name,p_specialty,d,'Planejada',now()
  from unnest(p_planned_dates) d
  on conflict (plan_id,planned_date) do nothing;

  return jsonb_build_object('plan_id',v_plan_id,'preserved_confirmed',v_preserved);
end;
$$;

create or replace function public.delete_clinical_followup_plan(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_preserved integer := 0;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;
  perform 1 from public.clinical_followup_plans where id=p_plan_id and doctor_id=v_user for update;
  if not found then raise exception 'Planejamento não encontrado ou sem permissão'; end if;

  select count(*) into v_preserved from public.clinical_followup_occurrences
    where plan_id=p_plan_id and (appointment_id is not null or slot_id is not null);

  delete from public.clinical_followup_occurrences
    where plan_id=p_plan_id and appointment_id is null and slot_id is null;

  if v_preserved > 0 then
    update public.clinical_followup_plans set status='Arquivado',updated_at=now() where id=p_plan_id;
    return jsonb_build_object('archived',true,'preserved_confirmed',v_preserved);
  end if;

  delete from public.clinical_followup_plans where id=p_plan_id;
  return jsonb_build_object('archived',false,'preserved_confirmed',0);
end;
$$;

revoke all on function public.save_clinical_followup_plan(uuid,text,text,text,text,text,integer,date,date,integer,integer,date[]) from public,anon;
grant execute on function public.save_clinical_followup_plan(uuid,text,text,text,text,text,integer,date,date,integer,integer,date[]) to authenticated;
revoke all on function public.delete_clinical_followup_plan(uuid) from public,anon;
grant execute on function public.delete_clinical_followup_plan(uuid) to authenticated;
