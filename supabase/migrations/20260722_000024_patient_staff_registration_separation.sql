-- Separa definitivamente contas de paciente das solicitações de acesso profissional.

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

-- Remove somente perfis pendentes/recusados criados indevidamente para contas
-- declaradas como paciente. Perfis profissionais aprovados nunca são removidos.
delete from public.staff_registration_requests r
using auth.users u
where r.auth_user_id = u.id
  and lower(coalesce(u.raw_user_meta_data->>'account_type', '')) = 'patient';

delete from public.profiles p
using auth.users u
where p.id = u.id
  and lower(coalesce(u.raw_user_meta_data->>'account_type', '')) = 'patient'
  and p.access_status <> 'Aprovado'
  and not exists (
    select 1 from public.staff_registration_requests r where r.auth_user_id = p.id
  );
