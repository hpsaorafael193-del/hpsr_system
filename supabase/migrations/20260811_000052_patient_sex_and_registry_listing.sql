-- Acrescenta sexo cadastral opcional ao prontuário e amplia a listagem institucional
-- para permitir seleção automática do modelo de vacinação sem adivinhação pelo nome.

alter table public.patient_registry
  add column if not exists sex text;

alter table public.patient_registry
  drop constraint if exists patient_registry_sex_valid;

alter table public.patient_registry
  add constraint patient_registry_sex_valid
  check (sex is null or sex in ('Masculino', 'Feminino'));

comment on column public.patient_registry.sex is
  'Sexo cadastral opcional usado quando necessário por modelos clínicos/visuais. Valores permitidos: Masculino ou Feminino.';

-- A assinatura de retorno muda para incluir birth_date e sex; PostgreSQL exige recriação.
drop function if exists public.list_patient_registry_staff();

create function public.list_patient_registry_staff()
returns table (
  passport text,
  name text,
  age text,
  blood_type text,
  birth_date date,
  sex text,
  city_phone text,
  email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_hpsr_staff() then
    return;
  end if;

  return query
  select p.passport, p.name, p.age, p.blood_type, p.birth_date, p.sex, p.city_phone, p.email, p.created_at
  from public.patient_registry p
  order by p.name asc, p.passport asc;
end;
$$;

revoke all on function public.list_patient_registry_staff() from public;
grant execute on function public.list_patient_registry_staff() to authenticated;
