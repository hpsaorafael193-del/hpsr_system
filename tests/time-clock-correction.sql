-- Teste transacional: nenhum registro de teste fica salvo.
begin;
do $$
declare actor uuid; e uuid;
begin
 select id into actor from public.profiles where public.is_time_clock_admin(id) limit 1;
 if actor is null then raise exception 'QA sem administrador'; end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 insert into public.time_clock_entries(user_id,opened_at,closed_at,status) values(actor,'1900-01-10 20:00-03','1900-01-11 10:00-03','Encerrado') returning id into e;
 insert into public.time_clock_segments(entry_id,user_id,started_at,ended_at) values(e,actor,'1900-01-10 20:00-03','1900-01-11 10:00-03');
 perform set_config('hpsr.qa_entry',e::text,true);
end $$;
set local role authenticated;
do $$
declare e uuid:=current_setting('hpsr.qa_entry')::uuid; updated timestamptz; fresh timestamptz; result jsonb; total bigint; cnt integer; denied boolean:=false;
begin
 select updated_at into updated from public.time_clock_entries where id=e;
 result:=public.admin_correct_time_clock_periods(e,'[{"startedAt":"1900-01-10T20:00:00-03:00","endedAt":"1900-01-10T23:00:00-03:00"},{"startedAt":"1900-01-11T08:00:00-03:00","endedAt":"1900-01-11T10:00:00-03:00"}]', 'QA rollback - dividir por dia',updated);
 select count(*),sum(worked_seconds) into cnt,total from public.time_clock_entries where id in(select value::uuid from jsonb_array_elements_text(result->'entryIds'));
 if cnt<>2 or total<>18000 then raise exception 'QA divisão incorreta: %, %',cnt,total; end if;
 if not exists(select 1 from public.time_clock_audit where entry_id=e and previous_data->'segments'->0->>'ended_at' is not null and new_data->'entryIds'=result->'entryIds') then raise exception 'QA auditoria ausente'; end if;
 if exists(select 1 from public.time_clock_segments where entry_id in(select value::uuid from jsonb_array_elements_text(result->'entryIds')) and started_at < '1900-01-11 08:00-03' and ended_at > '1900-01-10 23:00-03') then raise exception 'QA intervalo indevido'; end if;
 select updated_at into fresh from public.time_clock_entries where id=e;
 begin
  perform public.admin_correct_time_clock_periods(e,'[{"startedAt":"1900-01-10T20:00:00-03:00","endedAt":"1900-01-10T23:00:00-03:00"}]','QA stale',updated);
 exception when others then denied:=sqlerrm like '%atualizado%'; end;
 if not denied then raise exception 'QA concorrência não protegida'; end if;
 denied:=false;
 begin
  perform public.admin_correct_time_clock_periods(e,'[{"startedAt":"1900-01-10T20:00:00-03:00","endedAt":"1900-01-10T23:00:00-03:00"},{"startedAt":"1900-01-10T22:00:00-03:00","endedAt":"1900-01-10T23:30:00-03:00"}]','QA overlap',fresh);
 exception when others then denied:=sqlerrm like '%sobrepor%'; end;
 if not denied then raise exception 'QA sobreposição aceita'; end if;
 denied:=false;
 begin
  perform public.admin_correct_time_clock_periods(e,'[{"startedAt":"1900-01-11T08:30:00-03:00","endedAt":"1900-01-11T09:00:00-03:00"}]','QA outro ponto',fresh);
 exception when others then denied:=sqlerrm like '%outro ponto%'; end;
 if not denied then raise exception 'QA colisão com outro ponto aceita'; end if;
 denied:=false;
 begin
  perform public.admin_correct_time_clock_periods(e,'[{"startedAt":"1900-01-10T23:00:00-03:00","endedAt":"1900-01-10T20:00:00-03:00"}]','QA inválido',fresh);
 exception when others then denied:=sqlerrm like '%período válido%'; end;
 if not denied then raise exception 'QA intervalo invertido aceito'; end if;
 denied:=false;
 begin
  perform public.admin_correct_time_clock_periods(e,jsonb_build_array(jsonb_build_object('startedAt',now()+interval '1 hour','endedAt',now()+interval '2 hours')),'QA futuro',fresh);
 exception when others then denied:=sqlerrm like '%futuros%'; end;
 if not denied then raise exception 'QA futuro aceito'; end if;
 if has_function_privilege('anon','public.admin_correct_time_clock_periods(uuid,jsonb,text,timestamptz)','execute') then raise exception 'QA execução anônima'; end if;
 perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
 denied:=false;
 begin
  perform public.admin_correct_time_clock_periods(e,'[]','QA acesso',updated);
 exception when others then denied:=sqlerrm like '%Acesso restrito%'; end;
 if not denied then raise exception 'QA acesso indevido'; end if;
end $$;
rollback;
select 'PASS: divisão, duração, intervalo, auditoria, concorrência, sobreposições, datas, acesso; rollback' as validation;
