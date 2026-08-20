-- Vínculos de agenda passam a ser exclusivamente administrativos.
-- Consultas, planejamentos e classificação clínica não criam vínculo implicitamente.

create or replace function public.set_patient_schedule_link(
  target_passport text,
  target_doctor_id uuid,
  target_doctor_name text,
  target_specialty text,
  target_enabled boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_passport text := public.hpsr_normalize_passport(target_passport);
  v_specialty text := trim(coalesce(target_specialty, ''));
  v_name text := trim(coalesce(target_doctor_name, ''));
  v_assignments jsonb := '[]'::jsonb;
  v_cleaned jsonb := '[]'::jsonb;
begin
  if v_user is null then raise exception 'Sessão não encontrada'; end if;
  if not public.is_hpsr_internal_link_manager() then
    raise exception 'Somente o Diretor Técnico / Dev pode gerenciar vínculos de agenda';
  end if;
  if v_passport = '' or target_doctor_id is null or v_specialty = '' then
    raise exception 'Paciente, médico e especialidade são obrigatórios';
  end if;

  select coalesce(schedule_assignments, '[]'::jsonb)
    into v_assignments
    from public.patient_portal_access
   where public.hpsr_normalize_passport(patient_passport) = v_passport
   for update;

  if not found then raise exception 'Paciente sem acesso ativo ao Portal do Paciente'; end if;

  select coalesce(jsonb_agg(item), '[]'::jsonb)
    into v_cleaned
    from jsonb_array_elements(v_assignments) item
   where coalesce(item->>'doctor_id', '') <> target_doctor_id::text
      or public.hpsr_normalize_specialty(item->>'specialty') <> public.hpsr_normalize_specialty(v_specialty);

  if target_enabled then
    v_cleaned := v_cleaned || jsonb_build_array(jsonb_build_object(
      'doctor_id', target_doctor_id::text,
      'doctor_name', coalesce(nullif(v_name, ''), 'Médico responsável'),
      'specialty', v_specialty,
      'source', 'internal_manual',
      'managed_by', v_user::text,
      'managed_at', now()
    ));
  end if;

  update public.patient_portal_access
     set schedule_assignments = v_cleaned,
         updated_at = now()
   where public.hpsr_normalize_passport(patient_passport) = v_passport;

  return jsonb_build_object('ok', true, 'linked', target_enabled, 'assignments', v_cleaned);
end;
$$;

revoke all on function public.set_patient_schedule_link(text, uuid, text, text, boolean) from public, anon;
grant execute on function public.set_patient_schedule_link(text, uuid, text, text, boolean) to authenticated, service_role;

comment on function public.set_patient_schedule_link(text, uuid, text, text, boolean) is
  'Gerencia explicitamente vínculos paciente-médico-especialidade. Restrito ao Diretor Técnico / Dev; contextos clínicos não criam vínculos.';
