alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists access_status text not null default 'Pendente';
alter table public.staff_registration_requests add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists profiles_email_unique on public.profiles (lower(email)) where email is not null;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, access_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1), 'Novo usuário'),
    new.email,
    'Médico Clínico',
    'Pendente'
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_new_auth_user();

drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);

drop policy if exists "authenticated profile administration" on public.profiles;
create policy "authenticated profile administration" on public.profiles for update to authenticated using (true) with check (true);
