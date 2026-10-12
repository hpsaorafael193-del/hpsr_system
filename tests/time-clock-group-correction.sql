-- Inteiramente transacional: fixtures e alterações de relatórios são revertidos.
begin;
do $$
declare actor uuid; inactive uuid; e uuid; other uuid;
begin
 select id into actor from public.profiles where access_status='Aprovado' and public.is_time_clock_admin(id) limit 1;
 select id into inactive from public.profiles where access_status='Desligado' limit 1;
 if actor is null or inactive is null then raise exception 'QA sem perfis de referência'; end if;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 insert into public.time_clock_entries(user_id,opened_at,closed_at,status) values(actor,'1901-01-10 20:00-03','1901-01-11 10:00-03','Encerrado') returning id into e;
 insert into public.time_clock_segments(entry_id,user_id,started_at,ended_at) values(e,actor,'1901-01-10 20:00-03','1901-01-11 10:00-03');
 perform set_config('hpsr.qa_group_entry',e::text,true);
 insert into public.time_clock_entries(user_id,opened_at,closed_at,status) values(actor,'1901-01-12 08:00-03','1901-01-12 09:00-03','Encerrado') returning id into other;
 insert into public.time_clock_segments(entry_id,user_id,started_at,ended_at) values(other,actor,'1901-01-12 08:00-03','1901-01-12 09:00-03');
 perform public.time_clock_recalculate_entry(other);
 perform set_config('hpsr.qa_other_entry',other::text,true);
 insert into public.time_clock_entries(user_id,opened_at,closed_at,status) values(inactive,'1901-01-10 08:00-03','1901-01-10 09:00-03','Encerrado') returning id into e;
 perform set_config('hpsr.qa_inactive_entry',e::text,true);
end $$;
set local role authenticated;
do $$
declare e uuid:=current_setting('hpsr.qa_group_entry')::uuid; expected jsonb; original_expected jsonb; result jsonb; again jsonb; second uuid; req uuid:=gen_random_uuid(); total bigint; cnt int; denied bool; report jsonb;
 periods jsonb:='[{"startedAt":"1901-01-10T20:00:00-03:00","endedAt":"1901-01-10T23:00:00-03:00"},{"startedAt":"1901-01-11T08:00:00-03:00","endedAt":"1901-01-11T10:00:00-03:00"}]';
begin
 select jsonb_agg(jsonb_build_object('id',id,'updatedAt',updated_at)) into expected from public.time_clock_entries where id=e;
 original_expected:=expected;
 result:=public.admin_correct_time_clock_group(e,periods,'QA dividir',expected,req);
 second:=(result->'entryIds'->>1)::uuid;
 select count(*),sum(worked_seconds) into cnt,total from public.time_clock_entries where correction_group_id=(result->>'groupId')::uuid;
 if cnt<>2 or total<>18000 then raise exception 'QA divisão/total % %',cnt,total; end if;
 again:=public.admin_correct_time_clock_group(e,periods,'QA dividir',original_expected,req);
 if again is distinct from result then raise exception 'QA repetição não idempotente'; end if;
 if (select count(*) from public.time_clock_audit where new_data->>'requestId'=req::text)<>1 then raise exception 'QA auditoria duplicada'; end if;
 -- Reabre pelo ponto do segundo dia e corrige ambos: IDs preservados, nenhum período desaparece.
 select jsonb_agg(jsonb_build_object('id',id,'updatedAt',updated_at)) into expected from public.time_clock_entries where correction_group_id=(result->>'groupId')::uuid;
 periods:='[{"startedAt":"1901-01-10T20:00:00-03:00","endedAt":"1901-01-10T22:00:00-03:00"},{"startedAt":"1901-01-11T08:00:00-03:00","endedAt":"1901-01-11T10:00:00-03:00"}]';
 again:=public.admin_correct_time_clock_group(second,periods,'QA reabrir segundo dia',expected,gen_random_uuid());
 if again->'entryIds' is distinct from result->'entryIds' then raise exception 'QA IDs não preservados'; end if;
 select sum(worked_seconds) into total from public.time_clock_entries where correction_group_id=(result->>'groupId')::uuid;
 if total<>14400 then raise exception 'QA horas incorretas após reedição'; end if;
 if (select worked_seconds from public.time_clock_entries where id=current_setting('hpsr.qa_other_entry')::uuid)<>3600 then raise exception 'QA ponto posterior independente alterado'; end if;
 denied:=false;
 begin perform public.admin_correct_time_clock_group(second,periods,'QA versão antiga',expected,gen_random_uuid()); exception when others then denied:=sqlerrm like '%atualizado%'; end;
 if not denied then raise exception 'QA versão antiga aceita'; end if;
 select jsonb_agg(jsonb_build_object('id',id,'updatedAt',updated_at)) into expected from public.time_clock_entries where correction_group_id=(result->>'groupId')::uuid;
 denied:=false;
 begin perform public.admin_correct_time_clock_group(e,'[{"startedAt":"1901-01-10T20:00:00-03:00","endedAt":"1901-01-10T23:00:00-03:00"},{"startedAt":"1901-01-10T22:00:00-03:00","endedAt":"1901-01-11T10:00:00-03:00"}]','QA sobreposição',expected,gen_random_uuid()); exception when others then denied:=sqlerrm like '%sobrepor%'; end;
 if not denied then raise exception 'QA sobreposição aceita'; end if;
 if (select sum(worked_seconds) from public.time_clock_entries where correction_group_id=(result->>'groupId')::uuid)<>14400 then raise exception 'QA falha não atômica'; end if;
 -- Um terceiro período cria apenas um ponto novo. Remover somente esse período não perde os dois dias.
 periods:=periods || '[{"startedAt":"1901-01-11T11:00:00-03:00","endedAt":"1901-01-11T12:00:00-03:00"}]'::jsonb;
 again:=public.admin_correct_time_clock_group(e,periods,'QA adicionar',expected,gen_random_uuid());
 if jsonb_array_length(again->'entryIds')<>3 then raise exception 'QA terceiro período não salvo'; end if;
 select jsonb_agg(jsonb_build_object('id',id,'updatedAt',updated_at)) into expected from public.time_clock_entries where correction_group_id=(result->>'groupId')::uuid;
 again:=public.admin_correct_time_clock_group(e,periods-2,'QA remover terceiro',expected,gen_random_uuid());
 if jsonb_array_length(again->'entryIds')<>2 or not exists(select 1 from public.time_clock_entries where id=second) then raise exception 'QA remoção perdeu o segundo dia'; end if;
 select jsonb_agg(jsonb_build_object('id',id,'updatedAt',updated_at)) into expected from public.time_clock_entries where id=current_setting('hpsr.qa_inactive_entry')::uuid;
 denied:=false;
 begin perform public.admin_correct_time_clock_group(current_setting('hpsr.qa_inactive_entry')::uuid,'[{"startedAt":"1901-01-10T08:00:00-03:00","endedAt":"1901-01-10T09:00:00-03:00"}]','QA inativo',expected,gen_random_uuid()); exception when others then denied:=sqlerrm like '%ativos%'; end;
 if not denied then raise exception 'QA inativo aceito'; end if;
 report:=public.get_time_clock_admin_report();
 if exists(select 1 from jsonb_array_elements(report->'activeStaff') x join public.profiles p on p.id=(x->>'userId')::uuid where p.access_status<>'Aprovado') then raise exception 'QA seleção inclui inativo'; end if;
 if jsonb_array_length(report->'activeStaff')<>(select count(*) from public.profiles where access_status='Aprovado') then raise exception 'QA seleção incompleta'; end if;
 if has_function_privilege('anon','public.admin_correct_time_clock_group(uuid,jsonb,text,jsonb,uuid)','execute') then raise exception 'QA anônimo permitido'; end if;
 perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
 denied:=false;
 begin perform public.admin_correct_time_clock_group(e,periods,'QA acesso',expected,gen_random_uuid()); exception when others then denied:=sqlerrm like '%Acesso restrito%'; end;
 if not denied then raise exception 'QA acesso indevido'; end if;
end $$;
rollback;
select 'PASS: divisão, reedição por qualquer dia, IDs estáveis, próximo ponto preservado, idempotência, concorrência, adição/remoção, atomicidade, ativos e autorização; rollback' as validation;
