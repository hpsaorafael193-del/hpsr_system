create table if not exists public.clinical_record_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  record_id text not null,
  patient_passport text,
  record_type text,
  record_snapshot jsonb not null,
  deleted_by uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  reason text not null default 'Exclusão administrativa',
  deleted_at timestamptz not null default now()
);

create index if not exists clinical_record_deletion_audit_record_idx
  on public.clinical_record_deletion_audit(record_id);
create index if not exists clinical_record_deletion_audit_patient_idx
  on public.clinical_record_deletion_audit(patient_passport);

alter table public.clinical_record_deletion_audit enable row level security;

drop policy if exists "clinical deletion audit admin read" on public.clinical_record_deletion_audit;
create policy "clinical deletion audit admin read"
on public.clinical_record_deletion_audit
for select to authenticated
using (public.is_access_admin());

revoke all on table public.clinical_record_deletion_audit from public, anon;
grant select on table public.clinical_record_deletion_audit to authenticated;
grant all on table public.clinical_record_deletion_audit to service_role;

drop policy if exists "staff clinical access" on public.clinical_records;
drop policy if exists "staff clinical read" on public.clinical_records;
drop policy if exists "staff clinical insert" on public.clinical_records;
drop policy if exists "staff clinical update" on public.clinical_records;
drop policy if exists "admin clinical delete" on public.clinical_records;

create policy "staff clinical read"
on public.clinical_records for select to authenticated
using (public.is_hpsr_staff());

create policy "staff clinical insert"
on public.clinical_records for insert to authenticated
with check (public.is_hpsr_staff());

create policy "staff clinical update"
on public.clinical_records for update to authenticated
using (public.is_hpsr_staff())
with check (public.is_hpsr_staff());

create policy "admin clinical delete"
on public.clinical_records for delete to authenticated
using (public.is_access_admin());

create or replace function public.audit_clinical_record_delete()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_actor_name text;
begin
  if v_user_id is null or not public.is_access_admin() then
    raise exception 'Somente a administração pode excluir registros clínicos.' using errcode = '42501';
  end if;

  select coalesce(nullif(name, ''), v_user_id::text)
    into v_actor_name
    from public.profiles
   where id = v_user_id;

  v_actor_name := coalesce(v_actor_name, v_user_id::text);

  insert into public.clinical_record_deletion_audit(
    record_id, patient_passport, record_type, record_snapshot,
    deleted_by, actor_name, reason
  ) values (
    old.id, old.patient_passport, old.record_type, to_jsonb(old),
    v_user_id, v_actor_name, 'Exclusão administrativa'
  );

  insert into public.system_activities(
    id, module, action, description, actor, reference, created_at
  ) values (
    'clinical-delete-' || replace(gen_random_uuid()::text, '-', ''),
    'Prontuário',
    'Registro clínico excluído',
    format(
      '%s do paciente %s foi excluído administrativamente.',
      coalesce(old.record_type, 'Registro clínico'),
      coalesce(old.patient_passport, 'não informado')
    ),
    v_actor_name,
    old.id,
    now()
  );

  return old;
end;
$function$;

drop trigger if exists audit_clinical_record_delete_trigger on public.clinical_records;
create trigger audit_clinical_record_delete_trigger
before delete on public.clinical_records
for each row execute function public.audit_clinical_record_delete();
