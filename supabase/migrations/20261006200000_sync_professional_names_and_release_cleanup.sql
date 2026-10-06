-- HPSR v1.1.16-test.74
-- Regra: a identidade do profissional é o UUID do perfil. O nome é apenas apresentação
-- e deve ser propagado a registros derivados sempre que o perfil for renomeado.

create or replace function public.hpsr_apply_professional_display_name(p_doctor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_name text;
  v_appointments integer := 0;
  v_plans integer := 0;
  v_forms integer := 0;
  v_series integer := 0;
  v_slots integer := 0;
begin
  select name into v_name from public.profiles where id = p_doctor_id;
  if v_name is null then
    return jsonb_build_object('ok', false, 'error', 'Perfil profissional não encontrado.');
  end if;

  update public.clinical_followup_plans
     set doctor_name = v_name, updated_at = now()
   where doctor_id = p_doctor_id;
  get diagnostics v_plans = row_count;

  update public.followup_intake_forms
     set doctor_name = v_name, updated_at = now()
   where doctor_id = p_doctor_id;
  get diagnostics v_forms = row_count;

  update public.clinical_availability_series
     set doctor_name = v_name, updated_at = now()
   where doctor_id = p_doctor_id;
  get diagnostics v_series = row_count;

  update public.clinical_appointment_slots
     set doctor_name = v_name, updated_at = now()
   where doctor_id = p_doctor_id;
  get diagnostics v_slots = row_count;

  update public.appointments
     set payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
       'physician', v_name,
       'doctor', v_name,
       'acceptedByName', v_name,
       'updatedAt', now()
     ),
     updated_at = now()
   where coalesce(payload->>'doctorId', payload->>'doctor_id', payload->>'acceptedById', '') = p_doctor_id::text;
  get diagnostics v_appointments = row_count;

  return jsonb_build_object(
    'ok', true,
    'name', v_name,
    'appointments', v_appointments,
    'plans', v_plans,
    'forms', v_forms,
    'series', v_series,
    'slots', v_slots
  );
end;
$function$;

revoke all on function public.hpsr_apply_professional_display_name(uuid) from public, anon;
grant execute on function public.hpsr_apply_professional_display_name(uuid) to authenticated;

create or replace function public.hpsr_sync_professional_display_name()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(new.name, '') is distinct from coalesce(old.name, '') then
    perform public.hpsr_apply_professional_display_name(new.id);

    -- Registros históricos sem doctor_id mantêm o vínculo pelo nome anterior.
    -- Atualizamos apenas correspondências exatas para não reatribuir registros de terceiros.
    update public.system_activities set actor = new.name where actor = old.name;
    update public.hospital_bed_history set doctor_name = new.name where doctor_name = old.name;

    update public.financial_receipts
       set payload = jsonb_set(payload, '{issuedBy}', to_jsonb(new.name), true)
     where payload->>'issuedBy' = old.name;

    update public.financial_plan_entries
       set payload = jsonb_set(payload, '{registeredBy}', to_jsonb(new.name), true)
     where payload->>'registeredBy' = old.name;

    update public.clinical_records
       set payload = case
         when payload->>'doctorName' = old.name then jsonb_set(payload, '{doctorName}', to_jsonb(new.name), true)
         when payload->>'physician' = old.name then jsonb_set(payload, '{physician}', to_jsonb(new.name), true)
         when payload->>'doctor' = old.name then jsonb_set(payload, '{doctor}', to_jsonb(new.name), true)
         else payload
       end
     where payload->>'doctorName' = old.name
        or payload->>'physician' = old.name
        or payload->>'doctor' = old.name;
  end if;
  return new;
end;
$function$;

drop trigger if exists hpsr_sync_professional_display_name on public.profiles;
create trigger hpsr_sync_professional_display_name
after update of name on public.profiles
for each row
when (old.name is distinct from new.name)
execute function public.hpsr_sync_professional_display_name();

-- Backfill de identidade estável: usa acceptedById quando já existe.
update public.appointments a
   set payload = jsonb_set(coalesce(a.payload, '{}'::jsonb), '{doctorId}', to_jsonb(a.payload->>'acceptedById'), true)
 where coalesce(a.payload->>'doctorId', a.payload->>'doctor_id', '') = ''
   and coalesce(a.payload->>'acceptedById', '') <> ''
   and exists (select 1 from public.profiles p where p.id::text = a.payload->>'acceptedById');

-- Backfill por nome atual quando o perfil é inequívoco.
update public.appointments a
   set payload = jsonb_set(coalesce(a.payload, '{}'::jsonb), '{doctorId}', to_jsonb(p.id::text), true)
  from public.profiles p
 where coalesce(a.payload->>'doctorId', a.payload->>'doctor_id', '') = ''
   and lower(btrim(coalesce(a.payload->>'physician', a.payload->>'doctor', a.payload->>'acceptedByName', ''))) = lower(btrim(p.name));

-- Alias histórico confirmado do mesmo perfil após alteração de sobrenome.
update public.appointments a
   set payload = jsonb_set(coalesce(a.payload, '{}'::jsonb), '{doctorId}', to_jsonb(p.id::text), true)
  from public.profiles p
 where coalesce(a.payload->>'doctorId', a.payload->>'doctor_id', '') = ''
   and lower(btrim(coalesce(a.payload->>'physician', a.payload->>'doctor', a.payload->>'acceptedByName', ''))) = lower('Luidhy Luddhiev')
   and p.name = 'Luidhy D''Amato';

-- Após reconciliar IDs, aplica o nome atual de cada perfil a todos os registros derivados.
do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform public.hpsr_apply_professional_display_name(r.id);
  end loop;
end $$;

-- Segurança: o Portal do Paciente grava solicitações apenas pelas rotas server-side autenticadas.
drop policy if exists "public appointment insert" on public.appointments;
