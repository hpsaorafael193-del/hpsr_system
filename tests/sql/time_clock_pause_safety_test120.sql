begin;
do $$
declare
 actor uuid; e uuid; result jsonb; n int; paused timestamptz; total bigint;
begin
 select id into actor from public.profiles p where access_status='Aprovado'
 and not exists(select 1 from public.time_clock_entries where user_id=p.id and closed_at is null) limit 1;
 if actor is null then raise exception 'QA precisa de um perfil sem ponto aberto'; end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 -- 1h de trabalho + pausa encerrada de 3h + 30min de trabalho + pausa atual >2h.
 paused:=now()-interval '2 hours 1 second';
 insert into public.time_clock_entries(user_id,status,opened_at) values(actor,'Em pausa',paused-interval '4 hours 30 minutes') returning id into e;
 insert into public.time_clock_segments(entry_id,user_id,started_at,ended_at) values
 (e,actor,paused-interval '4 hours 30 minutes',paused-interval '3 hours 30 minutes'),
 (e,actor,paused-interval '30 minutes',paused);
 insert into public.time_clock_breaks(entry_id,user_id,started_at,ended_at) values
 (e,actor,paused-interval '3 hours 30 minutes',paused-interval '30 minutes'),(e,actor,paused,null);
 update public.profiles set service_status='Em pausa' where id=actor;
 n:=hpsr_private.close_expired_time_clock_pauses(actor);
 if n<>1 then raise exception 'QA pausa vencida não encerrada'; end if;
 if not exists(select 1 from public.time_clock_entries where id=e and status='Encerrado' and closed_at=now() and worked_seconds=5400) then raise exception 'QA tempo pausado contabilizado ou trabalho perdido'; end if;
 if (select service_status from public.profiles where id=actor)<>'Fora de serviço' then raise exception 'QA perfil não atualizado'; end if;
 if not exists(select 1 from public.time_clock_audit where entry_id=e and actor_user_id is null and new_data->>'reasonCode'='pause_timeout_2h') then raise exception 'QA auditoria ausente'; end if;
 if hpsr_private.close_expired_time_clock_pauses(actor)<>0 then raise exception 'QA fechamento repetido'; end if;
 if (select count(*) from public.time_clock_audit where entry_id=e)<>1 then raise exception 'QA auditoria duplicada'; end if;
 -- Exatamente duas horas não passa do limite. Pausas anteriores não somam ao limite atual.
 insert into public.time_clock_entries(user_id,status,opened_at) values(actor,'Em pausa',now()-interval '8 hours') returning id into e;
 insert into public.time_clock_segments(entry_id,user_id,started_at,ended_at) values(e,actor,now()-interval '8 hours',now()-interval '7 hours'),(e,actor,now()-interval '3 hours',now()-interval '2 hours');
 insert into public.time_clock_breaks(entry_id,user_id,started_at,ended_at) values(e,actor,now()-interval '7 hours',now()-interval '3 hours'),(e,actor,now()-interval '2 hours',null);
 if hpsr_private.close_expired_time_clock_pauses(actor)<>0 then raise exception 'QA limite inclusivo incorreto'; end if;
 result:=public.time_clock_action('return');
 if result->>'status'<>'Em serviço' then raise exception 'QA retorno legítimo bloqueado'; end if;
 -- Em serviço não encerra, mesmo com pausas passadas longas e entrada antiga.
 if hpsr_private.close_expired_time_clock_pauses(actor)<>0 then raise exception 'QA ponto ativo indevidamente encerrado'; end if;
 perform public.time_clock_action('pause');
 update public.time_clock_breaks set started_at=now()-interval '2 hours 1 second' where entry_id=e and ended_at is null;
 -- A ação de retorno, mesmo antes do cron, deve persistir o fechamento, sem rollback por erro.
 result:=public.time_clock_action('return');
 if result->>'status'<>'Fora de serviço' or exists(select 1 from public.time_clock_segments where entry_id=e and ended_at is null) then raise exception 'QA retorno ressuscitou pausa vencida'; end if;
 -- Os outros caminhos fazem a mesma verificação, sem depender do navegador.
 for n in 1..3 loop
   insert into public.time_clock_entries(user_id,status,opened_at) values(actor,'Em pausa',now()-interval '3 hours') returning id into e;
   insert into public.time_clock_segments(entry_id,user_id,started_at,ended_at) values(e,actor,now()-interval '3 hours',now()-interval '2 hours 1 second');
   insert into public.time_clock_breaks(entry_id,user_id,started_at) values(e,actor,now()-interval '2 hours 1 second');
   if n=1 then result:=public.time_clock_heartbeat(false);
     if result->>'reason'<>'pause_timeout_2h' then raise exception 'QA heartbeat não identificou encerramento'; end if;
   elsif n=2 then result:=public.time_clock_prepare_action();
     if (result->>'active')::boolean then raise exception 'QA preparação permite pausa vencida'; end if;
   else result:=public.get_my_time_clock_state();
     if result->>'status'<>'Fora de serviço' then raise exception 'QA consulta mantém pausa vencida'; end if;
   end if;
   if not exists(select 1 from public.time_clock_entries where id=e and closed_at is not null and worked_seconds=3599) then raise exception 'QA contagem/caminho % incorreto',n; end if;
 end loop;
 if has_function_privilege('authenticated','hpsr_private.close_expired_time_clock_pauses(uuid)','execute') or has_function_privilege('anon','hpsr_private.close_expired_time_clock_pauses(uuid)','execute') then raise exception 'QA worker exposto'; end if;
 if not exists(select 1 from cron.job where jobname='hpsr-time-clock-pause-safety-close' and active and schedule='* * * * *') then raise exception 'QA tarefa independente não agendada'; end if;
end $$;
rollback;
select 'PASS: >2h contínuas; pausas excluídas; trabalho preservado; limite exato; retorno; heartbeat; preparação; leitura; auditoria; idempotência; cron privado. Fixtures revertidas.' as validation;
