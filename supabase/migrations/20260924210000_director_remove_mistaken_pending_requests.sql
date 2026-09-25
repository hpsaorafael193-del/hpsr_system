-- A exclusão de solicitações pendentes é lógica: retira o pedido das filas
-- e preserva o histórico de auditoria, sem apagar consultas/registro clínico.
-- A migration da v1.0.393 com este nome não foi aplicada no banco.
create or replace function public.hpsr_delete_mistaken_clinical_request(p_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor public.profiles%rowtype;
  v_request public.appointments%rowtype;
  v_now timestamptz := now();
begin
  if v_actor_id is null then
    return jsonb_build_object('ok', false, 'error', 'Sessão não encontrada.');
  end if;

  select * into v_actor
  from public.profiles
  where id = v_actor_id
    and access_status = 'Aprovado'
    and role in ('Diretora', 'Vice Diretor', 'Vice Diretor / Dev');

  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'Somente a Direção pode excluir solicitações pendentes.');
  end if;

  if nullif(pg_catalog.btrim(coalesce(p_request_id, '')), '') is null then
    return jsonb_build_object('ok', false, 'error', 'Solicitação não informada.');
  end if;

  select * into v_request
  from public.appointments
  where id = p_request_id
  for update;

  if v_request.id is null then
    return jsonb_build_object('ok', false, 'error', 'Solicitação não encontrada. Atualize a lista.');
  end if;

  if v_request.status not in ('Solicitação enviada', 'Aguardando análise', 'Acompanhamento aguardando confirmação')
     or coalesce(nullif(pg_catalog.btrim(v_request.payload->>'source'), ''), 'patient_portal') <> 'patient_portal'
  then
    return jsonb_build_object('ok', false, 'error', 'Somente solicitações pendentes enviadas pelo paciente podem ser excluídas aqui.');
  end if;

  if nullif(pg_catalog.btrim(coalesce(v_request.payload->>'acceptedAt', '')), '') is not null
     or nullif(pg_catalog.btrim(coalesce(v_request.payload->>'acceptedById', '')), '') is not null
     or nullif(pg_catalog.btrim(coalesce(v_request.payload->>'syncedScheduleId', '')), '') is not null
     or nullif(pg_catalog.btrim(coalesce(v_request.payload->>'sourceRequestId', '')), '') is not null
     or nullif(pg_catalog.btrim(coalesce(v_request.payload->>'slotId', '')), '') is not null
     or nullif(pg_catalog.btrim(coalesce(v_request.payload->>'followupPlanId', '')), '') is not null
  then
    return jsonb_build_object('ok', false, 'error', 'A solicitação possui vínculo de atendimento e não pode ser excluída nesta ação.');
  end if;

  if exists (select 1 from public.clinical_appointment_slots s where s.appointment_id = v_request.id)
     or exists (select 1 from public.clinical_followup_occurrences f where f.appointment_id = v_request.id)
     or exists (select 1 from public.clinical_records r where r.payload->>'appointmentId' = v_request.id)
     or exists (select 1 from public.appointments a where a.id <> v_request.id and
       (a.payload->>'sourceRequestId' = v_request.id or a.payload->>'syncedScheduleId' = v_request.id))
  then
    return jsonb_build_object('ok', false, 'error', 'Há consulta ou registro vinculado a esta solicitação. A exclusão foi bloqueada.');
  end if;

  -- Arquivamento: status final reconhecido pela regra de vaga ativa.
  -- A solicitação some imediatamente das filas pendentes e a operação mantém rastreabilidade.
  update public.appointments
  set status = 'Arquivado',
      payload = v_request.payload || pg_catalog.jsonb_build_object(
        'status', 'Arquivado',
        'answer', 'Solicitação removida pela Direção por envio equivocado.',
        'archivedByDirection', true,
        'archivedById', v_actor_id::text,
        'archivedAt', v_now
      ),
      updated_at = v_now
  where id = v_request.id
    and status in ('Solicitação enviada', 'Aguardando análise', 'Acompanhamento aguardando confirmação');

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Solicitação já foi atualizada. Atualize a lista.');
  end if;

  insert into public.system_activities(module, action, description, actor, reference)
  values (
    'Agendamentos',
    'Exclusão de solicitação pendente',
    pg_catalog.format(
      'Solicitação enviada por engano arquivada pela Direção. Tipo: %s. Especialidade: %s. Status anterior: %s.',
      coalesce(v_request.payload->>'flowType', 'Consulta'),
      coalesce(v_request.payload->>'specialty', 'Não informada'),
      v_request.status
    ),
    coalesce(v_actor.name, v_actor_id::text),
    v_request.id
  );

  return jsonb_build_object('ok', true, 'removed', true);
end;
$function$;

revoke all on function public.hpsr_delete_mistaken_clinical_request(text) from public, anon, authenticated;
grant execute on function public.hpsr_delete_mistaken_clinical_request(text) to authenticated;
comment on function public.hpsr_delete_mistaken_clinical_request(text) is
  'Direção: exclusão lógica auditada de solicitações pendentes do portal enviadas por engano. Não afeta consultas confirmadas nem registros clínicos.';

notify pgrst, 'reload schema';
