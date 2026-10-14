-- Apenas a pausa atual contínua > 2h. Nenhum limite diário ou aviso externo.
create extension if not exists pg_cron;
create index if not exists time_clock_active_break_started_idx
  on public.time_clock_breaks(started_at, entry_id) where ended_at is null;

-- Invoker interno: somente postgres/owner, sem endpoint acessível ao cliente.
create or replace function hpsr_private.close_expired_time_clock_pauses(p_user_id uuid default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_candidate record;
  v_entry public.time_clock_entries%rowtype;
  v_pause public.time_clock_breaks%rowtype;
  v_now timestamptz := now();
  v_count integer := 0;
begin
  for v_candidate in
    select e.id, e.user_id
    from public.time_clock_breaks b
    join public.time_clock_entries e on e.id = b.entry_id
    where b.ended_at is null and b.started_at < v_now - interval '2 hours'
      and e.closed_at is null and e.status = 'Em pausa'
      and (p_user_id is null or e.user_id = p_user_id)
    order by b.started_at, e.id
    limit 200
  loop
    -- Mesma ordem da correção administrativa: perfil antes do ponto.
    perform 1 from public.profiles where id = v_candidate.user_id for update;
    select * into v_entry from public.time_clock_entries
      where id = v_candidate.id and closed_at is null and status = 'Em pausa'
      for update skip locked;
    if v_entry.id is null then continue; end if;
    select * into v_pause from public.time_clock_breaks
      where entry_id = v_entry.id and ended_at is null
        and started_at < v_now - interval '2 hours'
      for update;
    if v_pause.id is null then continue; end if;

    -- Nenhum segmento aberto deve atravessar a pausa, inclusive dados antigos.
    update public.time_clock_segments
      set ended_at = greatest(started_at, v_pause.started_at)
      where entry_id = v_entry.id and ended_at is null;
    update public.time_clock_breaks set ended_at = v_now where id = v_pause.id;
    update public.time_clock_entries
      set status = 'Encerrado', closed_at = v_now, close_requested_at = null, updated_at = v_now
      where id = v_entry.id;
    perform public.time_clock_recalculate_entry(v_entry.id);
    update public.profiles set service_status = 'Fora de serviço', updated_at = v_now
      where id = v_entry.user_id;

    insert into public.time_clock_audit
      (entry_id, target_user_id, actor_user_id, action, reason, previous_data, new_data)
    values (v_entry.id, v_entry.user_id, null, 'Encerramento automático',
      'Pausa contínua superior a duas horas. O intervalo em pausa não conta como trabalho.',
      jsonb_build_object('entry', to_jsonb(v_entry), 'pause', to_jsonb(v_pause)),
      jsonb_build_object('reasonCode', 'pause_timeout_2h', 'closedAt', v_now,
        'pauseStartedAt', v_pause.started_at,
        'workedSeconds', (select worked_seconds from public.time_clock_entries where id = v_entry.id)));

    perform public.refresh_time_clock_month_report(
      date_trunc('month', timezone('America/Sao_Paulo', v_entry.opened_at))::date);
    perform public.refresh_time_clock_month_report(
      date_trunc('month', timezone('America/Sao_Paulo', v_now))::date);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$function$;
revoke all on function hpsr_private.close_expired_time_clock_pauses(uuid) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_time_clock_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_entry public.time_clock_entries%rowtype;
  v_pause public.time_clock_breaks%rowtype;
  v_last_break public.time_clock_breaks%rowtype;
  v_seconds bigint := 0;
  v_history jsonb;
  v_ranking jsonb;
begin
  if v_user is null then raise exception 'Sessão não encontrada.'; end if;
  perform public.close_previous_time_clock_months();

  perform 1 from public.profiles where id = v_user for update;
  perform hpsr_private.close_expired_time_clock_pauses(v_user);

  select * into v_entry from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1;

  if v_entry.id is not null then
    select * into v_pause from public.time_clock_breaks
      where entry_id = v_entry.id and ended_at is null limit 1;
    select * into v_last_break from public.time_clock_breaks
      where entry_id = v_entry.id order by started_at desc limit 1;
    select coalesce(floor(sum(extract(epoch from (coalesce(ended_at, now()) - started_at))))::bigint, 0)
      into v_seconds
    from public.time_clock_segments
    where entry_id = v_entry.id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id, 'openedAt', e.opened_at, 'closedAt', e.closed_at,
    'workedSeconds', e.worked_seconds, 'status', e.status
  ) order by e.opened_at desc), '[]'::jsonb)
  into v_history
  from (
    select * from public.time_clock_entries
    where user_id = v_user and closed_at is not null
    order by opened_at desc limit 30
  ) e;

  v_ranking := public.time_clock_month_ranking(public.time_clock_current_month());

  return jsonb_build_object(
    'status', case when v_entry.id is null then 'Fora de serviço' else v_entry.status end,
    'entryId', v_entry.id,
    'openedAt', v_entry.opened_at,
    'pauseStartedAt', coalesce(v_pause.started_at, v_last_break.started_at),
    'returnedAt', case when v_pause.id is null then v_last_break.ended_at else null end,
    'workedSeconds', v_seconds,
    'history', v_history,
    'ranking', v_ranking
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.time_clock_action(p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
  v_break public.time_clock_breaks%rowtype;
  v_seconds bigint := 0;
begin
  if v_user is null then raise exception 'Sessão não encontrada.'; end if;
  perform public.close_previous_time_clock_months();

  perform 1 from public.profiles where id = v_user for update;
  if hpsr_private.close_expired_time_clock_pauses(v_user) > 0 and p_action <> 'enter' then
    return public.get_my_time_clock_state();
  end if;

  select * into v_entry from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1 for update;

  if p_action = 'enter' then
    if v_entry.id is not null then raise exception 'Já existe um ponto aberto.'; end if;
    insert into public.time_clock_entries(user_id, status, opened_at)
      values (v_user, 'Em serviço', v_now) returning * into v_entry;
    insert into public.time_clock_segments(entry_id, user_id, started_at)
      values (v_entry.id, v_user, v_now);

  elsif p_action = 'pause' then
    if v_entry.id is null then raise exception 'Não existe ponto aberto.'; end if;
    if v_entry.status <> 'Em serviço' then raise exception 'O ponto não está em serviço.'; end if;
    update public.time_clock_segments set ended_at = v_now
      where entry_id = v_entry.id and ended_at is null;
    insert into public.time_clock_breaks(entry_id, user_id, started_at)
      values (v_entry.id, v_user, v_now);
    update public.time_clock_entries set status = 'Em pausa', updated_at = v_now where id = v_entry.id;

  elsif p_action = 'return' then
    if v_entry.id is null then raise exception 'Não existe ponto aberto.'; end if;
    if v_entry.status <> 'Em pausa' then raise exception 'Não existe pausa ativa.'; end if;
    update public.time_clock_breaks set ended_at = v_now
      where entry_id = v_entry.id and ended_at is null returning * into v_break;
    if v_break.id is null then raise exception 'Não existe pausa ativa.'; end if;
    insert into public.time_clock_segments(entry_id, user_id, started_at)
      values (v_entry.id, v_user, v_now);
    update public.time_clock_entries set status = 'Em serviço', updated_at = v_now where id = v_entry.id;

  elsif p_action = 'finish' then
    if v_entry.id is null then raise exception 'Não existe ponto aberto.'; end if;
    if v_entry.status = 'Em serviço' then
      update public.time_clock_segments set ended_at = v_now
        where entry_id = v_entry.id and ended_at is null;
    elsif v_entry.status = 'Em pausa' then
      update public.time_clock_breaks set ended_at = v_now
        where entry_id = v_entry.id and ended_at is null;
    end if;
    update public.time_clock_entries
      set status = 'Encerrado', closed_at = v_now, updated_at = v_now
      where id = v_entry.id;
    v_seconds := public.time_clock_recalculate_entry(v_entry.id);

    -- Apenas meses já encerrados são materializados como relatório.
    perform public.refresh_time_clock_month_report(
      date_trunc('month', timezone('America/Sao_Paulo', v_entry.opened_at))::date
    );
    perform public.refresh_time_clock_month_report(
      date_trunc('month', timezone('America/Sao_Paulo', v_now))::date
    );
  else
    raise exception 'Ação de ponto inválida.';
  end if;

  update public.profiles
  set service_status = case
        when p_action = 'finish' then 'Fora de serviço'
        when p_action = 'pause' then 'Em pausa'
        else 'Em serviço'
      end,
      updated_at = v_now
  where id = v_user;

  return public.get_my_time_clock_state();
end;
$function$;

CREATE OR REPLACE FUNCTION public.time_clock_heartbeat(p_close boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
  v_deadline timestamptz;
begin
  if v_user is null then
    return jsonb_build_object('active', false, 'closed', false, 'reason', 'no_session');
  end if;

  perform 1 from public.profiles where id = v_user for update;
  if hpsr_private.close_expired_time_clock_pauses(v_user) > 0 then
    return jsonb_build_object('active', false, 'closed', true, 'reason', 'pause_timeout_2h');
  end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1
  for update;

  if v_entry.id is null then
    return jsonb_build_object('active', false, 'closed', false);
  end if;

  if p_close then
    perform public.time_clock_close_entry_at(v_entry.id, v_now);
    return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_now);
  end if;

  if v_entry.close_requested_at is not null then
    v_deadline := v_entry.close_requested_at + interval '3 minutes';
    if v_now >= v_deadline then
      perform public.time_clock_close_entry_at(v_entry.id, v_deadline);
      return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_deadline);
    end if;
  end if;

  update public.time_clock_entries
  set last_heartbeat_at = v_now,
      close_requested_at = null,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object('active', true, 'closed', false, 'heartbeatAt', v_now);
end;
$function$;

CREATE OR REPLACE FUNCTION public.time_clock_prepare_action()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('active', false, 'reason', 'no_session');
  end if;

  perform 1 from public.profiles where id = v_user for update;
  if hpsr_private.close_expired_time_clock_pauses(v_user) > 0 then
    return jsonb_build_object('active', false, 'reason', 'pause_timeout_2h');
  end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc
  limit 1
  for update;

  if v_entry.id is null then
    update public.profiles
    set service_status = 'Fora de serviço', updated_at = v_now
    where id = v_user and service_status <> 'Fora de serviço';

    return jsonb_build_object('active', false, 'reason', 'no_open_entry');
  end if;

  update public.time_clock_entries
  set close_requested_at = null,
      last_heartbeat_at = v_now,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object(
    'active', true,
    'entryId', v_entry.id,
    'status', v_entry.status
  );
end;
$function$;

-- Uma execução interna por minuto, sem consultas novas no navegador.
select cron.schedule('hpsr-time-clock-pause-safety-close', '* * * * *',
  'select hpsr_private.close_expired_time_clock_pauses();');
