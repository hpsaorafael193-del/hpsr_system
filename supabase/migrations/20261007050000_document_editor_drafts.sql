create table public.document_editor_drafts (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 client_saved_at timestamptz not null,
 updated_at timestamptz not null default now()
);
alter table public.document_editor_drafts enable row level security;
revoke all on public.document_editor_drafts from anon, authenticated;
grant select, insert, update, delete on public.document_editor_drafts to authenticated;
create policy document_draft_select on public.document_editor_drafts for select to authenticated
 using ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()));
create policy document_draft_insert on public.document_editor_drafts for insert to authenticated
 with check ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()));
create policy document_draft_update on public.document_editor_drafts for update to authenticated
 using ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()))
 with check ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()));
create policy document_draft_delete on public.document_editor_drafts for delete to authenticated
 using ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()));
create trigger document_draft_order before insert or update on public.document_editor_drafts
 for each row execute function public.hpsr_exam_draft_order();
comment on table public.document_editor_drafts is 'Rascunho privado de documentos, independente de publicação e do Portal.';
