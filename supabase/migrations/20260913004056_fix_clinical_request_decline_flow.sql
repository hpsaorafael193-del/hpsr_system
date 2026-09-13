-- v1.0.358 — Corrige a recusa de solicitações clínicas.
-- Consultas consideram capacidade clínica; exames não consomem nem dependem dessa capacidade.
-- A elegibilidade usa a mesma regra oficial de especialidade do aceite.

create or replace function public.hpsr_decline_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
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

  select * into v_profile
    from public.profiles
   where id = v_user_id;

  if not found or coalesce(v_profile.access_status, 'Aprovado') <> 'Aprovado' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_DOCTOR', 'error', 'Perfil profissional inválido.');
  end if;

  select * into v_row
    from public.appointments
   where id = p_request_id
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Solicitação não encontrada.');
  end if;

  if v_row.status not in ('Solicitação enviada', 'Aguardando análise', 'Acompanhamento aguardando confirmação') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_RESOLVED', 'error', 'Esta solicitação já foi resolvida ou saiu da fila inicial.');
  end if;

  v_specialty := trim(coalesce(v_row.payload->>'specialty', ''));
  if v_specialty = '' or not public.hpsr_doctor_has_specialty(v_user_id, v_specialty) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE', 'error', 'Esta solicitação não pertence às especialidades permitidas para o seu cargo/perfil.');
  end if;

  v_requested_doctor := nullif(trim(coalesce(v_row.payload->>'requestedDoctorId', '')), '');
  if v_requested_doctor is not null and v_requested_doctor <> v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'REQUESTED_OTHER_DOCTOR', 'error', 'Este acompanhamento foi direcionado a outro médico.');
  end if;

  v_declined := coalesce(v_row.payload->'declinedBy', '[]'::jsonb);
  if v_declined ? v_user_id::text then
    return jsonb_build_object('ok', false, 'code', 'DECLINED', 'error', 'Você já recusou esta solicitação.');
  end if;

  select coalesce(jsonb_agg(distinct value), '[]'::jsonb)
    into v_declined
    from (
      select value
        from jsonb_array_elements_text(v_declined)
      union all
      select v_user_id::text
    ) d(value);

  v_flow_type := coalesce(nullif(trim(v_row.payload->>'flowType'), ''), 'Consulta comum');

  if v_requested_doctor is not null then
    v_remaining := 0;
  elsif v_flow_type = 'Exames' then
    select count(*)::integer
      into v_remaining
      from public.profiles p
     where coalesce(p.access_status, 'Aprovado') = 'Aprovado'
       and public.hpsr_doctor_has_specialty(p.id, v_specialty)
       and not (v_declined ? p.id::text);
  else
    select count(*)::integer
      into v_remaining
      from public.profiles p
     where coalesce(p.access_status, 'Aprovado') = 'Aprovado'
       and public.hpsr_doctor_has_specialty(p.id, v_specialty)
       and coalesce((public.hpsr_clinical_capacity(p.id, v_specialty)->>'available')::integer, 0) > 0
       and not (v_declined ? p.id::text);
  end if;

  if v_remaining = 0 then
    v_answer := case
      when v_requested_doctor is not null then
        'O médico solicitado não poderá assumir este acompanhamento no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
      when v_flow_type = 'Exames' then
        'Nenhum profissional elegível aceitou esta solicitação de exame no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
      else
        'Nenhum profissional com vaga aceitou esta solicitação no momento. Entre em contato com o Hospital São Rafael para nova orientação.'
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

    return jsonb_build_object(
      'ok', true,
      'status', 'Recusada',
      'closed', true,
      'flowType', v_flow_type,
      'remainingCandidates', 0
    );
  end if;

  update public.appointments
     set payload = coalesce(v_row.payload, '{}'::jsonb) || jsonb_build_object(
       'declinedBy', v_declined,
       'updatedAt', v_now
     ),
         updated_at = v_now
   where id = p_request_id;

  return jsonb_build_object(
    'ok', true,
    'status', v_row.status,
    'closed', false,
    'flowType', v_flow_type,
    'remainingCandidates', v_remaining
  );
end;
$function$;

revoke all on function public.hpsr_decline_clinical_request(text) from public, anon;
grant execute on function public.hpsr_decline_clinical_request(text) to authenticated;
