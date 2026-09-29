-- v1.0.425: a Direção pode assumir pedidos de outras especialidades.
-- Exceção restrita ao aceite: mantém regras anteriores de recusas, pedidos
-- direcionados, concorrência, capacidade e ausência de alteração no perfil.
begin;

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
  v_is_director boolean := false;
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

  v_is_director := coalesce(v_profile.role, '') in ('Diretora', 'Vice Diretor', 'Vice Diretor / Dev');

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

  -- A Direção pode aceitar solicitações de outras especialidades sem
  -- acrescentar essas especialidades ao seu perfil. Não contorna direcionamento,
  -- recusas anteriores, situação da solicitação nem capacidade clínica.
  -- Médico Clínico continua podendo receber exames de qualquer especialidade.
  if v_flow_type = 'Exames' then
    return v_is_director or v_profile.role = 'Médico Clínico' or v_has_specialty;
  end if;

  if not v_is_director and not v_has_specialty then
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

  -- A ampliação de aceite pela Direção não modifica a permissão de recusa.
  -- Pedidos de outras especialidades continuam fora da ação de recusar.
  if coalesce(v_profile.role, '') in ('Diretora', 'Vice Diretor', 'Vice Diretor / Dev')
     and not exists (
       select 1
       from regexp_split_to_table(coalesce(v_profile.specialty, ''), '[,;/|]+') token
       where public.hpsr_normalize_specialty(token) = public.hpsr_normalize_specialty(v_specialty)
         and public.hpsr_normalize_specialty(token) <> ''
     ) then
    return jsonb_build_object('ok', false, 'code', 'NOT_ELIGIBLE',
      'error', 'A recusa de solicitações de outras especialidades não está autorizada para este perfil.');
  end if;

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

comment on function public.hpsr_request_is_eligible(uuid, text, text, text, jsonb, text, boolean) is
  'Elegibilidade para aceite: Diretora e Vice Diretores podem assumir qualquer especialidade com vaga; mantém direcionamento e recusas anteriores. Demais médicos seguem suas especialidades.';
comment on function public.hpsr_my_clinical_request_inbox(integer) is
  'Fila clínica pessoal: a Direção pode assumir solicitações de outras especialidades quando elegível; demais médicos seguem perfil, direcionamento e capacidade.';
comment on function public.hpsr_my_clinical_request_board(integer) is
  'Central de Agendamentos: Diretora e Vice Diretores veem todas as especialidades e podem aceitar solicitações elegíveis; próprias especialidades aparecem primeiro.';

commit;
notify pgrst, 'reload schema';
