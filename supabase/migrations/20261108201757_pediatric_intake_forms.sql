-- Add the pediatric form to the existing versioned intake workflow.
begin;

alter table public.followup_intake_forms drop constraint followup_intake_forms_form_type_check;
alter table public.followup_intake_forms add constraint followup_intake_forms_form_type_check
  check (form_type in ('gestational', 'ivf_ropa', 'pediatric'));

create unique index followup_intake_pediatric_pending_idx
  on public.followup_intake_forms (doctor_id, patient_passport)
  where form_type = 'pediatric' and status in ('requested', 'draft');

drop policy "staff view own followup intake forms" on public.followup_intake_forms;
create policy "staff view own followup intake forms" on public.followup_intake_forms
  for select to authenticated using (
    (doctor_id = (select auth.uid()) or (select public.is_hpsr_system_admin()))
    and (form_type <> 'pediatric' or (select public.hpsr_pediatric_access()))
  );

drop policy "staff create own followup intake forms" on public.followup_intake_forms;
create policy "staff create own followup intake forms" on public.followup_intake_forms
  for insert to authenticated with check (
    case when form_type = 'pediatric' then
      doctor_id = (select auth.uid())
      and public.hpsr_pediatric_write(doctor_id, patient_passport)
      and status = 'requested' and answers = '{}'::jsonb
      and submitted_at is null and reviewed_at is null
      and exists (
        select 1 from public.patient_guardian_links g
        where g.child_passport = followup_intake_forms.patient_passport
          and g.access_status = 'authorized' and g.portal_access
          and (g.guardian_user_id is not null or nullif(btrim(g.guardian_passport), '') is not null)
          and g.guardian_passport is distinct from g.child_passport
      )
    else
      (select public.is_hpsr_system_admin())
      or (doctor_id = (select auth.uid()) and public.hpsr_can_manage_reproductive_patient(
        doctor_id, patient_passport, case when form_type = 'ivf_ropa' then 'in_vitro' else 'gestacional' end
      ))
    end
  );

drop policy "staff update own followup intake forms" on public.followup_intake_forms;
create policy "staff update own followup intake forms" on public.followup_intake_forms
  for update to authenticated
  using (case when form_type = 'pediatric' then
    public.hpsr_pediatric_write(doctor_id, patient_passport) and status = 'submitted'
  else doctor_id = (select auth.uid()) or (select public.is_hpsr_system_admin()) end)
  with check (case when form_type = 'pediatric' then
    public.hpsr_pediatric_write(doctor_id, patient_passport) and status = 'reviewed' and reviewed_at is not null
  else
    (select public.is_hpsr_system_admin())
    or (doctor_id = (select auth.uid()) and public.hpsr_can_manage_reproductive_patient(
      doctor_id, patient_passport, case when form_type = 'ivf_ropa' then 'in_vitro' else 'gestacional' end
    ))
  end);

create function public.hpsr_preserve_pediatric_intake_response() returns trigger
  language plpgsql security invoker set search_path = '' as $$
begin
  if current_user = 'authenticated' and (old.form_type = 'pediatric' or new.form_type = 'pediatric') then
    if (to_jsonb(new) - array['status', 'reviewed_at', 'updated_at']) <>
       (to_jsonb(old) - array['status', 'reviewed_at', 'updated_at']) then
      raise exception 'Os dados e as respostas da ficha pediátrica devem ser preservados.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.hpsr_preserve_pediatric_intake_response() from public, anon, authenticated;
create trigger preserve_pediatric_intake_response before update on public.followup_intake_forms
  for each row execute function public.hpsr_preserve_pediatric_intake_response();

commit;
