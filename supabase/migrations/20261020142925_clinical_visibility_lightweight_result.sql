-- Snapshot release without rewriting the original clinical payload.
alter table public.clinical_records alter column payload set compression lz4;
alter table public.clinical_records add column if not exists released_render_payload jsonb compression lz4;
create or replace function hpsr_private.set_clinical_record_visibility(target_record_id text, confidential boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_profile public.profiles%rowtype; actor_is_admin boolean:=false;
changed public.clinical_records; snapshot jsonb;
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


if confidential then
 update public.clinical_records set is_confidential=true,released_at=null,released_by=null,
 confidentiality_updated_at=now(),confidentiality_updated_by=auth.uid(),updated_at=now()
 where id=target_record_id returning * into changed;
else
 select case when lower(record_type) in ('exame','documento') then
 (payload-'releasedSnapshot') || jsonb_build_object('releasedAt',now(),'releasedBy',auth.uid())
 else null end into snapshot from public.clinical_records where id=target_record_id for update;
 update public.clinical_records set is_confidential=false,released_render_payload=snapshot,
 released_at=now(),released_by=auth.uid(),confidentiality_updated_at=now(),
 confidentiality_updated_by=auth.uid(),updated_at=now()
 where id=target_record_id returning * into changed;
end if;
if changed.id is null then raise exception 'Clinical record not found'; end if;
insert into public.system_activities(id,module,action,description,actor,reference)
values('portal-confidentiality-'||replace(gen_random_uuid()::text,'-',''),'Portal do Paciente',
case when confidential then 'Registro colocado em sigilo para o paciente' else 'Registro liberado ao paciente' end,
'Visibilidade atualizada; versão liberada preservada em snapshot estruturado.',
coalesce(actor_profile.name,auth.uid()::text),target_record_id);
return jsonb_build_object('id',changed.id,'is_confidential',changed.is_confidential,
'released_at',changed.released_at,'released_by',changed.released_by,'updated_at',changed.updated_at);
end $$;
revoke all on function hpsr_private.set_clinical_record_visibility(text,boolean) from public,anon;
grant execute on function hpsr_private.set_clinical_record_visibility(text,boolean) to authenticated;
CREATE OR REPLACE FUNCTION public.set_clinical_record_confidentiality(target_record_id text, confidential boolean)
 RETURNS clinical_records
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
     set released_render_payload = null, is_confidential = confidential,
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
$function$
;
create or replace function public.set_clinical_record_visibility(target_record_id text,confidential boolean)
returns jsonb language sql security invoker set search_path='' as $$
select hpsr_private.set_clinical_record_visibility(target_record_id,confidential);
$$;
revoke all on function public.set_clinical_record_visibility(text,boolean) from public,anon;
revoke all on function hpsr_private.set_clinical_record_visibility(text,boolean) from public,anon;
grant execute on function public.set_clinical_record_visibility(text,boolean) to authenticated;
grant execute on function hpsr_private.set_clinical_record_visibility(text,boolean) to authenticated;

