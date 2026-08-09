-- v1.0.220 — Módulo de Parcerias
-- Uma única tabela concentra o cadastro da instituição, membros e termos.
-- Leitura: toda a equipe autenticada. Escrita: Diretora, Vice Diretor e Diretor Técnico / Dev.

create table if not exists public.partnerships (
  id uuid primary key default gen_random_uuid(),
  institution_name text not null,
  institution_type text,
  summary text,
  formed_at date not null default current_date,
  hp_offer_summary text,
  partner_offer_summary text,
  hp_discount_percent numeric(5,2),
  partner_discount_percent numeric(5,2),
  off_duty_service boolean not null default false,
  members jsonb not null default '[]'::jsonb,
  terms jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'Ativa' check (status in ('Ativa', 'Inativa')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partnerships_hp_discount_range check (hp_discount_percent is null or (hp_discount_percent >= 0 and hp_discount_percent <= 100)),
  constraint partnerships_partner_discount_range check (partner_discount_percent is null or (partner_discount_percent >= 0 and partner_discount_percent <= 100)),
  constraint partnerships_members_array check (jsonb_typeof(members) = 'array'),
  constraint partnerships_terms_array check (jsonb_typeof(terms) = 'array')
);

create index if not exists idx_partnerships_status_formed_at
  on public.partnerships(status, formed_at desc);

create or replace function public.touch_partnership_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.institution_name = trim(new.institution_name);
  new.institution_type = nullif(trim(coalesce(new.institution_type, '')), '');
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_partnerships_updated_at on public.partnerships;
create trigger trg_partnerships_updated_at
before insert or update on public.partnerships
for each row execute function public.touch_partnership_updated_at();

create or replace function public.is_hpsr_partnership_director()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) in (
        lower('Diretora'),
        lower('Vice Diretor'),
        lower('Diretor Técnico / Dev'),
        lower('Dev / Desenvolvedor do Sistema')
      )
  );
$$;

revoke all on function public.is_hpsr_partnership_director() from public;
grant execute on function public.is_hpsr_partnership_director() to authenticated;

alter table public.partnerships enable row level security;
revoke all on table public.partnerships from anon, authenticated;
grant select, insert, update, delete on table public.partnerships to authenticated;

drop policy if exists "staff read partnerships" on public.partnerships;
create policy "staff read partnerships"
on public.partnerships
for select
to authenticated
using (public.is_hpsr_staff());

drop policy if exists "directors create partnerships" on public.partnerships;
create policy "directors create partnerships"
on public.partnerships
for insert
to authenticated
with check (public.is_hpsr_partnership_director());

drop policy if exists "directors update partnerships" on public.partnerships;
create policy "directors update partnerships"
on public.partnerships
for update
to authenticated
using (public.is_hpsr_partnership_director())
with check (public.is_hpsr_partnership_director());

drop policy if exists "directors delete partnerships" on public.partnerships;
create policy "directors delete partnerships"
on public.partnerships
for delete
to authenticated
using (public.is_hpsr_partnership_director());

comment on table public.partnerships is 'Parcerias institucionais do Hospital São Rafael; membros e termos ficam consolidados em JSONB para evitar tabelas auxiliares desnecessárias.';
