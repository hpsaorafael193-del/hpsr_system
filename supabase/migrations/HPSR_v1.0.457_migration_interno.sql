-- v1.0.457 — Central Interno; sem novas tabelas, sem alteração de prontuários ou vínculos existentes.
-- A identidade do Dev já está protegida por system_owner_identity.
begin;

alter table public.system_owner_identity
  add column if not exists director_user_id uuid references auth.users(id) on delete restrict,
  add column if not exists director_email text;

-- Registra a Diretora atualmente aprovada sem usar ID fixo e exige identidade inequívoca.
do $$
declare v_id uuid; v_email text; v_n integer;
begin
  select count(*),min(id::text)::uuid,min(email) into v_n,v_id,v_email
  from public.profiles where role='Diretora' and access_status='Aprovado';
  if v_n <> 1 or nullif(trim(coalesce(v_email,'')),'') is null then
    raise exception 'É necessária exatamente uma Diretora aprovada e com e-mail antes desta migration';
  end if;
  if exists(select 1 from public.system_owner_identity where singleton=true
        and director_user_id is not null and director_user_id<>v_id) then
    raise exception 'Diretora exclusiva já vinculada a outra identidade; revisão manual necessária';
  end if;
  update public.system_owner_identity set director_user_id=v_id,director_email=v_email,updated_at=now()
   where singleton=true;
  if not found then raise exception 'Identidade do desenvolvedor não configurada'; end if;
end $$;

-- Uma única função de autorização para toda a área Interno: ID + cargo + aprovação.
create or replace function public.hpsr_can_access_internal()
returns boolean language sql stable security definer set search_path='' as $fn$
  select exists(
    select 1 from public.profiles p
      cross join public.system_owner_identity oi
    where oi.singleton=true and p.id=(select auth.uid()) and p.access_status='Aprovado'
      and ((p.id=oi.user_id and p.role='Vice Diretor / Dev'
           and lower(trim(p.email))=lower(trim(oi.email)))
        or (p.id=oi.director_user_id and p.role='Diretora'
           and lower(trim(p.email))=lower(trim(oi.director_email))))
  );
$fn$;
revoke all on function public.hpsr_can_access_internal() from public, anon;
grant execute on function public.hpsr_can_access_internal() to authenticated, service_role;

-- Outros diretores e vice-diretores não herdam acesso às aprovações.
create or replace function public.hpsr_can_manage_guardian_links()
returns boolean language sql stable security definer set search_path='' as $fn$
  select public.hpsr_can_access_internal();
$fn$;
revoke all on function public.hpsr_can_manage_guardian_links() from public, anon;
grant execute on function public.hpsr_can_manage_guardian_links() to authenticated,service_role;

-- Impede concessão ou remoção acidental do cargo exclusivo da Anne.
create or replace function public.hpsr_protect_director_role()
returns trigger language plpgsql security definer set search_path='' as $fn$
declare d_id uuid; d_mail text;
begin
  select director_user_id,director_email into d_id,d_mail
  from public.system_owner_identity where singleton=true;
  if d_id is null then raise exception 'Identidade exclusiva da Diretora não configurada'; end if;
  if new.role='Diretora' and (new.id is distinct from d_id
       or lower(trim(coalesce(new.email,'')))<>lower(trim(d_mail))) then
    raise exception 'O cargo Diretora é exclusivo da identidade autorizada';
  end if;
  if new.id=d_id and (new.role<>'Diretora'
     or lower(trim(coalesce(new.email,'')))<>lower(trim(d_mail))) then
    raise exception 'A identidade exclusiva da Diretora não pode ser alterada por este fluxo';
  end if;
  return new;
end;
$fn$;
drop trigger if exists hpsr_protect_director_role_trigger on public.profiles;
create trigger hpsr_protect_director_role_trigger before insert or update of role,email
on public.profiles for each row execute function public.hpsr_protect_director_role();

-- Mantém a proibição anterior para o Dev e acrescenta Diretora na triagem de cargos.
create or replace function public.block_exclusive_role_registration_request()
returns trigger language plpgsql security definer set search_path='' as $fn$
begin
  if new.requested_role in ('Vice Diretor / Dev','Diretor Técnico / Dev','Diretora')
     or coalesce(new.payload->>'requestedRole','') in ('Vice Diretor / Dev','Diretor Técnico / Dev','Diretora') then
    raise exception 'Este cargo é exclusivo da administração do HPSR e não pode ser solicitado';
  end if;
  return new;
end;
$fn$;

-- Correções administrativas limitadas a campos não clínicos e sempre justificadas.
-- Não altera passaporte: mudanças de ID exigem avaliação de todos os vínculos externos.
create or replace function public.hpsr_internal_correct_patient(
  p_passport text,p_name text,p_age text,p_reason text
) returns jsonb language plpgsql security definer set search_path='' as $fn$
declare old_row public.patient_registry%rowtype; n text; age_text text; reason_text text;
begin
  if not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno' using errcode='42501'; end if;
  n:=trim(regexp_replace(coalesce(p_name,''),'\s+',' ','g'));
  age_text:=trim(coalesce(p_age,'')); reason_text:=trim(coalesce(p_reason,''));
  if length(n)<2 or length(n)>160 or length(age_text)>60 or length(reason_text)<10 or length(reason_text)>400 then
    raise exception 'Informe nome, idade e justificativa de pelo menos 10 caracteres' using errcode='22023';
  end if;
  select * into old_row from public.patient_registry where passport=upper(trim(p_passport)) for update;
  if not found then raise exception 'Paciente não localizado' using errcode='22023'; end if;
  if old_row.name is not distinct from n and old_row.age is not distinct from nullif(age_text,'') then
    return jsonb_build_object('updated',false,'message','Nenhuma alteração necessária');
  end if;
  update public.patient_registry set name=n,age=nullif(age_text,''),updated_at=now() where passport=old_row.passport;
  insert into public.system_activities(id,module,action,description,actor,reference)
    select 'HPSR-INT-'||gen_random_uuid()::text,'Interno','Correção cadastral',
      'Nome: '||old_row.name||' → '||n||'; idade: '||coalesce(old_row.age,'—')||' → '||coalesce(nullif(age_text,''),'—')||'. Motivo: '||reason_text,
      p.name,old_row.passport from public.profiles p where p.id=(select auth.uid());
  return jsonb_build_object('updated',true,'passport',old_row.passport);
end;
$fn$;
revoke all on function public.hpsr_internal_correct_patient(text,text,text,text) from public,anon;
grant execute on function public.hpsr_internal_correct_patient(text,text,text,text) to authenticated;

-- Ocorrências administrativas no histórico existente, sem guardar dados clínicos ou anexos.
create or replace function public.hpsr_internal_create_issue(p_title text,p_category text,p_description text)
returns text language plpgsql security definer set search_path='' as $fn$
declare ref text:='INT-'||gen_random_uuid()::text; title_text text; description_text text;
begin
  if not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno' using errcode='42501'; end if;
  title_text:=trim(coalesce(p_title,'')); description_text:=trim(coalesce(p_description,''));
  if length(title_text)<4 or length(title_text)>120 or length(description_text)>1200
    or p_category not in ('Cadastro','Vínculo','Acesso','Agendamento','Sistema','Outro') then
    raise exception 'Dados da ocorrência inválidos' using errcode='22023';
  end if;
  insert into public.system_activities(id,module,action,description,actor,reference)
    select 'HPSR-'||ref,'Interno','Ocorrência registrada',p_category||' — '||title_text||case when description_text<>'' then ': '||description_text else '' end,p.name,ref
    from public.profiles p where p.id=(select auth.uid());
  return ref;
end;
$fn$;
revoke all on function public.hpsr_internal_create_issue(text,text,text) from public,anon;
grant execute on function public.hpsr_internal_create_issue(text,text,text) to authenticated;

create or replace function public.hpsr_internal_resolve_issue(p_reference text,p_resolution text)
returns boolean language plpgsql security definer set search_path='' as $fn$
declare ref text:=trim(coalesce(p_reference,'')); note text:=trim(coalesce(p_resolution,''));
begin
  if not public.hpsr_can_access_internal() then raise exception 'Acesso restrito ao Interno' using errcode='42501'; end if;
  if length(note)<8 or length(note)>600 then raise exception 'Informe uma resolução com pelo menos 8 caracteres' using errcode='22023'; end if;
  if not exists(select 1 from public.system_activities where module='Interno' and action='Ocorrência registrada' and reference=ref) then
    raise exception 'Ocorrência não encontrada' using errcode='22023';
  end if;
  if exists(select 1 from public.system_activities where module='Interno' and action='Ocorrência resolvida' and reference=ref) then
    raise exception 'Ocorrência já resolvida' using errcode='23505';
  end if;
  insert into public.system_activities(id,module,action,description,actor,reference)
    select 'HPSR-INT-'||gen_random_uuid()::text,'Interno','Ocorrência resolvida',note,p.name,ref
    from public.profiles p where p.id=(select auth.uid());
  return true;
end;
$fn$;
revoke all on function public.hpsr_internal_resolve_issue(text,text) from public,anon;
grant execute on function public.hpsr_internal_resolve_issue(text,text) to authenticated;

-- Entradas da área Interno não ficam visíveis para funcionários sem autorização.
drop policy if exists "hpsr internal activity read" on public.system_activities;
create policy "hpsr internal activity read" on public.system_activities as restrictive
for select to authenticated using (module <> 'Interno' or (select public.hpsr_can_access_internal()));
drop policy if exists "hpsr internal activity insert" on public.system_activities;
create policy "hpsr internal activity insert" on public.system_activities as restrictive
for insert to authenticated with check (module <> 'Interno');
drop policy if exists "hpsr internal activity write guard" on public.system_activities;
create policy "hpsr internal activity write guard" on public.system_activities as restrictive
for update to authenticated using (module <> 'Interno') with check (module <> 'Interno');
drop policy if exists "hpsr internal activity delete guard" on public.system_activities;
create policy "hpsr internal activity delete guard" on public.system_activities as restrictive
for delete to authenticated using (module <> 'Interno');

commit;
