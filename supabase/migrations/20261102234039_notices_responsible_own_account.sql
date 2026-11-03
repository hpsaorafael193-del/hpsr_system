-- Responsáveis adultos classificados em Pediatria mantêm o destino na própria conta.
create or replace function hpsr_notice_private.patient_targets()
returns table(source_passport text,recipient_id uuid,recipient_name text,source_name text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno.' using errcode='42501'; end if;
 return query
 with people as materialized (
 select r.passport,r.name,
   (case when lower(btrim(coalesce(r.age,''))) ~ '^[0-9]{1,3}( (ano|anos|mes|meses))?$' then
      case when lower(r.age) ~ 'mes' then substring(r.age from '[0-9]+')::int < 216 else substring(r.age from '[0-9]+')::int < 18 end
    else false end
    or exists(select 1 from public.patient_guardian_links l where l.child_passport=r.passport)
    or (lower(btrim(coalesce(r.age,''))) !~ '^[0-9]{1,3}( (ano|anos|mes|meses))?$' and lower(coalesce(r.follow_up,'')) like '%pediatr%' and not exists(select 1 from public.patient_guardian_links l join public.patient_accounts a on a.user_id=l.guardian_user_id or (l.guardian_user_id is null and a.patient_passport=l.guardian_passport) where a.patient_passport=r.passport))
    or (coalesce(btrim(r.age),'')='' and exists(select 1 from public.appointments a where a.passport=r.passport and lower(btrim(a.payload->>'specialty')) in ('pediatria','pediatra'))
       and not exists(select 1 from public.patient_guardian_links l join public.patient_accounts a on a.user_id=l.guardian_user_id or (l.guardian_user_id is null and a.patient_passport=l.guardian_passport) where a.patient_passport=r.passport))
   ) as child
 from public.patient_registry r
 ), resolved as (
 select p.passport,a.user_id,coalesce(nullif(a.display_name,''),p.name) as account_name,p.name as patient_name
 from people p join public.patient_accounts a on a.patient_passport=p.passport where not p.child
 union
 select p.passport,a.user_id,coalesce(nullif(a.display_name,''),g.name,'Responsável') as account_name,p.name as patient_name
 from people p join public.patient_guardian_links l on l.child_passport=p.passport
 join public.patient_accounts a on (l.guardian_user_id=a.user_id or (l.guardian_user_id is null and l.guardian_passport=a.patient_passport))
 left join public.patient_registry g on g.passport=a.patient_passport
 where p.child and l.access_status='authorized' and l.portal_access and l.revoked_at is null
 and coalesce(a.patient_passport,'')<>p.passport
 union
 select null::text,a.user_id,coalesce(nullif(a.display_name,''),'Responsável'),'Conta de responsável'
 from public.patient_accounts a where a.patient_passport is null
 )
 select distinct r.passport,r.user_id,r.account_name,r.patient_name from resolved r
 join public.patient_accounts a on a.user_id=r.user_id
 where exists(select 1 from public.patient_portal_access x where x.access_enabled and
 (x.user_id=r.user_id or (x.user_id is null and x.patient_passport=a.patient_passport)));
end; $$;
