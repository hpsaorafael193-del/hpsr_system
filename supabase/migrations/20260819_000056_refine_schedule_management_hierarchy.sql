-- Alinha a hierarquia administrativa da agenda com a regra operacional vigente:
-- - médico administra os próprios planejamentos/horários/consultas;
-- - Diretora e Vice-Diretor administram a agenda de toda a equipe;
-- - Diretor Técnico / Dev mantém acesso total técnico;
-- - demais cargos não recebem gestão global da agenda por esta função.
-- Aceita as grafias "Vice Diretor" e "Vice-Diretor" para compatibilidade legada.

create or replace function public.is_hpsr_schedule_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with current_profile as (
    select p.id, p.passport, p.role
    from public.profiles p
    where p.id = auth.uid()
    limit 1
  ), resolved_roles as (
    select
      lower(regexp_replace(replace(coalesce(cp.role, ''), '-', ' '), '[[:space:]]+', ' ', 'g')) as profile_role,
      lower(regexp_replace(replace(coalesce(tm.hospital_role, ''), '-', ' '), '[[:space:]]+', ' ', 'g')) as member_role,
      lower(regexp_replace(replace(coalesce(tm.payload->>'hospitalRole', ''), '-', ' '), '[[:space:]]+', ' ', 'g')) as payload_role,
      lower(regexp_replace(replace(coalesce(tm.payload->>'systemRole', ''), '-', ' '), '[[:space:]]+', ' ', 'g')) as system_role
    from current_profile cp
    left join public.team_members tm
      on tm.id = cp.id::text
      or (cp.passport is not null and tm.passport = cp.passport)
  )
  select exists (
    select 1
    from resolved_roles r
    where
      r.profile_role in ('diretora', 'vice diretor', 'diretor técnico / dev')
      or r.member_role in ('diretora', 'vice diretor', 'diretor técnico / dev')
      or r.payload_role in ('diretora', 'vice diretor', 'diretor técnico / dev')
      or r.system_role = 'diretor técnico / dev'
  );
$$;

revoke all on function public.is_hpsr_schedule_manager() from public, anon;
grant execute on function public.is_hpsr_schedule_manager() to authenticated;

comment on function public.is_hpsr_schedule_manager() is
  'Gestão global da agenda: Diretora, Vice-Diretor e Diretor Técnico / Dev. Médicos continuam administrando recursos próprios pelas regras de ownership existentes.';
