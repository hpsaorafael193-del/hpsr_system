-- Inclui todos os profissionais aprovados no ranking mensal atual,
-- mesmo quando ainda não possuem ponto encerrado no período.

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
  v_current_ranking jsonb;
begin
  if not public.is_time_clock_admin() then
    raise exception 'Acesso administrativo necessário.';
  end if;

  perform public.close_previous_time_clock_months();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'userId', e.user_id,
    'user', coalesce(nullif(trim(p.name), ''), 'Usuário'),
    'openedAt', e.opened_at,
    'closedAt', e.closed_at,
    'workedSeconds', e.worked_seconds,
    'status', e.status
  ) order by (e.closed_at is null) desc, e.opened_at desc), '[]'::jsonb)
  into v_entries
  from (select * from public.time_clock_entries order by opened_at desc limit 500) e
  left join public.profiles p on p.id = e.user_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'monthStart', r.month_start,
    'ranking', r.ranking,
    'totalUsers', r.total_users,
    'totalWorkedSeconds', r.total_worked_seconds,
    'closedAt', r.closed_at
  ) order by r.month_start desc), '[]'::jsonb)
  into v_reports
  from public.time_clock_monthly_reports r
  where r.month_start < public.time_clock_current_month();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'entryId', a.entry_id,
    'actor', actor.name,
    'target', target.name,
    'action', a.action,
    'reason', a.reason,
    'createdAt', a.created_at
  ) order by a.created_at desc), '[]'::jsonb)
  into v_audit
  from (select * from public.time_clock_audit order by created_at desc limit 200) a
  left join public.profiles actor on actor.id = a.actor_user_id
  left join public.profiles target on target.id = a.target_user_id;

  with existing_ranking as (
    select
      (item->>'userId')::uuid as user_id,
      greatest(coalesce((item->>'workedSeconds')::bigint, 0), 0) as worked_seconds
    from jsonb_array_elements(public.time_clock_month_ranking(public.time_clock_current_month())) item
  ), approved_professionals as (
    select
      p.id,
      coalesce(nullif(trim(p.name), ''), 'Profissional') as name,
      coalesce(r.worked_seconds, 0) as worked_seconds
    from public.profiles p
    left join existing_ranking r on r.user_id = p.id
    where p.access_status = 'Aprovado'
  ), ranked as (
    select
      row_number() over(order by worked_seconds desc, name asc) as position,
      id,
      name,
      worked_seconds
    from approved_professionals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'position', position,
    'userId', id,
    'user', name,
    'workedSeconds', worked_seconds
  ) order by position), '[]'::jsonb)
  into v_current_ranking
  from ranked;

  return jsonb_build_object(
    'entries', v_entries,
    'reports', v_reports,
    'audit', v_audit,
    'currentRanking', v_current_ranking
  );
end;
$$;

grant execute on function public.get_time_clock_admin_report() to authenticated;
