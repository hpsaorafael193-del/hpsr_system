// Local QA uses @electric-sql/pglite 0.5.11; set HPSR_PGLITE_MODULE to its module path.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require(process.env.HPSR_PGLITE_MODULE || '@electric-sql/pglite');
const owner='11111111-1111-4111-8111-111111111111',admin='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333';
const plan='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',visit='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
(async()=>{
 const db=new PGlite();await db.exec(`
 create role authenticated;create role anon;create schema auth;create schema hpsr_private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key,name text,role text,access_status text);
 insert into profiles values('${owner}','Anny','Médico Especialista','Aprovado'),('${admin}','Luidhy','Vice Diretor / Dev','Aprovado'),('${other}','Outro','Médico Especialista','Aprovado');
 create table patient_doctor_links(doctor_id uuid,patient_passport text);
 insert into patient_doctor_links values('${owner}','TEST-COVERAGE');
 create table clinical_followup_plans(id uuid primary key,doctor_id uuid,doctor_name text,patient_passport text,patient_name text,plan_type text,specialty text,consultation_schedule jsonb,planning_document_path text,planning_document_versions jsonb,planning_notes text,start_date date,end_date date,updated_at timestamptz);
 create table clinical_followup_occurrences(id uuid primary key,plan_id uuid,doctor_id uuid,patient_passport text,specialty text,step_number int,planned_date date,planned_text text,evolution_text text,medical_observation_text text,conduct_text text,followup_report jsonb,rp_marker text,step_title text,individual_document_path text,individual_document_versions jsonb,individual_released_at timestamptz,individual_released_document_path text,individual_released_snapshot jsonb,updated_at timestamptz);
 create table clinical_records(id text primary key,patient_passport text,record_type text,payload jsonb,created_by uuid,is_confidential boolean,updated_at timestamptz);
 create function public.hpsr_normalize_specialty(input text) returns text language sql as $$select lower(input)$$;
 create function public.hpsr_can_manage_reproductive_patient(d uuid,p text,k text) returns boolean language sql stable as $$select d=auth.uid() and exists(select 1 from public.patient_doctor_links where doctor_id=d and patient_passport=p)$$;
 create function public.hpsr_can_write_reproductive_occurrence(p uuid,d uuid,passport text,s text) returns boolean language sql stable as $$select d=auth.uid()$$;
 alter table clinical_followup_plans enable row level security;alter table clinical_followup_occurrences enable row level security;alter table clinical_records enable row level security;
 create policy view_plans on clinical_followup_plans for select to authenticated using(true);
 create policy own_plans on clinical_followup_plans for update to authenticated using(doctor_id=auth.uid()) with check(doctor_id=auth.uid());
 create policy "hpsr reproductive plan update guard" on clinical_followup_plans as restrictive for update to authenticated using(doctor_id=auth.uid()) with check(doctor_id=auth.uid());
 create policy view_occurrences on clinical_followup_occurrences for select to authenticated using(true);
 create policy own_occurrences on clinical_followup_occurrences for update to authenticated using(doctor_id=auth.uid()) with check(doctor_id=auth.uid());
 create policy "hpsr reproductive occurrence update guard" on clinical_followup_occurrences as restrictive for update to authenticated using(doctor_id=auth.uid()) with check(doctor_id=auth.uid());
 create policy staff_clinical on clinical_records for all to authenticated using(true) with check(true);
 create policy "hpsr reproductive clinical update guard" on clinical_records as restrictive for update to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
 grant usage on schema auth,public to authenticated;grant select,insert,update on all tables in schema public to authenticated;
 `);
 await db.exec(fs.readFileSync(path.join(__dirname,'../sql/reproductive-temporary-coverage.sql'),'utf8'));
 await db.exec(`insert into clinical_followup_plans values('${plan}','${owner}','Anny','TEST-COVERAGE','Paciente de teste','gestacional','Obstetra','[{"number":1,"planned_text":"Plano original"}]',null,'[]','Observações originais','2026-10-01','2026-11-01','2026-10-01');
 insert into clinical_followup_occurrences(id,plan_id,doctor_id,patient_passport,specialty,step_number,planned_date,planned_text,evolution_text,followup_report,individual_document_versions,updated_at) values('${visit}','${plan}','${owner}','TEST-COVERAGE','Obstetra',1,'2026-10-01','Plano original','Evolução original','{}','[]','2026-10-01');
 insert into clinical_records values('followup-${visit}','TEST-COVERAGE','Evolução obstétrica','{"followupPlanId":"${plan}","followupOccurrenceId":"${visit}"}','${owner}',true,now());`);
 async function as(id){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`);}
 const current=async()=> (await db.query(`select * from clinical_followup_occurrences where id='${visit}'`)).rows[0];
 async function save(update,release=false,version){const row=await current();return (await db.query(`select public.save_reproductive_individual_atomic('${visit}',${q(JSON.stringify(update))}::jsonb,${release===null?'null':release},${q(version||row.updated_at.toISOString())}) result`)).rows[0].result;}
 await as(other);await assert.rejects(save({planned_text:'Intrusão'}),e=>e.code==='42501');assert.equal((await current()).evolution_text,'Evolução original');
 await as(admin);
 const direct=await db.query(`update clinical_followup_occurrences set evolution_text='Escrita direta' where id='${visit}' returning id`);assert.equal(direct.rows.length,0);
 const payload={planned_text:'Plano em cobertura',evolution_text:'Atendimento por Luidhy',medical_observation_text:'Orientações',followup_report:{exams_performed:'Exame de teste'},individual_released_snapshot:{plan_id:plan,occurrence_id:visit,doctor_name:'Assinatura falsa',evolution_text:'Atendimento por Luidhy'}};
 const saved=await save(payload,true);let row=await current();assert.equal(row.doctor_id,owner);assert.equal(row.performed_by,admin);assert.equal(row.performed_by_name,'Luidhy');assert.equal(row.individual_released_snapshot.doctor_name,'Luidhy');assert.equal(row.individual_released_snapshot.responsible_doctor_name,'Anny');assert.equal(row.individual_document_versions[0].evolution_text,'Evolução original');assert.equal(row.individual_document_versions[0].performed_by,owner);
 let p=(await db.query(`select * from clinical_followup_plans where id='${plan}'`)).rows[0];assert.equal(p.doctor_id,owner);assert.equal(p.doctor_name,'Anny');assert.equal(p.planning_notes,'Observações originais');assert.equal(p.consultation_schedule[0].planned_text,'Plano em cobertura');
 let record=(await db.query(`select * from clinical_records where id='followup-${visit}'`)).rows[0];assert.equal(record.created_by,owner);assert.equal(record.payload.doctor.id,admin);assert.equal(record.payload.responsibleDoctor.id,owner);
 assert.equal((await db.query(`select current_setting('hpsr.coverage_context',true) context`)).rows[0].context,'');
 await assert.rejects(save(payload,false,'2026-10-01'),e=>e.code==='40001');assert.equal((await current()).individual_released_snapshot.doctor_name,'Luidhy');
 const before=(await current()).evolution_text;await assert.rejects(save({...payload,evolution_text:'Não deve persistir',individual_released_snapshot:{plan_id:plan,occurrence_id:'errado'}},true));assert.equal((await current()).evolution_text,before);
 await as(owner);await save({...payload,planned_text:'Plano retomado',evolution_text:'Anny retomou'},false);row=await current();assert.equal(row.performed_by,owner);assert.equal(row.doctor_id,owner);assert.equal(row.individual_released_at,null);assert(row.individual_document_versions.some(version=>version.saved_by_name==='Anny' && version.evolution_text==='Atendimento por Luidhy'));
 // Cover a previously unrecorded occurrence: returning owner can update a record created by coverage.
 await db.exec(`reset role;delete from clinical_records where id='followup-${visit}';`);
 await as(admin);await save(payload,true);record=(await db.query(`select * from clinical_records where id='followup-${visit}'`)).rows[0];assert.equal(record.created_by,admin);
 await as(owner);await save({...payload,evolution_text:'Retomada após cobertura'},null);record=(await db.query(`select * from clinical_records where id='followup-${visit}'`)).rows[0];assert.equal(record.created_by,admin);assert.equal(record.payload.doctor.id,owner);assert.equal((await current()).individual_released_snapshot.doctor_name,'Luidhy');
 // IVF uses the same scoped save, without adding or moving plans.
 const fivPlan='cccccccc-cccc-4ccc-8ccc-cccccccccccc',fivVisit='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 await db.exec(`reset role;insert into clinical_followup_plans select '${fivPlan}',doctor_id,doctor_name,'FIV-PATIENT','Doadora','in_vitro','Ginecologia',consultation_schedule,planning_document_path,planning_document_versions,planning_notes,start_date,end_date,updated_at from clinical_followup_plans where id='${plan}';
 insert into clinical_followup_occurrences(id,plan_id,doctor_id,patient_passport,specialty,step_number,planned_date,updated_at,individual_document_versions) values('${fivVisit}','${fivPlan}','${owner}','FIV-PATIENT','Ginecologia',1,'2026-10-01','2026-10-01','[]');`);
 await as(admin);await db.query(`select public.save_reproductive_individual_atomic('${fivVisit}','{"planned_text":"FIV em cobertura","evolution_text":"Registro FIV","followup_report":{}}',null,'2026-10-01')`);
 const fiv=(await db.query(`select * from clinical_followup_occurrences where id='${fivVisit}'`)).rows[0];assert.equal(fiv.performed_by,admin);assert.equal(fiv.doctor_id,owner);assert.equal((await db.query('select count(*) n from clinical_followup_plans')).rows[0].n,2);
 await as(owner);await db.exec(`reset role;delete from patient_doctor_links where doctor_id='${owner}';`);await as(owner);await assert.rejects(save(payload),e=>e.code==='42501');
 const privileged=(await db.query("select count(*) n from pg_proc where proname in ('save_reproductive_individual_atomic','hpsr_coverage_write_allowed','hpsr_coverage_clinical_write_allowed','attribute_reproductive_occurrence') and prosecdef")).rows[0].n;assert.equal(privileged,0);
 await as(admin);await db.exec(`reset role;update profiles set access_status='Inativo' where id='${admin}';`);await as(admin);await assert.rejects(save(payload),e=>e.code==='42501');
 await db.exec('reset role;set role anon;');await assert.rejects(db.query(`select public.save_reproductive_individual_atomic('${visit}','{}',false,now())`),e=>e.code==='42501');
 console.log('PASS: real PostgreSQL RLS: scoped coverage, denied direct/outsider/inactive/anonymous writes, owner unchanged, author stamped, original history preserved, concurrency, atomic rollback, release/revocation and original doctor resumes.');
 await db.close();
})().catch(e=>{console.error(e);process.exit(1)});
