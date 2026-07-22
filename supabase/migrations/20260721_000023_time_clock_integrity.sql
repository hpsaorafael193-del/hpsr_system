create or replace function public.time_clock_recalculate_entry(p_entry_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seconds bigint := 0;
begin
  select coalesce(floor(sum(extract(epoch from (ended_at - started_at))))::bigint, 0)
    into v_seconds
  from public.time_clock_segments
  where entry_id = p_entry_id
    and ended_at is not null
    and ended_at >= started_at;

  update public.time_clock_entries
  set worked_seconds = greatest(v_seconds, 0), updated_at = now()
  where id = p_entry_id;

  return greatest(v_seconds, 0);
end;
$$;

create or replace function public.time_clock_sync_entry_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
begin
  v_entry_id := coalesce(new.entry_id, old.entry_id);
  if v_entry_id is not null then
    perform public.time_clock_recalculate_entry(v_entry_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists time_clock_segments_sync_total on public.time_clock_segments;
create trigger time_clock_segments_sync_total
after insert or update or delete on public.time_clock_segments
for each row execute function public.time_clock_sync_entry_total();

create or replace function public.time_clock_month_ranking(p_month date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select
      (date_trunc('month', p_month::timestamp) at time zone 'America/Sao_Paulo') as month_start,
      ((date_trunc('month', p_month::timestamp) + interval '1 month') at time zone 'America/Sao_Paulo') as month_end
  ), totals as (
    select s.user_id,
           floor(sum(extract(epoch from (
             least(s.ended_at, b.month_end) - greatest(s.started_at, b.month_start)
           ))))::bigint as worked_seconds
    from public.time_clock_segments s
    cross join bounds b
    join public.time_clock_entries e on e.id = s.entry_id and e.closed_at is not null
    where s.ended_at is not null
      and s.started_at < b.month_end
      and s.ended_at > b.month_start
    group by s.user_id
  ), ranked as (
    select row_number() over(order by t.worked_seconds desc, p.name asc) as position,
           t.user_id, p.name as user_name, t.worked_seconds
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

do $$
declare
  v_entry record;
begin
  for v_entry in select id from public.time_clock_entries where closed_at is not null loop
    perform public.time_clock_recalculate_entry(v_entry.id);
  end loop;
end;
$$;
