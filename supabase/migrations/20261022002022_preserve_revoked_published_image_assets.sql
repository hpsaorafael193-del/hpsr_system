-- Visibility and retention are separate: revoking portal access must not delete history.
create or replace function hpsr_private.sync_released_image_asset_paths() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if lower(new.record_type) in ('exame','documento') and jsonb_typeof(new.released_render_payload->'imageAssets')='array' then
   select coalesce(array_agg(value),'{}') into new.released_image_asset_paths
   from jsonb_array_elements_text(new.released_render_payload->'imageAssets');
 elsif not new.is_confidential and cardinality(new.image_asset_paths)>0 then
   new.released_image_asset_paths:=new.image_asset_paths;
 end if;
 -- A confidential record keeps historical reference metadata; access still requires release.
 return new;
end; $$;

