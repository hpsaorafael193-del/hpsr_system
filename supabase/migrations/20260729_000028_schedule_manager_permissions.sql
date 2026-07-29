-- v0.5.83 — Permissões de gerenciamento da Agenda Clínica
-- Médicos continuam gerenciando somente os próprios registros.
-- Direção e desenvolvimento podem gerenciar registros de todos os médicos.

create or replace function public.is_hpsr_schedule_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in (
        lower('Diretora'),
        lower('Vice Diretor'),
        lower('Diretor Clínico'),
        lower('Dev / Desenvolvedor do Sistema')
      )
  );
$$;

grant execute on function public.is_hpsr_schedule_manager() to authenticated;

-- Séries de disponibilidade
drop policy if exists "Doctors manage own availability" on public.clinical_availability_series;
drop policy if exists "Schedule managers manage availability" on public.clinical_availability_series;
create policy "Doctors and managers manage availability"
on public.clinical_availability_series
for all
to authenticated
using (doctor_id = auth.uid() or public.is_hpsr_schedule_manager())
with check (doctor_id = auth.uid() or public.is_hpsr_schedule_manager());

-- Horários publicados
drop policy if exists "Doctors manage own slots" on public.clinical_appointment_slots;
drop policy if exists "Schedule managers manage slots" on public.clinical_appointment_slots;
create policy "Doctors and managers manage slots"
on public.clinical_appointment_slots
for all
to authenticated
using (doctor_id = auth.uid() or public.is_hpsr_schedule_manager())
with check (doctor_id = auth.uid() or public.is_hpsr_schedule_manager());

-- Planejamentos
drop policy if exists "Doctors manage own plans" on public.clinical_followup_plans;
drop policy if exists "Schedule managers manage plans" on public.clinical_followup_plans;
create policy "Doctors and managers manage plans"
on public.clinical_followup_plans
for all
to authenticated
using (doctor_id = auth.uid() or public.is_hpsr_schedule_manager())
with check (doctor_id = auth.uid() or public.is_hpsr_schedule_manager());

-- Ocorrências vinculadas aos planejamentos
drop policy if exists "Doctors manage own occurrences" on public.clinical_followup_occurrences;
drop policy if exists "Schedule managers manage occurrences" on public.clinical_followup_occurrences;
create policy "Doctors and managers manage occurrences"
on public.clinical_followup_occurrences
for all
to authenticated
using (doctor_id = auth.uid() or public.is_hpsr_schedule_manager())
with check (doctor_id = auth.uid() or public.is_hpsr_schedule_manager());
