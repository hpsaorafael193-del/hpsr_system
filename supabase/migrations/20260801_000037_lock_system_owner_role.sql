-- v1.0.149 — Protege o cargo exclusivo Diretor Técnico / Dev.
-- A identidade é fixada pelo user_id e confirmada pelo e-mail da conta Auth.

create table if not exists public.system_owner_identity (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_owner_identity_email_not_blank check (length(trim(email)) > 3)
);

alter table public.system_owner_identity enable row level security;
revoke all on table public.system_owner_identity from anon, authenticated;

do $$
declare
  owner_count integer;
  owner_id uuid;
  owner_email text;
begin
  select count(*)
    into owner_count
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'Diretor Técnico / Dev'
    and lower(trim(coalesce(p.email, ''))) = lower(trim(coalesce(u.email, '')))
    and length(trim(coalesce(u.email, ''))) > 3;

  if owner_count <> 1 then
    raise exception 'A proteção do cargo Diretor Técnico / Dev exige exatamente um perfil atual com user_id e e-mail Auth correspondentes. Encontrados: %', owner_count;
  end if;

  select p.id, lower(trim(u.email))
    into owner_id, owner_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'Diretor Técnico / Dev'
    and lower(trim(coalesce(p.email, ''))) = lower(trim(coalesce(u.email, '')))
    and length(trim(coalesce(u.email, ''))) > 3
  limit 1;

  insert into public.system_owner_identity (singleton, user_id, email, updated_at)
  values (true, owner_id, owner_email, now())
  on conflict (singleton) do update
  set user_id = excluded.user_id,
      email = excluded.email,
      updated_at = now();
end;
$$;

create or replace function public.is_system_owner_identity(
  candidate_user_id uuid,
  candidate_email text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.system_owner_identity owner
    where owner.singleton = true
      and owner.user_id = candidate_user_id
      and lower(trim(owner.email)) = lower(trim(coalesce(candidate_email, '')))
  );
$$;

revoke all on function public.is_system_owner_identity(uuid, text) from public;
grant execute on function public.is_system_owner_identity(uuid, text) to authenticated;

create or replace function public.protect_system_owner_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  owner_email text;
begin
  select user_id, email into owner_id, owner_email
  from public.system_owner_identity
  where singleton = true;

  if owner_id is null then
    raise exception 'Identidade exclusiva do sistema não configurada';
  end if;

  if new.role = 'Diretor Técnico / Dev' and not (
    new.id = owner_id
    and lower(trim(coalesce(new.email, ''))) = lower(trim(owner_email))
  ) then
    raise exception 'O cargo Diretor Técnico / Dev é exclusivo da identidade autorizada';
  end if;

  if new.id = owner_id then
    if lower(trim(coalesce(new.email, ''))) <> lower(trim(owner_email)) then
      raise exception 'O e-mail da identidade exclusiva não pode ser alterado por este fluxo';
    end if;
    if new.role <> 'Diretor Técnico / Dev' then
      raise exception 'O cargo exclusivo da identidade autorizada não pode ser removido';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_system_owner_profile_role_trigger on public.profiles;
create trigger protect_system_owner_profile_role_trigger
before insert or update of role, email on public.profiles
for each row execute function public.protect_system_owner_profile_role();

create or replace function public.protect_system_owner_team_member_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  owner_email text;
  target_email text;
  has_exclusive_role boolean;
  had_exclusive_role boolean;
begin
  select user_id, email into owner_id, owner_email
  from public.system_owner_identity
  where singleton = true;

  if tg_op = 'DELETE' then
    had_exclusive_role := old.hospital_role = 'Diretor Técnico / Dev'
      or coalesce(old.payload->>'systemRole', '') = 'Diretor Técnico / Dev'
      or coalesce(old.payload->>'hospitalRole', '') = 'Diretor Técnico / Dev';
    if had_exclusive_role then
      raise exception 'O registro da identidade exclusiva não pode ser removido';
    end if;
    return old;
  end if;

  has_exclusive_role := new.hospital_role = 'Diretor Técnico / Dev'
    or coalesce(new.payload->>'systemRole', '') = 'Diretor Técnico / Dev'
    or coalesce(new.payload->>'hospitalRole', '') = 'Diretor Técnico / Dev';

  if has_exclusive_role then
    select p.email into target_email
    from public.profiles p
    where p.id::text = new.id;

    if new.id <> owner_id::text
      or lower(trim(coalesce(target_email, ''))) <> lower(trim(owner_email)) then
      raise exception 'O cargo Diretor Técnico / Dev é exclusivo da identidade autorizada';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    had_exclusive_role := old.hospital_role = 'Diretor Técnico / Dev'
      or coalesce(old.payload->>'systemRole', '') = 'Diretor Técnico / Dev'
      or coalesce(old.payload->>'hospitalRole', '') = 'Diretor Técnico / Dev';
    if had_exclusive_role and not has_exclusive_role then
      raise exception 'O cargo exclusivo da identidade autorizada não pode ser removido';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_system_owner_team_member_role_trigger on public.team_members;
create trigger protect_system_owner_team_member_role_trigger
before insert or update or delete on public.team_members
for each row execute function public.protect_system_owner_team_member_role();

create or replace function public.block_exclusive_role_registration_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.requested_role = 'Diretor Técnico / Dev'
    or coalesce(new.payload->>'requestedRole', '') = 'Diretor Técnico / Dev' then
    raise exception 'O cargo Diretor Técnico / Dev não pode ser solicitado ou atribuído por cadastro';
  end if;
  return new;
end;
$$;

drop trigger if exists block_exclusive_role_registration_request_trigger on public.staff_registration_requests;
create trigger block_exclusive_role_registration_request_trigger
before insert or update of requested_role, payload on public.staff_registration_requests
for each row execute function public.block_exclusive_role_registration_request();
