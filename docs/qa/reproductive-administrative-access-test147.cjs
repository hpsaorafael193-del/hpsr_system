// Local verification uses @electric-sql/pglite 0.5.11.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require(process.env.HPSR_PGLITE_MODULE || '@electric-sql/pglite');
const owner='11111111-1111-4111-8111-111111111111',admin='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333';
const plan='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',visit='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
(async()=>{
 const db=new PGlite();await db.exec(`
 create role authenticated;create role anon;create schema auth;create schema hpsr_private;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key,name text,role text,access_status text,specialty text default 'Obstetra;Ginecologia');
 insert into profiles(id,name,role,access_status) values('${owner}','Anny','Médico Especialista','Aprovado'),('${admin}','Luidhy','Vice Diretor / Dev','Aprovado'),('${other}','Outro','Médico Especialista','Aprovado');
 create table patient_registry(passport text primary key,name text);insert into patient_registry values('TEST-COVERAGE','Paciente de teste'),('FIV-PATIENT','Doadora');
 create table patient_doctor_links(doctor_id uuid,patient_passport text,specialty text default 'Obstetra;Ginecologia');
 insert into patient_doctor_links(doctor_id,patient_passport) values('${owner}','TEST-COVERAGE');
 create table clinical_followup_plans(id uuid primary key,doctor_id uuid,doctor_name text,patient_passport text,patient_name text,plan_type text,specialty text,consultation_schedule jsonb,planning_document_path text,planning_document_versions jsonb,planning_notes text,start_date date,end_date date,updated_at timestamptz,frequency text,interval_days int,total_consultations int,total_weeks int,status text,schedule_confirmed_at timestamptz,portal_released_at timestamptz,planning_released_document_path text,planning_released_snapshot jsonb,fiv_project_id uuid,fiv_role text);
 create table clinical_followup_occurrences(id uuid primary key,plan_id uuid,doctor_id uuid,patient_passport text,specialty text,step_number int,planned_date date,planned_text text,evolution_text text,medical_observation_text text,conduct_text text,followup_report jsonb,rp_marker text,step_title text,individual_document_path text,individual_document_versions jsonb,individual_released_at timestamptz,individual_released_document_path text,individual_released_snapshot jsonb,updated_at timestamptz,patient_name text,appointment_id uuid,slot_id uuid,status text,fiv_step_id uuid);
 create table clinical_records(id text primary key,patient_passport text,record_type text,payload jsonb,created_by uuid,is_confidential boolean,updated_at timestamptz);
 create function public.hpsr_can_access_obstetra() returns boolean language sql as $$select true$$;
 create function public.hpsr_reproductive_specialty_matches(s text,k text) returns boolean language sql as $$select case when k='gestacional' then lower(s) like '%obst%' else lower(s) like '%gineco%' end$$;
 create function public.hpsr_normalize_specialty(input text) returns text language sql as $$select lower(input)$$;
 create function public.hpsr_can_manage_reproductive_patient(target_doctor uuid,target_passport text,target_kind text) returns boolean language sql stable as $$select target_doctor=auth.uid() and exists(select 1 from public.patient_doctor_links where doctor_id=target_doctor and patient_passport=target_passport)$$;
 create function public.hpsr_can_write_reproductive_occurrence(p uuid,d uuid,passport text,s text) returns boolean language sql stable as $$select d=auth.uid()$$;
 alter table clinical_followup_plans enable row level security;alter table clinical_followup_occurrences enable row level security;alter table clinical_records enable row level security;
 create policy view_plans on clinical_followup_plans for select to authenticated using(true);
 create policy own_plans on clinical_followup_plans for all to authenticated using(doctor_id=auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='Vice Diretor / Dev')) with check(doctor_id=auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='Vice Diretor / Dev'));
 create policy "hpsr reproductive plan update guard" on clinical_followup_plans as restrictive for update to authenticated using(public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,plan_type)) with check(public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,plan_type));
 create policy view_occurrences on clinical_followup_occurrences for select to authenticated using(true);
 create policy own_occurrences on clinical_followup_occurrences for all to authenticated using(doctor_id=auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='Vice Diretor / Dev')) with check(doctor_id=auth.uid() or exists(select 1 from profiles where id=auth.uid() and role='Vice Diretor / Dev'));
 create policy "hpsr reproductive occurrence update guard" on clinical_followup_occurrences as restrictive for update to authenticated using(public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,'gestacional')) with check(public.hpsr_can_manage_reproductive_patient(doctor_id,patient_passport,'gestacional'));
 create policy staff_clinical on clinical_records for all to authenticated using(true) with check(true);
 create policy "hpsr reproductive clinical update guard" on clinical_records as restrictive for update to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
 grant usage on schema auth,public to authenticated;grant select,insert,update,delete on all tables in schema public to authenticated;
 `);
 await db.exec(`create policy "hpsr reproductive occurrence delete guard" on clinical_followup_occurrences as restrictive for delete to authenticated using(doctor_id=auth.uid());`);
 await db.exec(fs.readFileSync(path.join(__dirname,'../../supabase/migrations/20261026165754_natural_dev_administrative_followup_access.sql'),'utf8'));
 await db.exec(`insert into clinical_followup_plans(id,doctor_id,doctor_name,patient_passport,patient_name,plan_type,specialty,consultation_schedule,planning_document_path,planning_document_versions,planning_notes,start_date,end_date,updated_at) values('${plan}','${owner}','Anny','TEST-COVERAGE','Paciente de teste','gestacional','Obstetra','[{"number":1,"planned_text":"Plano original"}]',null,'[]','Observações originais','2026-10-01','2026-11-01','2026-10-01');
 insert into clinical_followup_occurrences(id,plan_id,doctor_id,patient_passport,specialty,step_number,planned_date,planned_text,evolution_text,followup_report,individual_document_versions,updated_at) values('${visit}','${plan}','${owner}','TEST-COVERAGE','Obstetra',1,'2026-10-01','Plano original','Evolução original','{}','[]','2026-10-01');
 insert into clinical_records values('followup-${visit}','TEST-COVERAGE','Evolução obstétrica','{"followupPlanId":"${plan}","followupOccurrenceId":"${visit}"}','${owner}',true,now());`);
 async function as(id){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`);}
 const current=async()=> (await db.query(`select * from clinical_followup_occurrences where id='${visit}'`)).rows[0];
 async function save(update,release=false,version){const row=await current();return (await db.query(`select public.save_reproductive_individual_atomic('${visit}',${q(JSON.stringify(update))}::jsonb,${release===null?'null':release},${q(version||row.updated_at.toISOString())}) result`)).rows[0].result;}
 await as(other);await assert.rejects(save({planned_text:'Intrusão'}),e=>e.code==='42501');assert.equal((await current()).evolution_text,'Evolução original');
 await as(admin);
 const direct=await db.query(`update clinical_followup_occurrences set evolution_text='Escrita direta' where id='${visit}' returning id`);assert.equal(direct.rows.length,1);await db.query(`update clinical_followup_occurrences set evolution_text='Evolução original' where id='${visit}'`);
 const payload={planned_text:'Plano em cobertura',evolution_text:'Atendimento por Luidhy',medical_observation_text:'Orientações',followup_report:{exams_performed:'Exame de teste'},individual_released_snapshot:{plan_id:plan,occurrence_id:visit,doctor_name:'Assinatura falsa',evolution_text:'Atendimento por Luidhy'}};
 const saved=await save(payload,true);let row=await current();assert.equal(row.doctor_id,owner);assert.equal(row.followup_report._author.id,admin);assert.equal(row.followup_report._author.name,'Luidhy');assert.equal(row.individual_released_snapshot.doctor_name,'Luidhy');assert.equal(row.individual_released_snapshot.responsible_doctor_name,'Anny');assert.equal(row.individual_document_versions[0].evolution_text,'Evolução original');assert.equal(row.individual_document_versions[0].author.id,owner);
 let p=(await db.query(`select * from clinical_followup_plans where id='${plan}'`)).rows[0];assert.equal(p.doctor_id,owner);assert.equal(p.doctor_name,'Anny');assert.equal(p.planning_notes,'Observações originais');assert.equal(p.consultation_schedule[0].planned_text,'Plano em cobertura');
 let record=(await db.query(`select * from clinical_records where id='followup-${visit}'`)).rows[0];assert.equal(record.created_by,owner);assert.equal(record.payload.doctor.id,admin);assert.equal(record.payload.responsibleDoctor.id,owner);

 await assert.rejects(save(payload,false,'2026-10-01'),e=>e.code==='40001');assert.equal((await current()).individual_released_snapshot.doctor_name,'Luidhy');
 const before=(await current()).evolution_text;await assert.rejects(save({...payload,evolution_text:'Não deve persistir',individual_released_snapshot:{plan_id:plan,occurrence_id:'errado'}},true));assert.equal((await current()).evolution_text,before);
 await as(owner);await save({...payload,planned_text:'Plano retomado',evolution_text:'Anny retomou'},false);row=await current();assert.equal(row.followup_report._author.id,owner);assert.equal(row.doctor_id,owner);assert.equal(row.individual_released_at,null);assert(row.individual_document_versions.some(version=>version.saved_by_name==='Anny' && version.evolution_text==='Atendimento por Luidhy'));
 // Cover a previously unrecorded occurrence: returning owner can update a record created by coverage.
 await db.exec(`reset role;delete from clinical_records where id='followup-${visit}';`);
 await as(admin);await save(payload,true);record=(await db.query(`select * from clinical_records where id='followup-${visit}'`)).rows[0];assert.equal(record.created_by,admin);
 await as(owner);await save({...payload,evolution_text:'Retomada após cobertura'},null);record=(await db.query(`select * from clinical_records where id='followup-${visit}'`)).rows[0];assert.equal(record.created_by,admin);assert.equal(record.payload.doctor.id,owner);assert.equal((await current()).individual_released_snapshot.doctor_name,'Luidhy');
 // IVF uses the same scoped save, without adding or moving plans.
 const fivPlan='cccccccc-cccc-4ccc-8ccc-cccccccccccc',fivVisit='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 await db.exec(`reset role;insert into clinical_followup_plans(id,doctor_id,doctor_name,patient_passport,patient_name,plan_type,specialty,consultation_schedule,planning_document_path,planning_document_versions,planning_notes,start_date,end_date,updated_at) select '${fivPlan}',doctor_id,doctor_name,'FIV-PATIENT','Doadora','in_vitro','Ginecologia',consultation_schedule,planning_document_path,planning_document_versions,planning_notes,start_date,end_date,updated_at from clinical_followup_plans where id='${plan}';
 insert into clinical_followup_occurrences(id,plan_id,doctor_id,patient_passport,specialty,step_number,planned_date,updated_at,individual_document_versions) values('${fivVisit}','${fivPlan}','${owner}','FIV-PATIENT','Ginecologia',1,'2026-10-01','2026-10-01','[]');`);
 await as(admin);await db.query(`select public.save_reproductive_individual_atomic('${fivVisit}','{"planned_text":"FIV em cobertura","evolution_text":"Registro FIV","followup_report":{}}',null,'2026-10-01')`);
 const fiv=(await db.query(`select * from clinical_followup_occurrences where id='${fivVisit}'`)).rows[0];assert.equal(fiv.followup_report._author.id,admin);assert.equal(fiv.doctor_id,owner);assert.equal((await db.query('select count(*) n from clinical_followup_plans')).rows[0].n,2);
 await as(admin);
 const previousPlan=(await db.query(`select * from clinical_followup_plans where id='${plan}'`)).rows[0];
 const steps=[{number:1,date:'2026-10-02',marker:'Retorno',title:'Consulta',planned_text:'Revisão administrativa'}];
 await db.query(`select public.save_gestational_planning_atomic('${plan}','TEST-COVERAGE','Nome diferente','2026-10-01','2026-11-01','Nota do desenvolvedor',${q(JSON.stringify(steps))}::jsonb,true,${q(previousPlan.updated_at.toISOString())})`);
 const editedPlan=(await db.query(`select * from clinical_followup_plans where id='${plan}'`)).rows[0];assert.equal(editedPlan.doctor_id,owner);assert.equal(editedPlan.doctor_name,'Anny');assert.equal(editedPlan.planning_released_snapshot.doctor_name,'Anny');assert.equal(editedPlan.planning_notes,'Nota do desenvolvedor');assert.equal(editedPlan.planning_document_versions.at(-1).saved_by,admin);
 // Editing an existing IVF project must preserve its owner in both the main RPC and release wrapper.
 await db.exec(`reset role;update clinical_followup_plans set fiv_project_id=id,fiv_role='gestante' where id='${fivPlan}';`);await as(admin);
 const beforeFiv=(await db.query(`select * from clinical_followup_plans where id='${fivPlan}'`)).rows[0];
 const fivSteps=[{number:1,date:'2026-10-03',marker:'Etapa',title:'FIV',planned_text:'Ajuste FIV',fiv_step_id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',fiv_recipient:'gestante'}];
 await db.query(`select public.save_fiv_patient_project_release_state('${fivPlan}','${fivPlan}','FIV-PATIENT',null,'Não deve substituir Anny','2026-10-01','2026-11-01','Ajuste',${q(JSON.stringify(fivSteps))}::jsonb,true,false,${q(JSON.stringify({[fivPlan]:beforeFiv.updated_at.toISOString()}))}::jsonb)`);
 const afterFiv=(await db.query(`select * from clinical_followup_plans where id='${fivPlan}'`)).rows[0];assert.equal(afterFiv.doctor_id,owner);assert.equal(afterFiv.doctor_name,'Anny');assert.equal(afterFiv.planning_released_snapshot.doctor_name,'Anny');
 await as(owner);await db.exec(`reset role;delete from patient_doctor_links where doctor_id='${owner}';`);await as(owner);await assert.rejects(save(payload),e=>e.code==='42501');
 const privileged=(await db.query("select count(*) n from pg_proc where proname in ('save_reproductive_individual_atomic','save_gestational_planning_atomic','save_fiv_patient_project','save_fiv_patient_project_release_state','can_administer_reproductive_followup') and prosecdef")).rows[0].n;assert.equal(privileged,0);
 await as(admin);await db.exec(`reset role;update profiles set access_status='Inativo' where id='${admin}';`);await as(admin);await assert.rejects(save(payload),e=>e.code==='42501');
 await db.exec('reset role;set role anon;');await assert.rejects(db.query(`select public.save_reproductive_individual_atomic('${visit}','{}',false,now())`),e=>e.code==='42501');
 console.log('PASS: real PostgreSQL RLS: natural Dev administrator access, denied outsider/inactive/anonymous writes, owner unchanged, author stamped, original history preserved, concurrency, atomic rollback, release/revocation and original doctor resumes.');
 await db.close();
})().catch(e=>{console.error(e.message,e.code,e.where || "");process.exit(1)});
