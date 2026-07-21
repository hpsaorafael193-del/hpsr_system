-- Contas permanentes do Portal do Paciente vinculadas ao cadastro institucional.
create table if not exists public.patient_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  patient_passport text not null unique references public.patient_registry(passport) on update cascade on delete restrict,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists idx_patient_accounts_passport on public.patient_accounts(patient_passport);
create index if not exists idx_patient_accounts_email on public.patient_accounts(lower(email));

create or replace function public.touch_patient_accounts_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.email = lower(trim(new.email));
  new.patient_passport = upper(trim(new.patient_passport));
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_patient_accounts_updated_at on public.patient_accounts;
create trigger trg_patient_accounts_updated_at
before insert or update on public.patient_accounts
for each row execute function public.touch_patient_accounts_updated_at();

alter table public.patient_accounts enable row level security;
revoke all on table public.patient_accounts from anon, authenticated;

-- O paciente pode consultar apenas o próprio vínculo pelo Auth.
drop policy if exists "patient reads own account" on public.patient_accounts;
create policy "patient reads own account"
on public.patient_accounts for select to authenticated
using (user_id = auth.uid());

grant select on table public.patient_accounts to authenticated;

comment on table public.patient_accounts is 'Vínculo permanente entre Supabase Auth e o passaporte institucional do paciente.';

-- Diferencia contas da equipe das contas de pacientes. Contas de pacientes não recebem
-- acesso direto às tabelas internas; todo conteúdo do Portal passa pelas rotas servidoras.
create or replace function public.is_hpsr_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid());
$$;
revoke all on function public.is_hpsr_staff() from public;
grant execute on function public.is_hpsr_staff() to authenticated;

-- Cadastro institucional: equipe administra; paciente consulta somente o próprio vínculo.
drop policy if exists "authenticated patient registry" on public.patient_registry;
drop policy if exists "staff patient registry" on public.patient_registry;
create policy "staff patient registry" on public.patient_registry
for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "patient reads own registry" on public.patient_registry;
create policy "patient reads own registry" on public.patient_registry
for select to authenticated using (
  exists(select 1 from public.patient_accounts a where a.user_id = auth.uid() and a.patient_passport = patient_registry.passport)
);

-- Remove das contas de pacientes as políticas históricas amplas da área interna.
drop policy if exists "authenticated profiles read" on public.profiles;
create policy "staff profiles read" on public.profiles for select to authenticated using (public.is_hpsr_staff());
drop policy if exists "authenticated profile administration" on public.profiles;
create policy "staff profile administration" on public.profiles for update to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());

drop policy if exists "authenticated operational access" on public.team_members;
create policy "staff operational access" on public.team_members for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated applications access" on public.staff_applications;
create policy "staff applications access" on public.staff_applications for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated registrations access" on public.staff_registration_requests;
create policy "staff registrations access" on public.staff_registration_requests for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated appointments access" on public.appointments;
create policy "staff appointments access" on public.appointments for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated financial access" on public.financial_receipts;
create policy "staff financial access" on public.financial_receipts for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated plan financial access" on public.financial_plan_entries;
create policy "staff plan financial access" on public.financial_plan_entries for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated activity access" on public.system_activities;
create policy "staff activity access" on public.system_activities for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated clinical access" on public.clinical_records;
create policy "staff clinical access" on public.clinical_records for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated beds access" on public.hospital_beds;
create policy "staff beds access" on public.hospital_beds for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());
drop policy if exists "authenticated donations access" on public.blood_donations;
create policy "staff donations access" on public.blood_donations for all to authenticated using (public.is_hpsr_staff()) with check (public.is_hpsr_staff());

drop policy if exists "Medical staff view availability" on public.clinical_availability_series;
create policy "Medical staff view availability" on public.clinical_availability_series for select to authenticated using (public.is_hpsr_staff());
drop policy if exists "Medical staff view slots" on public.clinical_appointment_slots;
create policy "Medical staff view slots" on public.clinical_appointment_slots for select to authenticated using (public.is_hpsr_staff());
drop policy if exists "Medical staff view plans" on public.clinical_followup_plans;
create policy "Medical staff view plans" on public.clinical_followup_plans for select to authenticated using (public.is_hpsr_staff());
drop policy if exists "Medical staff view occurrences" on public.clinical_followup_occurrences;
create policy "Medical staff view occurrences" on public.clinical_followup_occurrences for select to authenticated using (public.is_hpsr_staff());
