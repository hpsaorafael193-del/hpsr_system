alter table public.patient_registry add column if not exists discord text;

create or replace function public.hpsr_normalize_city_phone(target_value text)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
declare
  digits text := regexp_replace(coalesce(target_value, ''), '\D', '', 'g');
  local_digits text;
begin
  if trim(coalesce(target_value, '')) = '' then return null; end if;
  if digits ~ '^055[0-9]{6}$' then
    local_digits := substr(digits, 4, 6);
  elsif digits ~ '^[0-9]{6}$' then
    local_digits := digits;
  else
    raise exception 'Telefone da cidade inválido. Use (055) 000-000.';
  end if;
  return '(055) ' || substr(local_digits, 1, 3) || '-' || substr(local_digits, 4, 3);
end;
$function$;

revoke all on function public.hpsr_normalize_city_phone(text) from public, anon;
grant execute on function public.hpsr_normalize_city_phone(text) to authenticated, service_role;

create or replace function public.hpsr_normalize_patient_discord(target_value text)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
declare
  cleaned text := trim(coalesce(target_value, ''));
begin
  if cleaned = '' then return null; end if;
  if cleaned !~ '^[0-9]{17,20}$' then
    raise exception 'ID do Discord inválido. Informe somente 17 a 20 dígitos.';
  end if;
  return cleaned;
end;
$function$;

revoke all on function public.hpsr_normalize_patient_discord(text) from public, anon;
grant execute on function public.hpsr_normalize_patient_discord(text) to authenticated, service_role;

create or replace function public.hpsr_guard_patient_contact_format()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  new.city_phone := public.hpsr_normalize_city_phone(new.city_phone);
  new.discord := public.hpsr_normalize_patient_discord(new.discord);
  return new;
end;
$function$;

revoke all on function public.hpsr_guard_patient_contact_format() from public, anon, authenticated;

drop trigger if exists hpsr_guard_patient_contact_format on public.patient_registry;
create trigger hpsr_guard_patient_contact_format
before insert or update of city_phone, discord on public.patient_registry
for each row execute function public.hpsr_guard_patient_contact_format();

alter table public.patient_registry drop constraint if exists patient_registry_city_phone_format;
alter table public.patient_registry add constraint patient_registry_city_phone_format
check (city_phone is null or city_phone ~ '^\(055\) [0-9]{3}-[0-9]{3}$');

alter table public.patient_registry drop constraint if exists patient_registry_discord_format;
alter table public.patient_registry add constraint patient_registry_discord_format
check (discord is null or discord ~ '^[0-9]{17,20}$');

with valid_history as (
  select public.hpsr_normalize_passport(a.passport) as passport,
         regexp_replace(coalesce(a.payload->>'discordId', ''), '\D', '', 'g') as discord_id
  from public.appointments a
  where regexp_replace(coalesce(a.payload->>'discordId', ''), '\D', '', 'g') ~ '^[0-9]{17,20}$'
), single_value as (
  select passport, min(discord_id) as discord_id
  from valid_history
  group by passport
  having count(distinct discord_id) = 1
)
update public.patient_registry p
set discord = s.discord_id, updated_at = now()
from single_value s
where public.hpsr_normalize_passport(p.passport) = s.passport
  and p.discord is null;

drop function if exists public.list_patient_registry_staff();
create function public.list_patient_registry_staff()
returns table(passport text,name text,age text,blood_type text,birth_date date,sex text,city_phone text,discord text,email text,created_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null or not public.is_hpsr_staff() then return; end if;
  return query
  select p.passport,p.name,p.age,p.blood_type,p.birth_date,p.sex,p.city_phone,p.discord,p.email,p.created_at
  from public.patient_registry p
  order by p.name asc,p.passport asc;
end;
$function$;

revoke all on function public.list_patient_registry_staff() from public, anon;
grant execute on function public.list_patient_registry_staff() to authenticated, service_role;

create or replace function public.upsert_patient_registry_staff(p_passport text,p_name text,p_age text,p_blood_type text,p_city_phone text,p_email text,p_discord text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_passport text := public.hpsr_normalize_passport(p_passport);
  v_name text := trim(coalesce(p_name, ''));
  v_phone text := public.hpsr_normalize_city_phone(p_city_phone);
  v_discord text := public.hpsr_normalize_patient_discord(p_discord);
  v_row public.patient_registry%rowtype;
begin
  if auth.uid() is null or not public.is_hpsr_staff() then return jsonb_build_object('ok', false, 'reason', 'unauthorized'); end if;
  if v_passport = '' or v_name = '' then raise exception 'Nome e documento são obrigatórios.'; end if;
  insert into public.patient_registry(passport,name,age,blood_type,city_phone,discord,email)
  values(v_passport,v_name,nullif(trim(coalesce(p_age,'')),''),nullif(trim(coalesce(p_blood_type,'')),''),v_phone,v_discord,nullif(lower(trim(coalesce(p_email,''))),''))
  on conflict (passport) do update set
    name=excluded.name,
    age=coalesce(excluded.age,public.patient_registry.age),
    blood_type=coalesce(excluded.blood_type,public.patient_registry.blood_type),
    city_phone=coalesce(excluded.city_phone,public.patient_registry.city_phone),
    discord=coalesce(excluded.discord,public.patient_registry.discord),
    email=coalesce(excluded.email,public.patient_registry.email),
    updated_at=now()
  returning * into v_row;
  return jsonb_build_object('ok',true,'passport',v_row.passport,'name',v_row.name,'city_phone',v_row.city_phone,'discord',v_row.discord);
end;
$function$;

revoke all on function public.upsert_patient_registry_staff(text,text,text,text,text,text,text) from public, anon;
grant execute on function public.upsert_patient_registry_staff(text,text,text,text,text,text,text) to authenticated, service_role;

comment on column public.patient_registry.discord is 'ID numérico do Discord do paciente. Contato preferencial da equipe; telefone da cidade permanece como contato alternativo.';
