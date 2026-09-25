-- Unifica a elegibilidade da fila clínica de solicitações.
-- A fila pessoal deixa de herdar exceções administrativas de especialidade:
-- diretoria mantém seus poderes administrativos, mas recebe na caixa clínica
-- apenas solicitações compatíveis com as especialidades configuradas no perfil.

create or replace function public.hpsr_request_is_eligible(
  p_doctor_id uuid,
  p_specialty text,
  p_flow_type text,
  p_requested_doctor_id text,
  p_declined_by jsonb,
  p_status text,
  p_apply_capacity boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_profile public.profiles%rowtype;
  v_specialty text := trim(coalesce(p_specialty, ''));
  v_flow_type text := coalesce(nullif(trim(coalesce(p_flow_type, '')), ''), 'Consulta comum');
  v_requested_doctor text := nullif(trim(coalesce(p_requested_doctor_id, '')), '');
  v_declined jsonb := case when jsonb_typeof(coalesce(p_declined_by, '[]'::jsonb)) = 'array' then coalesce(p_declined_by, '[]'::jsonb) else '[]'::jsonb end;
  v_has_specialty boolean := false;
begin
  if p_doctor_id is null or v_specialty = '' then
    return false;
  end if;

  if coalesce(p_status, '') not in ('Solicitação enviada', 'Aguardando análise', 'Acompanhamento aguardando confirmação') then
    return false;
  end if;

  select p.*
    into v_profile
    from public.profiles p
   where p.id = p_doctor_id
     and coalesce(p.access_status, '') = 'Aprovado';

  if not found then
    return false;
  end if;

  if v_requested_doctor is not null and v_requested_doctor <> p_doctor_id::text then
    return false;
  end if;

  if exists (
    select 1
      from jsonb_array_elements_text(v_declined) item(value)
     where item.value = p_doctor_id::text
  ) then
    return false;
  end if;

  select exists (
    select 1
      from regexp_split_to_table(coalesce(v_profile.specialty, ''), '[,;/|]+') token
     where public.hpsr_normalize_specialty(token) = public.hpsr_normalize_specialty(v_specialty)
       and public.hpsr_normalize_specialty(token) <> ''
  ) into v_has_specialty;

  -- Médico Clínico continua podendo receber exame de qualquer especialidade.
  -- Todos os demais profissionais, inclusive cargos diretivos, usam as
  -- especialidades clínicas efetivamente configuradas no perfil para a fila.
  if v_flow_type = 'Exames' then
    return v_profile.role = 'Médico Clínico' or v_has_specialty;
  end if;

  if not v_has_specialty then
    return false;
  end if;

  if p_apply_capacity and coalesce((public.hpsr_clinical_capacity(p_doctor_id, v_specialty)->>'available')::integer, 0) <= 0 then
    return false;
  end if;

  return true;
end;
$function$;

revoke all on function public.hpsr_request_is_eligible(uuid, text, text, text, jsonb, text, boolean) from public, anon, authenticated;
grant execute on function public.hpsr_request_is_eligible(uuid, text, text, text, jsonb, text, boolean) to service_role;

create or replace function public.hpsr_my_clinical_request_inbox(p_limit integer default 120)
returns table (
  id text,
  passport text,
  patient text,
  status text,
  payload jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $function$
  select
    a.id,
    a.passport,
    a.patient,
    a.status,
    a.payload,
    a.created_at,
    a.updated_at
  from public.appointments a
  where a.status in ('Solicitação enviada', 'Aguardando análise', 'Acompanhamento aguardando confirmação')
    and public.hpsr_request_is_eligible(
      (select auth.uid()),
      a.payload->>'specialty',
      coalesce(a.payload->>'flowType', 'Consulta comum'),
      a.payload->>'requestedDoctorId',
      coalesce(a.payload->'declinedBy', '[]'::jsonb),
      a.status,
      true
    )
  order by a.created_at desc, a.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 120), 200));
$function$;

revoke all on function public.hpsr_my_clinical_request_inbox(integer) from public, anon;
grant execute on function public.hpsr_my_clinical_request_inbox(integer) to authenticated, service_role;

create or replace function public.hpsr_claim_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_row public.appointments%rowtype;
  v_specialty text;
  v_capacity jsonb;
  v_now timestamptz := now();
  v_declined jsonb := '[]'::jsonb;
  v_flow_type text;
  v_plan_id uuid;
  v_requested_doctor text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão médica inválida.');
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  if not found or coalesce(v_profile.access_status, '') <> 'Aprovado' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Perfil profissional inválido.');
  end if;

  select * into v_row from public.appointments where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Solicitação não encontrada.');
  end if;

  v_specialty := trim(coalesce(v_row.payload->>'specialty', ''));
  v_flow_type := coalesce(nullif(trim(v_row.payload->>'flowType'), ''), 'Consulta comum');
  v_requested_doctor := nullif(trim(coalesce(v_row.payload->>'requestedDoctorId', '')), '');
  v_declined := coalesce(v_row.payload->'declinedBy', '[]'::jsonb);

  if not public.hpsr_request_is_eligible(
    v_user_id,
    v_specialty,
    v_flow_type,
    v_requested_doctor,
    v_declined,
    v_row.status,
    true
  ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Esta solicitação não está disponível para o seu perfil, especialidade ou capacidade atual.');
  end if;

  if v_flow_type <> 'Exames' then
    v_capacity := public.hpsr_clinical_capacity(v_user_id, v_specialty);
  end if;

  if v_flow_type in ('Acompanhamento', 'Acompanhamento com especialista') then
    select f.id into v_plan_id
      from public.clinical_followup_plans f
     where f.doctor_id = v_user_id
       and upper(trim(f.patient_passport)) = upper(trim(v_row.passport))
       and public.hpsr_normalize_specialty(f.specialty) = public.hpsr_normalize_specialty(v_specialty)
       and f.status in ('Ativo', 'Em andamento', 'Pendente de planejamento')
     order by f.created_at desc
     limit 1;

    if v_plan_id is null then
      insert into public.clinical_followup_plans(
        doctor_id, doctor_name, patient_passport, patient_name, specialty,
        frequency, interval_days, start_date, end_date, total_consultations,
        total_weeks, status, updated_at
      ) values (
        v_user_id, coalesce(v_profile.name, 'Médico'), upper(trim(v_row.passport)),
        coalesce(v_row.patient, v_row.payload->>'patient', 'Não informado'), v_specialty,
        'Semanal', 7, current_date, null, null, null, 'Pendente de planejamento', v_now
      ) returning id into v_plan_id;
    end if;
  end if;

  update public.appointments
     set status = 'Aceita',
         payload = coalesce(v_row.payload, '{}'::jsonb) || jsonb_build_object(
           'doctorId', v_user_id::text,
           'physician', v_profile.name,
           'doctor', v_profile.name,
           'acceptedById', v_user_id::text,
           'acceptedByName', v_profile.name,
           'acceptedAt', v_now,
           'doctorNotificationUnread', false,
           'updatedAt', v_now,
           'followupPlanId', case when v_plan_id is not null then v_plan_id::text else coalesce(v_row.payload->>'followupPlanId', '') end,
           'answer', case
             when v_flow_type = 'Exames' then 'Solicitação de exame aceita. O médico responsável entrará em contato diretamente.'
             when v_flow_type in ('Acompanhamento', 'Acompanhamento com especialista') then 'Solicitação aceita. O médico responsável entrará em contato para organizar a continuidade do atendimento.'
             else 'Solicitação aceita. O médico responsável entrará em contato para combinar o atendimento.'
           end
         ),
         updated_at = v_now
   where id = p_request_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'Aceita',
    'doctorId', v_user_id,
    'doctorName', v_profile.name,
    'flowType', v_flow_type,
    'followupPlanId', v_plan_id,
    'capacityApplied', v_flow_type <> 'Exames',
    'capacity', case when v_flow_type = 'Exames' then null else v_capacity end
  );
end;
$function$;

revoke all on function public.hpsr_claim_clinical_request(text) from public, anon;
grant execute on function public.hpsr_claim_clinical_request(text) to authenticated;

create or replace function public.hpsr_decline_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_row public.appointments%rowtype;
  v_specialty text;
  v_flow_type text;
  v_requested_doctor text;
  v_declined jsonb := '[]'::jsonb;
  v_remaining integer := 0;
  v_now timestamptz := now();
  v_answer text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão médica inválida.');
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  if not found or coalesce(v_profile.access_status, '') <> 'Aprovado' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Perfil profissional inválido.');
  end if;

  select * into v_row from public.appointments where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Solicitação não encontrada.');
  end if;

  v_specialty := trim(coalesce(v_row.payload->>'specialty', ''));
  v_flow_type := coalesce(nullif(trim(v_row.payload->>'flowType'), ''), 'Consulta comum');
  v_requested_doctor := nullif(trim(coalesce(v_row.payload->>'requestedDoctorId', '')), '');
  v_declined := coalesce(v_row.payload->'declinedBy', '[]'::jsonb);

  if not public.hpsr_request_is_eligible(
    v_user_id,
    v_specialty,
    v_flow_type,
    v_requested_doctor,
    v_declined,
    v_row.status,
    true
  ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Esta solicitação não está disponível para o seu perfil, especialidade ou capacidade atual.');
  end if;

  select coalesce(jsonb_agg(distinct value), '[]'::jsonb)
    into v_declined
    from (
      select value from jsonb_array_elements_text(case when jsonb_typeof(v_declined) = 'array' then v_declined else '[]'::jsonb end)
      union all select v_user_id::text
    ) d(value);

  select count(*)::integer
    into v_remaining
    from public.profiles p
   where public.hpsr_request_is_eligible(
     p.id,
     v_specialty,
     v_flow_type,
     v_requested_doctor,
     v_declined,
     v_row.status,
     true
   );

  if v_remaining = 0 then
    v_answer := case
      when v_requested_doctor is not null then
        'O médico solicitado não poderá assumir esta solicitação no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
      when v_flow_type = 'Exames' then
        'Nenhum profissional elegível aceitou esta solicitação de exame no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
      else
        'Nenhum profissional elegível com vaga aceitou esta solicitação no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
    end;

    update public.appointments
       set status = 'Recusada',
           payload = coalesce(v_row.payload, '{}'::jsonb) || jsonb_build_object(
             'declinedBy', v_declined,
             'answer', v_answer,
             'doctorNotificationUnread', false,
             'updatedAt', v_now
           ),
           updated_at = v_now
     where id = p_request_id;

    return jsonb_build_object('ok', true, 'status', 'Recusada', 'closed', true, 'flowType', v_flow_type, 'remainingCandidates', 0);
  end if;

  update public.appointments
     set payload = coalesce(v_row.payload, '{}'::jsonb) || jsonb_build_object(
       'declinedBy', v_declined,
       'updatedAt', v_now
     ),
         updated_at = v_now
   where id = p_request_id;

  return jsonb_build_object('ok', true, 'status', v_row.status, 'closed', false, 'flowType', v_flow_type, 'remainingCandidates', v_remaining);
end;
$function$;

revoke all on function public.hpsr_decline_clinical_request(text) from public, anon;
grant execute on function public.hpsr_decline_clinical_request(text) to authenticated;

comment on function public.hpsr_my_clinical_request_inbox(integer) is
  'Fonte única da fila clínica pessoal: especialidade real do perfil, direcionamento, recusas e capacidade de consulta. Exames permanecem fora da capacidade; Médico Clínico pode receber exames de qualquer especialidade.';
