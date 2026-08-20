-- Corrige a resolução de gestores da agenda para usar a mesma identidade administrativa
-- reconhecida pelo frontend: cargo em profiles ou team_members/payload.systemRole.
-- Não amplia a hierarquia; apenas elimina a divergência entre UI e RPC/RLS.

create or replace function public.is_hpsr_schedule_manager()
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
      and (
        lower(coalesce(p.role, '')) in (
          lower('Diretora'),
          lower('Vice Diretor'),
          lower('Diretor Clínico'),
          lower('Diretor Técnico / Dev')
        )
        or exists (
          select 1
          from public.team_members tm
          where (
            tm.id = p.id::text
            or (p.passport is not null and tm.passport = p.passport)
          )
          and (
            lower(coalesce(tm.hospital_role, '')) in (
              lower('Diretora'),
              lower('Vice Diretor'),
              lower('Diretor Clínico'),
              lower('Diretor Técnico / Dev')
            )
            or lower(coalesce(tm.payload->>'hospitalRole', '')) in (
              lower('Diretora'),
              lower('Vice Diretor'),
              lower('Diretor Clínico'),
              lower('Diretor Técnico / Dev')
            )
            or lower(coalesce(tm.payload->>'systemRole', '')) = lower('Diretor Técnico / Dev')
          )
        )
      )
  );
$$;

revoke all on function public.is_hpsr_schedule_manager() from public, anon;
grant execute on function public.is_hpsr_schedule_manager() to authenticated;

comment on function public.is_hpsr_schedule_manager() is
  'Reconhece gestores da agenda pelo cargo efetivo em profiles ou team_members, incluindo systemRole do Diretor Técnico / Dev.';
