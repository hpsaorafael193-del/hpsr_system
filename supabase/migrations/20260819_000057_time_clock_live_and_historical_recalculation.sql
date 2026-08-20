-- Corrige a leitura ao vivo do ponto e reconcilia totais históricos com os segmentos reais.
-- 1) pontos abertos passam a expor o segmento atual no total exibido;
-- 2) ranking do mês atual inclui trabalho ainda em andamento;
-- 3) pontos encerrados antigos são recalculados a partir dos segmentos;
-- 4) quando um ponto encerrado possui exatamente um último segmento sem ended_at,
--    esse segmento é encerrado com closed_at (reparo seguro de legado);
-- 5) rankings mensais arquivados são reconstruídos após a reconciliação.

-- Repara somente casos não ambíguos: um único segmento aberto em uma jornada já encerrada.
with dangling as (
  select s.entry_id, min(s.id::text)::uuid as segment_id
  from public.time_clock_segments s
  join public.time_clock_entries e on e.id = s.entry_id
  where e.closed_at is not null
    and s.ended_at is null
    and s.started_at <= e.closed_at
  group by s.entry_id
  having count(*) = 1
)
update public.time_clock_segments s
set ended_at = e.closed_at
from dangling d
join public.time_clock_entries e on e.id = d.entry_id
where s.id = d.segment_id
  and s.ended_at is null;

-- Reconcilia todos os totais persistidos. Para jornadas abertas, worked_seconds continua
-- representando apenas segmentos já encerrados; o segmento corrente é calculado ao vivo.
do $$
declare
  v_entry record;
begin
  for v_entry in select id from public.time_clock_entries loop
    perform public.time_clock_recalculate_entry(v_entry.id);
  end loop;
end;
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
  ), effective_segments as (
    select
      s.user_id,
      s.started_at,
      case
        when s.ended_at is not null then s.ended_at
        when e.closed_at is not null and e.closed_at >= s.started_at then e.closed_at
        when e.closed_at is null and e.status = 'Em serviço' then now()
        else null
      end as effective_end
    from public.time_clock_segments s
    join public.time_clock_entries e on e.id = s.entry_id
  ), totals as (
    select es.user_id,
           floor(sum(greatest(0, extract(epoch from (
             least(es.effective_end, b.month_end) - greatest(es.started_at, b.month_start)
           )))))::bigint as worked_seconds
    from effective_segments es
    cross join bounds b
    where es.effective_end is not null
      and es.started_at < b.month_end
      and es.effective_end > b.month_start
    group by es.user_id
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
  v_now timestamptz := now();
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
    'workedSeconds', coalesce(live.worked_seconds, 0),
    'status', e.status
  ) order by (e.closed_at is null) desc, e.opened_at desc), '[]'::jsonb)
  into v_entries
  from (select * from public.time_clock_entries order by opened_at desc limit 500) e
  left join public.profiles p on p.id = e.user_id
  left join lateral (
    select coalesce(floor(sum(greatest(0, extract(epoch from (
      case
        when s.ended_at is not null then s.ended_at
        when e.closed_at is not null and e.closed_at >= s.started_at then e.closed_at
        when e.closed_at is null and e.status = 'Em serviço' then v_now
        else s.started_at
      end - s.started_at
    )))))::bigint, 0) as worked_seconds
    from public.time_clock_segments s
    where s.entry_id = e.id
  ) live on true;

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
    'currentRanking', v_current_ranking,
    'serverNow', v_now
  );
end;
$$;

grant execute on function public.get_time_clock_admin_report() to authenticated;

-- Recria os relatórios de meses já encerrados com os segmentos reconciliados.
select public.close_previous_time_clock_months();
