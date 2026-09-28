-- v1.0.412: documentos PNG privados, versões de edição e liberação independente.
-- Não altera registros clínicos existentes nem policies de outras áreas.
alter table public.clinical_followup_plans
  add column if not exists planning_document_path text,
  add column if not exists planning_released_document_path text,
  add column if not exists planning_document_versions jsonb not null default '[]'::jsonb,
  add column if not exists planning_released_snapshot jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obstetric-plans', 'obstetric-plans', false, 10485760, array['image/png'])
on conflict (id) do nothing;

-- Os arquivos são gravados em <doctor uid>/<plan uuid>/<revision>.png.
-- A leitura do paciente é feita SOMENTE por API com sessão de Portal validada.
create policy "obstetric plan doctor insert" on storage.objects for insert to authenticated
with check (bucket_id = 'obstetric-plans' and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.clinical_followup_plans p
    where p.id::text = (storage.foldername(name))[2] and p.doctor_id = (select auth.uid()) and p.specialty = 'Obstetra'));
create policy "obstetric plan doctor select" on storage.objects for select to authenticated
using (bucket_id = 'obstetric-plans' and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.clinical_followup_plans p
    where p.id::text = (storage.foldername(name))[2] and p.doctor_id = (select auth.uid()) and p.specialty = 'Obstetra'));
create policy "obstetric plan doctor delete" on storage.objects for delete to authenticated
using (bucket_id = 'obstetric-plans' and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.clinical_followup_plans p
    where p.id::text = (storage.foldername(name))[2] and p.doctor_id = (select auth.uid()) and p.specialty = 'Obstetra'));
