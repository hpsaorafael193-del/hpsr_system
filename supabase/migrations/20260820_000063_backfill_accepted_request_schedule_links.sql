-- v1.0.278
-- Recupera vínculos de solicitações já aceitas antes da criação automática do vínculo leve.
do $$
declare
  r record;
  v_assignments jsonb;
begin
  for r in
    select distinct
      public.hpsr_normalize_passport(a.passport) as passport,
      a.payload->>'acceptedById' as doctor_id,
      coalesce(nullif(a.payload->>'acceptedByName',''), nullif(a.payload->>'physician',''), 'Médico responsável') as doctor_name,
      a.payload->>'specialty' as specialty
    from public.appointments a
    where a.status = 'Aceita'
      and coalesce(a.payload->>'source','') = 'patient_portal'
      and coalesce(a.payload->>'acceptedById','') <> ''
      and coalesce(a.payload->>'specialty','') <> ''
  loop
    select coalesce(pa.schedule_assignments,'[]'::jsonb)
      into v_assignments
      from public.patient_portal_access pa
     where public.hpsr_normalize_passport(pa.patient_passport)=r.passport
     for update;
    if not found then continue; end if;

    if not exists (
      select 1 from jsonb_array_elements(v_assignments) item
       where item->>'doctor_id'=r.doctor_id
         and public.hpsr_normalize_specialty(item->>'specialty')=public.hpsr_normalize_specialty(r.specialty)
    ) then
      update public.patient_portal_access pa
         set schedule_assignments = v_assignments || jsonb_build_array(jsonb_build_object(
           'doctor_id', r.doctor_id,
           'doctor_name', r.doctor_name,
           'specialty', r.specialty
         )),
             updated_at = now()
       where public.hpsr_normalize_passport(pa.patient_passport)=r.passport;
    end if;
  end loop;
end;
$$;
