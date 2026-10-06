-- v1.1.16-test.43 — fichas técnicas de acompanhamento solicitadas pelo médico.
create table if not exists public.followup_intake_forms (
  id uuid primary key default gen_random_uuid(),
  patient_passport text not null,
  doctor_id uuid not null references auth.users(id),
  doctor_name text not null default '',
  specialty text not null,
  form_type text not null check (form_type in ('gestational','ivf_ropa')),
  status text not null default 'requested' check (status in ('requested','draft','submitted','reviewed','cancelled')),
  answers jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  request_note text,
  constraint followup_intake_forms_passport_nonempty check (btrim(patient_passport) <> '')
);

create index if not exists followup_intake_forms_patient_idx on public.followup_intake_forms (patient_passport, requested_at desc);
create index if not exists followup_intake_forms_doctor_idx on public.followup_intake_forms (doctor_id, requested_at desc);

alter table public.followup_intake_forms enable row level security;

drop policy if exists "staff view own followup intake forms" on public.followup_intake_forms;
create policy "staff view own followup intake forms" on public.followup_intake_forms
for select to authenticated using (doctor_id = auth.uid() or public.is_hpsr_system_admin());

drop policy if exists "staff create own followup intake forms" on public.followup_intake_forms;
create policy "staff create own followup intake forms" on public.followup_intake_forms
for insert to authenticated with check (
  public.is_hpsr_system_admin()
  or (
    doctor_id = auth.uid()
    and public.hpsr_can_manage_reproductive_patient(
      doctor_id,
      patient_passport,
      case when form_type = 'ivf_ropa' then 'in_vitro' else 'gestacional' end
    )
  )
);

drop policy if exists "staff update own followup intake forms" on public.followup_intake_forms;
create policy "staff update own followup intake forms" on public.followup_intake_forms
for update to authenticated using (doctor_id = auth.uid() or public.is_hpsr_system_admin())
with check (
  public.is_hpsr_system_admin()
  or (
    doctor_id = auth.uid()
    and public.hpsr_can_manage_reproductive_patient(
      doctor_id,
      patient_passport,
      case when form_type = 'ivf_ropa' then 'in_vitro' else 'gestacional' end
    )
  )
);

revoke all on table public.followup_intake_forms from anon;
grant select, insert, update on table public.followup_intake_forms to authenticated;
grant select, insert, update, delete on table public.followup_intake_forms to service_role;

comment on table public.followup_intake_forms is 'Solicitações versionadas de ficha técnica OFF RP para acompanhamentos. O envio de uma nova ficha não apaga fichas anteriores.';
