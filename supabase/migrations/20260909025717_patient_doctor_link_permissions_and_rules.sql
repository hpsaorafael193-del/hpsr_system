-- v1.0.338 — Mudança 2: regras e permissões dos vínculos paciente + médico + especialidade.
-- Não integra Agenda/Portal e não implementa encerramento/histórico operacional ainda.

create or replace function public.hpsr_is_patient_link_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
      from public.profiles p
     where p.id = auth.uid()
       and coalesce(p.access_status, 'Aprovado') = 'Aprovado'
       and p.role in ('Diretor Técnico / Dev', 'Diretora', 'Vice Diretor')
  );
$function$;

revoke all on function public.hpsr_is_patient_link_admin() from public, anon;
grant execute on function public.hpsr_is_patient_link_admin() to authenticated;

create or replace function public.hpsr_doctor_has_specialty(
  target_doctor_id uuid,
  target_specialty text
)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
      from public.profiles p
     where p.id = target_doctor_id
       and coalesce(p.access_status, 'Aprovado') = 'Aprovado'
       and public.hpsr_normalize_specialty(target_specialty) <> ''
       and exists (
         select 1
           from regexp_split_to_table(coalesce(p.specialty, ''), '[,;/|]+') token
          where public.hpsr_normalize_specialty(token)
                = public.hpsr_normalize_specialty(target_specialty)
       )
  );
$function$;

revoke all on function public.hpsr_doctor_has_specialty(uuid, text) from public, anon;
grant execute on function public.hpsr_doctor_has_specialty(uuid, text) to authenticated;

create unique index patient_doctor_links_patient_normalized_specialty_key
  on public.patient_doctor_links (
    patient_passport,
    public.hpsr_normalize_specialty(specialty)
  );

create or replace function public.hpsr_validate_patient_doctor_link()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if not public.hpsr_doctor_has_specialty(new.doctor_id, new.specialty) then
    raise exception using
      errcode = '23514',
      message = 'A especialidade informada não pertence ao médico selecionado.';
  end if;

  return new;
end;
$function$;

revoke all on function public.hpsr_validate_patient_doctor_link() from public, anon;
grant execute on function public.hpsr_validate_patient_doctor_link() to authenticated, service_role;

drop trigger if exists trg_validate_patient_doctor_link on public.patient_doctor_links;
create trigger trg_validate_patient_doctor_link
before insert or update of doctor_id, specialty
on public.patient_doctor_links
for each row
execute function public.hpsr_validate_patient_doctor_link();

revoke all on table public.patient_doctor_links from anon, authenticated;
grant select, insert, update on table public.patient_doctor_links to authenticated;

revoke all on table public.patient_doctor_link_history from anon, authenticated;
grant select on table public.patient_doctor_link_history to authenticated;

create policy "links select own or admin"
on public.patient_doctor_links
for select
to authenticated
using (
  (select auth.uid()) = doctor_id
  or public.hpsr_is_patient_link_admin()
);

create policy "links insert own or admin"
on public.patient_doctor_links
for insert
to authenticated
with check (
  (
    (select auth.uid()) = doctor_id
    or public.hpsr_is_patient_link_admin()
  )
  and public.hpsr_doctor_has_specialty(doctor_id, specialty)
);

create policy "links update own or admin"
on public.patient_doctor_links
for update
to authenticated
using (
  (select auth.uid()) = doctor_id
  or public.hpsr_is_patient_link_admin()
)
with check (
  (
    (select auth.uid()) = doctor_id
    or public.hpsr_is_patient_link_admin()
  )
  and public.hpsr_doctor_has_specialty(doctor_id, specialty)
);

create policy "link history select own or admin"
on public.patient_doctor_link_history
for select
to authenticated
using (
  (select auth.uid()) = doctor_id
  or public.hpsr_is_patient_link_admin()
);

comment on function public.hpsr_is_patient_link_admin() is
  'Autoriza gerenciamento administrativo de vínculos para Diretora, Vice Diretor e Diretor Técnico / Dev.';
comment on function public.hpsr_doctor_has_specialty(uuid, text) is
  'Valida se a especialidade normalizada pertence a um perfil médico aprovado.';
comment on trigger trg_validate_patient_doctor_link on public.patient_doctor_links is
  'Garante no banco que todo vínculo use uma especialidade pertencente ao médico.';
