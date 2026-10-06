-- HPSR v1.1.16-test.30
-- Documentos estruturados + snapshots de publicação + operações administrativas do Interno.
-- Reutiliza clinical_records e system_activities; nenhuma nova tabela é criada.

create or replace function public.set_clinical_record_confidentiality(target_record_id text, confidential boolean)
returns public.clinical_records
language plpgsql
security definer
set search_path to ''
as $$
declare
  changed_record public.clinical_records;
  activity_id text;
  actor_profile public.profiles%rowtype;
  actor_is_admin boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select p.* into actor_profile
    from public.profiles p
   where p.id = auth.uid()
     and coalesce(p.access_status, '') = 'Aprovado';

  if not found then
    raise exception 'Approved clinical staff profile required';
  end if;

  select coalesce(public.is_access_admin(), false) into actor_is_admin;

  if not actor_is_admin
     and coalesce(trim(actor_profile.crm), '') = ''
     and lower(coalesce(actor_profile.role, '')) not like '%médic%'
     and lower(coalesce(actor_profile.role, '')) not like '%medic%'
     and lower(coalesce(actor_profile.role, '')) not like '%psic%'
     and lower(coalesce(actor_profile.role, '')) not like '%obst%'
     and lower(coalesce(actor_profile.role, '')) not like '%diretor%'
     and lower(coalesce(actor_profile.role, '')) not like '%cirurg%'
  then
    raise exception 'Clinical permission required';
  end if;

  update public.clinical_records
     set is_confidential = confidential,
         payload = case
           when not confidential and record_type in ('Documento', 'documento') then
             jsonb_set(
               payload,
               '{releasedSnapshot}',
               jsonb_strip_nulls(jsonb_build_object(
                 'schemaVersion', coalesce(payload -> 'schemaVersion', '2'::jsonb),
                 'documentKind', coalesce(payload -> 'documentKind', '"medical-document"'::jsonb),
                 'documentTitle', payload -> 'documentTitle',
                 'documentModelId', payload -> 'documentModelId',
                 'documentCategory', payload -> 'documentCategory',
                 'documentHtml', payload -> 'documentHtml',
                 'guidedValues', payload -> 'guidedValues',
                 'useModel', payload -> 'useModel',
                 'patient', payload -> 'patient',
                 'doctor', payload -> 'doctor',
                 'selectedDoctorId', payload -> 'selectedDoctorId',
                 'savedAt', payload -> 'savedAt',
                 'appointmentId', payload -> 'appointmentId',
                 'appointmentSpecialty', payload -> 'appointmentSpecialty',
                 'appointmentDoctor', payload -> 'appointmentDoctor',
                 'appointmentDate', payload -> 'appointmentDate',
                 'appointmentTime', payload -> 'appointmentTime',
                 'releasedAt', to_jsonb(now()),
                 'releasedBy', to_jsonb(auth.uid())
               )),
               true
             )
           else payload
         end,
         released_at = case when confidential then null else now() end,
         released_by = case when confidential then null else auth.uid() end,
         confidentiality_updated_at = now(),
         confidentiality_updated_by = auth.uid(),
         updated_at = now()
   where id = target_record_id
  returning * into changed_record;

  if changed_record.id is null then
    raise exception 'Clinical record not found';
  end if;

  activity_id := 'portal-confidentiality-' || replace(gen_random_uuid()::text, '-', '');
  insert into public.system_activities (id, module, action, description, actor, reference)
  values (
    activity_id,
    'Portal do Paciente',
    case when confidential then 'Registro colocado em sigilo para o paciente' else 'Registro liberado ao paciente' end,
    case when confidential
      then 'A visualização deste registro foi bloqueada apenas no Portal do Paciente. O registro permanece disponível internamente conforme as permissões clínicas.'
      else case when changed_record.record_type in ('Documento', 'documento')
        then 'O documento foi liberado ao Portal com snapshot estruturado da versão atual. Edições posteriores permanecem internas até nova liberação.'
        else 'O registro foi liberado para visualização no Portal do Paciente e permanece disponível internamente conforme as permissões clínicas.'
      end
    end,
    coalesce(actor_profile.name, auth.uid()::text),
    target_record_id
  );

  return changed_record;
end;
$$;

revoke execute on function public.set_clinical_record_confidentiality(text, boolean) from public;
grant execute on function public.set_clinical_record_confidentiality(text, boolean) to authenticated;

create or replace function public.hpsr_internal_correct_record_metadata(
  p_record_id text,
  p_title text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  old_record public.clinical_records%rowtype;
  actor_name text;
  next_title text := trim(regexp_replace(coalesce(p_title, ''), '\s+', ' ', 'g'));
  reason_text text := trim(coalesce(p_reason, ''));
  old_title text;
begin
  if not public.hpsr_can_access_internal() then
    raise exception 'Acesso restrito ao Interno' using errcode = '42501';
  end if;
  if length(next_title) < 3 or length(next_title) > 160
     or length(reason_text) < 10 or length(reason_text) > 400 then
    raise exception 'Informe um título válido e justificativa de pelo menos 10 caracteres' using errcode = '22023';
  end if;

  select * into old_record
    from public.clinical_records
   where id = trim(p_record_id)
   for update;
  if not found then
    raise exception 'Registro clínico não localizado' using errcode = '22023';
  end if;
  if lower(old_record.record_type) <> 'documento' then
    raise exception 'O Interno só corrige metadados administrativos de documentos' using errcode = '22023';
  end if;

  old_title := coalesce(nullif(trim(old_record.history_title), ''), old_record.payload ->> 'documentTitle', 'Documento');
  if old_title = next_title then
    return jsonb_build_object('updated', false, 'id', old_record.id, 'title', next_title);
  end if;

  update public.clinical_records
     set history_title = next_title,
         payload = jsonb_set(payload, '{documentTitle}', to_jsonb(next_title), true),
         updated_at = now()
   where id = old_record.id;

  select p.name into actor_name from public.profiles p where p.id = auth.uid();
  insert into public.system_activities(id, module, action, description, actor, reference)
  values (
    'HPSR-INT-' || gen_random_uuid()::text,
    'Interno',
    'Correção de metadados de documento',
    'Título: ' || old_title || ' → ' || next_title || '. Motivo: ' || reason_text || '. Conteúdo clínico e snapshot já liberado não foram alterados.',
    coalesce(actor_name, auth.uid()::text),
    old_record.id
  );

  return jsonb_build_object('updated', true, 'id', old_record.id, 'title', next_title);
end;
$$;

revoke execute on function public.hpsr_internal_correct_record_metadata(text, text, text) from public;
grant execute on function public.hpsr_internal_correct_record_metadata(text, text, text) to authenticated;

create or replace function public.hpsr_internal_set_record_visibility(
  p_record_id text,
  p_confidential boolean,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  target public.clinical_records%rowtype;
  changed public.clinical_records;
  actor_name text;
  reason_text text := trim(coalesce(p_reason, ''));
begin
  if not public.hpsr_can_access_internal() then
    raise exception 'Acesso restrito ao Interno' using errcode = '42501';
  end if;
  if length(reason_text) < 10 or length(reason_text) > 400 then
    raise exception 'Informe uma justificativa de pelo menos 10 caracteres' using errcode = '22023';
  end if;

  select * into target from public.clinical_records where id = trim(p_record_id);
  if not found then
    raise exception 'Registro clínico não localizado' using errcode = '22023';
  end if;
  if lower(target.record_type) not in ('documento', 'exame') then
    raise exception 'Somente documentos e exames podem ser administrados nesta área' using errcode = '22023';
  end if;

  select * into changed
    from public.set_clinical_record_confidentiality(target.id, p_confidential);

  select p.name into actor_name from public.profiles p where p.id = auth.uid();
  insert into public.system_activities(id, module, action, description, actor, reference)
  values (
    'HPSR-INT-' || gen_random_uuid()::text,
    'Interno',
    case when p_confidential then 'Registro clínico recolhido do Portal' else 'Registro clínico liberado ao Portal' end,
    coalesce(nullif(target.history_title, ''), target.record_type) || '. Motivo administrativo: ' || reason_text,
    coalesce(actor_name, auth.uid()::text),
    target.id
  );

  return jsonb_build_object(
    'id', changed.id,
    'isConfidential', changed.is_confidential,
    'releasedAt', changed.released_at
  );
end;
$$;

revoke execute on function public.hpsr_internal_set_record_visibility(text, boolean, text) from public;
grant execute on function public.hpsr_internal_set_record_visibility(text, boolean, text) to authenticated;
