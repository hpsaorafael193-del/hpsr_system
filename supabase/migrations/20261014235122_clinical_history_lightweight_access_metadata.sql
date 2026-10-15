-- Lightweight access metadata; no payload/image copies and no table rewrite.
alter table public.clinical_records
  add column if not exists access_document_model_id text,
  add column if not exists access_vaccine_group text,
  add column if not exists access_card_model text,
  add column if not exists access_metadata_ready boolean not null default false;

create or replace function hpsr_private.sync_clinical_access_metadata()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
begin
  new.access_document_model_id := new.payload ->> 'documentModelId';
  new.access_vaccine_group := new.payload #>> '{vaccine,group}';
  new.access_card_model := new.payload ->> 'cardModel';
  new.access_metadata_ready := true;
  return new;
end;
$function$;
revoke all on function hpsr_private.sync_clinical_access_metadata() from public, anon, authenticated;
drop trigger if exists aa_sync_clinical_access_metadata on public.clinical_records;
create trigger aa_sync_clinical_access_metadata
before insert or update of payload, access_document_model_id, access_vaccine_group, access_card_model, access_metadata_ready
on public.clinical_records for each row execute function hpsr_private.sync_clinical_access_metadata();

-- Fallback preserves access rules for rows not yet backfilled.
alter policy "pediatric followup specialty guard" on public.clinical_records
  using (((id not like 'pediatric-followup-%') and coalesce(
    case when access_metadata_ready then access_document_model_id else payload ->> 'documentModelId' end, '') <> 'pediatric-followup')
    or (select hpsr_private.can_manage_pediatric_followup()))
  with check (((id not like 'pediatric-followup-%') and coalesce(
    case when access_metadata_ready then access_document_model_id else payload ->> 'documentModelId' end, '') <> 'pediatric-followup')
    or (select hpsr_private.can_manage_pediatric_followup()));

alter policy "gestational vaccination specialty read v118" on public.clinical_records
  using ((not ((record_type = any(array['Vacina'::text, 'CadernetaVacinal'::text]))
    and (((case when access_metadata_ready then access_vaccine_group else payload #>> '{vaccine,group}' end) = 'gestante')
      or ((case when access_metadata_ready then access_card_model else payload ->> 'cardModel' end) = 'gestante'))))
    or (select public.hpsr_can_manage_gestational_vaccination()));

alter policy "staff clinical read" on public.clinical_records
  using ((select public.is_hpsr_staff()));

comment on column public.clinical_records.access_metadata_ready is 'Derived cache, recomputed by trigger whenever payload or cache fields change. False keeps the original RLS fallback.';
