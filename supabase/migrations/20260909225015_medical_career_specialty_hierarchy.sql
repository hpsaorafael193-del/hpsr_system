-- v1.0.346 — Regra estrutural de especialidades por etapa da carreira médica.
-- Não altera datas, duração, status ou histórico de contrato.

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

  if v_role in ('Médico Especialista', 'Médico Cirurgião', 'Diretor Clínico', 'Diretora', 'Vice Diretor', 'Diretor Técnico / Dev') then
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

create or replace function public.hpsr_enforce_profile_specialty_by_role()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.specialty := public.hpsr_staff_specialty_for_role(new.role, new.specialty);
  if btrim(coalesce(new.role, '')) in ('Residente', 'Estagiário de Enfermagem', 'Enfermeiro', 'Técnico de Enfermagem') then
    new.specialty_capacity := '{}'::jsonb;
  end if;
  return new;
end;
$function$;

revoke all on function public.hpsr_enforce_profile_specialty_by_role() from public, anon, authenticated;

drop trigger if exists zz_hpsr_enforce_profile_specialty_by_role on public.profiles;
create trigger zz_hpsr_enforce_profile_specialty_by_role
before insert or update of role, specialty on public.profiles
for each row execute function public.hpsr_enforce_profile_specialty_by_role();

create or replace function public.hpsr_enforce_team_member_specialty_by_role()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  v_role text;
  v_specialty text;
begin
  v_role := coalesce(nullif(btrim(new.hospital_role), ''), nullif(btrim(new.payload->>'hospitalRole'), ''), nullif(btrim(new.payload->>'role'), ''));
  v_specialty := public.hpsr_staff_specialty_for_role(v_role, new.payload->>'specialty');
  new.payload := jsonb_set(coalesce(new.payload, '{}'::jsonb), '{specialty}', to_jsonb(coalesce(v_specialty, '')), true);
  return new;
end;
$function$;

revoke all on function public.hpsr_enforce_team_member_specialty_by_role() from public, anon, authenticated;

drop trigger if exists zz_hpsr_enforce_team_member_specialty_by_role on public.team_members;
create trigger zz_hpsr_enforce_team_member_specialty_by_role
before insert or update of hospital_role, payload on public.team_members
for each row execute function public.hpsr_enforce_team_member_specialty_by_role();

update public.profiles
set specialty = public.hpsr_staff_specialty_for_role(role, specialty)
where role in (
  'Residente', 'Estagiário de Enfermagem', 'Enfermeiro', 'Técnico de Enfermagem',
  'Médico Clínico', 'Médico Especialista', 'Médico Cirurgião',
  'Diretor Clínico', 'Diretora', 'Vice Diretor', 'Diretor Técnico / Dev'
)
and specialty is distinct from public.hpsr_staff_specialty_for_role(role, specialty);

update public.team_members
set payload = jsonb_set(
  coalesce(payload, '{}'::jsonb),
  '{specialty}',
  to_jsonb(coalesce(public.hpsr_staff_specialty_for_role(
    coalesce(nullif(btrim(hospital_role), ''), nullif(btrim(payload->>'hospitalRole'), ''), nullif(btrim(payload->>'role'), '')),
    payload->>'specialty'
  ), '')),
  true
)
where coalesce(payload->>'specialty', '') is distinct from coalesce(public.hpsr_staff_specialty_for_role(
  coalesce(nullif(btrim(hospital_role), ''), nullif(btrim(payload->>'hospitalRole'), ''), nullif(btrim(payload->>'role'), '')),
  payload->>'specialty'
), '');

comment on function public.hpsr_staff_specialty_for_role(text, text) is
  'Normaliza especialidades pela progressão: Residente e abaixo sem especialidade; Médico Clínico com Clínico Geral; cargos médicos superiores mantêm Clínico Geral como base.';
