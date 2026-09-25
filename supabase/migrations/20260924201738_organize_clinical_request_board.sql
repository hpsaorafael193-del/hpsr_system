-- Fila de leitura da Central de Agendamentos, independente da fila de aceite.
-- Apenas profissionais com perfil aprovado recebem os dados.
-- Médicos veem a própria especialidade; Diretora e Vice Diretores podem
-- acompanhar as demais, mas as permissões clínicas de aceite não se ampliam.
create or replace function public.hpsr_my_clinical_request_board(p_limit integer default 200)
returns table (
  id text,
  passport text,
  patient text,
  status text,
  payload jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  own_specialty boolean,
  can_claim boolean,
  availability_reason text
)
language sql
security definer
set search_path = ''
as $function$
  with actor as materialized (
    select p.id, p.role, p.specialty,
      p.role in ('Diretora', 'Vice Diretor', 'Vice Diretor / Dev') as is_director
    from public.profiles p
    where p.id = (select auth.uid())
      and p.access_status = 'Aprovado'
      and (
        p.role in ('Diretora', 'Vice Diretor', 'Vice Diretor / Dev')
        or nullif(trim(coalesce(p.specialty, '')), '') is not null
      )
  ), requests as (
    select a.id, a.passport, a.patient, a.status, a.payload, a.created_at, a.updated_at,
      actor.id as actor_id,
      actor.is_director,
      coalesce(nullif(trim(a.payload->>'specialty'), ''), '') as request_specialty,
      coalesce(nullif(trim(a.payload->>'flowType'), ''), 'Consulta comum') as request_flow,
      nullif(trim(coalesce(a.payload->>'requestedDoctorId', '')), '') as requested_doctor,
      case when jsonb_typeof(a.payload->'declinedBy') = 'array'
           then a.payload->'declinedBy' else '[]'::jsonb end as declined_by,
      exists (
        select 1
        from regexp_split_to_table(coalesce(actor.specialty, ''), '[,;/|]+') token
        where public.hpsr_normalize_specialty(token) =
              public.hpsr_normalize_specialty(coalesce(a.payload->>'specialty', ''))
          and public.hpsr_normalize_specialty(token) <> ''
      ) as is_own_specialty
    from public.appointments a
    cross join actor
    where a.status in ('Solicitação enviada', 'Aguardando análise', 'Acompanhamento aguardando confirmação')
  ), visible as (
    select r.*
    from requests r
    where r.is_director or (
      r.is_own_specialty
      and (r.requested_doctor is null or r.requested_doctor = r.actor_id::text)
    )
  ), evaluated as (
    select v.*,
      public.hpsr_request_is_eligible(
        v.actor_id,
        v.request_specialty,
        v.request_flow,
        v.requested_doctor,
        v.declined_by,
        v.status,
        true
      ) as is_claimable,
      exists (
        select 1 from jsonb_array_elements_text(v.declined_by) item(value)
        where item.value = v.actor_id::text
      ) as already_declined
    from visible v
  )
  select
    e.id, e.passport, e.patient, e.status, e.payload, e.created_at, e.updated_at,
    e.is_own_specialty as own_specialty,
    e.is_claimable as can_claim,
    case
      when e.is_claimable then null::text
      when e.request_specialty = '' then 'Especialidade não informada'
      when e.requested_doctor is not null and e.requested_doctor <> e.actor_id::text
        then 'Direcionada a outro médico'
      when e.already_declined then 'Você já recusou esta solicitação'
      when not e.is_own_specialty then 'Outra especialidade · acompanhamento da Direção'
      when e.request_flow <> 'Exames' and
        coalesce((public.hpsr_clinical_capacity(e.actor_id, e.request_specialty)->>'available')::integer, 0) <= 0
        then 'Sem vaga disponível para esta especialidade'
      else 'Não disponível para aceite no momento'
    end as availability_reason
  from evaluated e
  order by e.is_own_specialty desc, e.created_at desc, e.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 400));
$function$;

revoke all on function public.hpsr_my_clinical_request_board(integer) from public, anon;
grant execute on function public.hpsr_my_clinical_request_board(integer) to authenticated;
comment on function public.hpsr_my_clinical_request_board(integer) is
  'Quadro de agendamentos: fila de leitura por especialidade; visão geral para Diretora e Vice; aceite sempre validado por elegibilidade clínica e capacidade. Não altera a fila pessoal de aceites.';
