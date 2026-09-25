create or replace function public.hpsr_person_name_case(input_value text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  normalized text;
  result_value text := '';
  current_char text;
  capitalize_next boolean := true;
  index_value integer;
begin
  if input_value is null then
    return null;
  end if;

  normalized := pg_catalog.regexp_replace(pg_catalog.btrim(input_value), '\s+', ' ', 'g');

  if normalized = '' then
    return '';
  end if;

  for index_value in 1..pg_catalog.char_length(normalized) loop
    current_char := pg_catalog.substr(normalized, index_value, 1);

    if current_char ~ '[[:alpha:]]' then
      if capitalize_next then
        result_value := result_value || pg_catalog.upper(current_char);
      else
        result_value := result_value || pg_catalog.lower(current_char);
      end if;
      capitalize_next := false;
    else
      result_value := result_value || current_char;
      capitalize_next := current_char = ' '
        or current_char = ''''
        or current_char = '’'
        or current_char = '-';
    end if;
  end loop;

  return result_value;
end;
$$;

comment on function public.hpsr_person_name_case(text) is
  'Normaliza nomes de pessoas do HPSR: primeira letra de cada parte em maiúscula e demais letras em minúscula, preservando espaços, hífens e apóstrofos.';

create or replace function public.hpsr_normalize_person_name_row()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.name := public.hpsr_person_name_case(new.name);
  return new;
end;
$$;

drop trigger if exists trg_hpsr_normalize_profile_name on public.profiles;
create trigger trg_hpsr_normalize_profile_name
before insert or update of name on public.profiles
for each row
execute function public.hpsr_normalize_person_name_row();

drop trigger if exists trg_hpsr_normalize_patient_name on public.patient_registry;
create trigger trg_hpsr_normalize_patient_name
before insert or update of name on public.patient_registry
for each row
execute function public.hpsr_normalize_person_name_row();

update public.profiles
set name = public.hpsr_person_name_case(name)
where name is not null
  and name is distinct from public.hpsr_person_name_case(name);

update public.patient_registry
set name = public.hpsr_person_name_case(name)
where name is not null
  and name is distinct from public.hpsr_person_name_case(name);
