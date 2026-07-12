-- Supabase como fonte única da equipe e das candidaturas.

-- Garante perfil para usuários criados diretamente no Auth.
insert into public.profiles (id, name, email, role, access_status)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'name', ''), split_part(coalesce(u.email, 'Usuário'), '@', 1)),
  u.email,
  coalesce(nullif(u.raw_user_meta_data->>'role', ''), 'Estagiário de Enfermagem'),
  'Pendente'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

create or replace function public.admin_update_profile(
  target_profile_id uuid,
  profile_patch jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_access_admin() then
    raise exception 'Administrative access required';
  end if;

  update public.profiles
  set
    role = coalesce(nullif(profile_patch->>'role', ''), role),
    specialty = coalesce(nullif(profile_patch->>'specialty', ''), specialty),
    service_status = coalesce(nullif(profile_patch->>'service_status', ''), service_status),
    updated_at = now()
  where id = target_profile_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.admin_update_profile(uuid, jsonb) from public;
grant execute on function public.admin_update_profile(uuid, jsonb) to authenticated;

create or replace function public.admin_delete_staff_application(application_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_access_admin() then
    raise exception 'Administrative access required';
  end if;

  delete from public.staff_applications where id = application_id;
end;
$$;

revoke all on function public.admin_delete_staff_application(text) from public;
grant execute on function public.admin_delete_staff_application(text) to authenticated;

-- Políticas explícitas para manter leitura e administração consistentes.
drop policy if exists "team profiles admin read" on public.profiles;
create policy "team profiles admin read"
on public.profiles for select to authenticated
using (auth.uid() = id or public.is_access_admin());

drop policy if exists "applications admin delete" on public.staff_applications;
create policy "applications admin delete"
on public.staff_applications for delete to authenticated
using (public.is_access_admin());

-- Ativa sincronização em tempo real para as telas administrativas.
do $$
begin
  begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.team_members; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.staff_applications; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.staff_registration_requests; exception when duplicate_object then null; end;
end $$;
