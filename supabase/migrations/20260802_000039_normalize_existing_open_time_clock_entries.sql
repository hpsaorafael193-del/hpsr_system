-- Normaliza pontos que já estavam abertos antes da adoção do fluxo de presença.
-- A migração encerra uma única vez todos os pontos atualmente abertos, usando o
-- último heartbeat conhecido; para registros legados sem heartbeat, usa a última
-- atualização válida do próprio ponto. Após isso, os próximos pontos passam a
-- seguir integralmente o fluxo atual do sistema.

do $$
declare
  v_entry record;
begin
  create temporary table if not exists _hpsr_open_time_clock_entries (
    entry_id uuid primary key,
    user_id uuid not null,
    close_at timestamptz not null,
    previous_data jsonb
  ) on commit drop;

  truncate table _hpsr_open_time_clock_entries;

  insert into _hpsr_open_time_clock_entries(entry_id, user_id, close_at, previous_data)
  select
    e.id,
    e.user_id,
    greatest(
      e.opened_at,
      least(now(), coalesce(e.last_heartbeat_at, e.updated_at, e.opened_at))
    ),
    to_jsonb(e)
  from public.time_clock_entries e
  where e.closed_at is null;

  update public.time_clock_segments s
  set ended_at = greatest(s.started_at, legacy.close_at)
  from _hpsr_open_time_clock_entries legacy
  where s.entry_id = legacy.entry_id
    and s.ended_at is null;

  update public.time_clock_breaks b
  set ended_at = greatest(b.started_at, legacy.close_at)
  from _hpsr_open_time_clock_entries legacy
  where b.entry_id = legacy.entry_id
    and b.ended_at is null;

  update public.time_clock_entries e
  set status = 'Encerrado',
      closed_at = legacy.close_at,
      updated_at = now()
  from _hpsr_open_time_clock_entries legacy
  where e.id = legacy.entry_id
    and e.closed_at is null;

  update public.profiles p
  set service_status = 'Fora de serviço',
      updated_at = now()
  where p.id in (select distinct user_id from _hpsr_open_time_clock_entries);

  insert into public.time_clock_audit(
    entry_id,
    target_user_id,
    actor_user_id,
    action,
    reason,
    previous_data,
    new_data
  )
  select
    legacy.entry_id,
    legacy.user_id,
    null,
    'Encerramento de ponto legado',
    'Normalização única de pontos que já estavam abertos antes do fluxo atual de presença.',
    legacy.previous_data,
    to_jsonb(e)
  from _hpsr_open_time_clock_entries legacy
  join public.time_clock_entries e on e.id = legacy.entry_id;

  for v_entry in
    select entry_id from _hpsr_open_time_clock_entries
  loop
    perform public.time_clock_recalculate_entry(v_entry.entry_id);
  end loop;
end;
$$;
