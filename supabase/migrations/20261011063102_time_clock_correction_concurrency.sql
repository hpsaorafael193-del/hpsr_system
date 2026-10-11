-- Mantém a versão de edição distinta mesmo dentro da mesma transação.
create or replace function hpsr_private.correct_time_clock_periods(
 p_entry_id uuid, p_periods jsonb, p_reason text, p_expected_updated_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 v_entry public.time_clock_entries%rowtype;
 v_period jsonb; v_start timestamptz; v_end timestamptz; v_previous_end timestamptz;
 v_before jsonb; v_ids jsonb := '[]'; v_id uuid; v_index integer := 0;
 v_month date; v_min timestamptz; v_max timestamptz;
begin
 if auth.uid() is null or not public.is_time_clock_admin() then
  raise exception 'Acesso restrito à Diretoria e ao Desenvolvedor.';
 end if;
 if nullif(trim(p_reason),'') is null or length(p_reason) > 2000 then raise exception 'Informe um motivo de até 2000 caracteres.'; end if;
 if jsonb_typeof(p_periods) is distinct from 'array' or jsonb_array_length(p_periods) not between 1 and 100 then raise exception 'Informe de 1 a 100 períodos.'; end if;
 select * into v_entry from public.time_clock_entries where id=p_entry_id for update;
 if not found then raise exception 'Ponto não encontrado.'; end if;
 if v_entry.closed_at is null then raise exception 'Encerre o ponto antes de corrigir.'; end if;
 if p_expected_updated_at is null or v_entry.updated_at is distinct from p_expected_updated_at then raise exception 'O ponto foi atualizado. Reabra a correção para conferir os horários.'; end if;
 -- Serializa correções do mesmo profissional.
 perform 1 from public.profiles where id=v_entry.user_id for update;
 for v_period in select value from jsonb_array_elements(p_periods) loop
  v_start := (v_period->>'startedAt')::timestamptz;
  v_end := (v_period->>'endedAt')::timestamptz;
  if v_start is null or v_end is null or not isfinite(v_start) or not isfinite(v_end) or v_end <= v_start then raise exception 'Entrada e saída devem formar um período válido.'; end if;
  if v_end > now() then raise exception 'Não é permitido informar horários futuros.'; end if;
  if v_previous_end is not null and v_start < v_previous_end then raise exception 'Os períodos devem estar em ordem e não podem se sobrepor.'; end if;
  if exists(select 1 from public.time_clock_segments s where s.user_id=v_entry.user_id and s.entry_id<>p_entry_id and s.started_at < v_end and coalesce(s.ended_at,now()) > v_start) then raise exception 'O período se sobrepõe a outro ponto do profissional.'; end if;
  v_previous_end := v_end;
 end loop;
 v_before := jsonb_build_object('entry',to_jsonb(v_entry),'segments',coalesce((select jsonb_agg(to_jsonb(s) order by s.started_at) from public.time_clock_segments s where s.entry_id=p_entry_id),'[]'::jsonb),'breaks',coalesce((select jsonb_agg(to_jsonb(b) order by b.started_at) from public.time_clock_breaks b where b.entry_id=p_entry_id),'[]'::jsonb));
 v_min := v_entry.opened_at; v_max := v_entry.closed_at;
 delete from public.time_clock_segments where entry_id=p_entry_id;
 delete from public.time_clock_breaks where entry_id=p_entry_id;
 for v_period in select value from jsonb_array_elements(p_periods) loop
  v_start := (v_period->>'startedAt')::timestamptz; v_end := (v_period->>'endedAt')::timestamptz;
  if v_index=0 then
   v_id:=p_entry_id;
   update public.time_clock_entries set opened_at=v_start,closed_at=v_end,status='Encerrado',worked_seconds=0,updated_at=clock_timestamp() where id=v_id;
  else
   insert into public.time_clock_entries(user_id,opened_at,closed_at,status) values(v_entry.user_id,v_start,v_end,'Encerrado') returning id into v_id;
  end if;
  insert into public.time_clock_segments(entry_id,user_id,started_at,ended_at) values(v_id,v_entry.user_id,v_start,v_end);
  perform public.time_clock_recalculate_entry(v_id);
  update public.time_clock_entries set updated_at=clock_timestamp() where id=v_id;
  v_ids:=v_ids || jsonb_build_array(v_id); v_index:=v_index+1;
  v_min:=least(v_min,v_start); v_max:=greatest(v_max,v_end);
 end loop;
 insert into public.time_clock_audit(entry_id,target_user_id,actor_user_id,action,reason,previous_data,new_data)
 values(p_entry_id,v_entry.user_id,auth.uid(),'Correção de ponto',trim(p_reason),v_before,jsonb_build_object('entryIds',v_ids,'periods',p_periods));
 -- Atualiza todos os meses envolvidos, inclusive meses intermediários.
 for v_month in select generate_series(date_trunc('month',v_min at time zone 'America/Sao_Paulo'),date_trunc('month',v_max at time zone 'America/Sao_Paulo'),interval '1 month')::date loop
  perform public.refresh_time_clock_month_report(v_month);
 end loop;
 return jsonb_build_object('entryIds',v_ids);
end;
$$;
