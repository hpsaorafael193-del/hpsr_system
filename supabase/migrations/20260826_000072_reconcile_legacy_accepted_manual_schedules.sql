-- v1.0.303
-- Reconcilia solicitações antigas já aceitas com agendamentos manuais criados em registros separados.
-- Não apaga histórico nem altera status. Apenas grava referências cruzadas quando a correspondência é segura.
with base as (
  select
    id,
    passport,
    status,
    created_at,
    updated_at,
    payload,
    coalesce(payload->>'specialty','') as specialty,
    coalesce(payload->>'doctorId',payload->>'acceptedById','') as doctor_id,
    coalesce(payload->>'physician',payload->>'doctor','') as doctor_name,
    coalesce(payload->>'flowType','Consulta comum') as flow_type,
    coalesce(payload->>'sourceRequestId','') as source_request_id
  from public.appointments
),
ranked as (
  select
    sch.id as scheduled_id,
    acc.id as accepted_id,
    row_number() over (
      partition by sch.id
      order by acc.updated_at desc, acc.created_at desc
    ) as rn
  from base sch
  join base acc
    on acc.id <> sch.id
   and acc.status = 'Aceita'
   and acc.flow_type <> 'Exames'
   and sch.status in ('Agendada','Confirmada','Reagendamento aceito','Em atendimento','Realizada','Concluída','Adiada','Atrasada','Não compareceu','Cancelada')
   and sch.created_at >= acc.created_at
   and trim(sch.passport) = trim(acc.passport)
   and lower(trim(sch.specialty)) = lower(trim(acc.specialty))
   and (
      (acc.doctor_id <> '' and sch.doctor_id = acc.doctor_id)
      or
      (acc.doctor_id = '' and acc.doctor_name <> '' and lower(trim(sch.doctor_name)) = lower(trim(acc.doctor_name)))
   )
  where sch.source_request_id = ''
),
matches as (
  select scheduled_id, accepted_id
  from ranked
  where rn = 1
),
updated_schedule as (
  update public.appointments sch
     set payload = coalesce(sch.payload,'{}'::jsonb)
                   || jsonb_build_object(
                        'sourceRequestId', m.accepted_id,
                        'legacyRequestSynchronized', true,
                        'legacyRequestSynchronizedAt', now()
                      ),
         updated_at = now()
    from matches m
   where sch.id = m.scheduled_id
  returning sch.id
)
update public.appointments acc
   set payload = coalesce(acc.payload,'{}'::jsonb)
                 || jsonb_build_object(
                      'syncedScheduleId', m.scheduled_id,
                      'legacyScheduleSynchronized', true,
                      'legacyScheduleSynchronizedAt', now()
                    ),
       updated_at = now()
  from matches m
 where acc.id = m.accepted_id;
