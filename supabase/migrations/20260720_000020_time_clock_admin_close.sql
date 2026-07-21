-- Diretoria e Desenvolvedor podem encerrar pontos ativos e ajustar o horário de encerramento.
-- A ação não exige justificativa, mas permanece registrada na auditoria técnica.

create or replace function public.admin_set_time_clock_closed_at(
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
  v_before jsonb;
  v_last_segment public.time_clock_segments%rowtype;
  v_last_break public.time_clock_breaks%rowtype;
  v_was_active boolean;
  v_old_closed_at timestamptz;
  v_seconds bigint;
begin
  if not public.is_time_clock_admin() then
    raise exception 'Acesso restrito à Diretoria e ao Desenvolvedor.';
  end if;

  select * into v_entry
  from public.time_clock_entries
  where id = p_entry_id
  for update;

  if v_entry.id is null then raise exception 'Ponto não encontrado.'; end if;
  if p_closed_at is null then raise exception 'Informe o horário de encerramento.'; end if;
  if p_closed_at < v_entry.opened_at then raise exception 'O encerramento não pode ser anterior à entrada.'; end if;
  if p_closed_at > now() + interval '1 minute' then raise exception 'O encerramento não pode estar no futuro.'; end if;

  v_before := to_jsonb(v_entry);
  v_was_active := v_entry.closed_at is null;
  v_old_closed_at := v_entry.closed_at;

  select * into v_last_segment
  from public.time_clock_segments
  where entry_id = p_entry_id
  order by started_at desc
  limit 1;

  select * into v_last_break
  from public.time_clock_breaks
  where entry_id = p_entry_id
  order by started_at desc
  limit 1;

  -- Remove intervalos que começaram depois do novo encerramento e corta os que o ultrapassam.
  delete from public.time_clock_segments
  where entry_id = p_entry_id and started_at >= p_closed_at;
  delete from public.time_clock_breaks
  where entry_id = p_entry_id and started_at >= p_closed_at;

  update public.time_clock_segments
  set ended_at = p_closed_at
  where entry_id = p_entry_id
    and started_at < p_closed_at
    and (ended_at is null or ended_at > p_closed_at);

  update public.time_clock_breaks
  set ended_at = p_closed_at
  where entry_id = p_entry_id
    and started_at < p_closed_at
    and (ended_at is null or ended_at > p_closed_at);

  -- Ao ampliar um ponto já encerrado, prolonga somente o último estado conhecido.
  if not v_was_active and v_old_closed_at is not null and p_closed_at > v_old_closed_at then
    if v_last_segment.id is not null
       and v_last_segment.ended_at = v_old_closed_at
       and (v_last_break.id is null or v_last_segment.started_at >= v_last_break.started_at) then
      update public.time_clock_segments set ended_at = p_closed_at where id = v_last_segment.id;
    elsif v_last_break.id is not null and v_last_break.ended_at = v_old_closed_at then
      update public.time_clock_breaks set ended_at = p_closed_at where id = v_last_break.id;
    end if;
  end if;

  update public.time_clock_entries
  set closed_at = p_closed_at,
      status = 'Encerrado',
      updated_at = now()
  where id = p_entry_id;

  v_seconds := public.time_clock_recalculate_entry(p_entry_id);

  if v_was_active then
    update public.profiles
    set service_status = 'Fora de serviço', updated_at = now()
    where id = v_entry.user_id;
  end if;

  insert into public.time_clock_audit(
    entry_id, target_user_id, actor_user_id, action, reason, previous_data, new_data
  ) values (
    p_entry_id,
    v_entry.user_id,
    auth.uid(),
    case when v_was_active then 'Encerramento administrativo de ponto' else 'Ajuste administrativo do encerramento' end,
    null,
    v_before,
    jsonb_build_object('closed_at', p_closed_at, 'worked_seconds', v_seconds)
  );

  perform public.refresh_time_clock_month_report(
    date_trunc('month', timezone('America/Sao_Paulo', v_entry.opened_at))::date
  );
  perform public.refresh_time_clock_month_report(
    date_trunc('month', timezone('America/Sao_Paulo', p_closed_at))::date
  );
  if v_old_closed_at is not null then
    perform public.refresh_time_clock_month_report(
      date_trunc('month', timezone('America/Sao_Paulo', v_old_closed_at))::date
    );
  end if;
end;
$$;

grant execute on function public.admin_set_time_clock_closed_at(uuid, timestamptz) to authenticated;
