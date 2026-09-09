-- v1.0.344 — Impede troca direta de médico/especialidade sem histórico.
create or replace function public.hpsr_protect_patient_link_identity_change()
returns trigger language plpgsql set search_path to 'public'
as $function$
begin
  if old.doctor_id<>new.doctor_id or public.hpsr_normalize_specialty(old.specialty)<>public.hpsr_normalize_specialty(new.specialty) then
    raise exception using errcode='23514', message='Troca de médico ou especialidade deve ser realizada pelo fluxo de substituição de vínculo.';
  end if;
  return new;
end;
$function$;
revoke all on function public.hpsr_protect_patient_link_identity_change() from public, anon;
grant execute on function public.hpsr_protect_patient_link_identity_change() to authenticated, service_role;
drop trigger if exists trg_protect_patient_link_identity_change on public.patient_doctor_links;
create trigger trg_protect_patient_link_identity_change before update of doctor_id,specialty on public.patient_doctor_links for each row execute function public.hpsr_protect_patient_link_identity_change();
