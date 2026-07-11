-- Remove registros demonstrativos que versões anteriores podiam ter espelhado no banco.
delete from public.team_members
where id in ('dev-luidhy','dir-sabrina','tec-marcos','med-helena','med-miguel','res-lucas','est-maya');

delete from public.staff_applications
where id in ('HPSR-EQP-000014','HPSR-EQP-000015');

delete from public.appointments
where id in ('HPSR-AGD-000128','HPSR-AGD-000129','HPSR-AGD-000130','CONS-001','CONS-002','CONS-003','CONS-004','CONS-005');

-- Consultas públicas retornam somente o registro que combina com os dados informados.
create or replace function public.consult_staff_application(p_passport text, p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'passport', passport,
    'token', token,
    'protocol', id,
    'name', name,
    'desiredRole', desired_role,
    'status', status,
    'triageDecision', payload->>'triageDecision',
    'interviewStatus', payload->>'interviewStatus',
    'interviewAt', payload->>'interviewAt',
    'interviewResult', payload->>'interviewResult'
  )
  from public.staff_applications
  where lower(trim(passport)) = lower(trim(p_passport))
    and lower(trim(token)) = lower(trim(p_token))
  limit 1;
$$;

create or replace function public.consult_appointment(p_passport text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', id,
    'passport', passport,
    'patient', patient,
    'status', status,
    'createdAt', created_at,
    'updatedAt', updated_at,
    'cityPhone', payload->>'cityPhone',
    'bloodType', payload->>'bloodType',
    'discord', payload->>'discord',
    'specialty', payload->>'specialty',
    'preferredDate', payload->>'preferredDate',
    'preferredPeriod', payload->>'preferredPeriod',
    'reason', payload->>'reason',
    'notes', payload->>'notes',
    'doctor', payload->>'doctor',
    'answer', payload->>'answer'
  )
  from public.appointments
  where trim(passport) = trim(p_passport)
  order by created_at desc
  limit 1;
$$;

grant execute on function public.consult_staff_application(text, text) to anon, authenticated;
grant execute on function public.consult_appointment(text) to anon, authenticated;
