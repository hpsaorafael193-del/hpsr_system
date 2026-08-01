-- Encerra o ponto quando a sessão deixa de manter presença no sistema.
-- Um único update a cada 30 segundos por usuário ativo; sem polling de leitura.

alter table public.time_clock_entries
  add column if not exists last_heartbeat_at timestamptz;

create index if not exists time_clock_entries_open_heartbeat_idx
  on public.time_clock_entries(user_id, last_heartbeat_at)
  where closed_at is null;

create or replace function public.time_clock_close_entry_at(
  p_entry_id uuid,
  p_closed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.time_clock_entries%rowtype;
begin
  select * into v_entry
  from public.time_clock_entries
  where id = p_entry_id and user_id = auth.uid() and closed_at is null
  for update;

  if v_entry.id is null then return; end if;

  update public.time_clock_segments
    set ended_at = greatest(started_at, p_closed_at)
    where entry_id = v_entry.id and ended_at is null;
  update public.time_clock_breaks
    set ended_at = greatest(started_at, p_closed_at)
    where entry_id = v_entry.id and ended_at is null;
  update public.time_clock_entries
    set status = 'Encerrado', closed_at = p_closed_at, updated_at = now()
    where id = v_entry.id;
  perform public.time_clock_recalculate_entry(v_entry.id);
  update public.profiles set service_status = 'Fora de serviço', updated_at = now() where id = auth.uid();
end;
$$;

create or replace function public.time_clock_heartbeat(p_close boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
  v_close_at timestamptz;
begin
  if v_user is null then raise exception 'Sessão não encontrada.'; end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1
  for update;

  if v_entry.id is null then return jsonb_build_object('active', false, 'closed', false); end if;

  if p_close then
    perform public.time_clock_close_entry_at(v_entry.id, v_now);
    return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_now);
  end if;

  if v_entry.last_heartbeat_at is not null and v_entry.last_heartbeat_at < v_now - interval '45 seconds' then
    v_close_at := v_entry.last_heartbeat_at;
    perform public.time_clock_close_entry_at(v_entry.id, v_close_at);
    return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_close_at);
  end if;

  update public.time_clock_entries
    set last_heartbeat_at = v_now, updated_at = v_now
    where id = v_entry.id;

  return jsonb_build_object('active', true, 'closed', false, 'heartbeatAt', v_now);
end;
$$;

grant execute on function public.time_clock_heartbeat(boolean) to authenticated;
grant execute on function public.time_clock_close_entry_at(uuid, timestamptz) to authenticated;
