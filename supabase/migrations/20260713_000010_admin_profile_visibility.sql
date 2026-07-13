-- Corrige a visibilidade administrativa dos perfis e preserva a regra:
-- Gerenciar Médico exibe somente perfis com access_status = 'Aprovado'.
-- Dev, Diretora e Vice Diretor podem ler todos os perfis para administração,
-- inclusive quando o cargo funcional está armazenado em team_members.

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
      and (
        p.role in ('Dev / Desenvolvedor do Sistema', 'Diretora', 'Vice Diretor')
        or exists (
          select 1
          from public.team_members tm
          where (
            tm.id = p.id::text
            or (p.passport is not null and tm.passport = p.passport)
          )
          and (
            tm.hospital_role in ('Dev / Desenvolvedor do Sistema', 'Diretora', 'Vice Diretor')
            or coalesce(tm.payload->>'systemRole', '') = 'Dev / Desenvolvedor do Sistema'
            or coalesce(tm.payload->>'hospitalRole', '') in ('Diretora', 'Vice Diretor')
          )
        )
      )
  );
$$;

revoke all on function public.is_access_admin() from public;
grant execute on function public.is_access_admin() to authenticated;

-- Remove políticas antigas que poderiam limitar a leitura apenas ao próprio perfil.
drop policy if exists "profile self read" on public.profiles;
drop policy if exists "team profiles admin read" on public.profiles;

create policy "profiles self or administration read"
on public.profiles for select to authenticated
using (auth.uid() = id or public.is_access_admin());

-- Garante que solicitações de cadastro também sejam visíveis por completo aos administradores.
drop policy if exists "registration own or admin read" on public.staff_registration_requests;
create policy "registration own or admin read"
on public.staff_registration_requests for select to authenticated
using (auth_user_id = auth.uid() or public.is_access_admin());
