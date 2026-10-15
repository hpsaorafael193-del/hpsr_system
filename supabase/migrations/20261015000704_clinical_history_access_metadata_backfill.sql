-- Populate only derived metadata; original payload, signatures and previews remain unchanged.
set local statement_timeout = '120s';
select set_config('request.jwt.claim.role', 'service_role', true);
do $backfill$
declare v_updated integer;
begin
  loop
    with batch as (
      select id from public.clinical_records where not access_metadata_ready order by id limit 50
    ), changed as (
      update public.clinical_records r set access_metadata_ready = true
      from batch b where r.id = b.id returning r.id
    ) select count(*) into v_updated from changed;
    exit when v_updated = 0;
  end loop;
end;
$backfill$;
