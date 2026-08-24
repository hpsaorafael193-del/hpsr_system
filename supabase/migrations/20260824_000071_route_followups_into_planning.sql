-- v1.0.297: acompanhamento solicitado no Portal passa ao planejamento real após aceite.
-- Reutiliza clinical_followup_plans/occurrences; não cria datas automaticamente.

create or replace function public.hpsr_clinical_capacity(p_doctor_id uuid, p_specialty text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_specialty text := trim(coalesce(p_specialty, ''));
  v_config jsonb := '{}'::jsonb;
  v_limit integer := 5;
  v_appointments integer := 0;
  v_followups integer := 0;
  v_used integer := 0;
  v_doctor_name text := '';
begin
  if p_doctor_id is null or v_specialty = '' then
    return jsonb_build_object('limit', 0, 'used', 0, 'available', 0, 'full', true);
  end if;

  select coalesce(p.specialty_capacity, '{}'::jsonb), coalesce(p.name, '')
    into v_config, v_doctor_name
    from public.profiles p
   where p.id = p_doctor_id
     and coalesce(p.access_status, 'Aprovado') = 'Aprovado';

  if not found then
    return jsonb_build_object('limit', 0, 'used', 0, 'available', 0, 'full', true);
  end if;

  if v_config ? v_specialty then
    begin
      v_limit := greatest(0, least(99, (v_config ->> v_specialty)::integer));
    exception when others then
      v_limit := 5;
    end;
  end if;

  select count(*)::integer into v_appointments
    from public.appointments a
   where trim(coalesce(a.payload->>'specialty', '')) = v_specialty
     and coalesce(a.payload->>'flowType', 'Consulta comum') <> 'Exames'
     and nullif(trim(coalesce(a.payload->>'followupPlanId', '')), '') is null
     and a.status in ('Aceita','Agendada','Confirmada','Reagendamento aceito','Em atendimento','Adiada','Atrasada')
     and (
       nullif(trim(coalesce(a.payload->>'doctorId','')), '') = p_doctor_id::text
       or nullif(trim(coalesce(a.payload->>'acceptedById','')), '') = p_doctor_id::text
       or (v_doctor_name <> '' and lower(trim(coalesce(a.payload->>'physician', a.payload->>'doctor', ''))) = lower(trim(v_doctor_name)))
     );

  select count(*)::integer into v_followups
    from public.clinical_followup_plans f
   where f.doctor_id = p_doctor_id
     and trim(coalesce(f.specialty, '')) = v_specialty
     and f.status in ('Ativo','Em andamento','Pendente de planejamento');

  v_used := coalesce(v_appointments, 0) + coalesce(v_followups, 0);
  return jsonb_build_object(
    'limit', v_limit,
    'used', v_used,
    'available', greatest(v_limit - v_used, 0),
    'full', v_used >= v_limit
  );
end;
$$;

create or replace function public.hpsr_claim_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
  if not found or coalesce(v_profile.access_status, 'Aprovado') <> 'Aprovado' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Perfil profissional inválido.');
  end if;

  select * into v_row from public.appointments where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Solicitação não encontrada.');
  end if;

  if v_row.status not in ('Solicitação enviada','Aguardando análise','Acompanhamento aguardando confirmação') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_CLAIMED', 'error', 'Esta solicitação já foi assumida por outro profissional.');
  end if;

  v_specialty := trim(coalesce(v_row.payload->>'specialty',''));
  if v_specialty = '' or not exists (
    select 1 from regexp_split_to_table(coalesce(v_profile.specialty,''), '[,;/|]+') token
    where lower(trim(token)) = lower(v_specialty)
  ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Esta solicitação não pertence às suas especialidades.');
  end if;

  v_requested_doctor := nullif(trim(coalesce(v_row.payload->>'requestedDoctorId','')), '');
  if v_requested_doctor is not null and v_requested_doctor <> v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'REQUESTED_OTHER_DOCTOR', 'error', 'Este acompanhamento foi direcionado a outro médico.');
  end if;

  v_declined := coalesce(v_row.payload->'declinedBy', '[]'::jsonb);
  if v_declined ? v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'DECLINED', 'error', 'Você já recusou esta solicitação.');
  end if;

  v_capacity := public.hpsr_clinical_capacity(v_user_id, v_specialty);
  if coalesce((v_capacity->>'available')::integer,0) <= 0 then
    return jsonb_build_object('ok', false, 'code', 'NO_CAPACITY', 'error', 'Você está sem vagas no momento para esta especialidade.');
  end if;

  v_flow_type := coalesce(v_row.payload->>'flowType', 'Consulta comum');

  if v_flow_type in ('Acompanhamento','Acompanhamento com especialista') then
    select f.id into v_plan_id
      from public.clinical_followup_plans f
     where f.doctor_id = v_user_id
       and upper(trim(f.patient_passport)) = upper(trim(v_row.passport))
       and lower(trim(f.specialty)) = lower(v_specialty)
       and f.status in ('Ativo','Em andamento','Pendente de planejamento')
     order by f.created_at desc
     limit 1;

    if v_plan_id is null then
      insert into public.clinical_followup_plans(
        doctor_id, doctor_name, patient_passport, patient_name, specialty,
        frequency, interval_days, start_date, end_date, total_consultations,
        total_weeks, status, updated_at
      ) values (
        v_user_id, coalesce(v_profile.name,'Médico'), upper(trim(v_row.passport)),
        coalesce(v_row.patient, v_row.payload->>'patient', 'Não informado'), v_specialty,
        'Semanal', 7, current_date, null, null, null, 'Pendente de planejamento', v_now
      ) returning id into v_plan_id;
    end if;
  end if;

  update public.appointments
     set status = 'Aceita',
         payload = coalesce(v_row.payload,'{}'::jsonb) || jsonb_build_object(
           'doctorId', v_user_id::text,
           'physician', v_profile.name,
           'doctor', v_profile.name,
           'acceptedById', v_user_id::text,
           'acceptedByName', v_profile.name,
           'acceptedAt', v_now,
           'doctorNotificationUnread', false,
           'updatedAt', v_now,
           'followupPlanId', case when v_plan_id is not null then v_plan_id::text else coalesce(v_row.payload->>'followupPlanId','') end,
           'answer', case
             when v_flow_type = 'Exames' then 'Solicitação de exame aceita. O médico responsável entrará em contato diretamente.'
             when v_flow_type in ('Acompanhamento','Acompanhamento com especialista') then 'Solicitação de acompanhamento aceita. O acompanhamento foi vinculado ao médico responsável e o planejamento será organizado pela equipe médica.'
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
    'capacity', public.hpsr_clinical_capacity(v_user_id, v_specialty)
  );
end;
$$;

revoke all on function public.hpsr_claim_clinical_request(text) from public, anon;
grant execute on function public.hpsr_claim_clinical_request(text) to authenticated;
revoke all on function public.hpsr_clinical_capacity(uuid,text) from public, anon, authenticated;
grant execute on function public.hpsr_clinical_capacity(uuid,text) to service_role;
