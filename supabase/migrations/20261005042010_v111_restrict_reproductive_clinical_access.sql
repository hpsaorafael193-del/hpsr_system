create or replace function public.hpsr_can_access_obstetra()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and coalesce(p.access_status, 'Aprovado') = 'Aprovado'
       and p.role in (
         'Médico Especialista', 'Médico Plantonista', 'Médico Cirurgião',
         'Diretor Clínico', 'Diretora', 'Vice Diretor', 'Vice Diretor / Dev'
       )
       and exists (
         select 1
           from regexp_split_to_table(coalesce(p.specialty, ''), E'[,;/|\\n]+') assigned(specialty)
          where public.hpsr_reproductive_specialty_matches(assigned.specialty, 'gestacional')
             or public.hpsr_reproductive_specialty_matches(assigned.specialty, 'in_vitro')
       )
  );
$function$;

revoke all on function public.hpsr_can_access_obstetra() from public, anon;
grant execute on function public.hpsr_can_access_obstetra() to authenticated, service_role;

create or replace function public.hpsr_can_manage_reproductive_patient(
  target_doctor uuid, target_passport text, target_kind text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_profile public.profiles%rowtype;
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

  if v_profile.role not in (
    'Médico Especialista', 'Médico Plantonista', 'Médico Cirurgião',
    'Diretor Clínico', 'Diretora', 'Vice Diretor', 'Vice Diretor / Dev'
  ) then
    return false;
  end if;

  select exists (
    select 1
      from regexp_split_to_table(coalesce(v_profile.specialty, ''), E'[,;/|\\n]+') token(value)
     where public.hpsr_reproductive_specialty_matches(token.value, target_kind)
  ) into v_has_specialty;
  if not v_has_specialty then return false; end if;

  return exists (
    select 1
      from public.patient_doctor_links l
     where l.doctor_id = target_doctor
       and upper(btrim(l.patient_passport)) = upper(btrim(target_passport))
       and public.hpsr_reproductive_specialty_matches(l.specialty, target_kind)
  );
end;
$function$;

revoke all on function public.hpsr_can_manage_reproductive_patient(uuid,text,text) from public, anon;
grant execute on function public.hpsr_can_manage_reproductive_patient(uuid,text,text) to authenticated, service_role;

comment on function public.hpsr_can_access_obstetra() is
  'Acesso clínico à Obstetra exige perfil aprovado e especialidade atribuída em Obstetrícia ou Ginecologia; cargo administrativo isolado não concede autorização clínica.';

comment on function public.hpsr_can_manage_reproductive_patient(uuid,text,text) is
  'Planejamento Gestacional/FIV exige médico autenticado, especialidade clínica compatível no perfil e vínculo ativo compatível com a paciente; sem exceção por cargo administrativo.';

notify pgrst, 'reload schema';
