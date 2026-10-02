-- v1.0.451 — cadernetas oficiais, acesso médico e liberação independente.
-- Preserva os registros clínicos existentes. Executar antes de publicar a interface.
begin;

create or replace function public.hpsr_can_edit_vaccination()
returns boolean language sql stable security definer set search_path = '' as $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.access_status = 'Aprovado'
      and p.role in (
        'Médico Clínico', 'Médico Especialista', 'Médico Plantonista',
        'Médico Cirurgião', 'Diretor Clínico', 'Diretora',
        'Vice Diretor', 'Vice Diretor / Dev'
      )
  );
$function$;
revoke all on function public.hpsr_can_edit_vaccination() from public, anon;
grant execute on function public.hpsr_can_edit_vaccination() to authenticated, service_role;

-- Uma proteção RESTRICTIVE impede que permissões genéricas da equipe
-- sejam usadas para criar/alterar registros de vacinação.
drop policy if exists "vaccination clinical insert doctor only" on public.clinical_records;
create policy "vaccination clinical insert doctor only"
on public.clinical_records as restrictive for insert to authenticated
with check (record_type <> 'Vacina' or public.hpsr_can_edit_vaccination());
drop policy if exists "vaccination clinical update doctor only" on public.clinical_records;
create policy "vaccination clinical update doctor only"
on public.clinical_records as restrictive for update to authenticated
using (record_type <> 'Vacina' or public.hpsr_can_edit_vaccination())
with check (record_type <> 'Vacina' or public.hpsr_can_edit_vaccination());

drop policy if exists "vaccination clinical delete doctor only" on public.clinical_records;
create policy "vaccination clinical delete doctor only"
on public.clinical_records as restrictive for delete to authenticated
using (record_type <> 'Vacina' or public.hpsr_can_edit_vaccination());

-- RLS é a proteção principal. O gatilho preserva a mesma regra mesmo
-- diante de funções preexistentes SECURITY DEFINER que alteram a visibilidade.
create or replace function public.hpsr_guard_vaccination_writes()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if (case when tg_op = 'DELETE' then old.record_type else new.record_type end) = 'Vacina'
     or (tg_op = 'UPDATE' and old.record_type = 'Vacina') then
    if coalesce(auth.role(), '') <> 'service_role' and not public.hpsr_can_edit_vaccination() then
      raise exception 'Somente médicos aprovados podem alterar registros de vacinação.'
        using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;
drop trigger if exists hpsr_vaccination_write_guard on public.clinical_records;
create trigger hpsr_vaccination_write_guard before insert or update or delete
on public.clinical_records for each row execute function public.hpsr_guard_vaccination_writes();

-- Impede duas gravações simultâneas da mesma dose, inclusive entre sessões.
-- Registros antigos sem cardId/slotId continuam intactos.
create unique index if not exists vaccination_card_slot_unique
on public.clinical_records (
  patient_passport, (payload->>'vaccinationCardId'), (payload->'vaccine'->>'slotId')
)
where record_type = 'Vacina'
  and coalesce(payload->>'vaccinationCardId','') <> ''
  and coalesce(payload->'vaccine'->>'slotId','') <> '';

create table if not exists public.vaccination_cards (
  id uuid primary key default gen_random_uuid(),
  patient_passport text not null references public.patient_registry(passport) on delete cascade,
  card_model text not null check (card_model in ('crianca', 'adulto-masculino', 'adulto-feminino', 'idoso', 'gestante')),
  doctor_id uuid not null references public.profiles(id) on delete restrict,
  doctor_name text not null,
  observations text not null default '' check (length(observations) <= 1200),
  draft_path text,
  published_path text,
  version integer not null default 1 check (version >= 1),
  released_at timestamptz,
  released_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_passport, card_model),
  constraint vaccination_published_consistency check ((published_path is null) = (released_at is null))
);
create index if not exists vaccination_cards_patient_released_idx
on public.vaccination_cards(patient_passport, released_at desc) where released_at is not null;
alter table public.vaccination_cards enable row level security;
revoke all on public.vaccination_cards from public, anon;
grant select, insert, update on public.vaccination_cards to authenticated;
grant all on public.vaccination_cards to service_role;

create policy "vaccination doctors select" on public.vaccination_cards for select to authenticated
using (public.hpsr_can_edit_vaccination());
create policy "vaccination doctors insert" on public.vaccination_cards for insert to authenticated
with check (public.hpsr_can_edit_vaccination() and doctor_id = auth.uid()
  and published_path is null and released_at is null);
create policy "vaccination doctors update" on public.vaccination_cards for update to authenticated
using (public.hpsr_can_edit_vaccination())
with check (public.hpsr_can_edit_vaccination());

-- Mesmo usuário autenticado sem aprovação médica não acessa os PNGs;
-- o portal utiliza a chave servidor SOMENTE após validar sessão/passaporte.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('vaccination-cards', 'vaccination-cards', false, 10485760, array['image/png'])
on conflict (id) do update set public = false;

drop policy if exists "vaccination doctors read images" on storage.objects;
create policy "vaccination doctors read images" on storage.objects for select to authenticated
using (bucket_id = 'vaccination-cards' and public.hpsr_can_edit_vaccination());
drop policy if exists "vaccination doctors upload images" on storage.objects;
create policy "vaccination doctors upload images" on storage.objects for insert to authenticated
with check (bucket_id = 'vaccination-cards' and public.hpsr_can_edit_vaccination());
-- PNGs são imutáveis e versionados: novas gravações usam sempre outro caminho.
drop policy if exists "vaccination bucket medical read guard" on storage.objects;
create policy "vaccination bucket medical read guard" on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'vaccination-cards' or public.hpsr_can_edit_vaccination());
drop policy if exists "vaccination bucket medical insert guard" on storage.objects;
create policy "vaccination bucket medical insert guard" on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'vaccination-cards' or public.hpsr_can_edit_vaccination());

commit;
