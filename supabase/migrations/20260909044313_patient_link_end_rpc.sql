-- v1.0.344 — Encerramento atômico: histórico + remoção do vínculo ativo.
create or replace function public.hpsr_end_patient_doctor_link(p_link_id uuid, p_end_reason text)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_link public.patient_doctor_links%rowtype;
  v_history_id uuid;
  v_ended_at timestamptz := now();
  v_future_slots integer := 0;
  v_active_followups integer := 0;
  v_reason text := btrim(coalesce(p_end_reason, ''));
begin
  if v_user_id is null then return jsonb_build_object('ok', false, 'code', 'UNAUTHENTICATED', 'error', 'Sessão inválida.'); end if;
  select * into v_profile from public.profiles where id = v_user_id limit 1;
  if not found or coalesce(v_profile.access_status, 'Aprovado') <> 'Aprovado' then return jsonb_build_object('ok', false, 'code', 'INVALID_PROFILE', 'error', 'Perfil profissional inválido.'); end if;
  if v_reason not in ('Acompanhamento concluído','Desistência do paciente','Mudança de médico','Impossibilidade de continuidade') then return jsonb_build_object('ok', false, 'code', 'INVALID_REASON', 'error', 'Selecione um motivo válido para o encerramento.'); end if;
  select * into v_link from public.patient_doctor_links where id = p_link_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'error', 'Vínculo não encontrado.'); end if;
  if v_link.doctor_id <> v_user_id and coalesce(v_profile.role, '') not in ('Diretor Técnico / Dev','Diretora','Vice Diretor') then return jsonb_build_object('ok', false, 'code', 'FORBIDDEN', 'error', 'Você não possui permissão para encerrar este vínculo.'); end if;

  select count(*) into v_future_slots from public.clinical_appointment_slots s
   where public.hpsr_normalize_passport(s.patient_passport)=public.hpsr_normalize_passport(v_link.patient_passport)
     and s.doctor_id=v_link.doctor_id
     and public.hpsr_normalize_specialty(s.specialty)=public.hpsr_normalize_specialty(v_link.specialty)
     and s.starts_at>v_ended_at and s.status='Ocupado';
  select count(*) into v_active_followups from public.clinical_followup_plans f
   where public.hpsr_normalize_passport(f.patient_passport)=public.hpsr_normalize_passport(v_link.patient_passport)
     and f.doctor_id=v_link.doctor_id
     and public.hpsr_normalize_specialty(f.specialty)=public.hpsr_normalize_specialty(v_link.specialty)
     and coalesce(f.status,'Ativo') not in ('Arquivado','Concluído','Concluída','Cancelado','Cancelada');

  insert into public.patient_doctor_link_history(patient_passport,doctor_id,specialty,started_at,ended_at,end_reason)
  values(v_link.patient_passport,v_link.doctor_id,v_link.specialty,v_link.started_at,v_ended_at,v_reason)
  returning id into v_history_id;
  delete from public.patient_doctor_links where id=v_link.id;
  return jsonb_build_object('ok',true,'historyId',v_history_id,'endedAt',v_ended_at,'futureAppointments',v_future_slots,'activeFollowups',v_active_followups,'commitmentsPreserved',true);
end;
$function$;
revoke all on function public.hpsr_end_patient_doctor_link(uuid,text) from public, anon;
grant execute on function public.hpsr_end_patient_doctor_link(uuid,text) to authenticated;
