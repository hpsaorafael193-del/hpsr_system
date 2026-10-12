alter table public.time_clock_entries add column if not exists correction_group_id uuid;
create index if not exists time_clock_entries_correction_group_idx on public.time_clock_entries(correction_group_id) where correction_group_id is not null;
-- Reconecta apenas registros existentes cuja divisão já está comprovada na auditoria.
with recursive edges as (
 select a.entry_id as src, e.id as dst from public.time_clock_audit a
 cross join lateral jsonb_array_elements_text(case when jsonb_typeof(a.new_data->'entryIds')='array' then a.new_data->'entryIds' else '[]'::jsonb end) j
 join public.time_clock_entries e on e.id::text=j.value and e.user_id=a.target_user_id
 join public.time_clock_entries original on original.id=a.entry_id and original.user_id=e.user_id
 where a.action='Correção de ponto'
), links as (select src,dst from edges union select dst,src from edges), walk(root,node) as (
 select src,src from links union select w.root,l.dst from walk w join links l on l.src=w.node
), groups as (select node,min(root::text)::uuid as group_id from walk group by node)
update public.time_clock_entries e set correction_group_id=g.group_id from groups g where e.id=g.node and e.correction_group_id is null;

create or replace function hpsr_private.correct_time_clock_group(
 p_entry_id uuid,p_periods jsonb,p_reason text,p_expected_entries jsonb,p_request_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_entry public.time_clock_entries%rowtype; v_group uuid; v_existing uuid[]; v_ids uuid[]:='{}';
 v_period jsonb; v_start timestamptz; v_end timestamptz; v_previous timestamptz;
 v_before jsonb; v_replay jsonb; v_id uuid; v_index integer:=1; v_month date; v_min timestamptz; v_max timestamptz;
begin
 if auth.uid() is null or not public.is_time_clock_admin() then raise exception 'Acesso restrito à Diretoria e ao Desenvolvedor.'; end if;
 if p_request_id is null then raise exception 'Identificador de salvamento obrigatório.'; end if;
 -- A mesma tentativa pode ser repetida após falha de rede sem duplicar pontos.
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select new_data into v_replay from public.time_clock_audit where actor_user_id=auth.uid() and new_data->>'requestId'=p_request_id::text;
 if found then
  if v_replay->>'sourceEntryId'<>p_entry_id::text or v_replay->'periods' is distinct from p_periods or v_replay->>'reason' is distinct from trim(p_reason) then raise exception 'Identificador já utilizado para outra correção.'; end if;
  return v_replay;
 end if;
 if nullif(trim(p_reason),'') is null or length(p_reason)>2000 then raise exception 'Informe um motivo de até 2000 caracteres.'; end if;
 if jsonb_typeof(p_periods) is distinct from 'array' or jsonb_array_length(p_periods) not between 1 and 100 then raise exception 'Informe de 1 a 100 períodos.'; end if;
 select * into v_entry from public.time_clock_entries where id=p_entry_id;
 if not found then raise exception 'Ponto não encontrado.'; end if;
 -- Trava o profissional antes dos pontos para serializar correções da mesma pessoa.
 perform 1 from public.profiles where id=v_entry.user_id and access_status='Aprovado' for update;
 if not found then raise exception 'Somente profissionais ativos no HP podem ter o ponto corrigido.'; end if;
 select * into v_entry from public.time_clock_entries where id=p_entry_id;
 v_group:=coalesce(v_entry.correction_group_id,v_entry.id);
 perform 1 from public.time_clock_entries where user_id=v_entry.user_id and (id=p_entry_id or correction_group_id=v_group) order by id for update;
 select array_agg(id order by opened_at,id),min(opened_at),max(closed_at) into v_existing,v_min,v_max from public.time_clock_entries where user_id=v_entry.user_id and (id=p_entry_id or correction_group_id=v_group);
 if exists(select 1 from public.time_clock_entries where id=any(v_existing) and closed_at is null) then raise exception 'Encerre o ponto antes de corrigir.'; end if;
 if jsonb_typeof(p_expected_entries) is distinct from 'array' or jsonb_array_length(p_expected_entries)<>cardinality(v_existing)
 or (select count(distinct x->>'id') from jsonb_array_elements(p_expected_entries) x)<>cardinality(v_existing)
 or exists(select 1 from public.time_clock_entries e where e.id=any(v_existing) and not exists(select 1 from jsonb_array_elements(p_expected_entries) x where x->>'id'=e.id::text and (x->>'updatedAt')::timestamptz=e.updated_at)) then
  raise exception 'O ponto foi atualizado. Reabra a correção para conferir todos os períodos.';
 end if;
 for v_period in select value from jsonb_array_elements(p_periods) loop
  v_start:=(v_period->>'startedAt')::timestamptz; v_end:=(v_period->>'endedAt')::timestamptz;
  if v_start is null or v_end is null or not isfinite(v_start) or not isfinite(v_end) or v_end<=v_start then raise exception 'Entrada e saída devem formar um período válido.'; end if;
  if v_end>now() then raise exception 'Não é permitido informar horários futuros.'; end if;
  if v_previous is not null and v_start<v_previous then raise exception 'Os períodos devem estar em ordem e não podem se sobrepor.'; end if;
  if exists(select 1 from public.time_clock_segments s where s.user_id=v_entry.user_id and not(s.entry_id=any(v_existing)) and s.started_at<v_end and coalesce(s.ended_at,now())>v_start) then raise exception 'O período se sobrepõe a outro ponto do profissional.'; end if;
  v_previous:=v_end;
 end loop;
 v_before:=jsonb_build_object('entries',(select jsonb_agg(to_jsonb(e) order by opened_at,id) from public.time_clock_entries e where id=any(v_existing)),
 'segments',coalesce((select jsonb_agg(to_jsonb(s) order by started_at) from public.time_clock_segments s where entry_id=any(v_existing)),'[]'::jsonb),
 'breaks',coalesce((select jsonb_agg(to_jsonb(b) order by started_at) from public.time_clock_breaks b where entry_id=any(v_existing)),'[]'::jsonb));
 delete from public.time_clock_segments where entry_id=any(v_existing);
 delete from public.time_clock_breaks where entry_id=any(v_existing);
 for v_period in select value from jsonb_array_elements(p_periods) loop
  v_start:=(v_period->>'startedAt')::timestamptz; v_end:=(v_period->>'endedAt')::timestamptz;
  if v_index<=cardinality(v_existing) then
   v_id:=v_existing[v_index];
   update public.time_clock_entries set opened_at=v_start,closed_at=v_end,status='Encerrado',worked_seconds=0,correction_group_id=v_group where id=v_id;
  else
   insert into public.time_clock_entries(user_id,opened_at,closed_at,status,correction_group_id) values(v_entry.user_id,v_start,v_end,'Encerrado',v_group) returning id into v_id;
  end if;
  insert into public.time_clock_segments(entry_id,user_id,started_at,ended_at) values(v_id,v_entry.user_id,v_start,v_end);
  perform public.time_clock_recalculate_entry(v_id);
  update public.time_clock_entries set updated_at=clock_timestamp() where id=v_id;
  v_ids:=array_append(v_ids,v_id); v_index:=v_index+1; v_min:=least(v_min,v_start);v_max:=greatest(v_max,v_end);
 end loop;
 -- Só remove os períodos excluídos explicitamente do formulário completo.
 -- Mantém os registros históricos e suas referências; duração zerada e auditada.
 -- A remoção explícita ocorre após gravar o snapshot de auditoria.
 v_replay:=jsonb_build_object('entryIds',to_jsonb(v_ids),'groupId',v_group,'requestId',p_request_id,'sourceEntryId',p_entry_id,'periods',p_periods,'reason',trim(p_reason));
 insert into public.time_clock_audit(entry_id,target_user_id,actor_user_id,action,reason,previous_data,new_data) values(p_entry_id,v_entry.user_id,auth.uid(),'Correção de ponto',trim(p_reason),v_before,v_replay);
 delete from public.time_clock_entries where id=any(v_existing) and not(id=any(v_ids));
 for v_month in select generate_series(date_trunc('month',v_min at time zone 'America/Sao_Paulo'),date_trunc('month',v_max at time zone 'America/Sao_Paulo'),interval '1 month')::date loop perform public.refresh_time_clock_month_report(v_month); end loop;
 return v_replay;
end;
$$;
revoke all on function hpsr_private.correct_time_clock_group(uuid,jsonb,text,jsonb,uuid) from public,anon;
grant execute on function hpsr_private.correct_time_clock_group(uuid,jsonb,text,jsonb,uuid) to authenticated;
create or replace function public.admin_correct_time_clock_group(p_entry_id uuid,p_periods jsonb,p_reason text,p_expected_entries jsonb,p_request_id uuid) returns jsonb language sql security invoker set search_path='' as $$select hpsr_private.correct_time_clock_group(p_entry_id,p_periods,p_reason,p_expected_entries,p_request_id);$$;
revoke all on function public.admin_correct_time_clock_group(uuid,jsonb,text,jsonb,uuid) from public,anon;
grant execute on function public.admin_correct_time_clock_group(uuid,jsonb,text,jsonb,uuid) to authenticated;
create index if not exists time_clock_audit_correction_request_idx on public.time_clock_audit((new_data->>'requestId')) where new_data->>'requestId' is not null;

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
  v_active_staff jsonb;
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
  from (select e.* from public.time_clock_entries e join public.profiles active on active.id=e.user_id and active.access_status='Aprovado' order by e.opened_at desc limit 500) e
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

  select coalesce(jsonb_agg(jsonb_build_object('userId',id,'user',name) order by name),'[]'::jsonb) into v_active_staff from public.profiles where access_status='Aprovado';

  return jsonb_build_object(
    'entries', v_entries,
    'reports', v_reports,
    'audit', v_audit,
    'currentRanking', v_current_ranking,
    'serverNow', v_now,
    'activeStaff', v_active_staff
  );
end;
$$;

grant execute on function public.get_time_clock_admin_report() to authenticated;


revoke execute on function public.get_time_clock_admin_report() from public,anon;

-- Clientes antigos não podem sobrescrever apenas um dia de um grupo.
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
 if not exists(select 1 from public.profiles where id=v_entry.user_id and access_status='Aprovado') then raise exception 'Somente profissionais ativos no HP podem ter o ponto corrigido.'; end if;
 if v_entry.correction_group_id is not null then raise exception 'Atualize o sistema para corrigir todos os períodos vinculados.'; end if;
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
