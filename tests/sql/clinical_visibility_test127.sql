begin;
set local statement_timeout='15s';
select set_config('request.jwt.claims','{"sub":"a74bdd7f-b2e3-44fd-a63d-70f769e35447","role":"authenticated"}',true);
do $$
declare fixture text := 'visibility-test-'||gen_random_uuid(); result jsonb; original jsonb; started timestamptz; released jsonb;
begin
select payload into original from public.clinical_records where id='exam-1792506119676-16fbea6de7d2d';
if original is null then raise exception 'Test source absent'; end if;
insert into public.clinical_records(id,record_type,payload,is_confidential)
values(fixture,'Exame',original,true);
started:=clock_timestamp();
result:=public.set_clinical_record_visibility(fixture,false);
raise notice 'Release ms: %, response bytes: %',extract(epoch from clock_timestamp()-started)*1000,pg_column_size(result);
if result ? 'payload' or (result->>'is_confidential')::boolean then raise exception 'Invalid result'; end if;
select released_render_payload into released from public.clinical_records where id=fixture;
if released->'renderSnapshot' is distinct from original->'renderSnapshot' then raise exception 'Render changed'; end if;
if released->'doctor' is distinct from original->'doctor' then raise exception 'Signature changed'; end if;
started:=clock_timestamp();
perform public.set_clinical_record_visibility(fixture,true);
raise notice 'Confidential ms: %',extract(epoch from clock_timestamp()-started)*1000;
if (select released_render_payload from public.clinical_records where id=fixture) is distinct from released then raise exception 'Snapshot changed on privacy'; end if;
update public.clinical_records set record_type='Documento' where id=fixture;
perform public.set_clinical_record_visibility(fixture,false);
if (select released_render_payload->'renderSnapshot' from public.clinical_records where id=fixture) is distinct from original->'renderSnapshot' then raise exception 'Document render changed'; end if;
end $$;
rollback;
