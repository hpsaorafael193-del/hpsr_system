-- v1.0.428 — acesso à aba Obstetra e operações dos planejamentos obstétricos.
-- Não restringe a leitura do prontuário/histórico clínico por profissionais já
-- autorizados: limita a escrita nesta especialidade e os PNGs privados.
-- Aplicar após as migrations locais anteriores, sem alterar registros existentes.
begin;

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
               from regexp_split_to_table(
                 case when p.role = 'Médico Clínico' then 'Clínico Geral' else coalesce(p.specialty, '') end,
                 E'[,;/|\n]+'
               ) as assigned(specialty)
              where public.hpsr_normalize_specialty(assigned.specialty)
                    in ('obstetra', 'ginecologia', 'obstetricia e ginecologia')
           )
         )
       )
  );
$function$;

revoke all on function public.hpsr_can_access_obstetra() from public, anon;
grant execute on function public.hpsr_can_access_obstetra() to authenticated, service_role;

-- RESTRICTIVE combina com as políticas existentes, sem ampliar o acesso de
-- médico algum nem afetar os acompanhamentos das outras especialidades.
-- Os planejamentos das duas modalidades são armazenados na especialidade
-- 'Obstetra' na versão atual. A reformulação de FIV permanece fora do escopo.
create policy "hpsr obstetra plan insert guard"
  on public.clinical_followup_plans as restrictive for insert to authenticated
  with check (public.hpsr_normalize_specialty(specialty) <> 'obstetra' or (select public.hpsr_can_access_obstetra()));

create policy "hpsr obstetra plan update guard"
  on public.clinical_followup_plans as restrictive for update to authenticated
  using (public.hpsr_normalize_specialty(specialty) <> 'obstetra' or (select public.hpsr_can_access_obstetra()))
  with check (public.hpsr_normalize_specialty(specialty) <> 'obstetra' or (select public.hpsr_can_access_obstetra()));

create policy "hpsr obstetra plan delete guard"
  on public.clinical_followup_plans as restrictive for delete to authenticated
  using (public.hpsr_normalize_specialty(specialty) <> 'obstetra' or (select public.hpsr_can_access_obstetra()));

create policy "hpsr obstetra occurrence insert guard"
  on public.clinical_followup_occurrences as restrictive for insert to authenticated
  with check (public.hpsr_normalize_specialty(specialty) <> 'obstetra' or (select public.hpsr_can_access_obstetra()));

create policy "hpsr obstetra occurrence update guard"
  on public.clinical_followup_occurrences as restrictive for update to authenticated
  using (public.hpsr_normalize_specialty(specialty) <> 'obstetra' or (select public.hpsr_can_access_obstetra()))
  with check (public.hpsr_normalize_specialty(specialty) <> 'obstetra' or (select public.hpsr_can_access_obstetra()));

create policy "hpsr obstetra occurrence delete guard"
  on public.clinical_followup_occurrences as restrictive for delete to authenticated
  using (public.hpsr_normalize_specialty(specialty) <> 'obstetra' or (select public.hpsr_can_access_obstetra()));

-- O bucket de PNGs é exclusivo dos planejamentos; demais buckets seguem
-- exatamente suas políticas atuais. O Portal utiliza o fluxo autorizado
-- do servidor e não recebe permissão de leitura direta no bucket.
create policy "hpsr obstetra document read guard"
  on storage.objects as restrictive for select to authenticated
  using (bucket_id <> 'obstetric-plans' or (select public.hpsr_can_access_obstetra()));

create policy "hpsr obstetra document insert guard"
  on storage.objects as restrictive for insert to authenticated
  with check (bucket_id <> 'obstetric-plans' or (select public.hpsr_can_access_obstetra()));

create policy "hpsr obstetra document update guard"
  on storage.objects as restrictive for update to authenticated
  using (bucket_id <> 'obstetric-plans' or (select public.hpsr_can_access_obstetra()))
  with check (bucket_id <> 'obstetric-plans' or (select public.hpsr_can_access_obstetra()));

create policy "hpsr obstetra document delete guard"
  on storage.objects as restrictive for delete to authenticated
  using (bucket_id <> 'obstetric-plans' or (select public.hpsr_can_access_obstetra()));

comment on function public.hpsr_can_access_obstetra() is
  'Diretora/Vice Diretores ou médico aprovado com Obstetrícia ou Ginecologia atribuída; não concede especialidades ao perfil.';

commit;
