-- Exclusão de disponibilidade controlada pelo médico/gestão.
-- A publicação pode ser removida mesmo quando já existem reservas.
-- Reservas ainda ativas ligadas à sequência são excluídas; atendimentos já
-- finalizados permanecem no histórico, mas os slots da publicação são removidos.
-- A permissão continua sendo do médico dono da agenda ou da gestão autorizada.

create or replace function public.delete_clinical_availability_series(p_series_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_series public.clinical_availability_series%rowtype;
  v_actor text;
  v_deleted_slots integer := 0;
  v_cancelled_appointments integer := 0;
  v_preserved_history integer := 0;
begin
  if v_user is null then
    raise exception 'Sessão não encontrada';
  end if;

  select * into v_series
  from public.clinical_availability_series
  where id = p_series_id
  for update;

  if v_series.id is null then
    raise exception 'Agenda publicada não encontrada';
  end if;

  if v_series.doctor_id <> v_user and not public.is_hpsr_schedule_manager() then
    raise exception 'Sem permissão para excluir esta agenda publicada';
  end if;

  -- Conta os atendimentos finalizados que continuarão existindo em appointments.
  -- O slot será removido com a sequência, mas o registro histórico da consulta
  -- permanece com seus dados próprios de data/hora no payload.
  select count(distinct a.id)
    into v_preserved_history
    from public.clinical_appointment_slots s
    join public.appointments a on a.id = s.appointment_id
   where s.series_id = p_series_id
     and not public.hpsr_is_active_patient_booking(a.status);

  -- Uma reserva ativa deixa de existir junto com a publicação. Se ela veio de
  -- acompanhamento, libera a ocorrência para que o paciente aguarde a próxima
  -- disponibilidade do mesmo médico/especialidade.
  update public.clinical_followup_occurrences o
     set slot_id = null,
         appointment_id = null,
         status = 'Aguardando abertura',
         updated_at = now()
   where o.appointment_id in (
     select distinct a.id
       from public.clinical_appointment_slots s
       join public.appointments a on a.id = s.appointment_id
      where s.series_id = p_series_id
        and public.hpsr_is_active_patient_booking(a.status)
   );

  delete from public.appointments a
   where a.id in (
     select distinct s.appointment_id
       from public.clinical_appointment_slots s
      where s.series_id = p_series_id
        and s.appointment_id is not null
        and public.hpsr_is_active_patient_booking(a.status)
   );
  get diagnostics v_cancelled_appointments = row_count;

  select count(*) into v_deleted_slots
    from public.clinical_appointment_slots
   where series_id = p_series_id;

  -- A FK series_id usa ON DELETE CASCADE, portanto a exclusão da série remove
  -- todos os slots, livres ou ocupados. Consultas finalizadas não dependem do
  -- slot para permanecerem no histórico.
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
    format(
      'Agenda %s de %s (%s a %s) removida. %s horário(s) removido(s); %s reserva(s) ativa(s) excluída(s); %s atendimento(s) finalizado(s) preservado(s) no histórico.',
      v_series.specialty,
      v_series.doctor_name,
      v_series.start_date,
      v_series.end_date,
      v_deleted_slots,
      v_cancelled_appointments,
      v_preserved_history
    ),
    coalesce(v_actor, v_user::text),
    p_series_id::text
  );

  return jsonb_build_object(
    'deleted', true,
    'deleted_slots', v_deleted_slots,
    'cancelled_appointments', v_cancelled_appointments,
    'preserved_history_appointments', v_preserved_history
  );
end;
$$;

revoke all on function public.delete_clinical_availability_series(uuid) from public, anon;
grant execute on function public.delete_clinical_availability_series(uuid) to authenticated;

comment on function public.delete_clinical_availability_series(uuid) is
  'Exclui uma agenda publicada do médico/gestão mesmo com reservas. Reservas ativas são removidas e acompanhamentos voltam a aguardar disponibilidade; atendimentos finalizados permanecem no histórico.';
