-- v1.0.434 — desativar exceção do paciente 000 e liberar fluxo normal para
-- todos os pacientes com vínculo ativo de Obstetrícia ou Ginecologia.
-- Preserva as consultas/etapas de teste registradas e os históricos clínicos.
-- Aplicar APÓS 20261001012000_zero_test_flexible_planning.sql, sem reexecutar
-- as migrations de seed de desenvolvimento já aplicadas.
begin;

-- Normaliza nomes da especialidade, inclusive perfis/vínculos combinados.
create or replace function public.hpsr_reproductive_specialty_matches(
  assigned text, kind text
)
returns boolean language sql immutable set search_path = '' as $function$
  select case
    when kind not in ('gestacional', 'in_vitro') then false
    when trim(translate(lower(coalesce(assigned, '')),
      'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc'))
      in ('ginecologia e obstetricia', 'obstetricia e ginecologia', 'ginecologista e obstetra') then true
    when kind = 'gestacional' then public.hpsr_normalize_specialty(assigned) = 'obstetra'
    else public.hpsr_normalize_specialty(assigned) = 'ginecologia'
  end;
$function$;

create or replace function public.hpsr_can_manage_reproductive_patient(
  target_doctor uuid, target_passport text, target_kind text
)
returns boolean language plpgsql stable security definer set search_path = ''
as $function$
declare
  v_profile public.profiles%rowtype;
  v_is_direction boolean;
  v_has_specialty boolean;
begin
  if target_doctor is null or target_doctor is distinct from auth.uid()
    or nullif(btrim(coalesce(target_passport, '')), '') is null
    or target_kind not in ('gestacional','in_vitro') then
    return false;
  end if;

  select * into v_profile from public.profiles p
   where p.id = target_doctor and p.access_status = 'Aprovado';
  if not found then return false; end if;

  v_is_direction := v_profile.role in ('Diretora','Vice Diretor','Vice Diretor / Dev');
  if not v_is_direction then
    if v_profile.role not in ('Médico Especialista','Médico Plantonista','Médico Cirurgião','Diretor Clínico')
      then return false;
    end if;
    select exists (
      select 1 from regexp_split_to_table(coalesce(v_profile.specialty, ''), '[,;/|]+') token(value)
       where public.hpsr_reproductive_specialty_matches(token.value,target_kind)
    ) into v_has_specialty;
    if not v_has_specialty then return false; end if;
  end if;

  -- Toda paciente, inclusive o passaporte 000, exige vínculo REAL com a
  -- modalidade e com o médico responsável; a Direção só dispensa especialidade
  -- do perfil, não a relação médico-paciente.
  return exists (
    select 1 from public.patient_doctor_links l
     where l.doctor_id = target_doctor
       and upper(btrim(l.patient_passport)) = upper(btrim(target_passport))
       and public.hpsr_reproductive_specialty_matches(l.specialty,target_kind)
  );
end;
$function$;

revoke all on function public.hpsr_can_manage_reproductive_patient(uuid,text,text) from public, anon;
grant execute on function public.hpsr_can_manage_reproductive_patient(uuid,text,text) to authenticated, service_role;

-- Garante que não há criação/edição de planos reprodutivos por interface
-- alternativa ou chamada direta do Supabase sem vínculo de especialidade.
drop policy if exists "hpsr reproductive plan insert guard" on public.clinical_followup_plans;
create policy "hpsr reproductive plan insert guard"
  on public.clinical_followup_plans as restrictive for insert to authenticated
  with check (
    coalesce(plan_type,'') not in ('gestacional','in_vitro')
    or (
      ((plan_type='gestacional' and public.hpsr_normalize_specialty(specialty)='obstetra')
       or (plan_type='in_vitro' and public.hpsr_normalize_specialty(specialty)='ginecologia'))
      and public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,plan_type)
    )
  );

drop policy if exists "hpsr reproductive plan update guard" on public.clinical_followup_plans;
create policy "hpsr reproductive plan update guard"
  on public.clinical_followup_plans as restrictive for update to authenticated
  using (
    coalesce(plan_type,'') not in ('gestacional','in_vitro')
    or public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,plan_type)
  )
  with check (
    coalesce(plan_type,'') not in ('gestacional','in_vitro')
    or (
      ((plan_type='gestacional' and public.hpsr_normalize_specialty(specialty)='obstetra')
       or (plan_type='in_vitro' and public.hpsr_normalize_specialty(specialty)='ginecologia'))
      and public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,plan_type)
    )
  );

-- A exclusão pelo médico responsável continua possível mesmo se o vínculo
-- for encerrado: a limpeza de registros próprios não cria novos atendimentos.
drop policy if exists "hpsr reproductive plan delete guard" on public.clinical_followup_plans;
create policy "hpsr reproductive plan delete guard"
  on public.clinical_followup_plans as restrictive for delete to authenticated
  using (
    coalesce(plan_type,'') not in ('gestacional','in_vitro')
    or (doctor_id=auth.uid() and public.hpsr_can_access_obstetra())
  );

-- Ocorrências precisam corresponder ao plano, médico, paciente e modalidade.
create or replace function public.hpsr_can_write_reproductive_occurrence(
  target_plan uuid, target_doctor uuid, target_passport text, target_specialty text
)
returns boolean language plpgsql stable security definer set search_path = ''
as $function$
declare
  v_plan public.clinical_followup_plans%rowtype;
begin
  select * into v_plan from public.clinical_followup_plans p where p.id=target_plan;
  if not found then return false; end if;
  if coalesce(v_plan.plan_type,'') not in ('gestacional','in_vitro') then
    return public.hpsr_normalize_specialty(target_specialty) not in ('obstetra','ginecologia')
      or (target_doctor=auth.uid() and public.hpsr_can_access_obstetra());
  end if;
  return target_doctor=v_plan.doctor_id
    and upper(btrim(coalesce(target_passport,'')))=upper(btrim(v_plan.patient_passport))
    and ((v_plan.plan_type='gestacional' and public.hpsr_normalize_specialty(target_specialty)='obstetra')
       or (v_plan.plan_type='in_vitro' and public.hpsr_normalize_specialty(target_specialty)='ginecologia'))
    and public.hpsr_can_manage_reproductive_patient(v_plan.doctor_id,v_plan.patient_passport,v_plan.plan_type);
end;
$function$;

revoke all on function public.hpsr_can_write_reproductive_occurrence(uuid,uuid,text,text) from public, anon;
grant execute on function public.hpsr_can_write_reproductive_occurrence(uuid,uuid,text,text) to authenticated, service_role;

drop policy if exists "hpsr reproductive occurrence insert guard" on public.clinical_followup_occurrences;
create policy "hpsr reproductive occurrence insert guard"
  on public.clinical_followup_occurrences as restrictive for insert to authenticated
  with check (public.hpsr_can_write_reproductive_occurrence(plan_id,doctor_id,patient_passport,specialty));

drop policy if exists "hpsr reproductive occurrence update guard" on public.clinical_followup_occurrences;
create policy "hpsr reproductive occurrence update guard"
  on public.clinical_followup_occurrences as restrictive for update to authenticated
  using (public.hpsr_can_write_reproductive_occurrence(plan_id,doctor_id,patient_passport,specialty))
  with check (public.hpsr_can_write_reproductive_occurrence(plan_id,doctor_id,patient_passport,specialty));

-- Mantém a autorização de exclusão já aplicada aos médicos responsáveis.
comment on function public.hpsr_can_manage_reproductive_patient(uuid,text,text) is
  'Sem exceções de desenvolvimento: médico autorizado + vínculo ativo com paciente e especialidade; Direção dispensa especialidade atribuída no perfil, mas não dispensa vínculo.';

commit;
notify pgrst, 'reload schema';
