-- v1.0.293 — Agenda compartilhada de procedimentos
-- A página de procedimentos deixa de ser estado local e passa a ter uma única
-- fonte persistente. Toda a equipe aprovada pode visualizar; alterações ficam
-- restritas à hierarquia global já definida em is_hpsr_schedule_manager().

create table if not exists public.clinical_procedures (
  id uuid primary key default gen_random_uuid(),
  patient_passport text not null,
  patient_name text not null,
  procedure_type text not null,
  room text not null,
  procedure_date date not null,
  start_time time without time zone not null,
  duration_hours integer not null,
  status text not null default 'solicitado',
  observations text,
  professionals jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinical_procedures_type_valid check (
    procedure_type in ('parto-normal', 'cesarea', 'parto-humanizado', 'fiv', 'procedimento-geral')
  ),
  constraint clinical_procedures_status_valid check (status in ('solicitado', 'confirmado')),
  constraint clinical_procedures_patient_name_not_blank check (btrim(patient_name) <> ''),
  constraint clinical_procedures_patient_passport_not_blank check (btrim(patient_passport) <> ''),
  constraint clinical_procedures_room_not_blank check (btrim(room) <> ''),
  constraint clinical_procedures_professionals_array check (jsonb_typeof(professionals) = 'array'),
  constraint clinical_procedures_duration_positive check (duration_hours > 0)
);

create index if not exists idx_clinical_procedures_date_time
  on public.clinical_procedures (procedure_date, start_time);

create index if not exists idx_clinical_procedures_patient
  on public.clinical_procedures (patient_passport, procedure_date desc);

create or replace function public.guard_clinical_procedure_room_conflict()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_start_minutes integer;
  v_end_minutes integer;
begin
  v_start_minutes := extract(hour from new.start_time)::integer * 60 + extract(minute from new.start_time)::integer;
  v_end_minutes := v_start_minutes + new.duration_hours * 60;

  if exists (
    select 1
    from public.clinical_procedures other
    where other.id <> new.id
      and other.procedure_date = new.procedure_date
      and other.room = new.room
      and v_start_minutes < (
        extract(hour from other.start_time)::integer * 60
        + extract(minute from other.start_time)::integer
        + other.duration_hours * 60
      )
      and v_end_minutes > (
        extract(hour from other.start_time)::integer * 60
        + extract(minute from other.start_time)::integer
      )
  ) then
    raise exception 'Conflito de sala: já existe outro procedimento neste intervalo.' using errcode = '23P01';
  end if;

  return new;
end;
$$;

create or replace function public.normalize_clinical_procedure()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.patient_passport = upper(btrim(new.patient_passport));
  new.patient_name = btrim(new.patient_name);
  new.room = btrim(new.room);
  new.observations = nullif(btrim(coalesce(new.observations, '')), '');
  new.duration_hours = case new.procedure_type
    when 'parto-normal' then 4
    when 'cesarea' then 4
    when 'parto-humanizado' then 4
    when 'fiv' then 1
    else 2
  end;
  new.updated_at = now();
  if tg_op = 'UPDATE' then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_normalize_clinical_procedure on public.clinical_procedures;
create trigger trg_normalize_clinical_procedure
before insert or update on public.clinical_procedures
for each row execute function public.normalize_clinical_procedure();

drop trigger if exists trg_guard_clinical_procedure_room_conflict on public.clinical_procedures;
create trigger trg_guard_clinical_procedure_room_conflict
before insert or update on public.clinical_procedures
for each row execute function public.guard_clinical_procedure_room_conflict();

alter table public.clinical_procedures enable row level security;
revoke all on table public.clinical_procedures from anon, authenticated;
grant select, insert, update, delete on table public.clinical_procedures to authenticated;

drop policy if exists "staff read clinical procedures" on public.clinical_procedures;
create policy "staff read clinical procedures"
on public.clinical_procedures
for select
to authenticated
using (public.is_hpsr_staff());

drop policy if exists "schedule managers create clinical procedures" on public.clinical_procedures;
create policy "schedule managers create clinical procedures"
on public.clinical_procedures
for insert
to authenticated
with check (public.is_hpsr_schedule_manager());

drop policy if exists "schedule managers update clinical procedures" on public.clinical_procedures;
create policy "schedule managers update clinical procedures"
on public.clinical_procedures
for update
to authenticated
using (public.is_hpsr_schedule_manager())
with check (public.is_hpsr_schedule_manager());

drop policy if exists "schedule managers delete clinical procedures" on public.clinical_procedures;
create policy "schedule managers delete clinical procedures"
on public.clinical_procedures
for delete
to authenticated
using (public.is_hpsr_schedule_manager());

-- Mantém os cards sincronizados entre médicos conectados sem polling.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'clinical_procedures'
     ) then
    alter publication supabase_realtime add table public.clinical_procedures;
  end if;
end;
$$;

comment on table public.clinical_procedures is
  'Agenda compartilhada de procedimentos do HPSR. Leitura para equipe autenticada e escrita apenas por gestores globais da agenda.';
