-- Mudança 5 — planejamento clínico deixa de alterar vínculo médico-paciente.
-- Excluir um planejamento cancela/libera os compromissos próprios do plano,
-- mas patient_doctor_links permanece intocado.

create or replace function public.delete_clinical_followup_plan(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_plan public.clinical_followup_plans%rowtype;
  v_occurrences integer := 0;
  v_cancelled_appointments integer := 0;
  v_preserved_appointments integer := 0;
  v_released_slots integer := 0;
  v_actor text;
begin
  if v_user is null then
    raise exception 'Sessão não encontrada';
  end if;

  select *
    into v_plan
    from public.clinical_followup_plans
   where id = p_plan_id
   for update;

  if v_plan.id is null then
    raise exception 'Planejamento não encontrado';
  end if;

  if v_plan.doctor_id <> v_user and not public.is_hpsr_schedule_manager() then
    raise exception 'Sem permissão para excluir este planejamento';
  end if;

  select count(*)
    into v_occurrences
    from public.clinical_followup_occurrences
   where plan_id = p_plan_id;

  update public.appointments a
     set status = 'Cancelada',
         payload = coalesce(a.payload, '{}'::jsonb)
           || jsonb_build_object(
                'cancelReason', 'Planejamento de acompanhamento removido',
                'cancelledByPlanDeletion', true,
                'updatedAt', now()
              ),
         updated_at = now()
   where a.id in (
     select o.appointment_id
       from public.clinical_followup_occurrences o
      where o.plan_id = p_plan_id
        and o.appointment_id is not null
   )
     and public.hpsr_is_active_patient_booking(a.status);

  get diagnostics v_cancelled_appointments = row_count;

  select count(*)
    into v_preserved_appointments
    from public.clinical_followup_occurrences o
    join public.appointments a on a.id = o.appointment_id
   where o.plan_id = p_plan_id
     and o.appointment_id is not null
     and not public.hpsr_is_active_patient_booking(a.status);

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
   )
     and s.starts_at > now()
     and s.status in ('Ocupado', 'Disponível');

  get diagnostics v_released_slots = row_count;

  delete from public.clinical_followup_occurrences
   where plan_id = p_plan_id;

  delete from public.clinical_followup_plans
   where id = p_plan_id;

  select coalesce(name, role, v_user::text)
    into v_actor
    from public.profiles
   where id = v_user;

  insert into public.system_activities(module, action, description, actor, reference)
  values(
    'Agenda Clínica',
    'Exclusão de planejamento',
    format(
      'Planejamento de %s (%s) removido. %s ocorrência(s), %s consulta(s) ativa(s) cancelada(s), %s consulta(s) históricas preservada(s) e %s vaga(s) futura(s) liberada(s). O vínculo médico-paciente não foi alterado.',
      v_plan.patient_name,
      v_plan.specialty,
      v_occurrences,
      v_cancelled_appointments,
      v_preserved_appointments,
      v_released_slots
    ),
    coalesce(v_actor, v_user::text),
    p_plan_id::text
  );

  return jsonb_build_object(
    'deleted', true,
    'deleted_occurrences', v_occurrences,
    'cancelled_appointments', v_cancelled_appointments,
    'preserved_appointments', v_preserved_appointments,
    'released_slots', v_released_slots,
    'patient_link_changed', false,
    'link_source', 'patient_doctor_links'
  );
end;
$function$;

revoke all on function public.delete_clinical_followup_plan(uuid) from public, anon;
grant execute on function public.delete_clinical_followup_plan(uuid) to authenticated, service_role;

comment on function public.delete_clinical_followup_plan(uuid) is
  'Exclui somente o planejamento e seus compromissos próprios. Nunca cria, remove ou altera patient_doctor_links.';
