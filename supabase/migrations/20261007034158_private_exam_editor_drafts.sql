create table public.exam_editor_drafts (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 client_saved_at timestamptz not null,
 updated_at timestamptz not null default now()
);
alter table public.exam_editor_drafts enable row level security;
revoke all on public.exam_editor_drafts from anon, authenticated;
grant select, insert, update, delete on public.exam_editor_drafts to authenticated;
create policy exam_draft_select on public.exam_editor_drafts for select to authenticated
 using ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()));
create policy exam_draft_insert on public.exam_editor_drafts for insert to authenticated
 with check ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()));
create policy exam_draft_update on public.exam_editor_drafts for update to authenticated
 using ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()))
 with check ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()));
create policy exam_draft_delete on public.exam_editor_drafts for delete to authenticated
 using ((select auth.uid()) = owner_id and (select public.is_hpsr_staff()));
create function public.hpsr_exam_draft_order() returns trigger
 language plpgsql security invoker set search_path = '' as $$
begin
 if TG_OP = 'UPDATE' and new.client_saved_at < old.client_saved_at then return null; end if;
 new.updated_at := now();
 return new;
end; $$;
revoke all on function public.hpsr_exam_draft_order() from public, anon;
create trigger exam_draft_order before insert or update on public.exam_editor_drafts
 for each row execute function public.hpsr_exam_draft_order();
comment on table public.exam_editor_drafts is 'Rascunho privado do editor de exames; não é um laudo publicado e não aparece no Portal.';
