-- Correção do ranking mensal do ponto:
-- 1) usa o mês institucional de São Paulo;
-- 2) contabiliza somente segmentos encerrados de pontos encerrados;
-- 3) mantém o mês atual ao vivo e arquiva somente meses concluídos.

create or replace function public.time_clock_current_month()
returns date
language sql
stable
security definer
set search_path = public
as $$
  select date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
$$;

create or replace function public.time_clock_month_ranking(p_month date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with local_bounds as (
    select date_trunc('month', p_month::timestamp)::date as month_date
  ), bounds as (
    select (month_date::timestamp at time zone 'America/Sao_Paulo') as month_start,
           ((month_date + interval '1 month')::timestamp at time zone 'America/Sao_Paulo') as month_end
    from local_bounds
  ), totals as (
    select s.user_id,
           floor(sum(greatest(0, extract(epoch from (
             least(s.ended_at, b.month_end) - greatest(s.started_at, b.month_start)
           )))))::bigint as worked_seconds
    from public.time_clock_segments s
    join public.time_clock_entries e
      on e.id = s.entry_id
     and e.closed_at is not null
     and e.status = 'Encerrado'
    cross join bounds b
    where s.ended_at is not null
      and s.started_at < b.month_end
      and s.ended_at > b.month_start
    group by s.user_id
  ), ranked as (
    select row_number() over(
             order by t.worked_seconds desc,
                      coalesce(nullif(trim(p.name), ''), 'Usuário') asc,
                      t.user_id asc
           ) as position,
           t.user_id,
           coalesce(nullif(trim(p.name), ''), 'Usuário') as user_name,
           t.worked_seconds
    from totals t
    left join public.profiles p on p.id = t.user_id
    where t.worked_seconds > 0
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'position', position,
    'userId', user_id,
    'user', user_name,
    'workedSeconds', worked_seconds
  ) order by position), '[]'::jsonb)
  from ranked;
$$;

create or replace function public.refresh_time_clock_month_report(p_month date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', p_month::timestamp)::date;
  v_current date := public.time_clock_current_month();
  v_ranking jsonb;
  v_total_users integer;
  v_total_seconds bigint;
begin
  -- O mês atual nunca é arquivado: seu ranking é calculado ao vivo.
  if v_month >= v_current then
    delete from public.time_clock_monthly_reports where month_start >= v_current;
    return;
  end if;

  v_ranking := public.time_clock_month_ranking(v_month);
  select count(*), coalesce(sum((item->>'workedSeconds')::bigint), 0)
    into v_total_users, v_total_seconds
  from jsonb_array_elements(v_ranking) item;

  insert into public.time_clock_monthly_reports(
    month_start, ranking, total_users, total_worked_seconds, closed_at, updated_at
  )
  values (v_month, v_ranking, v_total_users, v_total_seconds, now(), now())
  on conflict (month_start) do update set
    ranking = excluded.ranking,
    total_users = excluded.total_users,
    total_worked_seconds = excluded.total_worked_seconds,
    closed_at = coalesce(public.time_clock_monthly_reports.closed_at, excluded.closed_at),
    updated_at = now();
end;
$$;

create or replace function public.close_previous_time_clock_months()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date;
  v_current date := public.time_clock_current_month();
  v_first date;
begin
  delete from public.time_clock_monthly_reports where month_start >= v_current;

  select min(date_trunc('month', timezone('America/Sao_Paulo', started_at))::date)
    into v_first
  from public.time_clock_segments;

  if v_first is null or v_first >= v_current then
    return;
  end if;

  for v_month in
    select generate_series(v_first, v_current - interval '1 month', interval '1 month')::date
  loop
    perform public.refresh_time_clock_month_report(v_month);
  end loop;
end;
$$;

create or replace function public.time_clock_action(p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
  v_break public.time_clock_breaks%rowtype;
  v_seconds bigint := 0;
begin
  if v_user is null then raise exception 'Sessão não encontrada.'; end if;
  perform public.close_previous_time_clock_months();

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
$$;

create or replace function public.get_my_time_clock_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create or replace function public.admin_correct_time_clock_entry(
  p_entry_id uuid,
  p_opened_at timestamptz,
  p_closed_at timestamptz,
  p_worked_seconds bigint,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb;
  v_target uuid;
  v_old_opened timestamptz;
  v_old_closed timestamptz;
begin
  if not public.is_time_clock_admin() then raise exception 'Acesso administrativo necessário.'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'Informe o motivo da correção.'; end if;
  if p_closed_at is null or p_closed_at < p_opened_at then raise exception 'Período inválido.'; end if;
  if p_worked_seconds < 0 or p_worked_seconds > extract(epoch from (p_closed_at - p_opened_at)) then
    raise exception 'Tempo trabalhado inválido.';
  end if;

  select to_jsonb(e), e.user_id, e.opened_at, e.closed_at
    into v_before, v_target, v_old_opened, v_old_closed
  from public.time_clock_entries e
  where e.id = p_entry_id
  for update;
  if v_target is null then raise exception 'Ponto não encontrado.'; end if;

  delete from public.time_clock_segments where entry_id = p_entry_id;
  delete from public.time_clock_breaks where entry_id = p_entry_id;

  -- A correção administrativa registra apenas o período efetivamente trabalhado.
  -- Ele permanece limitado ao intervalo informado e é usado pelo ranking mensal.
  if p_worked_seconds > 0 then
    insert into public.time_clock_segments(entry_id, user_id, started_at, ended_at)
    values (
      p_entry_id,
      v_target,
      p_opened_at,
      least(p_closed_at, p_opened_at + make_interval(secs => p_worked_seconds::double precision))
    );
  end if;

  update public.time_clock_entries
  set opened_at = p_opened_at,
      closed_at = p_closed_at,
      worked_seconds = p_worked_seconds,
      status = 'Encerrado',
      updated_at = now()
  where id = p_entry_id;

  insert into public.time_clock_audit(
    entry_id, target_user_id, actor_user_id, action, reason, previous_data, new_data
  )
  values (
    p_entry_id, v_target, auth.uid(), 'Correção de ponto', trim(p_reason), v_before,
    jsonb_build_object(
      'opened_at', p_opened_at,
      'closed_at', p_closed_at,
      'worked_seconds', p_worked_seconds
    )
  );

  if v_old_opened is not null then
    perform public.refresh_time_clock_month_report(
      date_trunc('month', timezone('America/Sao_Paulo', v_old_opened))::date
    );
  end if;
  if v_old_closed is not null then
    perform public.refresh_time_clock_month_report(
      date_trunc('month', timezone('America/Sao_Paulo', v_old_closed))::date
    );
  end if;
  perform public.refresh_time_clock_month_report(
    date_trunc('month', timezone('America/Sao_Paulo', p_opened_at))::date
  );
  perform public.refresh_time_clock_month_report(
    date_trunc('month', timezone('America/Sao_Paulo', p_closed_at))::date
  );
end;
$$;

create or replace function public.get_time_clock_admin_report()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entries jsonb;
  v_reports jsonb;
  v_audit jsonb;
begin
  if not public.is_time_clock_admin() then raise exception 'Acesso administrativo necessário.'; end if;
  perform public.close_previous_time_clock_months();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id, 'userId', e.user_id,
    'user', coalesce(nullif(trim(p.name), ''), 'Usuário'),
    'openedAt', e.opened_at, 'closedAt', e.closed_at,
    'workedSeconds', e.worked_seconds, 'status', e.status
  ) order by e.opened_at desc), '[]'::jsonb)
  into v_entries
  from (select * from public.time_clock_entries order by opened_at desc limit 300) e
  left join public.profiles p on p.id = e.user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'monthStart', r.month_start, 'ranking', r.ranking,
    'totalUsers', r.total_users,
    'totalWorkedSeconds', r.total_worked_seconds,
    'closedAt', r.closed_at
  ) order by r.month_start desc), '[]'::jsonb)
  into v_reports
  from public.time_clock_monthly_reports r
  where r.month_start < public.time_clock_current_month();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'entryId', a.entry_id,
    'actor', actor.name, 'target', target.name,
    'action', a.action, 'reason', a.reason,
    'createdAt', a.created_at
  ) order by a.created_at desc), '[]'::jsonb)
  into v_audit
  from (select * from public.time_clock_audit order by created_at desc limit 200) a
  left join public.profiles actor on actor.id = a.actor_user_id
  left join public.profiles target on target.id = a.target_user_id;

  return jsonb_build_object(
    'entries', v_entries,
    'reports', v_reports,
    'audit', v_audit,
    'currentRanking', public.time_clock_month_ranking(public.time_clock_current_month())
  );
end;
$$;

-- Remove relatórios criados indevidamente para o mês ainda em andamento e
-- recalcula todos os meses já encerrados com a regra corrigida.
delete from public.time_clock_monthly_reports
where month_start >= public.time_clock_current_month();
select public.close_previous_time_clock_months();

grant execute on function public.time_clock_current_month() to authenticated;
grant execute on function public.get_my_time_clock_state() to authenticated;
grant execute on function public.time_clock_action(text) to authenticated;
grant execute on function public.get_time_clock_admin_report() to authenticated;
grant execute on function public.admin_correct_time_clock_entry(uuid, timestamptz, timestamptz, bigint, text) to authenticated;
