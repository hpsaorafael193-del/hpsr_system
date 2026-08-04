-- Protege ações de pausa/retorno/finalização contra estado visual desatualizado.
-- A função reaproveita o ponto aberto existente e cancela qualquer fechamento
-- diferido antes da ação solicitada, sem criar polling ou consultas recorrentes.

create or replace function public.time_clock_prepare_action()
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
  if v_user is null then
    return jsonb_build_object('active', false, 'reason', 'no_session');
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
$$;

revoke all on function public.time_clock_prepare_action() from public;
grant execute on function public.time_clock_prepare_action() to authenticated;
