-- Corrige a promoção de cargos usando o registro funcional já existente por ID ou passaporte.
-- Também preserva o payload contratual enviado pela interface, incluindo o reinício do contrato.
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
  resolved_passport text;
  resolved_name text;
  existing_member_id text;
begin
  if not public.is_access_admin() then
    raise exception 'Administrative access required';
  end if;

  resolved_role := coalesce(nullif(member_payload->>'hospitalRole', ''), nullif(member_payload->>'role', ''));
  resolved_specialty := nullif(member_payload->>'specialty', '');
  resolved_service_status := coalesce(nullif(member_payload->>'serviceStatus', ''), nullif(member_payload->>'service_status', ''));
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

  select tm.id
    into existing_member_id
  from public.team_members tm
  where tm.id = target_profile_id::text
     or (resolved_passport is not null and tm.passport = resolved_passport)
  order by case when tm.id = target_profile_id::text then 0 else 1 end
  limit 1
  for update;

  if existing_member_id is not null then
    update public.team_members
    set
      passport = coalesce(resolved_passport, passport),
      name = coalesce(resolved_name, name),
      hospital_role = coalesce(resolved_role, hospital_role),
      status = 'Ativo',
      payload = member_payload,
      updated_at = now()
    where id = existing_member_id;
  else
    insert into public.team_members (
      id,
      passport,
      name,
      hospital_role,
      status,
      payload,
      created_at,
      updated_at
    ) values (
      target_profile_id::text,
      resolved_passport,
      coalesce(resolved_name, 'Não informado'),
      coalesce(resolved_role, 'Estagiário de Enfermagem'),
      'Ativo',
      member_payload,
      now(),
      now()
    );
  end if;
end;
$$;

revoke all on function public.admin_update_team_member(uuid, jsonb) from public;
grant execute on function public.admin_update_team_member(uuid, jsonb) to authenticated;
