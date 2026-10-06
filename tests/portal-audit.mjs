import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const postcss=require('postcss');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files=[];
function visit(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const target=path.join(dir,ent.name);if(ent.isDirectory())visit(target);else if(/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.d.ts'))files.push(target);}}
visit(path.join(root,'src'));
let syntactic=0;
for(const file of files){const txt=fs.readFileSync(file,'utf8');const result=ts.transpileModule(txt,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});const errors=(result.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,`Syntax errors in ${file}: ${errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join('; ')}`);syntactic++;}
postcss.parse(fs.readFileSync(path.join(root,'src/app/globals.css'),'utf8'));
console.log(`PASS syntax ${syntactic} TS/TSX files and CSS parser`);
function loadModule(rel, deps){const file=path.join(root,rel);const src=fs.readFileSync(file,'utf8');const js=ts.transpileModule(src,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={}; const context={exports,require:(id)=>{if(id in deps)return deps[id]; throw new Error(`unmocked import: ${id}`)}, console,URL,Date,Set,Promise,Buffer,process,encodeURIComponent,decodeURIComponent};vm.runInNewContext(js,context,{filename:rel});return exports;}
function result(data,error=null){return {data,error};}
function fakeQuery(rows){const filters=[];let countLimit=Infinity;let single=false;const b={select:()=>b,eq:(key,val)=>{filters.push(r=>r[key]===val);return b},in:(key,arr)=>{filters.push(r=>arr.includes(r[key]));return b},gte:(key,val)=>{filters.push(r=>r[key]>=val);return b},not:(key,op,val)=>{if(op==='is'&&val===null)filters.push(r=>r[key]!==null);return b},order:()=>b,limit:(n)=>{countLimit=n;return b},maybeSingle:async()=>result(rows.filter(r=>filters.every(f=>f(r)))[0]||null),then:(resolve,reject)=>Promise.resolve(result(rows.filter(r=>filters.every(f=>f(r))).slice(0,countLimit))).then(resolve,reject)};return b;}
const people=[{passport:'ADULT',name:'Responsável',access_type:'self'},{passport:'CHILD_A',name:'Criança A',access_type:'guardian'},{passport:'CHILD_B',name:'Criança B',access_type:'guardian'}];
const links=[{child_passport:'CHILD_B',guardian_user_id:'OWNER',access_status:'authorized',portal_access:true},{child_passport:'CHILD_PENDING',guardian_user_id:'OWNER',access_status:'pending',portal_access:false},{child_passport:'CHILD_SUSPENDED',guardian_user_id:'OWNER',access_status:'suspended',portal_access:false}];
const records=[{id:'exam-b',patient_passport:'CHILD_B',record_type:'Exame',released_at:new Date().toISOString(),is_confidential:false,payload:{examName:'Resultado B',reportHtml:'<p>Exame B</p>'},created_at:'2026-10-01',updated_at:'2026-10-01'}, {id:'doc-b',patient_passport:'CHILD_B',record_type:'Documento',released_at:new Date().toISOString(),is_confidential:false,payload:{documentTitle:'Documento B'},created_at:'2026-10-01',updated_at:'2026-10-01'}, {id:'vax-b',patient_passport:'CHILD_B',record_type:'Vacina',released_at:new Date().toISOString(),is_confidential:false,payload:{vaccine:{name:'Teste'}},created_at:'2026-10-01',updated_at:'2026-10-01'}, {id:'secret-b',patient_passport:'CHILD_B',record_type:'Exame',released_at:null,is_confidential:true,payload:{examName:'sigiloso'},created_at:'2026-10-01',updated_at:'2026-10-01'}, {id:'exam-pending',patient_passport:'CHILD_PENDING',record_type:'Exame',released_at:new Date().toISOString(),is_confidential:false,payload:{examName:'NÃO VAZAR'},created_at:'2026-10-01',updated_at:'2026-10-01'}, {id:'exam-a',patient_passport:'CHILD_A',record_type:'Exame',released_at:new Date().toISOString(),is_confidential:false,payload:{examName:'Resultado A'},created_at:'2026-10-01',updated_at:'2026-10-01'}];
const supabase={rpc:async(n,args)=>{assert.equal(n,'patient_portal_accessible_patients');assert.equal(args.target_passport,'ADULT');return result([{passport:'ADULT',name:'Responsável',access_type:'self'},{passport:'CHILD_A',name:'Criança A',access_type:'guardian'}]);},from:(table)=>{if(table==='patient_guardian_links')return fakeQuery(links);if(table==='clinical_records')return fakeQuery(records);if(table==='appointments')return fakeQuery([]);if(table==='followup_intake_forms')return fakeQuery([]);throw new Error('unexpected table '+table);},storage:{from:()=>({createSignedUrl:async()=>result({signedUrl:'https://example.test/signed'})})}};
const fakeSession={supabase,access:{patient_passport:'ADULT',user_id:'OWNER'}};
const patientServer=loadModule('src/lib/patient-portal/server.ts',{'server-only':{},'@/lib/brazil-datetime':{brazilIso:()=>new Date().toISOString()},'crypto':require('node:crypto'),'@supabase/supabase-js':{createClient:()=>supabase}});
const req=(passport,id)=>({url:`https://hpsr.example/api/paciente/registros?passport=${encodeURIComponent(passport)}${id?'&id='+encodeURIComponent(id):''}`,nextUrl:new URL(`https://hpsr.example/api/paciente/registros?passport=${encodeURIComponent(passport)}${id?'&id='+encodeURIComponent(id):''}`)});
for(const passport of ['ADULT','CHILD_A','CHILD_B'])assert.equal(await patientServer.resolvePortalPatientPassport(req(passport),fakeSession),passport);
for(const passport of ['CHILD_PENDING','CHILD_SUSPENDED','SOMEONE_ELSE'])assert.equal(await patientServer.resolvePortalPatientPassport(req(passport),fakeSession),null);
assert.equal(await patientServer.resolvePortalPatientPassport(req('CHILD_B'),null),null);
console.log('PASS authorization: own + 2 approved children; pending/suspended/other/no-session rejected');
const NextResponse={json:(body,opts={})=>({status:opts.status||200,body,headers:opts.headers||{}})};
const recordsRoute=loadModule('src/app/api/paciente/registros/route.ts',{'next/server':{NextResponse},'@/lib/patient-portal/server':{getValidPatientSession:async()=>fakeSession,resolvePortalPatientPassport:patientServer.resolvePortalPatientPassport}});
const b=await recordsRoute.GET(req('CHILD_B'));assert.equal(b.status,200);assert.equal(b.body.records.length,3);assert.equal(JSON.stringify(b.body.records.map(r=>r.id).sort()),JSON.stringify(['exam-b','doc-b','vax-b'].sort()));const a=await recordsRoute.GET(req('CHILD_A'));assert.equal(a.status,200);assert.equal(JSON.stringify(a.body.records.map(r=>r.id)),JSON.stringify(['exam-a']));
assert.equal((await recordsRoute.GET(req('CHILD_PENDING'))).status,403);
assert.equal((await recordsRoute.GET(req('CHILD_B','secret-b'))).status,404);
assert.equal((await recordsRoute.GET(req('CHILD_B','exam-pending'))).status,404);
assert.equal((await recordsRoute.GET(req('CHILD_B','exam-b'))).body.record.title,'Resultado B');
console.log('PASS records simulation: child B sees only released exam/document/vaccination, child A isolated, pending rejected, confidential/foreign documents blocked');
const noticesRoute=loadModule('src/app/api/paciente/notificacoes/route.ts',{'next/server':{NextResponse},'@/lib/patient-portal/server':{getValidPatientSession:async()=>fakeSession,normalizePassport:patientServer.normalizePassport}});
const notifications=await noticesRoute.GET(req('CHILD_B'));assert.equal(notifications.status,200);assert(notifications.body.notices.filter(n=>n.passport==='CHILD_PENDING').every(n=>n.kind==='guardian'));assert(notifications.body.notices.some(n=>n.passport==='CHILD_B'&&n.section==='vaccination'));console.log('PASS notifications: child vaccination routes correctly and pending patient has no clinical notices');
const portal=fs.readFileSync(path.join(root,'src/components/public/PatientAccessPanel.tsx'),'utf8');const planning=fs.readFileSync(path.join(root,'src/components/public/PatientGestationalPlansPanel.tsx'),'utf8');const header=fs.readFileSync(path.join(root,'src/components/public/PublicHeader.tsx'),'utf8');assert(portal.includes('key={`${selectedPassport}:scheduled`}')&&portal.includes('key={`${selectedPassport}:vaccination`}')&&portal.includes('key={selectedPassport} data={activeFollowups}'));assert(header.includes('hpsr-patient-select-profile')&&header.includes('Minhas crianças')===false);assert(header.includes('Cadastrar filho ou filha'));assert(portal.includes('Escolher horário do médico'));assert(portal.includes('Pedir nova consulta'));assert(portal.includes('Cadastrar criança'));assert(portal.includes('Fichas do acompanhamento'));assert(planning.includes('Nenhuma imagem nova é salva no banco'));console.log('PASS UI contracts: profile keyed component reset, profile switch event, clear consultation paths, visible child registration, accompaniment forms area, virtual planning preview');
const css=fs.readFileSync(path.join(root,'src/app/globals.css'),'utf8');assert(css.includes('@media (max-width: 767px)')&&css.includes('@media (max-width: 389px)'));assert(header.includes('min-[390px]'));assert(portal.includes('sm:grid-cols-2')&&portal.includes('lg:grid-cols-[1.08fr_.92fr]'));console.log('PASS static responsive contracts: small window, smartphone, responsive portal grids, modal constraints');

// O responsável também pode ter apenas uma conta de acesso, sem prontuário próprio.
const guardianLinks=[
 {child_passport:'CHILD_A', guardian_user_id:'PARENT_ONLY', relationship:'Mãe',access_status:'authorized',portal_access:true,patient_registry:{name:'Criança A'}},
 {child_passport:'CHILD_B', guardian_user_id:'PARENT_ONLY', relationship:'Mãe',access_status:'authorized',portal_access:true,patient_registry:{name:'Criança B'}},
 {child_passport:'CHILD_PENDING', guardian_user_id:'PARENT_ONLY',relationship:'Mãe',access_status:'pending',portal_access:false,patient_registry:{name:'Criança pendente'}}
];
const onlyGuardianDb={from:(table)=>{switch(table){
 case 'patient_portal_sessions':return fakeQuery([{id:'SESSION',token_hash:'HASH',expires_at:new Date(Date.now()+3600000).toISOString(),revoked_at:null,portal_access_id:'PORTAL',last_seen_at:new Date().toISOString()}]);
 case 'patient_portal_access':return fakeQuery([{id:'PORTAL',user_id:'PARENT_ONLY',patient_passport:null,email:'parent@example.test',access_enabled:true}]);
 case 'patient_accounts':return fakeQuery([{user_id:'PARENT_ONLY',display_name:'Responsável sem prontuário'}]);
 case 'patient_guardian_links':return fakeQuery(guardianLinks);
 case 'patient_registry':return fakeQuery([{passport:'CHILD_A',city_phone:null,discord:null},{passport:'CHILD_B',city_phone:null,discord:null}]);
 default:throw Error('Unexpected table in guardian-only session '+table);
}},rpc:async()=>{throw Error('Guardian-only session must not use own-passport RPC') }};
const respCookies=()=>({set:()=>{}});
const ResponseWithCookies={json:(body,opts={})=>({status:opts.status||200,body,cookies:respCookies()})};
const sessionRoute=loadModule('src/app/api/paciente/sessao/route.ts',{'next/server':{NextResponse:ResponseWithCookies},'@/lib/brazil-datetime':{brazilIso:()=>new Date().toISOString()},'@/lib/patient-portal/server':{getPatientSessionCookieName:()=> 'hpsr_patient_session',getServiceClient:()=>onlyGuardianDb,hashPatientSecret:()=> 'HASH'}});
const guardianSession=await sessionRoute.GET({cookies:{get:()=>({value:'TOKEN'})}});
assert.equal(guardianSession.body.authenticated,true);assert.equal(guardianSession.body.hasOwnProfile,false);
assert.equal(guardianSession.body.accessiblePatients.length,2);assert.equal(guardianSession.body.pendingChildLinks.length,1);
console.log('PASS guardian-only account simulation: 2 approved child profiles, 1 pending, no empty own chart');
// Horário escolhido em perfil infantil deve ir para a criança, não para o responsável.
const bookingCalls=[];
const bookingDb={rpc:async(name,args)=>{bookingCalls.push({name,args});return result({ok:true,appointment_id:'APPOINTMENT_CHILD',doctor_name:'Pediatra',starts_at:'2026-11-02T14:00:00Z'})}};
const bookingRoute=loadModule('src/app/api/paciente/reservar-horario/route.ts',{'next/server':{NextResponse},'@/lib/patient-portal/server':{getValidPatientSession:async()=>({...fakeSession,supabase:bookingDb}),normalizePassport:patientServer.normalizePassport,resolvePortalPatientPassport:async(request)=>patientServer.resolvePortalPatientPassport(request,fakeSession)}});
const booked=await bookingRoute.POST({...req('CHILD_B'),json:async()=>({slotId:'SLOT_01',linkType:'assignment',doctorId:'DOCTOR',specialty:'Pediatria'})});
assert.equal(booked.status,200);assert.equal(bookingCalls[0].name,'book_patient_schedule_slot');
assert.equal(bookingCalls[0].args.target_passport,'CHILD_B');assert.equal(bookingCalls[0].args.requested_by_passport,'ADULT');
console.log('PASS pediatric booking: child owns appointment, adult remains requester');
// Suspensão posterior precisa bloquear a rota imediatamente, sem depender do menu visível.
links.find(l=>l.child_passport==='CHILD_B').access_status='suspended';
links.find(l=>l.child_passport==='CHILD_B').portal_access=false;
assert.equal(await patientServer.resolvePortalPatientPassport(req('CHILD_B'),fakeSession),null);
assert.equal((await recordsRoute.GET(req('CHILD_B'))).status,403);
console.log('PASS revoked guardianship: profile API access removed immediately');

console.log('TOTAL PASS');
