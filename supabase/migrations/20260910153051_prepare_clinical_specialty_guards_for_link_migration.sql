-- v1.0.347 — Preparação para Mudança 5.
-- Fecha fallbacks e impede uso clínico de especialidade incompatível com cargo/perfil.

create or replace function public.hpsr_guard_availability_specialty()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  if new.doctor_id is null then raise exception 'Médico responsável é obrigatório.'; end if;
  if public.hpsr_normalize_specialty(new.specialty) = '' then raise exception 'Especialidade clínica é obrigatória.'; end if;
  if not public.hpsr_doctor_has_specialty(new.doctor_id, new.specialty) then
    raise exception 'O cargo/perfil deste profissional não permite publicar horários nesta especialidade.';
  end if;
  return new;
end;
$function$;
revoke all on function public.hpsr_guard_availability_specialty() from public, anon, authenticated;

drop trigger if exists hpsr_guard_availability_series_specialty on public.clinical_availability_series;
create trigger hpsr_guard_availability_series_specialty before insert or update of doctor_id, specialty on public.clinical_availability_series for each row execute function public.hpsr_guard_availability_specialty();

drop trigger if exists hpsr_guard_availability_slot_specialty on public.clinical_appointment_slots;
create trigger hpsr_guard_availability_slot_specialty before insert or update of doctor_id, specialty on public.clinical_appointment_slots for each row execute function public.hpsr_guard_availability_specialty();

create or replace function public.hpsr_guard_followup_specialty()
returns trigger language plpgsql set search_path to 'public' as $function$
begin
  if new.doctor_id is null then raise exception 'Médico responsável é obrigatório.'; end if;
  if public.hpsr_normalize_specialty(new.specialty) = '' then raise exception 'Especialidade clínica é obrigatória.'; end if;
  if not public.hpsr_doctor_has_specialty(new.doctor_id, new.specialty) then
    raise exception 'O cargo/perfil deste profissional não permite acompanhamento nesta especialidade.';
  end if;
  return new;
end;
$function$;
revoke all on function public.hpsr_guard_followup_specialty() from public, anon, authenticated;

drop trigger if exists hpsr_guard_followup_plan_specialty on public.clinical_followup_plans;
create trigger hpsr_guard_followup_plan_specialty before insert or update of doctor_id, specialty on public.clinical_followup_plans for each row execute function public.hpsr_guard_followup_specialty();

drop trigger if exists hpsr_guard_followup_occurrence_specialty on public.clinical_followup_occurrences;
create trigger hpsr_guard_followup_occurrence_specialty before insert or update of doctor_id, specialty on public.clinical_followup_occurrences for each row execute function public.hpsr_guard_followup_specialty();

create or replace function public.hpsr_guard_staff_manual_appointment_specialty()
returns trigger language plpgsql set search_path to 'public' as $function$
declare
  v_doctor_id uuid;
  v_specialty text;
  v_mode text := coalesce(new.payload->>'schedulingMode', '');
begin
  if v_mode <> 'staff_manual_schedule' then return new; end if;
  if tg_op = 'UPDATE'
     and coalesce(old.payload->>'schedulingMode', '') = v_mode
     and coalesce(old.payload->>'doctorId', '') = coalesce(new.payload->>'doctorId', '')
     and public.hpsr_normalize_specialty(old.payload->>'specialty') = public.hpsr_normalize_specialty(new.payload->>'specialty') then
    return new;
  end if;
  begin
    v_doctor_id := nullif(coalesce(new.payload->>'doctorId', ''), '')::uuid;
  exception when invalid_text_representation then
    raise exception 'Médico responsável inválido no agendamento manual.';
  end;
  v_specialty := btrim(coalesce(new.payload->>'specialty', ''));
  if v_doctor_id is null then raise exception 'Médico responsável é obrigatório no agendamento manual.'; end if;
  if public.hpsr_normalize_specialty(v_specialty) = '' then raise exception 'Especialidade clínica é obrigatória no agendamento manual.'; end if;
  if not public.hpsr_doctor_has_specialty(v_doctor_id, v_specialty) then
    raise exception 'O cargo/perfil do médico selecionado não permite agendamento nesta especialidade.';
  end if;
  return new;
end;
$function$;
revoke all on function public.hpsr_guard_staff_manual_appointment_specialty() from public, anon, authenticated;

drop trigger if exists hpsr_guard_staff_manual_appointment_specialty on public.appointments;
create trigger hpsr_guard_staff_manual_appointment_specialty before insert or update of payload on public.appointments for each row execute function public.hpsr_guard_staff_manual_appointment_specialty();
