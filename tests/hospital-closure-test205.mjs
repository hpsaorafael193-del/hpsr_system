import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(process.env.HPSR_PGLITE ? pathToFileURL(process.env.HPSR_PGLITE) : '@electric-sql/pglite');
const db = new PGlite();
const admin = '00000000-0000-4000-8000-000000000001';
const doctor = '00000000-0000-4000-8000-000000000002';
try {
await db.exec(`
 create role anon; create role authenticated; create role service_role;
 create schema auth; create schema storage; create schema hpsr_private;
 grant usage on schema auth,storage,hpsr_private to authenticated,service_role;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function public.hpsr_can_access_internal() returns boolean language sql stable as $$ select auth.uid() = '${admin}'::uuid $$;
 create function public.is_access_admin() returns boolean language sql stable as $$ select public.hpsr_can_access_internal() $$;
 create table public.profiles (id uuid primary key, access_status text, crm text, role text, name text);
 insert into public.profiles values ('${admin}','Aprovado','123','Diretora','Anny'), ('${doctor}','Aprovado','456','Médico','Luidhy');
 create table public.clinical_records (
   id text primary key, record_type text, is_confidential boolean, payload jsonb, released_render_payload jsonb,
   released_at timestamptz, released_by uuid, confidentiality_updated_at timestamptz, confidentiality_updated_by uuid, updated_at timestamptz);
 insert into public.clinical_records (id,record_type,is_confidential,payload) values
   ('e','Exame',true,'{"title":"Exame existente"}'), ('d','Documento',true,'{"title":"Documento existente"}');
 create table public.system_activities(id text primary key,module text,action text,description text,actor text,reference text);
 create table public.appointments(id text primary key);
 create table public.followup_intake_forms(id text primary key);
 create table public.staff_applications(id text primary key);
 create table public.exam_editor_drafts(id text primary key);
 create table public.patient_portal_sessions(id text primary key);
 create table public.patient_access_codes(id text primary key);
 create table public.patient_accounts(id text primary key);
 create table public.patient_portal_access(id text primary key);
 create table storage.objects(id text primary key);
 alter table storage.objects enable row level security;
 create policy test_storage on storage.objects for all to authenticated using(true) with check(true);
 grant select,insert,update,delete on all tables in schema public,storage to authenticated,service_role;
 grant insert on public.appointments to anon;
`);
const currentRelease=fs.readFileSync('supabase/migrations/20261020142925_clinical_visibility_lightweight_result.sql','utf8');
await db.exec(currentRelease.slice(currentRelease.indexOf('create or replace function hpsr_private'),currentRelease.indexOf('CREATE OR REPLACE FUNCTION public.set_clinical_record_confidentiality')));
await db.exec(currentRelease.slice(currentRelease.indexOf('create or replace function public.set_clinical_record_visibility')));
await db.exec(fs.readFileSync('supabase/migrations/20261113233000_hospital_closure_mode.sql','utf8'));
const as = async (role, user='') => db.exec(`reset role; set role ${role}; set request.jwt.claim.sub='${user}';`);
const active = async () => (await db.query('select public.hpsr_closure_active() as active')).rows[0].active;
await as('anon');
assert.equal(await active(),false);
await db.exec("insert into public.appointments values ('before')");
await assert.rejects(db.exec("select public.hpsr_set_closure_mode(true)"),/permission denied/i);
await as('authenticated',doctor);
await assert.rejects(db.exec("select public.hpsr_set_closure_mode(true)"),/restrito/);
await as('authenticated',admin);
await db.exec("select public.hpsr_set_closure_mode(true)");
assert.equal(await active(),true);
await as('anon');
await assert.rejects(db.exec("insert into public.appointments values ('after')"),/encerrando/);
await as('service_role');
await assert.rejects(db.exec("insert into public.appointments values ('after')"),/encerrando/);
await db.exec("insert into public.patient_portal_sessions values ('existing-account-session')");
await as('authenticated',doctor);
for (const statement of [
 "insert into public.appointments values ('after')",
 "delete from public.appointments where id='before'",
 "insert into public.staff_applications values ('new')",
 "insert into public.followup_intake_forms values ('new')",
 "insert into public.exam_editor_drafts values ('new')",
 "insert into public.clinical_records (id,record_type) values ('new','Exame')",
 "update public.clinical_records set payload='{}' where id='e'",
 "update public.clinical_records set is_confidential=false where id='e'",
 "select public.set_clinical_record_visibility('d',false)",
]) await assert.rejects(db.exec(statement),/encerrando/);
await assert.rejects(db.exec("insert into storage.objects values ('new')"),/row-level security/);
const result = (await db.query("select public.set_clinical_record_visibility('e',false) as result")).rows[0].result;
assert.equal(result.is_confidential,false);
const record=(await db.query("select payload, released_render_payload from public.clinical_records where id='e'")).rows[0];
assert.equal(record.payload.title,'Exame existente');
assert.equal(record.released_render_payload.title,'Exame existente');
await assert.rejects(db.exec("select public.set_clinical_record_visibility('e',true)"),/encerrando/);
await assert.rejects(db.exec("select public.set_clinical_record_visibility('e',false)"),/encerrando/);
await as('authenticated',admin);
await db.exec("select public.hpsr_set_closure_mode(false)");
assert.equal(await active(),false);
await db.exec("insert into public.appointments values ('reopened')");
assert.equal((await db.query("select count(*)::int as n from public.appointments")).rows[0].n,2);
console.log('PASS closure: authorization, off/on/off, anon/staff/service writes, storage, sessions and existing exam release');
} finally { await db.close(); }
