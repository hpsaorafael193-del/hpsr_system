-- v1.0.156 — Um agendamento ativo por paciente e por especialidade

create or replace function public.hpsr_patient_has_active_booking(
  target_passport text,
  target_specialty text,
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
       and public.hpsr_normalize_specialty(a.payload->>'specialty') = public.hpsr_normalize_specialty(target_specialty)
       and (exclude_appointment_id is null or a.id <> exclude_appointment_id)
       and coalesce(a.payload->>'source', '') in ('patient_portal', 'clinical_availability')
       and public.hpsr_is_active_patient_booking(a.status)
  );
$$;

revoke all on function public.hpsr_patient_has_active_booking(text, text, text) from public, anon;
grant execute on function public.hpsr_patient_has_active_booking(text, text, text) to authenticated, service_role;

drop function if exists public.hpsr_patient_has_active_booking(text, text);

create index if not exists appointments_patient_specialty_active_lookup_idx
  on public.appointments (
    public.hpsr_normalize_passport(passport),
    public.hpsr_normalize_specialty(payload->>'specialty'),
    status
  )
  where coalesce(payload->>'source', '') in ('patient_portal', 'clinical_availability');

create or replace function public.hpsr_guard_single_active_patient_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  passport_key text;
  specialty_key text;
begin
  if coalesce(new.payload->>'source', '') not in ('patient_portal', 'clinical_availability')
     or not public.hpsr_is_active_patient_booking(new.status) then
    return new;
  end if;

  passport_key := public.hpsr_normalize_passport(new.passport);
  specialty_key := public.hpsr_normalize_specialty(new.payload->>'specialty');
  if passport_key = '' or specialty_key = '' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and coalesce(old.payload->>'source', '') in ('patient_portal', 'clinical_availability')
     and public.hpsr_is_active_patient_booking(old.status)
     and public.hpsr_normalize_passport(old.passport) = passport_key
     and public.hpsr_normalize_specialty(old.payload->>'specialty') = specialty_key then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('hpsr-active-booking:' || passport_key || ':' || specialty_key));

  if exists (
    select 1
      from public.appointments a
     where public.hpsr_normalize_passport(a.passport) = passport_key
       and public.hpsr_normalize_specialty(a.payload->>'specialty') = specialty_key
       and a.id <> new.id
       and coalesce(a.payload->>'source', '') in ('patient_portal', 'clinical_availability')
       and public.hpsr_is_active_patient_booking(a.status)
  ) then
    raise exception using
      errcode = '23505',
      message = 'O paciente já possui uma consulta ativa nesta especialidade.';
  end if;

  return new;
end;
$$;

comment on function public.hpsr_patient_has_active_booking(text, text, text) is
  'Verifica se o paciente já possui solicitação ou consulta ativa na mesma especialidade.';
comment on trigger hpsr_single_active_patient_booking on public.appointments is
  'Impede agendamentos ativos duplicados do mesmo paciente na mesma especialidade.';
