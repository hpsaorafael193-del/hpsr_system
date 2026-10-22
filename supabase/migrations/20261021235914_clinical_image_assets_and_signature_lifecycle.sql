-- Additive, backward-compatible. No existing clinical payload is rewritten/deleted.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('clinical-assets','clinical-assets',false,20971520,array['image/png','image/jpeg','image/webp','image/gif','image/avif','image/bmp'])
on conflict(id) do nothing;
create policy "clinical image immutable upload" on storage.objects for insert to authenticated
with check(bucket_id='clinical-assets' and (storage.foldername(name))[1]=(select auth.uid())::text and (select public.is_hpsr_staff()));
create policy "clinical image staff read" on storage.objects for select to authenticated
using(bucket_id='clinical-assets' and (select public.is_hpsr_staff()));
-- No client UPDATE/DELETE policy: existing historical files cannot be overwritten.

alter table public.clinical_records add column if not exists image_asset_paths text[] not null default '{}', add column if not exists released_image_asset_paths text[] not null default '{}';
alter table public.exam_editor_drafts add column if not exists image_asset_paths text[] not null default '{}';
alter table public.document_editor_drafts add column if not exists image_asset_paths text[] not null default '{}';
create index clinical_image_paths_idx on public.clinical_records using gin(image_asset_paths);
create index clinical_released_image_paths_idx on public.clinical_records using gin(released_image_asset_paths);
create index exam_draft_image_paths_idx on public.exam_editor_drafts using gin(image_asset_paths);
create index document_draft_image_paths_idx on public.document_editor_drafts using gin(image_asset_paths);

create or replace function hpsr_private.sync_released_image_asset_paths() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.is_confidential then new.released_image_asset_paths := '{}';
 elsif cardinality(new.image_asset_paths)>0 then
   if new.record_type in ('Exame','Documento') and new.released_render_payload is not null then
     select coalesce(array_agg(value),'{}') into new.released_image_asset_paths
     from jsonb_array_elements_text(coalesce(new.released_render_payload->'imageAssets','[]'::jsonb));
   else new.released_image_asset_paths := new.image_asset_paths; end if;
 end if;
 return new;
end; $$;
revoke all on function hpsr_private.sync_released_image_asset_paths() from public,anon,authenticated;
create trigger sync_released_image_asset_paths before insert or update of is_confidential,released_render_payload on public.clinical_records
for each row execute function hpsr_private.sync_released_image_asset_paths();

-- A short lease protects files uploaded before a clinical record/draft commits.
create table public.clinical_image_leases(path text not null, owner_id uuid not null, expires_at timestamptz not null, primary key(path,owner_id));
alter table public.clinical_image_leases enable row level security;
create index clinical_image_lease_expiry on public.clinical_image_leases(expires_at);
create policy "own image lease read" on public.clinical_image_leases for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_hpsr_staff()));
create policy "own image lease insert" on public.clinical_image_leases for insert to authenticated with check(owner_id=(select auth.uid()) and expires_at>now() and expires_at<=now()+interval '25 hours' and (select public.is_hpsr_staff()));
create policy "own image lease update" on public.clinical_image_leases for update to authenticated using(owner_id=(select auth.uid()) and (select public.is_hpsr_staff())) with check(owner_id=(select auth.uid()) and expires_at>now() and expires_at<=now()+interval '25 hours' and (select public.is_hpsr_staff()));
grant select,insert,update on public.clinical_image_leases to authenticated;
grant all on public.clinical_image_leases to service_role;

create table hpsr_private.signature_cleanup_queue(path text primary key, owner_id uuid not null, next_attempt_at timestamptz not null default now());
alter table hpsr_private.signature_cleanup_queue enable row level security;
grant usage on schema hpsr_private to service_role;
grant all on hpsr_private.signature_cleanup_queue to service_role;

create or replace function hpsr_private.queue_unused_profile_signature() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 -- Only a self-update, an already authorized manager, or a service operation can enqueue.
 if session_user not in ('postgres','supabase_admin') and auth.uid() is distinct from old.id and coalesce(auth.role(),'')<>'service_role' and not public.is_access_admin() then
   raise exception 'Acesso não autorizado.' using errcode='42501';
 end if;
 if new.access_status in ('Desligado','Desativado','Inativo','Removido') then new.signature_path:=null; end if;
 if old.signature_path is not null and old.signature_path is distinct from new.signature_path and old.signature_path not like 'data:%' then
   insert into hpsr_private.signature_cleanup_queue(path,owner_id) values(old.signature_path,old.id)
   on conflict(path) do update set next_attempt_at=now();
 end if;
 return new;
end; $$;
revoke all on function hpsr_private.queue_unused_profile_signature() from public,anon,authenticated;
create trigger queue_unused_profile_signature before update of access_status,signature_path on public.profiles
for each row execute function hpsr_private.queue_unused_profile_signature();

create or replace function public.clinical_image_is_used(target_bucket text,target_path text) returns boolean
language sql stable security invoker set search_path='' as $$
 select case when target_bucket='clinical-assets' then
  exists(select 1 from public.clinical_records where image_asset_paths @> array[target_path] or released_image_asset_paths @> array[target_path])
  or exists(select 1 from public.exam_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.image_asset_paths @> array[target_path])
  or exists(select 1 from public.document_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.image_asset_paths @> array[target_path])
  or exists(select 1 from public.clinical_image_leases where path=target_path and expires_at>now())
 else
  exists(select 1 from public.profiles where access_status='Aprovado' and signature_path=target_path)
  or exists(select 1 from public.clinical_records where payload::text like '%'||target_path||'%' or released_render_payload::text like '%'||target_path||'%')
  or exists(select 1 from public.exam_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.payload::text like '%'||target_path||'%')
  or exists(select 1 from public.document_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.payload::text like '%'||target_path||'%') end;
$$;
revoke all on function public.clinical_image_is_used(text,text) from public,anon,authenticated;
grant execute on function public.clinical_image_is_used(text,text) to service_role;

create or replace function public.clinical_image_cleanup_candidates(target_owner uuid default null)
returns table(bucket_id text,path text) language sql stable security invoker set search_path='' as $$
 (select 'signatures'::text,q.path from hpsr_private.signature_cleanup_queue q where q.next_attempt_at<=now() and (target_owner is null or q.owner_id=target_owner) order by q.next_attempt_at limit 3)
 union all
 (select 'clinical-assets'::text,o.name from storage.objects o where o.bucket_id='clinical-assets' and o.created_at<now()-interval '24 hours'
 and (target_owner is null or split_part(o.name,'/',1)=target_owner::text)
 and not exists(select 1 from public.clinical_records c where c.image_asset_paths @> array[o.name] or c.released_image_asset_paths @> array[o.name])
 and not exists(select 1 from public.exam_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.image_asset_paths @> array[o.name])
 and not exists(select 1 from public.document_editor_drafts d join public.profiles p on p.id=d.owner_id where p.access_status='Aprovado' and d.image_asset_paths @> array[o.name])
 and not exists(select 1 from public.clinical_image_leases l where l.path=o.name and l.expires_at>now()) order by o.created_at limit 5);
$$;
revoke all on function public.clinical_image_cleanup_candidates(uuid) from public,anon,authenticated;
grant execute on function public.clinical_image_cleanup_candidates(uuid) to service_role;
create or replace function public.complete_signature_cleanup(target_path text, retained boolean default false) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if retained then update hpsr_private.signature_cleanup_queue set next_attempt_at=now()+interval '30 days' where path=target_path;
 else delete from hpsr_private.signature_cleanup_queue where path=target_path; end if;
 delete from public.clinical_image_leases where expires_at<now()-interval '1 day';
end; $$;
revoke all on function public.complete_signature_cleanup(text,boolean) from public,anon,authenticated;
grant execute on function public.complete_signature_cleanup(text,boolean) to service_role;

-- Hourly garbage collection authenticates with a private Vault token, not a public key.
create extension if not exists pg_net with schema extensions;
do $$ begin
 if not exists(select 1 from vault.secrets where name='clinical_image_gc_token') then
   perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'clinical_image_gc_token','Clinical image garbage collection');
 end if;
end; $$;
create or replace function public.authorize_clinical_image_gc(token_hash text) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from vault.decrypted_secrets where name='clinical_image_gc_token'
 and encode(extensions.digest(decrypted_secret,'sha256'),'hex')=token_hash);
$$;
revoke all on function public.authorize_clinical_image_gc(text) from public,anon,authenticated;
grant execute on function public.authorize_clinical_image_gc(text) to service_role;
-- The job is activated only after the authenticated cleanup function is deployed.

