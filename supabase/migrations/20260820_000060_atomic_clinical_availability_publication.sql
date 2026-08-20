-- Publicação atômica da disponibilidade clínica.
-- Reutiliza clinical_availability_series + clinical_appointment_slots como fontes oficiais.
-- Cada dia do intervalo informado recebe a faixa de horários escolhida; não existe
-- recorrência semanal implícita baseada no primeiro dia.

create or replace function public.publish_clinical_availability(
  p_doctor_name text,
  p_specialty text,
  p_start_date date,
  p_end_date date,
  p_start_time time without time zone,
  p_end_time time without time zone,
  p_slot_duration_minutes integer default 60,
  p_daily_limit integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_id uuid := auth.uid();
  v_series_id uuid;
  v_slot_count integer := 0;
  v_requested_count integer := 0;
  v_conflict_count integer := 0;
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_doctor_id is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão médica inválida. Entre novamente no sistema.');
  end if;

  if not exists (
    select 1 from public.profiles p
     where p.id = v_doctor_id
       and coalesce(p.access_status, 'Aprovado') = 'Aprovado'
  ) then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Não foi possível validar o perfil médico para publicar horários.');
  end if;

  if p_start_date is null or p_end_date is null or p_start_date > p_end_date then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DATES', 'error', 'Informe um período de datas válido.');
  end if;

  if p_start_date < v_today then
    return jsonb_build_object('ok', false, 'code', 'PAST_DATE', 'error', 'Não é possível publicar horários em datas anteriores a hoje.');
  end if;

  if p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
    return jsonb_build_object('ok', false, 'code', 'INVALID_TIME', 'error', 'O horário final deve ser posterior ao inicial.');
  end if;

  if coalesce(p_slot_duration_minutes, 0) < 10 or p_slot_duration_minutes > 240 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DURATION', 'error', 'A duração do atendimento deve ficar entre 10 e 240 minutos.');
  end if;

  if coalesce(p_daily_limit, 0) < 1 or p_daily_limit > 5 then
    return jsonb_build_object('ok', false, 'code', 'INVALID_LIMIT', 'error', 'O limite diário deve ficar entre 1 e 5 horários.');
  end if;

  if nullif(trim(coalesce(p_doctor_name, '')), '') is null then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR_NAME', 'error', 'Não foi possível identificar o nome do médico.');
  end if;

  if nullif(trim(coalesce(p_specialty, '')), '') is null
     or p_specialty ~ '[,;/|]' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_SPECIALTY', 'error', 'Selecione uma única especialidade para esta publicação.');
  end if;

  -- Serializa publicações concorrentes do mesmo médico para impedir duas sequências
  -- sendo criadas no mesmo instante antes da verificação de sobreposição.
  perform pg_advisory_xact_lock(hashtext('hpsr-publish-availability:' || v_doctor_id::text));

  with requested_slots as (
    select
      day_value::date as slot_date,
      slot_number,
      (((day_value::date + p_start_time)
        + make_interval(mins => slot_number * p_slot_duration_minutes))
        at time zone 'America/Sao_Paulo') as starts_at,
      (((day_value::date + p_start_time)
        + make_interval(mins => (slot_number + 1) * p_slot_duration_minutes))
        at time zone 'America/Sao_Paulo') as ends_at
    from generate_series(p_start_date, p_end_date, interval '1 day') as day_value
    cross join generate_series(0, p_daily_limit - 1) as slot_number
    where make_interval(mins => (slot_number + 1) * p_slot_duration_minutes) <= (p_end_time - p_start_time)
  )
  select count(*) into v_requested_count from requested_slots;

  if v_requested_count = 0 then
    return jsonb_build_object('ok', false, 'code', 'NO_SLOTS', 'error', 'A faixa informada não comporta nenhum horário com a duração escolhida.');
  end if;

  with requested_slots as (
    select
      (((day_value::date + p_start_time)
        + make_interval(mins => slot_number * p_slot_duration_minutes))
        at time zone 'America/Sao_Paulo') as starts_at
    from generate_series(p_start_date, p_end_date, interval '1 day') as day_value
    cross join generate_series(0, p_daily_limit - 1) as slot_number
    where make_interval(mins => (slot_number + 1) * p_slot_duration_minutes) <= (p_end_time - p_start_time)
  )
  select count(*) into v_conflict_count
    from requested_slots r
    join public.clinical_appointment_slots s
      on s.doctor_id = v_doctor_id
     and s.starts_at = r.starts_at;

  if v_conflict_count > 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'SCHEDULE_CONFLICT',
      'error', 'Já existe horário publicado para você em parte desse período. Ajuste as datas ou a faixa de horário para evitar sobreposição.'
    );
  end if;

  insert into public.clinical_availability_series(
    doctor_id,
    doctor_name,
    specialty,
    start_date,
    end_date,
    start_time,
    end_time,
    slot_duration_minutes,
    weekday,
    daily_limit,
    status,
    created_at,
    updated_at
  ) values (
    v_doctor_id,
    trim(p_doctor_name),
    trim(p_specialty),
    p_start_date,
    p_end_date,
    p_start_time,
    p_end_time,
    p_slot_duration_minutes,
    extract(dow from p_start_date)::smallint,
    p_daily_limit,
    'Ativa',
    now(),
    now()
  ) returning id into v_series_id;

  with requested_slots as (
    select
      (((day_value::date + p_start_time)
        + make_interval(mins => slot_number * p_slot_duration_minutes))
        at time zone 'America/Sao_Paulo') as starts_at,
      (((day_value::date + p_start_time)
        + make_interval(mins => (slot_number + 1) * p_slot_duration_minutes))
        at time zone 'America/Sao_Paulo') as ends_at
    from generate_series(p_start_date, p_end_date, interval '1 day') as day_value
    cross join generate_series(0, p_daily_limit - 1) as slot_number
    where make_interval(mins => (slot_number + 1) * p_slot_duration_minutes) <= (p_end_time - p_start_time)
  ), inserted as (
    insert into public.clinical_appointment_slots(
      series_id,
      doctor_id,
      doctor_name,
      specialty,
      starts_at,
      ends_at,
      status,
      created_at,
      updated_at
    )
    select
      v_series_id,
      v_doctor_id,
      trim(p_doctor_name),
      trim(p_specialty),
      starts_at,
      ends_at,
      'Disponível',
      now(),
      now()
    from requested_slots
    returning id
  )
  select count(*) into v_slot_count from inserted;

  if v_slot_count <> v_requested_count then
    raise exception 'Falha ao publicar todos os horários solicitados.';
  end if;

  return jsonb_build_object(
    'ok', true,
    'series_id', v_series_id,
    'slot_count', v_slot_count,
    'start_date', p_start_date,
    'end_date', p_end_date,
    'specialty', trim(p_specialty)
  );
exception
  when unique_violation then
    raise exception 'Já existe horário publicado para você em parte desse período.';
end;
$$;

revoke all on function public.publish_clinical_availability(text, text, date, date, time, time, integer, integer) from public, anon;
grant execute on function public.publish_clinical_availability(text, text, date, date, time, time, integer, integer) to authenticated;

comment on function public.publish_clinical_availability(text, text, date, date, time, time, integer, integer) is
  'Publica atomicamente uma série e seus slots reais para todos os dias do período informado, sem recorrência semanal implícita.';

-- Remove somente publicações atuais/futuras que ficaram sem qualquer slot real.
-- Não toca séries históricas nem séries que tenham horários vinculados.
delete from public.clinical_availability_series series
 where series.status = 'Ativa'
   and series.end_date >= (now() at time zone 'America/Sao_Paulo')::date
   and not exists (
     select 1
       from public.clinical_appointment_slots slot
      where slot.series_id = series.id
   );
