-- Centraliza as assinaturas médicas no Supabase Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signatures', 'signatures', true, 2097152, array['image/png'])
on conflict (id) do update
set public = true,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/png'];

-- Leitura pública: a assinatura aparece em exames e documentos liberados.
drop policy if exists "public read signatures" on storage.objects;
create policy "public read signatures"
on storage.objects for select
using (bucket_id = 'signatures');

-- Cada usuário autenticado gerencia somente a própria pasta.
drop policy if exists "users upload own signature" on storage.objects;
create policy "users upload own signature"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own signature" on storage.objects;
create policy "users update own signature"
on storage.objects for update
to authenticated
using (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own signature" on storage.objects;
create policy "users delete own signature"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'signatures'
  and (storage.foldername(name))[1] = auth.uid()::text
);
