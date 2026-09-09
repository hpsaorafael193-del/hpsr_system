-- v1.0.338 — endurecimento das funções auxiliares da Mudança 2.
-- As policies existentes em profiles já permitem leitura da equipe autenticada,
-- então não há necessidade de SECURITY DEFINER nestas validações.

create or replace function public.hpsr_is_patient_link_admin()
returns boolean
language sql
stable
security invoker
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
security invoker
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
