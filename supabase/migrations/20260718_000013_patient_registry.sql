-- Cadastro institucional compartilhado de pacientes.
-- Um paciente é único pelo passaporte e pode ser visualizado por toda a equipe autenticada.

create table if not exists public.patient_registry (
  passport text primary key,
  name text not null,
  age text,
  blood_type text,
  city_phone text,
  email text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_registry_passport_not_blank check (length(trim(passport)) > 0),
  constraint patient_registry_name_not_blank check (length(trim(name)) > 0)
);

create index if not exists idx_patient_registry_name on public.patient_registry (name);
create index if not exists idx_patient_registry_email on public.patient_registry (email) where email is not null;

create or replace function public.touch_patient_registry_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.passport = upper(trim(new.passport));
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_patient_registry_updated_at on public.patient_registry;
create trigger trg_patient_registry_updated_at
before insert or update on public.patient_registry
for each row execute function public.touch_patient_registry_updated_at();

alter table public.patient_registry enable row level security;

drop policy if exists "authenticated patient registry" on public.patient_registry;
create policy "authenticated patient registry"
on public.patient_registry for all to authenticated
using (true)
with check (true);

revoke all on table public.patient_registry from anon;
grant select, insert, update, delete on table public.patient_registry to authenticated;
