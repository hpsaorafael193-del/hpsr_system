-- HPSR v1.1.16-test.73
-- 1) Fecha o acesso anônimo direto à tabela de agendamentos. O Portal usa rotas server-side com service_role.
-- 2) Reconcilia IDs estáveis de médicos em agendamentos legados.
-- 3) Ao encerrar vínculo por "Falta de resposta", encerra compromissos ativos e mantém somente histórico.

-- Segurança: não há mais gravação/leitura direta anônima de appointments.
drop policy if exists "public appointment insert" on public.appointments;
revoke all on table public.appointments from anon;

-- Identidade estável: se já existe acceptedById válido, usa-o como doctorId.
update public.appointments a
   set payload = jsonb_set(coalesce(a.payload, '{}'::jsonb), '{doctorId}', to_jsonb(a.payload->>'acceptedById'), true)
 where coalesce(a.payload->>'doctorId', a.payload->>'doctor_id', '') = ''
   and coalesce(a.payload->>'acceptedById', '') <> ''
   and exists (
     select 1 from public.profiles p
      where p.id::text = a.payload->>'acceptedById'
   );

-- Reconcilia registros legados cujo nome ainda coincide com o perfil atual.
update public.appointments a
   set payload = jsonb_set(coalesce(a.payload, '{}'::jsonb), '{doctorId}', to_jsonb(p.id::text), true)
  from public.profiles p
 where coalesce(a.payload->>'doctorId', a.payload->>'doctor_id', '') = ''
   and lower(btrim(coalesce(a.payload->>'physician', a.payload->>'doctor', a.payload->>'acceptedByName', ''))) = lower(btrim(p.name));

-- Alias histórico confirmado do mesmo perfil médico após mudança de sobrenome.
update public.appointments a
   set payload = jsonb_set(coalesce(a.payload, '{}'::jsonb), '{doctorId}', to_jsonb(p.id::text), true)
  from public.profiles p
 where coalesce(a.payload->>'doctorId', a.payload->>'doctor_id', '') = ''
   and lower(btrim(coalesce(a.payload->>'physician', a.payload->>'doctor', a.payload->>'acceptedByName', ''))) = lower('Luidhy Luddhiev')
   and p.name = 'Luidhy D''Amato';

-- Nomes derivados de disponibilidade sempre seguem o nome atual do perfil; o ID é a identidade real.
update public.clinical_availability_series s
   set doctor_name = p.name,
       updated_at = now()
  from public.profiles p
 where p.id = s.doctor_id
   and coalesce(s.doctor_name, '') is distinct from coalesce(p.name, '');

update public.clinical_appointment_slots s
   set doctor_name = p.name,
       updated_at = now()
  from public.profiles p
 where p.id = s.doctor_id
   and coalesce(s.doctor_name, '') is distinct from coalesce(p.name, '');

create or replace function public.hpsr_end_patient_doctor_link(p_link_id uuid, p_end_reason text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_link public.patient_doctor_links%rowtype;
  v_history_id uuid;
  v_ended_at timestamptz := now();
  v_future_slots integer := 0;
  v_active_followups integer := 0;
  v_cancelled_appointments integer := 0;
  v_archived_followups integer := 0;
  v_cancelled_occurrences integer := 0;
  v_reason text := btrim(coalesce(p_end_reason, ''));
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão inválida.');
  end if;

  select * into v_profile from public.profiles where id = v_user_id limit 1;
  if not found or coalesce(v_profile.access_status, 'Aprovado') <> 'Aprovado' then
    return jsonb_build_object('ok', false, 'code', 'INVALID_PROFILE', 'error', 'Perfil profissional inválido.');
  end if;

  if v_reason not in ('Acompanhamento concluído','Desistência do paciente','Falta de resposta','Mudança de médico','Impossibilidade de continuidade') then
    return jsonb_build_object('ok', false, 'code', 'INVALID_REASON', 'error', 'Selecione um motivo válido para o encerramento.');
  end if;

  select * into v_link from public.patient_doctor_links where id = p_link_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Vínculo não encontrado.');
  end if;

  if v_link.doctor_id <> v_user_id and coalesce(v_profile.role, '') not in ('Vice Diretor / Dev','Diretora','Vice Diretor') then
    return jsonb_build_object('ok', false, 'code', 'FORBIDDEN', 'error', 'Você não possui permissão para encerrar este vínculo.');
  end if;

  select count(*) into v_future_slots
    from public.clinical_appointment_slots s
   where public.hpsr_normalize_passport(s.patient_passport) = public.hpsr_normalize_passport(v_link.patient_passport)
     and s.doctor_id = v_link.doctor_id
     and public.hpsr_normalize_specialty(s.specialty) = public.hpsr_normalize_specialty(v_link.specialty)
     and s.starts_at > v_ended_at
     and s.status = 'Ocupado';

  select count(*) into v_active_followups
    from public.clinical_followup_plans f
   where public.hpsr_normalize_passport(f.patient_passport) = public.hpsr_normalize_passport(v_link.patient_passport)
     and f.doctor_id = v_link.doctor_id
     and public.hpsr_normalize_specialty(f.specialty) = public.hpsr_normalize_specialty(v_link.specialty)
     and coalesce(f.status, 'Ativo') not in ('Arquivado','Concluído','Concluída','Cancelado','Cancelada');

  if v_reason = 'Falta de resposta' then
    -- Encerra qualquer solicitação/consulta ainda ativa daquele vínculo. O trigger de appointments
    -- libera slots futuros ocupados ou encerra os que já não podem voltar à disponibilidade.
    update public.appointments a
       set status = 'Cancelada',
           payload = coalesce(a.payload, '{}'::jsonb) || jsonb_build_object(
             'appointmentManagementStatus', 'Sem resposta',
             'appointmentManagementNote', 'Encerrado automaticamente com o vínculo por falta de resposta.',
             'cancellationReason', 'Falta de resposta',
             'cancelledAt', v_ended_at,
             'cancelledById', v_user_id::text,
             'cancelledByName', coalesce(v_profile.name, 'Equipe médica'),
             'updatedAt', v_ended_at
           ),
           updated_at = v_ended_at
     where public.hpsr_normalize_passport(a.passport) = public.hpsr_normalize_passport(v_link.patient_passport)
       and public.hpsr_normalize_specialty(a.payload->>'specialty') = public.hpsr_normalize_specialty(v_link.specialty)
       and coalesce(a.payload->>'doctorId', a.payload->>'doctor_id', a.payload->>'acceptedById', '') = v_link.doctor_id::text
       and coalesce(a.status, '') not in ('Realizada','Concluída','Concluído','Não compareceu','Cancelada','Recusada','Recusado','Arquivado','Encerrado');
    get diagnostics v_cancelled_appointments = row_count;

    -- Mantém o conteúdo clínico para histórico, mas retira o acompanhamento do estado ativo.
    update public.clinical_followup_occurrences o
       set status = 'Cancelado', updated_at = v_ended_at
     where o.plan_id in (
       select f.id
         from public.clinical_followup_plans f
        where public.hpsr_normalize_passport(f.patient_passport) = public.hpsr_normalize_passport(v_link.patient_passport)
          and f.doctor_id = v_link.doctor_id
          and public.hpsr_normalize_specialty(f.specialty) = public.hpsr_normalize_specialty(v_link.specialty)
          and coalesce(f.status, 'Ativo') not in ('Arquivado','Concluído','Concluída','Cancelado','Cancelada')
     )
       and coalesce(o.status, '') not in ('Realizada','Concluída','Concluído','Cancelado','Cancelada','Não compareceu');
    get diagnostics v_cancelled_occurrences = row_count;

    update public.clinical_followup_plans f
       set status = 'Arquivado', updated_at = v_ended_at
     where public.hpsr_normalize_passport(f.patient_passport) = public.hpsr_normalize_passport(v_link.patient_passport)
       and f.doctor_id = v_link.doctor_id
       and public.hpsr_normalize_specialty(f.specialty) = public.hpsr_normalize_specialty(v_link.specialty)
       and coalesce(f.status, 'Ativo') not in ('Arquivado','Concluído','Concluída','Cancelado','Cancelada');
    get diagnostics v_archived_followups = row_count;
  end if;

  insert into public.patient_doctor_link_history(patient_passport,doctor_id,specialty,started_at,ended_at,end_reason)
  values(v_link.patient_passport,v_link.doctor_id,v_link.specialty,v_link.started_at,v_ended_at,v_reason)
  returning id into v_history_id;

  delete from public.patient_doctor_links where id = v_link.id;

  return jsonb_build_object(
    'ok', true,
    'historyId', v_history_id,
    'endedAt', v_ended_at,
    'futureAppointments', v_future_slots,
    'activeFollowups', v_active_followups,
    'cancelledAppointments', v_cancelled_appointments,
    'archivedFollowups', v_archived_followups,
    'cancelledOccurrences', v_cancelled_occurrences,
    'commitmentsPreserved', v_reason <> 'Falta de resposta'
  );
end;
$function$;

revoke all on function public.hpsr_end_patient_doctor_link(uuid,text) from public, anon;
grant execute on function public.hpsr_end_patient_doctor_link(uuid,text) to authenticated;
