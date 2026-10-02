-- v1.0.452: reutilizar exclusivamente public.clinical_records para aplicações e cadernetas.
-- Substitui a migration 20261001170000 da 451, ainda não aplicada.
-- Não cria tabela, não migra nem modifica registros de pacientes existentes.
begin;

create or replace function public.hpsr_can_edit_vaccination()
returns boolean language sql stable security definer set search_path = '' as $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.access_status = 'Aprovado'
      and p.role in (
        'Médico Clínico', 'Médico Especialista', 'Médico Plantonista',
        'Médico Cirurgião', 'Diretor Clínico', 'Diretora', 'Vice Diretor', 'Vice Diretor / Dev'
      )
  );
$function$;
revoke all on function public.hpsr_can_edit_vaccination() from public, anon;
grant execute on function public.hpsr_can_edit_vaccination() to authenticated, service_role;

-- As políticas genéricas de equipe continuam funcionando nos demais módulos.
-- Em Vacina/CadernetaVacinal, somente médico aprovado pode escrever/ler a caderneta.
drop policy if exists "vaccination clinical insert doctor only" on public.clinical_records;
create policy "vaccination clinical insert doctor only"
on public.clinical_records as restrictive for insert to authenticated
with check (record_type not in ('Vacina','CadernetaVacinal') or public.hpsr_can_edit_vaccination());
drop policy if exists "vaccination clinical update doctor only" on public.clinical_records;
create policy "vaccination clinical update doctor only"
on public.clinical_records as restrictive for update to authenticated
using (record_type not in ('Vacina','CadernetaVacinal') or public.hpsr_can_edit_vaccination())
with check (record_type not in ('Vacina','CadernetaVacinal') or public.hpsr_can_edit_vaccination());
drop policy if exists "vaccination clinical delete doctor only" on public.clinical_records;
create policy "vaccination clinical delete doctor only"
on public.clinical_records as restrictive for delete to authenticated
using (record_type not in ('Vacina','CadernetaVacinal') or public.hpsr_can_edit_vaccination());
drop policy if exists "vaccination card medical read" on public.clinical_records;
create policy "vaccination card medical read"
on public.clinical_records as restrictive for select to authenticated
using (record_type <> 'CadernetaVacinal' or public.hpsr_can_edit_vaccination());

create or replace function public.hpsr_guard_vaccination_writes()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare target_type text;
begin
  if tg_op = 'DELETE' then target_type := old.record_type;
  else target_type := new.record_type; end if;
  if target_type in ('Vacina', 'CadernetaVacinal')
     or (tg_op = 'UPDATE' and old.record_type in ('Vacina','CadernetaVacinal')) then
    if coalesce(auth.role(), '') <> 'service_role' and not public.hpsr_can_edit_vaccination() then
      raise exception 'Somente médicos aprovados podem alterar registros de vacinação.' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;
drop trigger if exists hpsr_vaccination_write_guard on public.clinical_records;
create trigger hpsr_vaccination_write_guard before insert or update or delete
on public.clinical_records for each row execute function public.hpsr_guard_vaccination_writes();

-- Um documento para cada combinação paciente/modelo; cada dose ocupa uma única caixa.
-- Registros legados sem cardModel/slotId não sofrem mudanças.
create unique index if not exists vaccination_card_clinical_model_unique
on public.clinical_records (patient_passport, (payload->>'cardModel'))
where record_type = 'CadernetaVacinal' and coalesce(payload->>'cardModel','') <> '';
create unique index if not exists vaccination_clinical_dose_unique
on public.clinical_records (patient_passport, (payload->>'cardModel'), (payload->'vaccine'->>'slotId'))
where record_type = 'Vacina' and coalesce(payload->>'cardModel','') <> ''
  and coalesce(payload->'vaccine'->>'slotId','') <> '';

-- Somente o bucket privado é novo. O bucket obstétrico e suas regras não são alterados.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('vaccination-cards','vaccination-cards',false,10485760,array['image/png'])
on conflict (id) do update set public = false;
drop policy if exists "vaccination doctors read images" on storage.objects;
create policy "vaccination doctors read images" on storage.objects for select to authenticated
using (bucket_id = 'vaccination-cards' and public.hpsr_can_edit_vaccination());
drop policy if exists "vaccination doctors upload images" on storage.objects;
create policy "vaccination doctors upload images" on storage.objects for insert to authenticated
with check (bucket_id = 'vaccination-cards' and public.hpsr_can_edit_vaccination()
  and exists (select 1 from public.clinical_records c
    where c.id = (storage.foldername(name))[1] and c.record_type = 'CadernetaVacinal'));
drop policy if exists "vaccination bucket medical read guard" on storage.objects;
create policy "vaccination bucket medical read guard" on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'vaccination-cards' or public.hpsr_can_edit_vaccination());
drop policy if exists "vaccination bucket medical insert guard" on storage.objects;
create policy "vaccination bucket medical insert guard" on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'vaccination-cards' or public.hpsr_can_edit_vaccination());
commit;
