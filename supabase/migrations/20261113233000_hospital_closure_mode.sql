begin;

create table hpsr_private.hospital_closure (
  singleton boolean primary key default true check (singleton),
  active boolean not null default false,
  changed_at timestamptz not null default now(),
  changed_by uuid
);
revoke all on hpsr_private.hospital_closure from public, anon, authenticated, service_role;
insert into hpsr_private.hospital_closure default values;

create function public.hpsr_closure_active() returns boolean
language sql stable security definer set search_path='' as $$
  select active from hpsr_private.hospital_closure where singleton
$$;
revoke all on function public.hpsr_closure_active() from public;
grant execute on function public.hpsr_closure_active() to anon, authenticated, service_role;

create function public.hpsr_set_closure_mode(enabled boolean) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not coalesce(public.hpsr_can_access_internal(),false) then
    raise exception 'Acesso restrito ao Interno.' using errcode='42501';
  end if;
  if enabled is null then raise exception 'Estado obrigatório.'; end if;
  update hpsr_private.hospital_closure
     set active=enabled, changed_by=auth.uid(), changed_at=now()
   where singleton;
  return enabled;
end;
$$;
revoke all on function public.hpsr_set_closure_mode(boolean) from public, anon;
grant execute on function public.hpsr_set_closure_mode(boolean) to authenticated;

-- A shared row lock makes the switch wait for in-flight clinical writes and
-- prevents a transaction starting a new write from racing past activation.
create function hpsr_private.closure_write_allowed() returns boolean
language sql volatile security definer set search_path='' as $$
  select not active from hpsr_private.hospital_closure where singleton for share
$$;
revoke all on function hpsr_private.closure_write_allowed() from public;
grant execute on function hpsr_private.closure_write_allowed() to anon, authenticated, service_role;

create function hpsr_private.guard_hospital_closure() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if not hpsr_private.closure_write_allowed() then
    raise exception 'O Hospital São Rafael do Norte está encerrando suas atividades. Esta ação não está mais disponível.' using errcode='42501';
  end if;
  return null;
end;
$$;

-- Session and password maintenance are preserved; none creates clinical data.
do $$
declare t record;
begin
  for t in select c.relname from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p') and not c.relispartition
      and c.relname not in ('spatial_ref_sys','patient_portal_sessions','patient_access_codes',
        'patient_accounts','patient_portal_access','clinical_records','system_activities')
  loop
    execute format('create trigger hpsr_archive_write_guard before insert or update or delete or truncate on public.%I for each statement execute function hpsr_private.guard_hospital_closure()',t.relname);
  end loop;
end $$;

create trigger hpsr_archive_record_write_guard before insert or delete or truncate on public.clinical_records
for each statement execute function hpsr_private.guard_hospital_closure();

create function hpsr_private.guard_archive_record_release() returns trigger
language plpgsql security invoker set search_path='' as $$
declare fields text[] := array['released_render_payload','is_confidential','released_at','released_by','confidentiality_updated_at','confidentiality_updated_by','updated_at'];
begin
  if hpsr_private.closure_write_allowed() then return new; end if;
  -- This runs before metadata/asset derivation. Only the existing authorized
  -- SECURITY DEFINER release RPC may set the snapshot and visibility metadata.
  if current_user not in ('anon','authenticated','service_role')
     and auth.uid() is not null
     and lower(old.record_type)='exame' and old.is_confidential is true and new.is_confidential is false
     and new.released_at is not null and new.released_by=auth.uid()
     and new.confidentiality_updated_by=auth.uid()
     and new.released_render_payload =
       (old.payload-'releasedSnapshot') || jsonb_build_object('releasedAt',new.released_at,'releasedBy',auth.uid())
     and (to_jsonb(new)-fields) = (to_jsonb(old)-fields)
  then return new; end if;
  raise exception 'O Hospital São Rafael do Norte está encerrando suas atividades. Esta ação não está mais disponível.' using errcode='42501';
end;
$$;
create trigger "00_hpsr_archive_record_release" before update on public.clinical_records
for each row execute function hpsr_private.guard_archive_record_release();

create trigger hpsr_archive_audit_write_guard before update or delete or truncate on public.system_activities
for each statement execute function hpsr_private.guard_hospital_closure();

create function hpsr_private.guard_archive_audit() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if hpsr_private.closure_write_allowed()
     or (current_user not in ('anon','authenticated','service_role')
         and auth.uid() is not null and new.module='Portal do Paciente'
         and new.action='Registro liberado ao paciente' and new.id like 'portal-confidentiality-%')
     or (current_user='service_role' and new.module='Portal do Paciente' and new.action='Recuperação de acesso')
  then return new; end if;
  raise exception 'O Hospital São Rafael do Norte está encerrando suas atividades. Esta ação não está mais disponível.' using errcode='42501';
end;
$$;
create trigger hpsr_archive_audit_insert_guard before insert on public.system_activities
for each row execute function hpsr_private.guard_archive_audit();

-- Permit trusted session infrastructure, not browser/old direct requests.
create function hpsr_private.guard_archive_account() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if current_user <> 'service_role' and public.hpsr_closure_active() then
    raise exception 'O Hospital São Rafael do Norte está encerrando suas atividades. Esta ação não está mais disponível.' using errcode='42501';
  end if;
  return null;
end;
$$;
do $$
declare t text;
begin
  foreach t in array array['patient_portal_sessions','patient_access_codes','patient_accounts','patient_portal_access'] loop
    execute format('create trigger hpsr_archive_account_guard before insert or update or delete or truncate on public.%I for each statement execute function hpsr_private.guard_archive_account()',t);
  end loop;
end $$;

create policy hpsr_archive_storage_insert on storage.objects as restrictive for insert to anon,authenticated
with check (not public.hpsr_closure_active());
create policy hpsr_archive_storage_update on storage.objects as restrictive for update to anon,authenticated
using (not public.hpsr_closure_active()) with check (not public.hpsr_closure_active());
create policy hpsr_archive_storage_delete on storage.objects as restrictive for delete to anon,authenticated
using (not public.hpsr_closure_active());

-- Keep OAuth login for existing staff without profile upserts during closure.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_type text := lower(coalesce(new.raw_user_meta_data->>'account_type', ''));
  request_id text := coalesce(new.raw_user_meta_data->>'registrationRequestId', 'staff-' || replace(new.id::text, '-', ''));
  requested_role text := coalesce(nullif(new.raw_user_meta_data->>'requestedRole', ''), 'Estagiário de Enfermagem');
  payload jsonb;
begin
  if public.hpsr_closure_active() then return new; end if;
  -- Contas criadas exclusivamente pelo Portal do Paciente não pertencem à equipe.
  -- Uma conta que já possua perfil profissional continua preservada e pode também ser paciente.
  if account_type = 'patient' then
    return new;
  end if;

  payload := jsonb_build_object(
    'id', request_id,
    'name', coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'email', new.email,
    'passport', coalesce(new.raw_user_meta_data->>'passport', ''),
    'crm', coalesce(new.raw_user_meta_data->>'crm', ''),
    'cityPhone', coalesce(new.raw_user_meta_data->>'cityPhone', ''),
    'discord', coalesce(new.raw_user_meta_data->>'discord', ''),
    'specialty', coalesce(new.raw_user_meta_data->>'specialty', 'Clínico Geral'),
    'requestedRole', requested_role,
    'createdAt', now(),
    'status', 'Pendente'
  );

  insert into public.profiles (id, name, email, passport, crm, role, specialty, city_phone, access_status)
  values (
    new.id, payload->>'name', new.email, nullif(payload->>'passport', ''),
    nullif(payload->>'crm', ''), requested_role, payload->>'specialty',
    nullif(payload->>'cityPhone', ''), 'Pendente'
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    passport = coalesce(excluded.passport, public.profiles.passport),
    crm = coalesce(excluded.crm, public.profiles.crm),
    specialty = coalesce(excluded.specialty, public.profiles.specialty),
    city_phone = coalesce(excluded.city_phone, public.profiles.city_phone),
    access_status = case when public.profiles.access_status = 'Aprovado' then 'Aprovado' else 'Pendente' end,
    updated_at = now();

  if coalesce(new.raw_user_meta_data->>'passport', '') <> ''
     and coalesce(new.raw_user_meta_data->>'crm', '') <> '' then
    insert into public.staff_registration_requests (
      id, auth_user_id, passport, name, requested_role, status, payload, created_at, updated_at
    ) values (
      request_id, new.id, payload->>'passport', payload->>'name', requested_role,
      'Pendente', payload, now(), now()
    )
    on conflict (id) do update set
      auth_user_id = excluded.auth_user_id,
      payload = excluded.payload,
      updated_at = now();
  end if;

  return new;
end;
$$;


commit;
