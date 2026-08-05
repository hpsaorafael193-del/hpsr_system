-- Arquiva cadastros de profissionais desligados na mesma transação do desligamento.
-- Evita que registros antigos retornem como pendentes e gerem notificações.
create or replace function public.admin_deactivate_team_member(
  target_profile_id uuid,
  deactivation_reason text default 'Desligamento administrativo'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  member_name text;
  member_passport text;
  normalized_reason text;
begin
  if not public.is_access_admin() then
    raise exception 'Administrative access required';
  end if;

  normalized_reason := coalesce(nullif(trim(deactivation_reason), ''), 'Desligamento administrativo');

  select p.name into actor_name
  from public.profiles p
  where p.id = auth.uid();

  select p.name, p.passport into member_name, member_passport
  from public.profiles p
  where p.id = target_profile_id;

  if member_name is null then
    raise exception 'Profile not found';
  end if;

  update public.profiles
  set
    access_status = 'Desligado',
    service_status = 'Fora de serviço',
    updated_at = now()
  where id = target_profile_id;

  update public.team_members
  set
    status = 'Desligado',
    payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
      'contractStatus', 'Desligado',
      'serviceStatus', 'Fora de serviço',
      'deactivatedAt', now(),
      'deactivationReason', normalized_reason
    ),
    updated_at = now()
  where id = target_profile_id::text;

  update public.staff_registration_requests
  set
    status = case when status = 'Recusado' then status else 'Aprovado' end,
    payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
      'hiddenAt', now(),
      'hiddenBy', coalesce(actor_name, auth.uid()::text),
      'hiddenReason', normalized_reason,
      'archivedByDeactivation', true,
      'doctorNotificationUnread', false
    ),
    updated_at = now()
  where auth_user_id = target_profile_id
     or (member_passport is not null and passport = member_passport)
     or (member_passport is not null and coalesce(payload->>'passport', '') = member_passport);

  insert into public.system_activities (
    id,
    module,
    action,
    description,
    actor,
    reference,
    created_at
  ) values (
    gen_random_uuid()::text,
    'Direção',
    'Desligamento de membro',
    member_name || ' foi desligado. Motivo: ' || normalized_reason,
    coalesce(actor_name, auth.uid()::text),
    target_profile_id::text,
    now()
  );
end;
$$;

revoke all on function public.admin_deactivate_team_member(uuid, text) from public;
grant execute on function public.admin_deactivate_team_member(uuid, text) to authenticated;
