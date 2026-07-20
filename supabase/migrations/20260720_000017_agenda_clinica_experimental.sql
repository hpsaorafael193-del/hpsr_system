create extension if not exists pgcrypto;

create table if not exists public.clinical_availability_series (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  doctor_name text not null,
  specialty text not null default 'Clínico Geral',
  start_date date not null,
  end_date date not null,
  start_time time not null,
  end_time time not null,
  slot_duration_minutes integer not null default 60 check (slot_duration_minutes between 10 and 240),
  weekday smallint not null check (weekday between 0 and 6),
  daily_limit integer,
  status text not null default 'Ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_appointment_slots (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references public.clinical_availability_series(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  doctor_name text not null,
  specialty text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'Disponível' check (status in ('Disponível','Ocupado','Bloqueado','Encerrado','Cancelado')),
  patient_passport text,
  patient_name text,
  appointment_id text,
  booked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doctor_id, starts_at)
);

create table if not exists public.clinical_followup_plans (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  doctor_name text not null,
  patient_passport text not null,
  patient_name text not null,
  specialty text not null default 'Clínico Geral',
  frequency text not null check (frequency in ('Semanal','Quinzenal','Mensal','Personalizada')),
  interval_days integer not null default 7 check (interval_days > 0),
  start_date date not null,
  end_date date,
  total_consultations integer,
  total_weeks integer,
  status text not null default 'Ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_followup_occurrences (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.clinical_followup_plans(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_passport text not null,
  patient_name text not null,
  specialty text not null,
  planned_date date not null,
  status text not null default 'Planejada',
  slot_id uuid references public.clinical_appointment_slots(id) on delete set null,
  appointment_id text,
  charge_units integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id, planned_date)
);

create index if not exists clinical_slots_available_idx on public.clinical_appointment_slots (starts_at, specialty) where status='Disponível';
create index if not exists clinical_slots_patient_idx on public.clinical_appointment_slots (patient_passport, starts_at);
create index if not exists clinical_occurrences_patient_idx on public.clinical_followup_occurrences (patient_passport, planned_date);

alter table public.clinical_availability_series enable row level security;
alter table public.clinical_appointment_slots enable row level security;
alter table public.clinical_followup_plans enable row level security;
alter table public.clinical_followup_occurrences enable row level security;

drop policy if exists "Medical staff view availability" on public.clinical_availability_series;
create policy "Medical staff view availability" on public.clinical_availability_series for select to authenticated using (true);
drop policy if exists "Doctors manage own availability" on public.clinical_availability_series;
create policy "Doctors manage own availability" on public.clinical_availability_series for all to authenticated using (doctor_id=auth.uid()) with check (doctor_id=auth.uid());

drop policy if exists "Medical staff view slots" on public.clinical_appointment_slots;
create policy "Medical staff view slots" on public.clinical_appointment_slots for select to authenticated using (true);
drop policy if exists "Doctors manage own slots" on public.clinical_appointment_slots;
create policy "Doctors manage own slots" on public.clinical_appointment_slots for all to authenticated using (doctor_id=auth.uid()) with check (doctor_id=auth.uid());

drop policy if exists "Medical staff view plans" on public.clinical_followup_plans;
create policy "Medical staff view plans" on public.clinical_followup_plans for select to authenticated using (true);
drop policy if exists "Doctors manage own plans" on public.clinical_followup_plans;
create policy "Doctors manage own plans" on public.clinical_followup_plans for all to authenticated using (doctor_id=auth.uid()) with check (doctor_id=auth.uid());

drop policy if exists "Medical staff view occurrences" on public.clinical_followup_occurrences;
create policy "Medical staff view occurrences" on public.clinical_followup_occurrences for select to authenticated using (true);
drop policy if exists "Doctors manage own occurrences" on public.clinical_followup_occurrences;
create policy "Doctors manage own occurrences" on public.clinical_followup_occurrences for all to authenticated using (doctor_id=auth.uid()) with check (doctor_id=auth.uid());

create or replace function public.cleanup_old_clinical_slots()
returns integer language plpgsql security definer set search_path=public as $$
declare removed integer;
begin
  delete from public.clinical_appointment_slots where starts_at < now() - interval '7 days';
  get diagnostics removed = row_count;
  return removed;
end;$$;

create or replace function public.process_missed_followup_occurrences()
returns integer language plpgsql security definer set search_path=public as $$
declare changed integer;
begin
  with missed as (
    update public.clinical_followup_occurrences
       set status='Não confirmada no prazo', updated_at=now()
     where planned_date < (now() at time zone 'America/Sao_Paulo')::date
       and status in ('Planejada','Aguardando abertura','Horários disponíveis')
     returning plan_id, planned_date
  ), next_items as (
    select distinct on (o.plan_id) o.id
      from public.clinical_followup_occurrences o
      join missed m on m.plan_id=o.plan_id
     where o.planned_date>m.planned_date
       and o.status in ('Planejada','Aguardando abertura')
     order by o.plan_id,o.planned_date
  )
  update public.clinical_followup_occurrences o
     set charge_units=greatest(o.charge_units,2),updated_at=now()
   where o.id in (select id from next_items);
  get diagnostics changed=row_count;
  return changed;
end;$$;
