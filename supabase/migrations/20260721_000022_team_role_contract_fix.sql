-- Corrige atualização administrativa de cargo e sincroniza o contrato funcional.
create or replace function public.admin_update_team_member(
  target_profile_id uuid,
  member_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role text;
  resolved_specialty text;
  resolved_service_status text;
  resolved_department text;
  resolved_passport text;
  resolved_name text;
begin
  if not public.is_access_admin() then
    raise exception 'Administrative access required';
  end if;

  resolved_role := coalesce(nullif(member_payload->>'hospitalRole', ''), nullif(member_payload->>'role', ''));
  resolved_specialty := nullif(member_payload->>'specialty', '');
  resolved_service_status := coalesce(nullif(member_payload->>'serviceStatus', ''), nullif(member_payload->>'service_status', ''));
  resolved_department := nullif(member_payload->>'department', '');
  resolved_passport := nullif(member_payload->>'passport', '');
  resolved_name := nullif(member_payload->>'name', '');

  update public.profiles
  set
    role = coalesce(resolved_role, role),
    specialty = coalesce(resolved_specialty, specialty),
    service_status = coalesce(resolved_service_status, service_status),
    updated_at = now()
  where id = target_profile_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  insert into public.team_members (
    id,
    passport,
    name,
    hospital_role,
    status,
    payload,
    created_at,
    updated_at
  )
  values (
    target_profile_id::text,
    resolved_passport,
    coalesce(resolved_name, 'Não informado'),
    coalesce(resolved_role, 'Estagiário de Enfermagem'),
    'Ativo',
    member_payload,
    now(),
    now()
  )
  on conflict (id) do update
  set
    passport = excluded.passport,
    name = excluded.name,
    hospital_role = excluded.hospital_role,
    status = excluded.status,
    payload = excluded.payload,
    updated_at = now();
end;
$$;

revoke all on function public.admin_update_team_member(uuid, jsonb) from public;
grant execute on function public.admin_update_team_member(uuid, jsonb) to authenticated;
