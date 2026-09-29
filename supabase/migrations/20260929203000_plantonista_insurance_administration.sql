-- v1.0.426 — Médico Plantonista por especialidade e cadastro de convênios exclusivo da Direção.
-- Não altera registros, especialidades, contratos nem histórico já existentes.
begin;

-- A estrutura existente de especialidades continua sendo a fonte de autorização
-- para agenda, acompanhamentos e procedimentos clínicos do Médico Plantonista.
create or replace function public.hpsr_staff_specialty_for_role(
  target_role text,
  target_specialty text
)
returns text
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  v_role text := btrim(coalesce(target_role, ''));
  v_item text;
  v_norm text;
  v_result text[] := array[]::text[];
  v_norms text[] := array[]::text[];
begin
  if v_role in ('Residente', 'Estagiário de Enfermagem', 'Enfermeiro', 'Técnico de Enfermagem') then
    return null;
  end if;

  if v_role = 'Médico Clínico' then
    return 'Clínico Geral';
  end if;

  if v_role in (
    'Médico Especialista', 'Médico Plantonista', 'Médico Cirurgião',
    'Diretor Clínico', 'Diretora', 'Vice Diretor', 'Vice Diretor / Dev'
  ) then
    v_result := array['Clínico Geral'];
    v_norms := array[public.hpsr_normalize_specialty('Clínico Geral')];

    foreach v_item in array regexp_split_to_array(coalesce(target_specialty, ''), E'[,;/|\\n]+') loop
      v_item := btrim(v_item);
      v_norm := public.hpsr_normalize_specialty(v_item);
      if v_item <> '' and v_norm <> '' and not (v_norm = any(v_norms)) then
        v_result := array_append(v_result, v_item);
        v_norms := array_append(v_norms, v_norm);
      end if;
    end loop;

    return array_to_string(v_result, ', ');
  end if;

  return nullif(btrim(coalesce(target_specialty, '')), '');
end;
$function$;

revoke all on function public.hpsr_staff_specialty_for_role(text, text) from public, anon;
grant execute on function public.hpsr_staff_specialty_for_role(text, text) to authenticated, service_role;

-- A política anterior autorizava escrita de convênios a qualquer profissional.
-- Preserva a leitura da equipe, mas exige permissão administrativa para cada
-- INSERT/UPDATE/DELETE (inclusive chamadas diretas pela API e upsert).
alter table public.financial_plan_entries enable row level security;
revoke all on table public.financial_plan_entries from public, anon;
grant select, insert, update, delete on table public.financial_plan_entries to authenticated;

drop policy if exists "authenticated plan financial access" on public.financial_plan_entries;
drop policy if exists "staff plan financial access" on public.financial_plan_entries;
drop policy if exists "hpsr insurance plans staff read" on public.financial_plan_entries;
drop policy if exists "hpsr insurance plans admin insert" on public.financial_plan_entries;
drop policy if exists "hpsr insurance plans admin update" on public.financial_plan_entries;
drop policy if exists "hpsr insurance plans admin delete" on public.financial_plan_entries;

create policy "hpsr insurance plans staff read"
  on public.financial_plan_entries for select to authenticated
  using ((select public.is_hpsr_staff()));

create policy "hpsr insurance plans admin insert"
  on public.financial_plan_entries for insert to authenticated
  with check ((select public.is_access_admin()));

create policy "hpsr insurance plans admin update"
  on public.financial_plan_entries for update to authenticated
  using ((select public.is_access_admin()))
  with check ((select public.is_access_admin()));

create policy "hpsr insurance plans admin delete"
  on public.financial_plan_entries for delete to authenticated
  using ((select public.is_access_admin()));

-- Protege a autorização acima contra promoção ou atribuição de especialidade
-- por uma atualização direta de perfil. Dados pessoais e capacidade permanecem
-- editáveis pelo fluxo existente; cadastros ainda pendentes podem escolher o
-- cargo clínico desejado, sem se autoaprovar nem assumir cargo da Direção.
create or replace function public.hpsr_guard_profile_privilege_changes()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  -- Operações internas sem sessão de usuário (ex.: migrations e serviço) seguem
  -- seus privilégios próprios; operações da interface possuem auth.uid().
  if auth.uid() is null or public.is_access_admin() then
    return new;
  end if;

  if new.role is not distinct from old.role
    and new.specialty is not distinct from old.specialty
    and new.access_status is not distinct from old.access_status
    and new.staff_metadata is not distinct from old.staff_metadata then
    return new;
  end if;

  if new.id = auth.uid()
    and coalesce(old.access_status, '') <> 'Aprovado'
    and new.access_status = 'Pendente'
    and new.staff_metadata is not distinct from old.staff_metadata
    and coalesce(new.role, '') not in (
      'Diretora', 'Vice Diretor', 'Vice Diretor / Dev', 'Diretor Técnico / Dev'
    ) then
    return new;
  end if;

  raise exception 'Alteração de cargo, especialidade ou autorização restrita à Direção.'
    using errcode = '42501';
end;
$function$;

revoke all on function public.hpsr_guard_profile_privilege_changes() from public, anon, authenticated;
drop trigger if exists hpsr_guard_profile_privilege_changes on public.profiles;
create trigger hpsr_guard_profile_privilege_changes
  before update of role, specialty, access_status, staff_metadata on public.profiles
  for each row execute function public.hpsr_guard_profile_privilege_changes();

comment on function public.hpsr_guard_profile_privilege_changes() is
  'Impede escalonamento de privilégios e especialidades por atualização direta de perfis; preserva cadastro pendente e alterações administrativas autorizadas.';

commit;
