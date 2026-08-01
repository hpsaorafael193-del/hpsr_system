-- v1.0.148 — Unifica o título clínico Diretor Técnico com o cargo técnico de Desenvolvedor.
-- O novo nome mantém exatamente o acesso total já pertencente ao Desenvolvedor.

update public.profiles
set role = 'Diretor Técnico / Dev', updated_at = now()
where role in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico');

update public.team_members
set
  hospital_role = case
    when hospital_role in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico') then 'Diretor Técnico / Dev'
    else hospital_role
  end,
  payload = jsonb_set(
    jsonb_set(
      coalesce(payload, '{}'::jsonb),
      '{systemRole}',
      to_jsonb(
        case
          when coalesce(payload->>'systemRole', '') in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico')
            then 'Diretor Técnico / Dev'
          else coalesce(payload->>'systemRole', '')
        end
      ),
      true
    ),
    '{hospitalRole}',
    to_jsonb(
      case
        when coalesce(payload->>'hospitalRole', '') in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico')
          then 'Diretor Técnico / Dev'
        else coalesce(payload->>'hospitalRole', hospital_role, '')
      end
    ),
    true
  ),
  updated_at = now()
where
  hospital_role in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico')
  or coalesce(payload->>'systemRole', '') in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico')
  or coalesce(payload->>'hospitalRole', '') in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico');

update public.staff_registration_requests
set
  requested_role = case
    when requested_role in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico') then 'Diretor Técnico / Dev'
    else requested_role
  end,
  payload = case
    when coalesce(payload->>'requestedRole', '') in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico')
      then jsonb_set(coalesce(payload, '{}'::jsonb), '{requestedRole}', to_jsonb('Diretor Técnico / Dev'::text), true)
    else payload
  end,
  updated_at = now()
where
  requested_role in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico')
  or coalesce(payload->>'requestedRole', '') in ('Dev / Desenvolvedor do Sistema', 'Diretor Técnico');

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
        p.role in ('Diretor Técnico / Dev', 'Diretora', 'Vice Diretor')
        or exists (
          select 1
          from public.team_members tm
          where (
            tm.id = p.id::text
            or (p.passport is not null and tm.passport = p.passport)
          )
          and (
            tm.hospital_role in ('Diretor Técnico / Dev', 'Diretora', 'Vice Diretor')
            or coalesce(tm.payload->>'systemRole', '') = 'Diretor Técnico / Dev'
            or coalesce(tm.payload->>'hospitalRole', '') in ('Diretora', 'Vice Diretor')
          )
        )
      )
  );
$$;

revoke all on function public.is_access_admin() from public;
grant execute on function public.is_access_admin() to authenticated;

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
      and lower(coalesce(p.role, '')) in (
        lower('Diretora'),
        lower('Vice Diretor'),
        lower('Diretor Clínico'),
        lower('Diretor Técnico / Dev')
      )
  );
$$;

grant execute on function public.is_hpsr_schedule_manager() to authenticated;
