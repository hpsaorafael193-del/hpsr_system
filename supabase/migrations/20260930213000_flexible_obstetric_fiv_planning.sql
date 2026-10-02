-- v1.0.430 — Planejamento Gestacional/FIV flexível, integral + individual.
-- Preserva registros existentes e reutiliza as tabelas institucionais de acompanhamento.
-- Sem criação automática de agendamentos: datas planejadas continuam independentes dos horários publicados.
begin;

alter table public.clinical_followup_plans
  add column if not exists planning_notes text,
  add column if not exists portal_released_at timestamptz,
  add column if not exists consultation_schedule jsonb,
  add column if not exists plan_type text,
  add column if not exists schedule_confirmed_at timestamptz,
  add column if not exists planning_document_path text,
  add column if not exists planning_released_document_path text,
  add column if not exists planning_document_versions jsonb not null default '[]'::jsonb,
  add column if not exists planning_released_snapshot jsonb;

update public.clinical_followup_plans
   set plan_type = 'gestacional'
 where plan_type is null
   and public.hpsr_normalize_specialty(specialty) = 'obstetra';


-- O campo é compartilhado com acompanhamentos de outras especialidades; por isso
-- registros legados não-obstétricos podem permanecer NULL e não são reclassificados.
do $block$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'clinical_followup_plan_type_check'
       and conrelid = 'public.clinical_followup_plans'::regclass
  ) then
    alter table public.clinical_followup_plans
      add constraint clinical_followup_plan_type_check
      check (plan_type is null or plan_type in ('gestacional', 'in_vitro'));
  end if;
end
$block$;

alter table public.clinical_followup_occurrences
  add column if not exists step_number integer,
  add column if not exists rp_marker text,
  add column if not exists step_title text,
  add column if not exists planned_text text,
  add column if not exists evolution_text text,
  add column if not exists conduct_text text,
  add column if not exists individual_document_path text,
  add column if not exists individual_released_document_path text,
  add column if not exists individual_document_versions jsonb not null default '[]'::jsonb,
  add column if not exists individual_released_snapshot jsonb,
  add column if not exists individual_released_at timestamptz;

comment on column public.clinical_followup_plans.consultation_schedule is
  'Cronograma confirmado pelo médico. Marcadores RP não determinam intervalos de calendário.';
comment on column public.clinical_followup_plans.schedule_confirmed_at is
  'Momento em que o médico confirmou a sugestão do cronograma antes da criação/atualização das ocorrências.';
comment on column public.clinical_followup_occurrences.step_number is
  'Número da consulta/etapa no planejamento integral e individual.';
comment on column public.clinical_followup_occurrences.rp_marker is
  'Marcador narrativo do RP (ex.: 16 semanas, 3ª semana); não é usado para calcular datas.';
comment on column public.clinical_followup_occurrences.planned_text is
  'Planejamento previsto pelo médico para esta consulta/etapa.';
comment on column public.clinical_followup_occurrences.evolution_text is
  'Evolução/observações médicas registradas após ou durante o atendimento.';
comment on column public.clinical_followup_occurrences.conduct_text is
  'Conduta/retorno definidos pelo médico para a consulta/etapa.';

create index if not exists clinical_followup_reproductive_plans_idx
  on public.clinical_followup_plans (doctor_id, patient_passport, plan_type, created_at desc)
  where plan_type in ('gestacional', 'in_vitro');

create index if not exists clinical_followup_occurrence_step_idx
  on public.clinical_followup_occurrences (plan_id, step_number)
  where step_number is not null;

create index if not exists clinical_followup_individual_release_idx
  on public.clinical_followup_occurrences (patient_passport, individual_released_at desc)
  where individual_released_at is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obstetric-plans', 'obstetric-plans', false, 10485760, array['image/png'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.hpsr_can_access_obstetra()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and coalesce(p.access_status, 'Aprovado') = 'Aprovado'
       and (
         p.role in ('Diretora', 'Vice Diretor', 'Vice Diretor / Dev')
         or (
           p.role in ('Médico Clínico', 'Médico Especialista', 'Médico Plantonista', 'Médico Cirurgião', 'Diretor Clínico')
           and exists (
             select 1
               from regexp_split_to_table(coalesce(p.specialty, ''), E'[,;/|\n]+') assigned(specialty)
              where public.hpsr_normalize_specialty(assigned.specialty) in ('obstetra', 'ginecologia')
           )
         )
       )
  );
$function$;

revoke all on function public.hpsr_can_access_obstetra() from public, anon;
grant execute on function public.hpsr_can_access_obstetra() to authenticated, service_role;

-- Somente o médico responsável pode alterar seus planejamentos reprodutivos.
-- Direção mantém acesso à aba e pode criar/editar os próprios planos quando responsável.
drop policy if exists "hpsr reproductive plan insert guard" on public.clinical_followup_plans;
create policy "hpsr reproductive plan insert guard"
  on public.clinical_followup_plans as restrictive for insert to authenticated
  with check (
    not (
      plan_type in ('gestacional', 'in_vitro')
      and public.hpsr_normalize_specialty(specialty) in ('obstetra', 'ginecologia')
    )
    or (
      doctor_id = (select auth.uid())
      and (select public.hpsr_can_access_obstetra())
    )
  );

drop policy if exists "hpsr reproductive plan update guard" on public.clinical_followup_plans;
create policy "hpsr reproductive plan update guard"
  on public.clinical_followup_plans as restrictive for update to authenticated
  using (
    not (
      plan_type in ('gestacional', 'in_vitro')
      and public.hpsr_normalize_specialty(specialty) in ('obstetra', 'ginecologia')
    )
    or (
      doctor_id = (select auth.uid())
      and (select public.hpsr_can_access_obstetra())
    )
  )
  with check (
    not (
      plan_type in ('gestacional', 'in_vitro')
      and public.hpsr_normalize_specialty(specialty) in ('obstetra', 'ginecologia')
    )
    or (
      doctor_id = (select auth.uid())
      and (select public.hpsr_can_access_obstetra())
    )
  );

drop policy if exists "hpsr reproductive plan delete guard" on public.clinical_followup_plans;
create policy "hpsr reproductive plan delete guard"
  on public.clinical_followup_plans as restrictive for delete to authenticated
  using (
    not (
      plan_type in ('gestacional', 'in_vitro')
      and public.hpsr_normalize_specialty(specialty) in ('obstetra', 'ginecologia')
    )
    or (
      doctor_id = (select auth.uid())
      and (select public.hpsr_can_access_obstetra())
    )
  );

-- As ocorrências individuais seguem o mesmo médico responsável do plano.
drop policy if exists "hpsr reproductive occurrence insert guard" on public.clinical_followup_occurrences;
create policy "hpsr reproductive occurrence insert guard"
  on public.clinical_followup_occurrences as restrictive for insert to authenticated
  with check (
    public.hpsr_normalize_specialty(specialty) not in ('obstetra', 'ginecologia')
    or (
      doctor_id = (select auth.uid())
      and (select public.hpsr_can_access_obstetra())
      and exists (
        select 1 from public.clinical_followup_plans p
         where p.id = plan_id
           and p.doctor_id = (select auth.uid())
           and p.plan_type in ('gestacional', 'in_vitro')
      )
    )
  );

drop policy if exists "hpsr reproductive occurrence update guard" on public.clinical_followup_occurrences;
create policy "hpsr reproductive occurrence update guard"
  on public.clinical_followup_occurrences as restrictive for update to authenticated
  using (
    public.hpsr_normalize_specialty(specialty) not in ('obstetra', 'ginecologia')
    or (doctor_id = (select auth.uid()) and (select public.hpsr_can_access_obstetra()))
  )
  with check (
    public.hpsr_normalize_specialty(specialty) not in ('obstetra', 'ginecologia')
    or (
      doctor_id = (select auth.uid())
      and (select public.hpsr_can_access_obstetra())
      and exists (
        select 1 from public.clinical_followup_plans p
         where p.id = plan_id
           and p.doctor_id = (select auth.uid())
           and p.plan_type in ('gestacional', 'in_vitro')
      )
    )
  );

drop policy if exists "hpsr reproductive occurrence delete guard" on public.clinical_followup_occurrences;
create policy "hpsr reproductive occurrence delete guard"
  on public.clinical_followup_occurrences as restrictive for delete to authenticated
  using (
    public.hpsr_normalize_specialty(specialty) not in ('obstetra', 'ginecologia')
    or (doctor_id = (select auth.uid()) and (select public.hpsr_can_access_obstetra()))
  );

-- Evoluções geradas por este módulo ficam editáveis apenas pelo profissional que as criou.
drop policy if exists "hpsr reproductive clinical update guard" on public.clinical_records;
create policy "hpsr reproductive clinical update guard"
  on public.clinical_records as restrictive for update to authenticated
  using (
    record_type not in ('Evolução obstétrica', 'Evolução FIV')
    or created_by = (select auth.uid())
  )
  with check (
    record_type not in ('Evolução obstétrica', 'Evolução FIV')
    or created_by = (select auth.uid())
  );

-- Políticas antigas do bucket são substituídas por uma regra compatível com
-- Gestacional (Obstetra) e FIV (Ginecologia), sem leitura direta do paciente.
drop policy if exists "obstetric plan doctor insert" on storage.objects;
drop policy if exists "obstetric plan doctor select" on storage.objects;
drop policy if exists "obstetric plan doctor delete" on storage.objects;
drop policy if exists "hpsr obstetra document read guard" on storage.objects;
drop policy if exists "hpsr obstetra document insert guard" on storage.objects;
drop policy if exists "hpsr obstetra document update guard" on storage.objects;
drop policy if exists "hpsr obstetra document delete guard" on storage.objects;

drop policy if exists "hpsr reproductive document insert" on storage.objects;
create policy "hpsr reproductive document insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'obstetric-plans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.hpsr_can_access_obstetra())
    and exists (
      select 1 from public.clinical_followup_plans p
       where p.id::text = (storage.foldername(name))[2]
         and p.doctor_id = (select auth.uid())
         and p.plan_type in ('gestacional', 'in_vitro')
         and public.hpsr_normalize_specialty(p.specialty) in ('obstetra', 'ginecologia')
    )
  );

drop policy if exists "hpsr reproductive document select" on storage.objects;
create policy "hpsr reproductive document select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'obstetric-plans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.hpsr_can_access_obstetra())
    and exists (
      select 1 from public.clinical_followup_plans p
       where p.id::text = (storage.foldername(name))[2]
         and p.doctor_id = (select auth.uid())
         and p.plan_type in ('gestacional', 'in_vitro')
    )
  );

drop policy if exists "hpsr reproductive document update" on storage.objects;
create policy "hpsr reproductive document update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'obstetric-plans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.hpsr_can_access_obstetra())
  )
  with check (
    bucket_id = 'obstetric-plans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.hpsr_can_access_obstetra())
  );

drop policy if exists "hpsr reproductive document delete" on storage.objects;
create policy "hpsr reproductive document delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'obstetric-plans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.hpsr_can_access_obstetra())
    and exists (
      select 1 from public.clinical_followup_plans p
       where p.id::text = (storage.foldername(name))[2]
         and p.doctor_id = (select auth.uid())
    )
  );

comment on function public.hpsr_can_access_obstetra() is
  'Acesso ao módulo Obstetra: Direção ou médico aprovado com Obstetrícia/Ginecologia atribuída; não concede especialidades ao perfil.';

commit;
notify pgrst, 'reload schema';
