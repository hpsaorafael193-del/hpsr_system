-- Index original public signature references once, not on every hourly cleanup.
create or replace function hpsr_private.legacy_signature_file_paths(input jsonb) returns text[]
language sql immutable parallel safe security invoker set search_path='' as $$
 select coalesce(array_agg(distinct m[1]),'{}') from regexp_matches(input::text,'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(?:signature|[0-9a-f]{64})\.png)','gi') m;
$$;
revoke all on function hpsr_private.legacy_signature_file_paths(jsonb) from public,anon;
grant execute on function hpsr_private.legacy_signature_file_paths(jsonb) to authenticated;

create or replace function hpsr_private.compact_clinical_signature_on_write() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 new.payload:=hpsr_private.compact_clinical_signature(new.payload);
 new.released_render_payload:=hpsr_private.compact_clinical_signature(new.released_render_payload);
 -- The compact client sends exact file references; older clients get a conservative fallback.
 if cardinality(new.image_asset_paths)=0 then
   new.image_asset_paths:=hpsr_private.legacy_signature_file_paths(new.payload)||hpsr_private.legacy_signature_file_paths(new.released_render_payload);
 end if;
 return new;
end; $$;

create or replace function hpsr_private.sync_draft_legacy_signature_paths() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if cardinality(new.image_asset_paths)=0 then new.image_asset_paths:=hpsr_private.legacy_signature_file_paths(new.payload); end if;
 return new;
end; $$;
revoke all on function hpsr_private.sync_draft_legacy_signature_paths() from public,anon,authenticated;
create trigger a0_sync_draft_legacy_signature_paths before insert or update of payload on public.exam_editor_drafts for each row execute function hpsr_private.sync_draft_legacy_signature_paths();
create trigger a0_sync_draft_legacy_signature_paths before insert or update of payload on public.document_editor_drafts for each row execute function hpsr_private.sync_draft_legacy_signature_paths();

-- Metadata only: leave all clinical content/images intact.
with refs as materialized (select id,hpsr_private.legacy_signature_file_paths(payload)||hpsr_private.legacy_signature_file_paths(released_render_payload) as paths from public.clinical_records where cardinality(image_asset_paths)=0)
update public.clinical_records c set image_asset_paths=r.paths from refs r where c.id=r.id and cardinality(r.paths)>0;
with refs as materialized (select owner_id,hpsr_private.legacy_signature_file_paths(payload) as paths from public.exam_editor_drafts where cardinality(image_asset_paths)=0)
update public.exam_editor_drafts d set image_asset_paths=r.paths from refs r where d.owner_id=r.owner_id and cardinality(r.paths)>0;
with refs as materialized (select owner_id,hpsr_private.legacy_signature_file_paths(payload) as paths from public.document_editor_drafts where cardinality(image_asset_paths)=0)
update public.document_editor_drafts d set image_asset_paths=r.paths from refs r where d.owner_id=r.owner_id and cardinality(r.paths)>0;

create or replace function public.clinical_image_is_used(target_bucket text,target_path text) returns boolean
language sql stable security invoker set search_path='' as $$
 select
  exists(select 1 from public.clinical_records where image_asset_paths @> array[target_path] or released_image_asset_paths @> array[target_path])
  or exists(select 1 from public.exam_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.image_asset_paths @> array[target_path])
  or exists(select 1 from public.document_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.image_asset_paths @> array[target_path])
  or (target_bucket='clinical-assets' and exists(select 1 from public.clinical_image_leases where path=target_path and expires_at>now()))
  or (target_bucket='signatures' and exists(select 1 from public.profiles where access_status='Aprovado' and signature_path=target_path));
$$;

