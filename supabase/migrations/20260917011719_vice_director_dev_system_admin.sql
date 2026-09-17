-- v1.0.361 — substitui Diretor Técnico / Dev por Vice Diretor / Dev.
-- A identidade administrativa exclusiva continua determinada por system_owner_identity,
-- separando a função técnica de administrador do nome do cargo hospitalar.

-- Atualiza todas as funções atuais que ainda referenciam o nome antigo do cargo.
do $migration$
declare
  fn record;
  definition text;
begin
  for fn in
    select p.oid
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and pg_get_functiondef(p.oid) like '%Diretor Técnico / Dev%'
  loop
    definition := replace(pg_get_functiondef(fn.oid), 'Diretor Técnico / Dev', 'Vice Diretor / Dev');
    execute definition;
  end loop;
end;
$migration$;

-- Função explícita de administrador do sistema: independe do cargo exibido.
create or replace function public.is_hpsr_system_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
      from public.system_owner_identity owner
      join public.profiles p on p.id = owner.user_id
     where owner.singleton = true
       and p.id = auth.uid()
       and lower(trim(coalesce(p.email, ''))) = lower(trim(owner.email))
       and coalesce(p.access_status, 'Aprovado') = 'Aprovado'
  );
$function$;

revoke all on function public.is_hpsr_system_admin() from public, anon;
grant execute on function public.is_hpsr_system_admin() to authenticated, service_role;

-- Administração hospitalar continua disponível para a direção; a identidade do sistema
-- permanece administradora mesmo que futuramente o texto do cargo seja reorganizado.
create or replace function public.is_access_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select public.is_hpsr_system_admin()
    or exists (
      select 1
        from public.profiles p
       where p.id = auth.uid()
         and p.access_status = 'Aprovado'
         and p.role in ('Vice Diretor / Dev', 'Diretora', 'Vice Diretor')
    );
$function$;

create or replace function public.is_hpsr_internal_link_manager()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select public.is_hpsr_system_admin();
$function$;

create or replace function public.is_hpsr_schedule_manager()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select public.is_hpsr_system_admin()
    or exists (
      select 1
        from public.profiles p
       where p.id = auth.uid()
         and p.access_status = 'Aprovado'
         and p.role in ('Diretora', 'Vice Diretor', 'Vice Diretor / Dev')
    );
$function$;

create or replace function public.is_hpsr_partnership_director()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select public.is_hpsr_system_admin()
    or exists (
      select 1
        from public.profiles p
       where p.id = auth.uid()
         and p.access_status = 'Aprovado'
         and p.role in ('Diretora', 'Vice Diretor', 'Vice Diretor / Dev')
    );
$function$;

-- O novo cargo técnico é exclusivo da identidade configurada. O nome antigo fica
-- descontinuado e não pode ser restaurado por edição de perfil.
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
    raise exception 'O cargo Diretor Técnico / Dev foi descontinuado. Utilize Vice Diretor / Dev.';
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

-- Migra a identidade administrativa atual sem depender de UUID fixo.
update public.profiles p
   set role = 'Vice Diretor / Dev',
       specialty = public.hpsr_staff_specialty_for_role('Vice Diretor / Dev', p.specialty),
       staff_metadata = jsonb_set(
         jsonb_set(coalesce(p.staff_metadata, '{}'::jsonb), '{systemRole}', to_jsonb('Administrador do Sistema'::text), true),
         '{accessLevel}', to_jsonb('Total'::text), true
       ),
       updated_at = now()
  from public.system_owner_identity owner
 where owner.singleton = true
   and p.id = owner.user_id;

comment on function public.is_hpsr_system_admin() is
  'Identifica a conta administrativa exclusiva do HPSR por system_owner_identity, independentemente do cargo hospitalar exibido.';
