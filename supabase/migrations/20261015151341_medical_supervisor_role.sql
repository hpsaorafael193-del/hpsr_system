-- Médico Supervisor: clinical parity with Especialista; no general administration grant.
CREATE OR REPLACE FUNCTION public.hpsr_can_edit_vaccination()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.access_status = 'Aprovado'
      and p.role in (
        'Médico Clínico', 'Médico Especialista', 'Médico Supervisor', 'Médico Plantonista',
        'Médico Cirurgião', 'Diretor Clínico', 'Diretora', 'Vice Diretor', 'Vice Diretor / Dev'
      )
  );
$function$;

CREATE OR REPLACE FUNCTION hpsr_private.can_manage_pediatric_followup()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.access_status = 'Aprovado'
      and (p.role in ('Diretora','Vice Diretor','Vice Diretor / Dev')
        or (p.role in ('Médico Especialista', 'Médico Supervisor','Médico Plantonista','Médico Cirurgião','Diretor Clínico')
          and exists (select 1 from regexp_split_to_table(coalesce(p.specialty,''), E'[,;|\n]+') s(value)
            where lower(btrim(s.value)) in ('pediatra','pediatria'))))
  );
$function$;

CREATE OR REPLACE FUNCTION public.hpsr_can_manage_gestational_vaccination()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and coalesce(p.access_status, '') = 'Aprovado'
       and (
         p.role in ('Diretora', 'Vice Diretor / Dev')
         or (
           p.role in ('Médico Clínico', 'Médico Especialista', 'Médico Supervisor', 'Médico Plantonista', 'Médico Cirurgião', 'Diretor Clínico', 'Vice Diretor')
           and exists (
             select 1
               from regexp_split_to_table(coalesce(p.specialty, ''), E'[,;/|\\n]+') specialty_name
              where public.hpsr_reproductive_specialty_matches(specialty_name, 'gestacional')
                 or public.hpsr_reproductive_specialty_matches(specialty_name, 'in_vitro')
           )
         )
       )
  );
$function$;

CREATE OR REPLACE FUNCTION public.hpsr_staff_specialty_for_role(target_role text, target_specialty text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  v_role text := btrim(coalesce(target_role, ''));
  v_item text;
  v_norm text;
  v_existing text;
  v_result text[] := array[]::text[];
  v_norms text[] := array[]::text[];
begin
  if v_role in ('Residente', 'Estagiário de Enfermagem', 'Enfermeiro', 'Técnico de Enfermagem') then
    return null;
  end if;

  if v_role = 'Médico Clínico' then
    return 'Clínico Geral';
  end if;

  if v_role in ('Médico Especialista', 'Médico Supervisor', 'Médico Cirurgião', 'Diretor Clínico', 'Diretora', 'Vice Diretor', 'Vice Diretor / Dev') then
    v_result := array['Clínico Geral'];
    v_norms := array[public.hpsr_normalize_specialty('Clínico Geral')];

    foreach v_item in array regexp_split_to_array(coalesce(target_specialty, ''), E'[,;/|\n]+') loop
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

CREATE OR REPLACE FUNCTION public.hpsr_can_access_obstetra()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and coalesce(p.access_status, 'Aprovado') = 'Aprovado'
       and (
         p.role in ('Diretora', 'Vice Diretor / Dev')
         or (
           p.role in ('Médico Especialista', 'Médico Supervisor', 'Médico Plantonista', 'Médico Cirurgião', 'Diretor Clínico', 'Vice Diretor')
           and exists (
             select 1
               from regexp_split_to_table(coalesce(p.specialty, ''), E'[,;/|\\n]+') assigned(specialty)
              where public.hpsr_reproductive_specialty_matches(assigned.specialty, 'gestacional')
                 or public.hpsr_reproductive_specialty_matches(assigned.specialty, 'in_vitro')
           )
         )
       )
  );
$function$;

CREATE OR REPLACE FUNCTION public.hpsr_can_manage_reproductive_patient(target_doctor uuid, target_passport text, target_kind text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_profile public.profiles%rowtype;
  v_is_full_admin boolean := false;
  v_has_specialty boolean := false;
begin
  if target_doctor is null
     or target_doctor is distinct from auth.uid()
     or nullif(btrim(coalesce(target_passport, '')), '') is null
     or target_kind not in ('gestacional','in_vitro') then
    return false;
  end if;

  select * into v_profile
    from public.profiles p
   where p.id = target_doctor
     and coalesce(p.access_status, '') = 'Aprovado';
  if not found then return false; end if;

  v_is_full_admin := v_profile.role in ('Diretora', 'Vice Diretor / Dev');

  if not v_is_full_admin then
    if v_profile.role not in ('Médico Especialista', 'Médico Supervisor', 'Médico Plantonista', 'Médico Cirurgião', 'Diretor Clínico', 'Vice Diretor') then
      return false;
    end if;

    select exists (
      select 1
        from regexp_split_to_table(coalesce(v_profile.specialty, ''), E'[,;/|\\n]+') token(value)
       where public.hpsr_reproductive_specialty_matches(token.value, target_kind)
    ) into v_has_specialty;
    if not v_has_specialty then return false; end if;
  end if;

  return exists (
    select 1
      from public.patient_doctor_links l
     where l.doctor_id = target_doctor
       and upper(btrim(l.patient_passport)) = upper(btrim(target_passport))
       and public.hpsr_reproductive_specialty_matches(l.specialty, target_kind)
  );
end;
$function$;


create or replace function hpsr_private.can_manage_insurance_plans()
returns boolean language sql stable security invoker set search_path = ''
as $function$
  select public.is_access_admin() or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.access_status = 'Aprovado' and p.role = 'Médico Supervisor'
  );
$function$;
revoke all on function hpsr_private.can_manage_insurance_plans() from public, anon;
grant execute on function hpsr_private.can_manage_insurance_plans() to authenticated;

-- Restrictive policies also protect deployments with an old permissive staff policy.
drop policy if exists "hpsr supervisor plans insert permissive" on public.financial_plan_entries;
create policy "hpsr supervisor plans insert permissive" on public.financial_plan_entries as permissive for insert to authenticated
with check ((select hpsr_private.can_manage_insurance_plans()))
;
drop policy if exists "hpsr supervisor plans insert restrictive" on public.financial_plan_entries;
create policy "hpsr supervisor plans insert restrictive" on public.financial_plan_entries as restrictive for insert to authenticated
with check ((select hpsr_private.can_manage_insurance_plans()))
;
drop policy if exists "hpsr supervisor plans update permissive" on public.financial_plan_entries;
create policy "hpsr supervisor plans update permissive" on public.financial_plan_entries as permissive for update to authenticated
using ((select hpsr_private.can_manage_insurance_plans()))
with check ((select hpsr_private.can_manage_insurance_plans()))
;
drop policy if exists "hpsr supervisor plans update restrictive" on public.financial_plan_entries;
create policy "hpsr supervisor plans update restrictive" on public.financial_plan_entries as restrictive for update to authenticated
using ((select hpsr_private.can_manage_insurance_plans()))
with check ((select hpsr_private.can_manage_insurance_plans()))
;
drop policy if exists "hpsr supervisor plans delete permissive" on public.financial_plan_entries;
create policy "hpsr supervisor plans delete permissive" on public.financial_plan_entries as permissive for delete to authenticated
using ((select hpsr_private.can_manage_insurance_plans()))
;
drop policy if exists "hpsr supervisor plans delete restrictive" on public.financial_plan_entries;
create policy "hpsr supervisor plans delete restrictive" on public.financial_plan_entries as restrictive for delete to authenticated
using ((select hpsr_private.can_manage_insurance_plans()))
;

create or replace function hpsr_private.guard_supervisor_assignment()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
begin
  if tg_op = 'UPDATE' and new.role is not distinct from old.role then return new; end if;
  if (new.role = 'Médico Supervisor' or (tg_op = 'UPDATE' and old.role = 'Médico Supervisor'))
     and auth.uid() is not null and not public.is_access_admin() then
    raise exception 'Atribuição do cargo Médico Supervisor restrita à Direção.' using errcode = '42501';
  end if;
  return new;
end;
$function$;
revoke all on function hpsr_private.guard_supervisor_assignment() from public, anon, authenticated;
drop trigger if exists hpsr_guard_supervisor_assignment on public.profiles;
create trigger hpsr_guard_supervisor_assignment before insert or update of role
on public.profiles for each row execute function hpsr_private.guard_supervisor_assignment();
