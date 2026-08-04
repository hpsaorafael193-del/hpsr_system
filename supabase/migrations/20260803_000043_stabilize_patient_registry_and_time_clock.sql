-- Estabiliza o acesso institucional aos pacientes, reduz erros esperados no log
-- e mantém o encerramento diferido do ponto sem falhar quando a sessão já sumiu.

-- Restaura grants que podem ter sido removidos ou não aplicados no ambiente publicado.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.patient_registry to authenticated;

do $$
begin
  if to_regclass('public.patient_portal_access') is not null then
    execute 'grant select, insert, update, delete on table public.patient_portal_access to authenticated';
  end if;
  if to_regclass('public.patient_portal_accounts') is not null then
    execute 'grant select, insert, update, delete on table public.patient_portal_accounts to authenticated';
  end if;
end;
$$;

-- Reaplica a política institucional sem liberar pacientes comuns para administração.
drop policy if exists "staff patient registry" on public.patient_registry;
create policy "staff patient registry" on public.patient_registry
for all to authenticated
using (public.is_hpsr_staff())
with check (public.is_hpsr_staff());

-- Leitura centralizada usada pelo seletor global. Evita depender diretamente dos
-- grants da tabela no cliente e mantém a validação de integrante da equipe.
create or replace function public.list_patient_registry_staff()
returns table (
  passport text,
  name text,
  age text,
  blood_type text,
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
  select p.passport, p.name, p.age, p.blood_type, p.city_phone, p.email, p.created_at
  from public.patient_registry p
  order by p.created_at desc;
end;
$$;

-- Cadastro rápido centralizado. O passaporte continua sendo a chave única e
-- registros existentes são atualizados em vez de duplicados.
create or replace function public.upsert_patient_registry_staff(
  p_passport text,
  p_name text,
  p_age text default null,
  p_blood_type text default null,
  p_city_phone text default null,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_passport text := upper(trim(coalesce(p_passport, '')));
  v_name text := trim(coalesce(p_name, ''));
  v_row public.patient_registry%rowtype;
begin
  if auth.uid() is null or not public.is_hpsr_staff() then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;
  if v_passport = '' or v_name = '' then
    raise exception 'Nome e documento são obrigatórios.';
  end if;

  insert into public.patient_registry(passport, name, age, blood_type, city_phone, email)
  values (
    v_passport,
    v_name,
    nullif(trim(coalesce(p_age, '')), ''),
    nullif(trim(coalesce(p_blood_type, '')), ''),
    nullif(trim(coalesce(p_city_phone, '')), ''),
    nullif(lower(trim(coalesce(p_email, ''))), '')
  )
  on conflict (passport) do update set
    name = excluded.name,
    age = coalesce(excluded.age, public.patient_registry.age),
    blood_type = coalesce(excluded.blood_type, public.patient_registry.blood_type),
    city_phone = coalesce(excluded.city_phone, public.patient_registry.city_phone),
    email = coalesce(excluded.email, public.patient_registry.email),
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object('ok', true, 'passport', v_row.passport, 'name', v_row.name);
end;
$$;

revoke all on function public.list_patient_registry_staff() from public;
revoke all on function public.upsert_patient_registry_staff(text, text, text, text, text, text) from public;
grant execute on function public.list_patient_registry_staff() to authenticated;
grant execute on function public.upsert_patient_registry_staff(text, text, text, text, text, text) to authenticated;

-- Chamadas de pagehide podem chegar depois que o token foi descartado. Isso é
-- um estado esperado do navegador, portanto não deve gerar P0001 nem alterar dados.
create or replace function public.time_clock_request_deferred_close()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
begin
  if v_user is null then
    return jsonb_build_object('active', false, 'scheduled', false, 'reason', 'no_session');
  end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1
  for update;

  if v_entry.id is null then
    return jsonb_build_object('active', false, 'scheduled', false);
  end if;

  update public.time_clock_entries
  set close_requested_at = v_now,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object(
    'active', true,
    'scheduled', true,
    'closeAfter', v_now + interval '3 minutes'
  );
end;
$$;

create or replace function public.time_clock_heartbeat(p_close boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_entry public.time_clock_entries%rowtype;
  v_deadline timestamptz;
begin
  if v_user is null then
    return jsonb_build_object('active', false, 'closed', false, 'reason', 'no_session');
  end if;

  select * into v_entry
  from public.time_clock_entries
  where user_id = v_user and closed_at is null
  order by opened_at desc limit 1
  for update;

  if v_entry.id is null then
    return jsonb_build_object('active', false, 'closed', false);
  end if;

  if p_close then
    perform public.time_clock_close_entry_at(v_entry.id, v_now);
    return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_now);
  end if;

  if v_entry.close_requested_at is not null then
    v_deadline := v_entry.close_requested_at + interval '3 minutes';
    if v_now >= v_deadline then
      perform public.time_clock_close_entry_at(v_entry.id, v_deadline);
      return jsonb_build_object('active', false, 'closed', true, 'closedAt', v_deadline);
    end if;
  end if;

  update public.time_clock_entries
  set last_heartbeat_at = v_now,
      close_requested_at = null,
      updated_at = v_now
  where id = v_entry.id;

  return jsonb_build_object('active', true, 'closed', false, 'heartbeatAt', v_now);
end;
$$;

grant execute on function public.time_clock_request_deferred_close() to authenticated;
grant execute on function public.time_clock_heartbeat(boolean) to authenticated;
