const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,deps={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:n=>deps[n]??require(n),console});return m.exports;}
const age=load('src/lib/patient-age.ts');
for(const v of ['',null,undefined,'-2','18.5','20 anos','2026-10-30','121',{},Infinity])assert.equal(age.parsePatientAge(v),null);
for(const v of ['0','18',25,'120'])assert.equal(age.parsePatientAge(v),Number(v));
let existing=null;const writes=[];
const api={auth:{admin:{createUser:async()=>({data:{user:{id:'new-account'}},error:null}),deleteUser:async()=>({error:null})}},from(table){const q={select(){return q},eq(){return q},in(){return q},insert(row){writes.push({table,action:'insert',row});return q},update(row){writes.push({table,action:'update',row});return q},delete(){return q},upsert(){return q},maybeSingle:async()=>({data:table==='patient_registry'?existing:null,error:null}),single:async()=>({data:{id:'new-access'},error:null}),then(resolve,reject){return Promise.resolve({data:null,error:null}).then(resolve,reject)}};return q;}};
const route=load('src/app/api/paciente/cadastrar/route.ts',{'@/lib/patient-age':age,'@/lib/phone':load('src/lib/phone.ts'),'@/lib/patient-portal/server':{getServiceClient:()=>api,normalizePassport:v=>String(v??'').trim().toUpperCase()},'next/server':{NextResponse:{json:(body,init)=>({body,status:init?.status??200})}}});
const base={name:'Paciente teste',passport:'PTEST',email:'patient@example.test',password:'example-password',age:'25'};
const request=body=>({json:async()=>body,headers:{get:()=>''}});
(async()=>{
for(const v of ['', '-1','18.5','20 anos','2026-10-30','121']){writes.length=0;assert.equal((await route.POST(request({...base,age:v}))).status,400);assert.equal(writes.length,0);}
assert.equal((await route.POST(request({...base,age:'17'}))).status,400);
writes.length=0;assert.equal((await route.POST(request(base))).status,200);assert.equal(writes.find(w=>w.table==='patient_registry'&&w.action==='insert').row.age,'25');
existing={passport:'PTEST',name:'Existente',age:null};writes.length=0;assert.equal((await route.POST(request(base))).status,200);assert.equal(writes.find(w=>w.table==='patient_registry'&&w.action==='update').row.age,'25');
existing={...existing,age:'42'};writes.length=0;assert.equal((await route.POST(request(base))).status,200);assert(writes.filter(w=>w.table==='patient_registry'&&w.action==='update').every(w=>!('age'in w.row)));
console.log('PASS age validation, new persistence, missing age filled, existing age preserved; mocked database only.');
})().catch(e=>{console.error(e);process.exitCode=1});
