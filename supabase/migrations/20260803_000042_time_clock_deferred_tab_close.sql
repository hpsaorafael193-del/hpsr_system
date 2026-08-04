-- Evita encerramentos indevidos em recargas, navegação interna, suspensão do navegador
-- e oscilações rápidas. O fechamento da aba apenas agenda um encerramento com tolerância.

alter table public.time_clock_entries
  add column if not exists close_requested_at timestamptz;

create index if not exists time_clock_entries_pending_close_idx
  on public.time_clock_entries(close_requested_at)
  where closed_at is null and close_requested_at is not null;

create or replace function public.time_clock_request_deferred_close()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
begin
  if v_user is null then raise exception 'Sessão não encontrada.'; end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1
  for update;

  if v_entry.id is null then
    return jsonb_build_object('active', false, 'scheduled', false);
  end if;

  update public.time_clock_entries
  set close_requested_at = v_now,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object(
    'active', true,
    'scheduled', true,
    'closeAfter', v_now + interval '3 minutes'
  );
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
  v_deadline timestamptz;
begin
  if v_user is null then raise exception 'Sessão não encontrada.'; end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1
  for update;

  if v_entry.id is null then
    return jsonb_build_object('active', false, 'closed', false);
  end if;

  -- Logout e encerramento manual continuam imediatos.
  if p_close then
    perform public.time_clock_close_entry_at(v_entry.id, v_now);
    return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_now);
  end if;

  -- Ao retornar após o período de tolerância, encerra no limite agendado.
  if v_entry.close_requested_at is not null then
    v_deadline := v_entry.close_requested_at + interval '3 minutes';
    if v_now >= v_deadline then
      perform public.time_clock_close_entry_at(v_entry.id, v_deadline);
      return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_deadline);
    end if;
  end if;

  -- Recarga, navegação ou retorno rápido cancelam o fechamento pendente.
  update public.time_clock_entries
  set last_heartbeat_at = v_now,
      close_requested_at = null,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object('active', true, 'closed', false, 'heartbeatAt', v_now);
end;
$$;

grant execute on function public.time_clock_request_deferred_close() to authenticated;
grant execute on function public.time_clock_heartbeat(boolean) to authenticated;
