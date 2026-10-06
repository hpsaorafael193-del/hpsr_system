-- HPSR v1.1.16-test.30
-- Publicação imutável para Documentos e Exames usando snapshot estruturado.
-- Preserva prévias/imagens históricas apenas quando já faziam parte do registro antigo.

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
           when not confidential and lower(record_type) in ('documento', 'exame') then
             jsonb_set(
               payload,
               '{releasedSnapshot}',
               jsonb_strip_nulls(
                 (payload - 'releasedSnapshot') || jsonb_build_object(
                   'releasedAt', to_jsonb(now()),
                   'releasedBy', to_jsonb(auth.uid())
                 )
               ),
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
      else case when lower(changed_record.record_type) in ('documento', 'exame')
        then 'O registro foi liberado ao Portal com snapshot estruturado da versão atual. Edições posteriores permanecem internas até nova liberação.'
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
