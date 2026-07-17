-- Registros de gesso da Traumatologia com Supabase como fonte de verdade.
create table if not exists public.cast_records (
  id text primary key,
  patient text not null,
  passport text not null,
  fractures text[] not null default '{}',
  placed_at date not null,
  removal_at date not null,
  status_override text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cast_records_status_override_check
    check (status_override is null or status_override = 'retirado')
);

create index if not exists cast_records_passport_idx on public.cast_records (passport);
create index if not exists cast_records_removal_at_idx on public.cast_records (removal_at);
create index if not exists cast_records_created_at_idx on public.cast_records (created_at desc);

alter table public.cast_records enable row level security;

drop policy if exists "authenticated cast records access" on public.cast_records;
create policy "authenticated cast records access"
on public.cast_records for all to authenticated
using (true)
with check (true);

do $$
begin
  begin
    alter publication supabase_realtime add table public.cast_records;
  exception when duplicate_object then null;
  end;
end $$;
