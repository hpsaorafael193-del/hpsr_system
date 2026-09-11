-- v1.0.352 — Correções de contato: Discord numérico sem faixa rígida de tamanho,
-- bloqueio de passaporte usado como Discord e classificação telefone/Discord feita no app.

alter table public.patient_registry
  drop constraint if exists patient_registry_discord_format;

alter table public.patient_registry
  add constraint patient_registry_discord_format
  check (discord is null or discord ~ '^[0-9]+$');

create or replace function public.hpsr_normalize_patient_discord(target_value text)
returns text
language plpgsql
immutable
set search_path to 'public'
as $function$
declare
  cleaned text := regexp_replace(trim(coalesce(target_value, '')), '\D', '', 'g');
begin
  if cleaned = '' then
    return null;
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
declare
  passport_digits text := regexp_replace(coalesce(new.passport, ''), '\D', '', 'g');
begin
  new.city_phone := public.hpsr_normalize_city_phone(new.city_phone);
  new.discord := public.hpsr_normalize_patient_discord(new.discord);

  if new.discord is not null and passport_digits <> '' and new.discord = passport_digits then
    raise exception 'O ID do Discord não pode ser igual ao passaporte/ID da cidade do paciente.';
  end if;

  return new;
end;
$function$;

comment on function public.hpsr_normalize_patient_discord(text) is
  'Normaliza o ID numérico do perfil/usuário do Discord sem impor uma faixa fixa de tamanho.';
comment on function public.hpsr_guard_patient_contact_format() is
  'Normaliza contatos do paciente e impede que o passaporte/ID da cidade seja salvo como Discord.';
