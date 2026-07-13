-- Portal do Paciente — Etapa 1
-- Fundação de banco e segurança. Não cria contas de pacientes no Supabase Auth.

create extension if not exists pgcrypto;

-- Contato usado exclusivamente para o portal. O prontuário clínico continua sem depender de e-mail.
create table if not exists public.patient_portal_access (
  id uuid primary key default gen_random_uuid(),
  patient_passport text not null unique,
  email text not null,
  access_enabled boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_portal_access_passport_not_blank check (length(trim(patient_passport)) > 0),
  constraint patient_portal_access_email_not_blank check (length(trim(email)) > 3)
);

-- Guarda somente o hash do código. Nunca armazena o código de seis dígitos em texto aberto.
create table if not exists public.patient_access_codes (
  id uuid primary key default gen_random_uuid(),
  portal_access_id uuid not null references public.patient_portal_access(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  invalidated_at timestamptz,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  sent_at timestamptz not null default now(),
  resend_available_at timestamptz not null default (now() + interval '60 seconds'),
  request_ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint patient_access_codes_attempts_valid check (attempt_count >= 0 and max_attempts between 1 and 20),
  constraint patient_access_codes_expiration_valid check (expires_at > created_at)
);

-- Sessão própria e restrita ao portal. Também é armazenada apenas como hash.
create table if not exists public.patient_portal_sessions (
  id uuid primary key default gen_random_uuid(),
  portal_access_id uuid not null references public.patient_portal_access(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  request_ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint patient_portal_sessions_expiration_valid check (expires_at > created_at)
);

-- Todo registro clínico passa a ter controle individual de sigilo.
alter table public.clinical_records
  add column if not exists is_confidential boolean not null default true,
  add column if not exists released_at timestamptz,
  add column if not exists released_by uuid references public.profiles(id) on delete set null,
  add column if not exists confidentiality_updated_at timestamptz not null default now(),
  add column if not exists confidentiality_updated_by uuid references public.profiles(id) on delete set null;

-- Registros já existentes permanecem em sigilo até liberação explícita de um médico.
update public.clinical_records
set is_confidential = true
where is_confidential is null;

create index if not exists idx_patient_portal_access_passport
  on public.patient_portal_access (patient_passport);
create index if not exists idx_patient_access_codes_access_sent
  on public.patient_access_codes (portal_access_id, sent_at desc);
create index if not exists idx_patient_access_codes_expiration
  on public.patient_access_codes (expires_at)
  where used_at is null and invalidated_at is null;
create index if not exists idx_patient_portal_sessions_token
  on public.patient_portal_sessions (token_hash);
create index if not exists idx_patient_portal_sessions_expiration
  on public.patient_portal_sessions (expires_at)
  where revoked_at is null;
create index if not exists idx_clinical_records_patient_release
  on public.clinical_records (patient_passport, is_confidential, created_at desc);

-- Atualização automática da data do cadastro do acesso.
create or replace function public.touch_patient_portal_access_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_patient_portal_access_updated_at on public.patient_portal_access;
create trigger trg_patient_portal_access_updated_at
before update on public.patient_portal_access
for each row execute function public.touch_patient_portal_access_updated_at();

alter table public.patient_portal_access enable row level security;
alter table public.patient_access_codes enable row level security;
alter table public.patient_portal_sessions enable row level security;

-- Equipe autenticada pode cadastrar e manter o contato do portal.
drop policy if exists "authenticated patient portal access" on public.patient_portal_access;
create policy "authenticated patient portal access"
on public.patient_portal_access for all to authenticated
using (true)
with check (true);

-- Códigos e sessões nunca ficam acessíveis diretamente pelo navegador, nem para anon,
-- nem para authenticated. As rotas servidoras futuras usarão somente service_role.
revoke all on table public.patient_access_codes from anon, authenticated;
revoke all on table public.patient_portal_sessions from anon, authenticated;
revoke all on table public.patient_portal_access from anon;
grant select, insert, update, delete on table public.patient_portal_access to authenticated;

-- Alterna sigilo e registra responsável/data de forma atômica.
create or replace function public.set_clinical_record_confidentiality(
  target_record_id text,
  confidential boolean
)
returns public.clinical_records
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_record public.clinical_records;
  activity_id text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.clinical_records
  set
    is_confidential = confidential,
    released_at = case when confidential then null else now() end,
    released_by = case when confidential then null else auth.uid() end,
    confidentiality_updated_at = now(),
    confidentiality_updated_by = auth.uid(),
    updated_at = now()
  where id = target_record_id
  returning * into changed_record;

  if changed_record.id is null then
    raise exception 'Clinical record not found';
  end if;

  activity_id := 'portal-confidentiality-' || replace(gen_random_uuid()::text, '-', '');
  insert into public.system_activities (id, module, action, description, actor, reference)
  values (
    activity_id,
    'Portal do Paciente',
    case when confidential then 'Registro colocado em sigilo' else 'Registro liberado ao paciente' end,
    case when confidential
      then 'O exame ou documento foi ocultado do Portal do Paciente.'
      else 'O exame ou documento foi liberado para visualização no Portal do Paciente.'
    end,
    coalesce((select name from public.profiles where id = auth.uid()), auth.uid()::text),
    target_record_id
  );

  return changed_record;
end;
$$;

revoke all on function public.set_clinical_record_confidentiality(text, boolean) from public;
grant execute on function public.set_clinical_record_confidentiality(text, boolean) to authenticated;

-- Invalida códigos anteriores quando um novo código for criado pela futura rota servidora.
create or replace function public.invalidate_patient_access_codes(target_portal_access_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

  update public.patient_access_codes
  set invalidated_at = now()
  where portal_access_id = target_portal_access_id
    and used_at is null
    and invalidated_at is null;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.invalidate_patient_access_codes(uuid) from public, anon, authenticated;
grant execute on function public.invalidate_patient_access_codes(uuid) to service_role;

-- Limpeza periódica; poderá ser chamada por cron/Edge Function futuramente.
create or replace function public.cleanup_expired_patient_portal_security()
returns table(deleted_codes bigint, deleted_sessions bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  codes_count bigint;
  sessions_count bigint;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

  delete from public.patient_access_codes
  where expires_at < now() - interval '24 hours'
     or used_at < now() - interval '24 hours'
     or invalidated_at < now() - interval '24 hours';
  get diagnostics codes_count = row_count;

  delete from public.patient_portal_sessions
  where expires_at < now() - interval '24 hours'
     or revoked_at < now() - interval '24 hours';
  get diagnostics sessions_count = row_count;

  return query select codes_count, sessions_count;
end;
$$;

revoke all on function public.cleanup_expired_patient_portal_security() from public, anon, authenticated;
grant execute on function public.cleanup_expired_patient_portal_security() to service_role;

comment on table public.patient_portal_access is 'Contato e habilitação do Portal do Paciente, sem conta no Supabase Auth.';
comment on table public.patient_access_codes is 'Códigos temporários de uso único; somente hashes são persistidos.';
comment on table public.patient_portal_sessions is 'Sessões temporárias próprias do portal; somente hashes de token são persistidos.';
comment on column public.clinical_records.is_confidential is 'Quando true, o registro nunca deve ser retornado ao paciente.';
