-- Bloqueio real do dashboard até aprovação administrativa.

create or replace function public.is_access_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.access_status = 'Aprovado'
      and p.role in ('Dev / Desenvolvedor do Sistema', 'Diretora', 'Vice Diretor')
  );
$$;

revoke all on function public.is_access_admin() from public;
grant execute on function public.is_access_admin() to authenticated;

drop policy if exists "authenticated profiles read" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "authenticated profile administration" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile read" on public.profiles;

create policy "profile self read"
on public.profiles for select to authenticated
using (auth.uid() = id or public.is_access_admin());

create policy "profile administration update"
on public.profiles for update to authenticated
using (public.is_access_admin())
with check (public.is_access_admin());

drop policy if exists "authenticated registrations access" on public.staff_registration_requests;
drop policy if exists "public registration insert" on public.staff_registration_requests;

create policy "registration public insert"
on public.staff_registration_requests for insert to anon, authenticated
with check (status = 'Pendente');

create policy "registration own or admin read"
on public.staff_registration_requests for select to authenticated
using (auth_user_id = auth.uid() or public.is_access_admin());

create policy "registration admin update"
on public.staff_registration_requests for update to authenticated
using (public.is_access_admin())
with check (public.is_access_admin());

create or replace function public.submit_staff_registration(
  request_id text,
  request_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set
    name = coalesce(nullif(request_payload->>'name', ''), name),
    email = coalesce(nullif(request_payload->>'email', ''), email),
    passport = nullif(request_payload->>'passport', ''),
    crm = nullif(request_payload->>'crm', ''),
    role = coalesce(nullif(request_payload->>'requestedRole', ''), role),
    specialty = nullif(request_payload->>'specialty', ''),
    city_phone = nullif(request_payload->>'cityPhone', ''),
    discord = nullif(request_payload->>'discord', ''),
    access_status = 'Pendente',
    updated_at = now()
  where id = uid;

  insert into public.staff_registration_requests (
    id, auth_user_id, passport, name, requested_role, status, payload, created_at, updated_at
  ) values (
    request_id,
    uid,
    request_payload->>'passport',
    request_payload->>'name',
    request_payload->>'requestedRole',
    'Pendente',
    request_payload,
    coalesce((request_payload->>'createdAt')::timestamptz, now()),
    now()
  )
  on conflict (id) do update set
    payload = excluded.payload,
    updated_at = now();
end;
$$;

grant execute on function public.submit_staff_registration(text, jsonb) to authenticated;

create or replace function public.decide_staff_registration(
  request_id text,
  decision text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
  target_role text;
  target_payload jsonb;
begin
  if not public.is_access_admin() then
    raise exception 'Administrative access required';
  end if;
  if decision not in ('Aprovado', 'Recusado') then
    raise exception 'Invalid decision';
  end if;

  select auth_user_id, requested_role, payload
  into target_user, target_role, target_payload
  from public.staff_registration_requests
  where id = request_id;

  update public.staff_registration_requests
  set status = decision, updated_at = now()
  where id = request_id;

  if target_user is not null then
    update public.profiles
    set
      access_status = decision,
      role = coalesce(target_role, role),
      specialty = coalesce(nullif(target_payload->>'specialty', ''), specialty),
      passport = coalesce(nullif(target_payload->>'passport', ''), passport),
      crm = coalesce(nullif(target_payload->>'crm', ''), crm),
      updated_at = now()
    where id = target_user;
  end if;
end;
$$;

grant execute on function public.decide_staff_registration(text, text) to authenticated;
