-- Old browser tabs must not overwrite/delete a signature required by a historic report.
create or replace function hpsr_private.may_change_profile_signature(target_path text) returns boolean
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or split_part(target_path,'/',1)<>auth.uid()::text or not public.is_hpsr_staff() then return false; end if;
 return not (
  exists(select 1 from public.clinical_records c where c.image_asset_paths @> array[target_path] or c.released_image_asset_paths @> array[target_path])
  or exists(select 1 from public.exam_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.image_asset_paths @> array[target_path])
  or exists(select 1 from public.document_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.image_asset_paths @> array[target_path])
 );
end; $$;
revoke all on function hpsr_private.may_change_profile_signature(text) from public,anon;
grant execute on function hpsr_private.may_change_profile_signature(text) to authenticated;
create policy "approved signature uploader guard" on storage.objects as restrictive for insert to authenticated
with check(bucket_id<>'signatures' or (select public.is_hpsr_staff()));
create policy "historic signature overwrite guard" on storage.objects as restrictive for update to authenticated
using(bucket_id<>'signatures' or hpsr_private.may_change_profile_signature(name))
with check(bucket_id<>'signatures' or hpsr_private.may_change_profile_signature(name));
create policy "historic signature delete guard" on storage.objects as restrictive for delete to authenticated
using(bucket_id<>'signatures' or hpsr_private.may_change_profile_signature(name));

