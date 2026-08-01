-- Mantém o ponto ativo quando a aba está inativa, minimizada ou em segundo plano.
-- O intervalo entre heartbeats não representa ausência: navegadores podem suspender
-- temporizadores em segundo plano. O encerramento permanece explícito por logout,
-- pagehide/fechamento ou evento offline enviado pelo cliente.

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

  if p_close then
    perform public.time_clock_close_entry_at(v_entry.id, v_now);
    return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_now);
  end if;

  update public.time_clock_entries
  set last_heartbeat_at = v_now,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object('active', true, 'closed', false, 'heartbeatAt', v_now);
end;
$$;

grant execute on function public.time_clock_heartbeat(boolean) to authenticated;
