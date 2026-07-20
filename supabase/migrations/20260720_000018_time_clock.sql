create extension if not exists pgcrypto;

create table if not exists public.time_clock_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'Em serviço' check (status in ('Em serviço', 'Em pausa', 'Encerrado')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  worked_seconds bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists time_clock_one_open_entry_per_user
  on public.time_clock_entries(user_id)
  where closed_at is null;
create index if not exists time_clock_entries_user_opened_idx on public.time_clock_entries(user_id, opened_at desc);

create table if not exists public.time_clock_segments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.time_clock_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create unique index if not exists time_clock_one_open_segment_per_entry
  on public.time_clock_segments(entry_id)
  where ended_at is null;
create index if not exists time_clock_segments_month_idx on public.time_clock_segments(started_at, ended_at);

create table if not exists public.time_clock_breaks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.time_clock_entries(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create unique index if not exists time_clock_one_open_break_per_entry
  on public.time_clock_breaks(entry_id)
  where ended_at is null;

create table if not exists public.time_clock_monthly_reports (
  month_start date primary key,
  ranking jsonb not null default '[]'::jsonb,
  total_users integer not null default 0,
  total_worked_seconds bigint not null default 0,
  closed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_clock_audit (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.time_clock_entries(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  reason text,
  previous_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.time_clock_entries enable row level security;
alter table public.time_clock_segments enable row level security;
alter table public.time_clock_breaks enable row level security;
alter table public.time_clock_monthly_reports enable row level security;
alter table public.time_clock_audit enable row level security;

create or replace function public.is_time_clock_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and (
        lower(coalesce(p.role, '')) like '%diretor%'
        or lower(coalesce(p.role, '')) like '%diretoria%'
        or lower(coalesce(p.role, '')) like '%desenvolvedor%'
        or lower(coalesce(p.role, '')) like '%dev%'
      )
  );
$$;

create policy "time clock own entries read" on public.time_clock_entries
  for select to authenticated using (user_id = auth.uid() or public.is_time_clock_admin());
create policy "time clock own segments read" on public.time_clock_segments
  for select to authenticated using (user_id = auth.uid() or public.is_time_clock_admin());
create policy "time clock own breaks read" on public.time_clock_breaks
  for select to authenticated using (user_id = auth.uid() or public.is_time_clock_admin());
create policy "time clock reports authenticated read" on public.time_clock_monthly_reports
  for select to authenticated using (public.is_time_clock_admin());
create policy "time clock audit admin read" on public.time_clock_audit
  for select to authenticated using (public.is_time_clock_admin());

create or replace function public.time_clock_month_ranking(p_month date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select date_trunc('month', p_month::timestamptz) as month_start,
           date_trunc('month', p_month::timestamptz) + interval '1 month' as month_end
  ), totals as (
    select s.user_id,
           floor(sum(extract(epoch from (
             least(coalesce(s.ended_at, now()), b.month_end) - greatest(s.started_at, b.month_start)
           ))))::bigint as worked_seconds
    from public.time_clock_segments s
    cross join bounds b
    join public.time_clock_entries e on e.id = s.entry_id and e.closed_at is not null
    where s.started_at < b.month_end
      and coalesce(s.ended_at, now()) > b.month_start
    group by s.user_id
  ), ranked as (
    select row_number() over(order by t.worked_seconds desc, p.name asc) as position,
           t.user_id,
           p.name as user_name,
           t.worked_seconds
    from totals t
    join public.profiles p on p.id = t.user_id
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
  v_month date := date_trunc('month', p_month)::date;
  v_ranking jsonb;
  v_total_users integer;
  v_total_seconds bigint;
begin
  v_ranking := public.time_clock_month_ranking(v_month);
  select count(*), coalesce(sum((item->>'workedSeconds')::bigint), 0)
    into v_total_users, v_total_seconds
  from jsonb_array_elements(v_ranking) item;

  insert into public.time_clock_monthly_reports(month_start, ranking, total_users, total_worked_seconds, closed_at, updated_at)
  values (v_month, v_ranking, v_total_users, v_total_seconds, now(), now())
  on conflict (month_start) do update set
    ranking = excluded.ranking,
    total_users = excluded.total_users,
    total_worked_seconds = excluded.total_worked_seconds,
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
  v_current date := date_trunc('month', now())::date;
begin
  for v_month in
    select generate_series(
      coalesce((select min(date_trunc('month', started_at)::date) from public.time_clock_segments), v_current),
      v_current - interval '1 month',
      interval '1 month'
    )::date
  loop
    perform public.refresh_time_clock_month_report(v_month);
  end loop;
end;
$$;

create or replace function public.time_clock_recalculate_entry(p_entry_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seconds bigint;
begin
  select coalesce(floor(sum(extract(epoch from (ended_at - started_at))))::bigint, 0)
    into v_seconds
  from public.time_clock_segments
  where entry_id = p_entry_id and ended_at is not null;

  update public.time_clock_entries
  set worked_seconds = v_seconds, updated_at = now()
  where id = p_entry_id;
  return v_seconds;
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
    update public.time_clock_entries set status = 'Encerrado', closed_at = v_now, updated_at = v_now where id = v_entry.id;
    v_seconds := public.time_clock_recalculate_entry(v_entry.id);
    perform public.refresh_time_clock_month_report(date_trunc('month', v_entry.opened_at)::date);
    perform public.refresh_time_clock_month_report(date_trunc('month', v_now)::date);
  else
    raise exception 'Ação de ponto inválida.';
  end if;

  update public.profiles
  set service_status = case when p_action = 'finish' then 'Fora de serviço' when p_action = 'pause' then 'Em pausa' else 'Em serviço' end,
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
    select * into v_pause from public.time_clock_breaks where entry_id = v_entry.id and ended_at is null limit 1;
    select * into v_last_break from public.time_clock_breaks where entry_id = v_entry.id order by started_at desc limit 1;
    select coalesce(floor(sum(extract(epoch from (coalesce(ended_at, now()) - started_at))))::bigint, 0)
      into v_seconds from public.time_clock_segments where entry_id = v_entry.id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id, 'openedAt', e.opened_at, 'closedAt', e.closed_at,
    'workedSeconds', e.worked_seconds, 'status', e.status
  ) order by e.opened_at desc), '[]'::jsonb)
  into v_history
  from (select * from public.time_clock_entries where user_id = v_user and closed_at is not null order by opened_at desc limit 30) e;

  v_ranking := public.time_clock_month_ranking(date_trunc('month', now())::date);

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
begin
  if not public.is_time_clock_admin() then raise exception 'Acesso administrativo necessário.'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'Informe o motivo da correção.'; end if;
  if p_closed_at is null or p_closed_at < p_opened_at then raise exception 'Período inválido.'; end if;
  if p_worked_seconds < 0 or p_worked_seconds > extract(epoch from (p_closed_at - p_opened_at)) then raise exception 'Tempo trabalhado inválido.'; end if;

  select to_jsonb(e), e.user_id into v_before, v_target from public.time_clock_entries e where e.id = p_entry_id for update;
  if v_target is null then raise exception 'Ponto não encontrado.'; end if;

  delete from public.time_clock_segments where entry_id = p_entry_id;
  delete from public.time_clock_breaks where entry_id = p_entry_id;
  insert into public.time_clock_segments(entry_id, user_id, started_at, ended_at)
  values (p_entry_id, v_target, p_opened_at, p_opened_at + make_interval(secs => p_worked_seconds::double precision));
  update public.time_clock_entries
  set opened_at = p_opened_at, closed_at = p_closed_at, worked_seconds = p_worked_seconds,
      status = 'Encerrado', updated_at = now()
  where id = p_entry_id;

  insert into public.time_clock_audit(entry_id, target_user_id, actor_user_id, action, reason, previous_data, new_data)
  values (p_entry_id, v_target, auth.uid(), 'Correção de ponto', trim(p_reason), v_before,
    jsonb_build_object('opened_at', p_opened_at, 'closed_at', p_closed_at, 'worked_seconds', p_worked_seconds));

  perform public.refresh_time_clock_month_report(date_trunc('month', p_opened_at)::date);
  perform public.refresh_time_clock_month_report(date_trunc('month', p_closed_at)::date);
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
    'id', e.id, 'userId', e.user_id, 'user', p.name, 'openedAt', e.opened_at,
    'closedAt', e.closed_at, 'workedSeconds', e.worked_seconds, 'status', e.status
  ) order by e.opened_at desc), '[]'::jsonb)
  into v_entries
  from (select * from public.time_clock_entries order by opened_at desc limit 300) e
  join public.profiles p on p.id = e.user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'monthStart', r.month_start, 'ranking', r.ranking, 'totalUsers', r.total_users,
    'totalWorkedSeconds', r.total_worked_seconds, 'closedAt', r.closed_at
  ) order by r.month_start desc), '[]'::jsonb)
  into v_reports from public.time_clock_monthly_reports r;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'entryId', a.entry_id, 'actor', actor.name, 'target', target.name,
    'action', a.action, 'reason', a.reason, 'createdAt', a.created_at
  ) order by a.created_at desc), '[]'::jsonb)
  into v_audit
  from (select * from public.time_clock_audit order by created_at desc limit 200) a
  left join public.profiles actor on actor.id = a.actor_user_id
  left join public.profiles target on target.id = a.target_user_id;

  return jsonb_build_object('entries', v_entries, 'reports', v_reports, 'audit', v_audit,
    'currentRanking', public.time_clock_month_ranking(date_trunc('month', now())::date));
end;
$$;

grant execute on function public.get_my_time_clock_state() to authenticated;
grant execute on function public.time_clock_action(text) to authenticated;
grant execute on function public.get_time_clock_admin_report() to authenticated;
grant execute on function public.admin_correct_time_clock_entry(uuid, timestamptz, timestamptz, bigint, text) to authenticated;
