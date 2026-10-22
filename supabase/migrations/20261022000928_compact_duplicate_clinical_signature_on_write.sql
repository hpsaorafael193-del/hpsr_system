-- Protect even older deployed clients from saving the same signature twice.
create or replace function hpsr_private.compact_clinical_signature(input jsonb) returns jsonb
language plpgsql immutable parallel safe security invoker set search_path='' as $$
declare saved jsonb; duplicate jsonb;
begin
 duplicate:=input#>'{doctor,signatureImage}';
 if duplicate is null or left(duplicate#>>'{}',11)<>'data:image/' then return input; end if;
 saved:=case input#>>'{renderSnapshot,kind}' when 'exam' then input#>'{renderSnapshot,document,metadata,signatureImage}' when 'document' then input#>'{renderSnapshot,metadata,doctor,signatureImage}' end;
 if duplicate=saved then return input#-'{doctor,signatureImage}'; end if;
 return input;
end; $$;
revoke all on function hpsr_private.compact_clinical_signature(jsonb) from public,anon,authenticated;
-- Trigger invocation retains the caller's row permissions. There is no privileged row writer.
create or replace function hpsr_private.compact_clinical_signature_on_write() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 new.payload:=hpsr_private.compact_clinical_signature(new.payload);
 new.released_render_payload:=hpsr_private.compact_clinical_signature(new.released_render_payload);
 return new;
end; $$;
revoke all on function hpsr_private.compact_clinical_signature_on_write() from public,anon,authenticated;
-- The invoker trigger calls this pure helper under the authenticated writer.
grant execute on function hpsr_private.compact_clinical_signature(jsonb) to authenticated;
create trigger a0_compact_clinical_signature before insert or update of payload,released_render_payload on public.clinical_records
for each row execute function hpsr_private.compact_clinical_signature_on_write();

