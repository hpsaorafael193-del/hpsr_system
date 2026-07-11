create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  passport text unique,
  crm text,
  role text not null default 'Estagiário de Enfermagem',
  specialty text,
  city_phone text,
  discord text,
  signature_path text,
  service_status text default 'Fora de serviço',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_applications (
  id text primary key,
  passport text,
  token text,
  name text not null,
  desired_role text,
  status text not null default 'Pendente',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_registration_requests (
  id text primary key,
  passport text not null,
  name text not null,
  requested_role text,
  status text not null default 'Pendente',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id text primary key,
  passport text not null,
  patient text not null,
  status text not null default 'Solicitação enviada',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id text primary key,
  passport text unique,
  name text not null,
  hospital_role text not null,
  status text default 'Ativo',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_receipts (
  id text primary key,
  number text unique not null,
  total numeric(14,2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_plan_entries (
  id text primary key,
  plan_id text,
  plan_name text not null,
  holder_passport text,
  value numeric(14,2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_activities (
  id text primary key,
  module text not null,
  action text not null,
  description text not null,
  actor text,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_records (
  id text primary key,
  patient_passport text,
  record_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hospital_beds (
  id text primary key,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.blood_donations (
  id text primary key,
  donor_passport text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.staff_applications enable row level security;
alter table public.staff_registration_requests enable row level security;
alter table public.appointments enable row level security;
alter table public.team_members enable row level security;
alter table public.financial_receipts enable row level security;
alter table public.financial_plan_entries enable row level security;
alter table public.system_activities enable row level security;
alter table public.clinical_records enable row level security;
alter table public.hospital_beds enable row level security;
alter table public.blood_donations enable row level security;

create policy "authenticated profiles read" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "authenticated operational access" on public.team_members for all to authenticated using (true) with check (true);
create policy "authenticated applications access" on public.staff_applications for all to authenticated using (true) with check (true);
create policy "public application insert" on public.staff_applications for insert to anon with check (true);
create policy "authenticated registrations access" on public.staff_registration_requests for all to authenticated using (true) with check (true);
create policy "public registration insert" on public.staff_registration_requests for insert to anon with check (true);
create policy "authenticated appointments access" on public.appointments for all to authenticated using (true) with check (true);
create policy "public appointment insert" on public.appointments for insert to anon with check (true);
create policy "authenticated financial access" on public.financial_receipts for all to authenticated using (true) with check (true);
create policy "authenticated plan financial access" on public.financial_plan_entries for all to authenticated using (true) with check (true);
create policy "authenticated activity access" on public.system_activities for all to authenticated using (true) with check (true);
create policy "authenticated clinical access" on public.clinical_records for all to authenticated using (true) with check (true);
create policy "authenticated beds access" on public.hospital_beds for all to authenticated using (true) with check (true);
create policy "authenticated donations access" on public.blood_donations for all to authenticated using (true) with check (true);
