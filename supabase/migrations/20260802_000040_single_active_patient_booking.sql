-- v1.0.155 — Um único agendamento ativo por paciente no Portal do Paciente

create or replace function public.hpsr_normalize_passport(value text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(trim(coalesce(value, '')), '\s+', '', 'g'));
$$;

create or replace function public.hpsr_is_active_patient_booking(booking_status text)
returns boolean
language sql
immutable
as $$
  select coalesce(trim(booking_status), '') not in (
    '',
    'Realizada',
    'Concluída',
    'Concluído',
    'Cancelada',
    'Recusada',
    'Recusado',
    'Não compareceu',
    'Arquivado',
    'Encerrado'
  );
$$;

create or replace function public.hpsr_patient_has_active_booking(
  target_passport text,
  exclude_appointment_id text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.appointments a
     where public.hpsr_normalize_passport(a.passport) = public.hpsr_normalize_passport(target_passport)
       and (exclude_appointment_id is null or a.id <> exclude_appointment_id)
       and coalesce(a.payload->>'source', '') in ('patient_portal', 'clinical_availability')
       and public.hpsr_is_active_patient_booking(a.status)
  );
$$;

revoke all on function public.hpsr_patient_has_active_booking(text, text) from public, anon;
grant execute on function public.hpsr_patient_has_active_booking(text, text) to authenticated, service_role;

create index if not exists appointments_patient_active_lookup_idx
  on public.appointments (public.hpsr_normalize_passport(passport), status)
  where coalesce(payload->>'source', '') in ('patient_portal', 'clinical_availability');

create or replace function public.hpsr_guard_single_active_patient_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  passport_key text;
begin
  if coalesce(new.payload->>'source', '') not in ('patient_portal', 'clinical_availability')
     or not public.hpsr_is_active_patient_booking(new.status) then
    return new;
  end if;

  -- Registros ativos antigos podem continuar sendo atualizados normalmente. O bloqueio
  -- atua apenas quando uma operação tenta criar uma nova pendência ativa para o paciente.
  if tg_op = 'UPDATE'
     and coalesce(old.payload->>'source', '') in ('patient_portal', 'clinical_availability')
     and public.hpsr_is_active_patient_booking(old.status)
     and public.hpsr_normalize_passport(old.passport) = public.hpsr_normalize_passport(new.passport) then
    return new;
  end if;

  passport_key := public.hpsr_normalize_passport(new.passport);
  if passport_key = '' then
    return new;
  end if;

  -- Serializa tentativas simultâneas do mesmo paciente sem bloquear outros pacientes.
  perform pg_advisory_xact_lock(hashtext('hpsr-active-booking:' || passport_key));

  if exists (
    select 1
      from public.appointments a
     where public.hpsr_normalize_passport(a.passport) = passport_key
       and a.id <> new.id
       and coalesce(a.payload->>'source', '') in ('patient_portal', 'clinical_availability')
       and public.hpsr_is_active_patient_booking(a.status)
  ) then
    raise exception using
      errcode = '23505',
      message = 'O paciente já possui uma consulta ativa.';
  end if;

  return new;
end;
$$;

drop trigger if exists hpsr_single_active_patient_booking on public.appointments;
create trigger hpsr_single_active_patient_booking
before insert or update of passport, status, payload on public.appointments
for each row execute function public.hpsr_guard_single_active_patient_booking();

comment on function public.hpsr_patient_has_active_booking(text, text) is
  'Verifica de forma leve se o paciente já possui solicitação ou consulta ativa criada pelo Portal do Paciente.';
comment on trigger hpsr_single_active_patient_booking on public.appointments is
  'Impede agendamentos simultâneos do mesmo paciente, inclusive em requisições concorrentes.';
