-- v1.0.361 — consolida Vice Diretor / Dev e preserva a função Administrador do Sistema.

update public.profiles p
   set role = 'Vice Diretor / Dev',
       staff_metadata = coalesce(p.staff_metadata, '{}'::jsonb)
         || jsonb_build_object(
              'systemRole', 'Administrador do Sistema',
              'accessLevel', 'Total'
            ),
       updated_at = now()
  from public.system_owner_identity owner
 where owner.singleton = true
   and p.id = owner.user_id;

update public.profiles
   set role = 'Vice Diretor / Dev',
       updated_at = now()
 where role = 'Diretor Técnico / Dev';

update public.staff_registration_requests
   set requested_role = case when requested_role = 'Diretor Técnico / Dev' then 'Vice Diretor / Dev' else requested_role end,
       payload = case
         when coalesce(payload->>'requestedRole', '') = 'Diretor Técnico / Dev'
           then jsonb_set(coalesce(payload, '{}'::jsonb), '{requestedRole}', to_jsonb('Vice Diretor / Dev'::text), true)
         else payload
       end,
       updated_at = now()
 where requested_role = 'Diretor Técnico / Dev'
    or coalesce(payload->>'requestedRole', '') = 'Diretor Técnico / Dev';

update public.staff_applications
   set desired_role = 'Vice Diretor / Dev',
       updated_at = now()
 where desired_role = 'Diretor Técnico / Dev';

create or replace function public.protect_system_owner_profile_role()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  if new.role = 'Diretor Técnico / Dev' then
    raise exception 'Este cargo foi descontinuado. Utilize Vice Diretor / Dev.';
  end if;

  if new.role = 'Vice Diretor / Dev' and not (
    new.id = owner_id
    and lower(trim(coalesce(new.email, ''))) = lower(trim(owner_email))
  ) then
    raise exception 'O cargo Vice Diretor / Dev é exclusivo da identidade administrativa autorizada';
  end if;

  if new.id = owner_id then
    if lower(trim(coalesce(new.email, ''))) <> lower(trim(owner_email)) then
      raise exception 'O e-mail da identidade administrativa exclusiva não pode ser alterado por este fluxo';
    end if;
    if new.role <> 'Vice Diretor / Dev' then
      raise exception 'O cargo Vice Diretor / Dev da identidade administrativa não pode ser removido por este fluxo';
    end if;
    new.staff_metadata := coalesce(new.staff_metadata, '{}'::jsonb)
      || jsonb_build_object('systemRole', 'Administrador do Sistema', 'accessLevel', 'Total');
  end if;

  return new;
end;
$function$;

create or replace function public.block_exclusive_role_registration_request()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.requested_role in ('Vice Diretor / Dev', 'Diretor Técnico / Dev')
     or coalesce(new.payload->>'requestedRole', '') in ('Vice Diretor / Dev', 'Diretor Técnico / Dev') then
    raise exception 'O cargo Vice Diretor / Dev é exclusivo da administração do sistema e não pode ser solicitado por cadastro';
  end if;
  return new;
end;
$function$;

comment on function public.protect_system_owner_profile_role() is
  'Protege a identidade administrativa: cargo hospitalar Vice Diretor / Dev e função de sistema Administrador do Sistema com acesso Total.';
