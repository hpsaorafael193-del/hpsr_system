-- v1.0.219 — correção consolidada de exclusão de consultas, planejamentos e agendas publicadas.
-- Substitui as migrations 000050/000051 não aplicadas anteriormente.
-- Preserva consultas reais ao remover agendas/planejamentos e mantém auditoria em system_activities.

create or replace function public.delete_clinical_followup_plan(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.clinical_followup_plans%rowtype;
  v_occurrences integer := 0;
  v_linked_appointments integer := 0;
  v_actor text;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;

  select * into v_plan
  from public.clinical_followup_plans
  where id = p_plan_id
  for update;

  if v_plan.id is null then raise exception 'Planejamento não encontrado'; end if;
  if v_plan.doctor_id <> v_user and not public.is_hpsr_schedule_manager() then
    raise exception 'Sem permissão para excluir este planejamento';
  end if;

  select count(*), count(*) filter (where appointment_id is not null)
    into v_occurrences, v_linked_appointments
  from public.clinical_followup_occurrences
  where plan_id = p_plan_id;

  -- Libera somente horários futuros sem consulta efetivamente vinculada.
  -- Consultas reais permanecem preservadas.
  update public.clinical_appointment_slots s
  set status = 'Disponível',
      patient_passport = null,
      patient_name = null,
      appointment_id = null,
      booked_at = null,
      updated_at = now()
  where s.id in (
    select o.slot_id
    from public.clinical_followup_occurrences o
    where o.plan_id = p_plan_id
      and o.slot_id is not null
      and o.appointment_id is null
  )
  and s.starts_at >= now();

  delete from public.clinical_followup_plans where id = p_plan_id;

  select coalesce(name, role, v_user::text) into v_actor
  from public.profiles where id = v_user;

  insert into public.system_activities(module, action, description, actor, reference)
  values (
    'Agenda Clínica',
    'Exclusão de planejamento',
    format('Planejamento de %s (%s) removido. %s ocorrência(s); %s consulta(s) já vinculada(s) preservada(s).',
      v_plan.patient_name, v_plan.specialty, v_occurrences, v_linked_appointments),
    coalesce(v_actor, v_user::text),
    p_plan_id::text
  );

  return jsonb_build_object(
    'deleted', true,
    'deleted_occurrences', v_occurrences,
    'preserved_appointments', v_linked_appointments
  );
end;
$$;

revoke all on function public.delete_clinical_followup_plan(uuid) from public, anon;
grant execute on function public.delete_clinical_followup_plan(uuid) to authenticated;


create or replace function public.delete_clinical_availability_series(p_series_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_series public.clinical_availability_series%rowtype;
  v_deleted_free integer := 0;
  v_preserved integer := 0;
  v_actor text;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;

  select * into v_series
  from public.clinical_availability_series
  where id = p_series_id
  for update;

  if v_series.id is null then raise exception 'Agenda publicada não encontrada'; end if;
  if v_series.doctor_id <> v_user and not public.is_hpsr_schedule_manager() then
    raise exception 'Sem permissão para excluir esta agenda publicada';
  end if;

  -- Slots ocupados precisam sobreviver à exclusão da série, pois a FK da série
  -- usa ON DELETE CASCADE. Eles são desvinculados antes da remoção.
  update public.clinical_appointment_slots
  set series_id = null,
      updated_at = now()
  where series_id = p_series_id
    and (
      appointment_id is not null
      or status = 'Ocupado'
      or patient_passport is not null
    );
  get diagnostics v_preserved = row_count;

  -- Slots livres são descartáveis junto da publicação antiga.
  delete from public.clinical_appointment_slots
  where series_id = p_series_id;
  get diagnostics v_deleted_free = row_count;

  delete from public.clinical_availability_series
  where id = p_series_id;

  select coalesce(name, role, v_user::text)
  into v_actor
  from public.profiles
  where id = v_user;

  insert into public.system_activities(module, action, description, actor, reference)
  values (
    'Agenda Clínica',
    'Exclusão de agenda publicada',
    format('Agenda %s de %s (%s a %s) removida. %s horário(s) livre(s) removido(s); %s consulta(s) preservada(s).',
      v_series.specialty, v_series.doctor_name, v_series.start_date, v_series.end_date, v_deleted_free, v_preserved),
    coalesce(v_actor, v_user::text),
    p_series_id::text
  );

  return jsonb_build_object(
    'deleted', true,
    'deleted_free_slots', v_deleted_free,
    'preserved_occupied_slots', v_preserved
  );
end;
$$;

revoke all on function public.delete_clinical_availability_series(uuid) from public, anon;
grant execute on function public.delete_clinical_availability_series(uuid) to authenticated;


create or replace function public.delete_clinical_appointment(p_appointment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.appointments%rowtype;
  v_profile_name text;
  v_actor text;
  v_slot_count integer := 0;
  v_occurrence_count integer := 0;
  v_is_owner boolean := false;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;

  select * into v_row
  from public.appointments
  where id = p_appointment_id
  for update;

  if v_row.id is null then raise exception 'Consulta não encontrada'; end if;

  select name, coalesce(name, role, v_user::text)
  into v_profile_name, v_actor
  from public.profiles
  where id = v_user;

  -- Compatibilidade com consultas atuais e legadas. Versões antigas nem sempre
  -- gravavam doctorId, então vínculos estruturados também identificam o médico.
  v_is_owner :=
    coalesce(v_row.payload->>'doctorId', '') = v_user::text
    or coalesce(v_row.payload->>'doctor_id', '') = v_user::text
    or lower(trim(coalesce(v_row.payload->>'physician', v_row.payload->>'doctor', ''))) = lower(trim(coalesce(v_profile_name, '')))
    or exists (
      select 1 from public.clinical_appointment_slots s
      where s.appointment_id = p_appointment_id and s.doctor_id = v_user
    )
    or exists (
      select 1 from public.clinical_followup_occurrences o
      where o.appointment_id = p_appointment_id and o.doctor_id = v_user
    );

  if not v_is_owner and not public.is_hpsr_schedule_manager() then
    raise exception 'Sem permissão para excluir esta consulta';
  end if;

  update public.clinical_followup_occurrences
  set appointment_id = null,
      status = case
        when planned_date < (now() at time zone 'America/Sao_Paulo')::date then 'Consulta removida'
        else 'Planejada'
      end,
      updated_at = now()
  where appointment_id = p_appointment_id;
  get diagnostics v_occurrence_count = row_count;

  update public.clinical_appointment_slots
  set status = case when starts_at < now() then 'Encerrado' else 'Disponível' end,
      patient_passport = null,
      patient_name = null,
      appointment_id = null,
      booked_at = null,
      updated_at = now()
  where appointment_id = p_appointment_id;
  get diagnostics v_slot_count = row_count;

  delete from public.appointments where id = p_appointment_id;

  insert into public.system_activities(module, action, description, actor, reference)
  values (
    'Agenda Clínica',
    'Exclusão de consulta',
    format('Consulta de %s removida da agenda. Status anterior: %s.', v_row.patient, v_row.status),
    coalesce(v_actor, v_user::text),
    p_appointment_id
  );

  return jsonb_build_object(
    'deleted', true,
    'released_slots', v_slot_count,
    'updated_occurrences', v_occurrence_count
  );
end;
$$;

revoke all on function public.delete_clinical_appointment(text) from public, anon;
grant execute on function public.delete_clinical_appointment(text) to authenticated;
