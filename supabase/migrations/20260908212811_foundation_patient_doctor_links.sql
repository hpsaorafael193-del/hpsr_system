-- Mudança 1 — Fundação técnica do vínculo paciente + médico + especialidade.
-- Esta migração cria a nova fonte de vínculo sem alterar Agenda/Portal e sem remover schedule_assignments.

create table public.patient_doctor_links (
  id uuid primary key default gen_random_uuid(),
  patient_passport text not null,
  doctor_id uuid not null,
  specialty text not null,
  started_at timestamptz not null default now(),

  constraint patient_doctor_links_patient_fkey
    foreign key (patient_passport)
    references public.patient_registry(passport)
    on update cascade
    on delete restrict,

  constraint patient_doctor_links_doctor_fkey
    foreign key (doctor_id)
    references public.profiles(id)
    on update cascade
    on delete restrict,

  constraint patient_doctor_links_specialty_not_blank
    check (length(btrim(specialty)) > 0),

  constraint patient_doctor_links_specialty_trimmed
    check (specialty = btrim(specialty)),

  constraint patient_doctor_links_patient_specialty_key
    unique (patient_passport, specialty)
);

create index patient_doctor_links_doctor_id_idx
  on public.patient_doctor_links (doctor_id);

create table public.patient_doctor_link_history (
  id uuid primary key default gen_random_uuid(),
  patient_passport text not null,
  doctor_id uuid not null,
  specialty text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  end_reason text not null,

  constraint patient_doctor_link_history_patient_fkey
    foreign key (patient_passport)
    references public.patient_registry(passport)
    on update cascade
    on delete restrict,

  constraint patient_doctor_link_history_doctor_fkey
    foreign key (doctor_id)
    references public.profiles(id)
    on update cascade
    on delete restrict,

  constraint patient_doctor_link_history_specialty_not_blank
    check (length(btrim(specialty)) > 0),

  constraint patient_doctor_link_history_specialty_trimmed
    check (specialty = btrim(specialty)),

  constraint patient_doctor_link_history_end_reason_not_blank
    check (length(btrim(end_reason)) > 0),

  constraint patient_doctor_link_history_end_reason_trimmed
    check (end_reason = btrim(end_reason)),

  constraint patient_doctor_link_history_dates_valid
    check (ended_at >= started_at)
);

create index patient_doctor_link_history_patient_idx
  on public.patient_doctor_link_history (patient_passport);
create index patient_doctor_link_history_doctor_idx
  on public.patient_doctor_link_history (doctor_id);
create index patient_doctor_link_history_specialty_idx
  on public.patient_doctor_link_history (specialty);
create index patient_doctor_link_history_ended_at_idx
  on public.patient_doctor_link_history (ended_at desc);

comment on table public.patient_doctor_links is
  'Vínculos operacionais atuais: paciente + médico + especialidade. Sem status.';
comment on table public.patient_doctor_link_history is
  'Histórico informativo de vínculos encerrados. Não concede acesso operacional.';
comment on column public.patient_doctor_links.started_at is
  'Data de início do vínculo. Para migração legada, usa managed_at apenas quando a origem é internal_manual; nos registros antigos sem data própria, usa a criação do acesso ao portal como melhor referência disponível.';

-- As tabelas ficam fechadas para clientes nesta etapa. As permissões de médico/admin serão implementadas na Mudança 2.
alter table public.patient_doctor_links enable row level security;
alter table public.patient_doctor_link_history enable row level security;

revoke all on table public.patient_doctor_links from anon, authenticated;
revoke all on table public.patient_doctor_link_history from anon, authenticated;
grant select, insert, update, delete on table public.patient_doctor_links to service_role;
grant select, insert, update, delete on table public.patient_doctor_link_history to service_role;

-- Migração controlada dos 10 vínculos legados atualmente existentes em schedule_assignments.
do $$
declare
  v_legacy_count integer;
  v_new_count integer;
  v_invalid_count integer;
begin
  select count(*)
    into v_legacy_count
    from public.patient_portal_access pa
    cross join lateral jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item;

  if v_legacy_count <> 10 then
    raise exception 'Migração de vínculos interrompida: esperado 10 vínculos legados, encontrados %.', v_legacy_count;
  end if;

  select count(*)
    into v_invalid_count
    from public.patient_portal_access pa
    cross join lateral jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item
    left join public.patient_registry pr on pr.passport = pa.patient_passport
    left join public.profiles p on p.id::text = item->>'doctor_id'
   where pr.passport is null
      or p.id is null
      or nullif(btrim(item->>'specialty'), '') is null;

  if v_invalid_count <> 0 then
    raise exception 'Migração de vínculos interrompida: % vínculo(s) legado(s) sem paciente, médico ou especialidade válida.', v_invalid_count;
  end if;

  insert into public.patient_doctor_links (
    patient_passport,
    doctor_id,
    specialty,
    started_at
  )
  select
    pa.patient_passport,
    (item->>'doctor_id')::uuid,
    btrim(item->>'specialty'),
    case
      when item->>'source' = 'internal_manual'
       and nullif(item->>'managed_at', '') is not null
        then (item->>'managed_at')::timestamptz
      else pa.created_at
    end
  from public.patient_portal_access pa
  cross join lateral jsonb_array_elements(coalesce(pa.schedule_assignments, '[]'::jsonb)) item;

  select count(*) into v_new_count from public.patient_doctor_links;

  if v_new_count <> v_legacy_count then
    raise exception 'Migração de vínculos incompleta: legado %, nova tabela %.', v_legacy_count, v_new_count;
  end if;
end
$$;
