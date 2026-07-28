-- Proteção da identidade do paciente, dados infantis e vínculos de responsáveis.

alter table public.patient_registry
  add column if not exists birth_date date;

create index if not exists idx_patient_registry_birth_date
  on public.patient_registry (birth_date)
  where birth_date is not null;

create table if not exists public.patient_guardian_links (
  id uuid primary key default gen_random_uuid(),
  child_passport text not null references public.patient_registry(passport) on update cascade on delete cascade,
  guardian_passport text not null references public.patient_registry(passport) on update cascade on delete restrict,
  relationship text not null,
  access_status text not null default 'authorized',
  portal_access boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  constraint patient_guardian_not_self check (child_passport <> guardian_passport),
  constraint patient_guardian_relationship_not_blank check (length(trim(relationship)) > 0),
  constraint patient_guardian_access_status check (access_status in ('pending','authorized','suspended','ended')),
  constraint patient_guardian_unique unique (child_passport, guardian_passport)
);

create index if not exists idx_patient_guardian_child
  on public.patient_guardian_links (child_passport, access_status);
create index if not exists idx_patient_guardian_guardian
  on public.patient_guardian_links (guardian_passport, access_status);

create or replace function public.touch_patient_guardian_link()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.child_passport = upper(trim(new.child_passport));
  new.guardian_passport = upper(trim(new.guardian_passport));
  new.relationship = trim(new.relationship);
  new.updated_at = now();
  if new.access_status in ('suspended','ended') and new.revoked_at is null then
    new.revoked_at = now();
  elsif new.access_status in ('pending','authorized') then
    new.revoked_at = null;
    new.revoked_by = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_patient_guardian_link on public.patient_guardian_links;
create trigger trg_patient_guardian_link
before insert or update on public.patient_guardian_links
for each row execute function public.touch_patient_guardian_link();

alter table public.patient_guardian_links enable row level security;
revoke all on table public.patient_guardian_links from anon, authenticated;

create policy "staff guardian links"
on public.patient_guardian_links for all to authenticated
using (public.is_hpsr_staff())
with check (public.is_hpsr_staff());

grant select, insert, update, delete on public.patient_guardian_links to authenticated;

-- Retorna os pacientes que uma conta do Portal pode visualizar sem duplicar registros clínicos.
create or replace function public.patient_portal_accessible_patients(target_passport text)
returns table (
  passport text,
  name text,
  relationship text,
  access_type text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.passport, p.name, 'Titular'::text, 'self'::text
  from public.patient_registry p
  where p.passport = upper(trim(target_passport))
  union all
  select child.passport, child.name, link.relationship, 'guardian'::text
  from public.patient_guardian_links link
  join public.patient_registry child on child.passport = link.child_passport
  where link.guardian_passport = upper(trim(target_passport))
    and link.portal_access = true
    and link.access_status = 'authorized';
$$;

revoke all on function public.patient_portal_accessible_patients(text) from public;
grant execute on function public.patient_portal_accessible_patients(text) to authenticated;
