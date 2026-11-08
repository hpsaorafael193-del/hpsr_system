import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, modules = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
    exports, console, URL, Date, Set,
    require(name) {
      if (name in modules) return modules[name];
      throw new Error(name);
    },
  });
  return exports;
}

const datetime = { brazilIso: () => new Date().toISOString() };
const model = load('src/lib/pediatric-intake-form.ts');
const guardian = load('src/lib/patient-portal/server.ts', {
  'server-only': {}, crypto: {}, '@supabase/supabase-js': {}, '@/lib/brazil-datetime': datetime,
});
const now = new Date().toISOString();
let authenticated = true;
let access = { patient_passport: '338', user_id: 'patient-338' };
let calls = [];
const forms = [
  { id:'legacy', patient_passport:'338', form_type:'gestational', status:'requested', answers:{}, requested_at:now, updated_at:now },
  { id:'pediatric', patient_passport:'643', form_type:'pediatric', status:'requested', answers:{}, requested_at:now, updated_at:now },
];
const links = [
  {child_passport:'643', guardian_user_id:'guardian', guardian_passport:null, access_status:'authorized', portal_access:true},
  {child_passport:'643', guardian_user_id:null, guardian_passport:'338', access_status:'authorized', portal_access:true},
  {child_passport:'643', guardian_user_id:'unapproved', guardian_passport:null, access_status:'pending', portal_access:true},
  {child_passport:'643', guardian_user_id:'other-user', guardian_passport:'901', access_status:'authorized', portal_access:true},
];
const client = {
  rpc(_, {target_passport}) {
    return Promise.resolve({data:[{passport:target_passport}, ...links.filter(l=>l.guardian_passport===target_passport&&l.access_status==='authorized'&&l.portal_access).map(l=>({passport:l.child_passport}))]});
  },
  from(table) {
    calls.push(['from',table]);
    const predicates = [];
    const chain = {};
    let mutation;
    for (const [method, predicate] of Object.entries({
      eq: (a,b)=>a===b, neq: (a,b)=>a!==b, is: (a,b)=>a===b,
      in: (a,b)=>b.includes(a), gte: (a,b)=>a>=b, not: (a,b)=>a!==b,
    })) chain[method]=(key,value)=>{ calls.push([method,key,value]); predicates.push(row=>predicate(row[key],value)); return chain; };
    for(const method of ['select','order','limit']) chain[method]=()=>chain;
    chain.update=values=>{calls.push(['update',values]);mutation=values;return chain;};
    function run() {
      const rows = (table==='followup_intake_forms'?forms:table==='patient_guardian_links'?links:[]).filter(r=>predicates.every(p=>p(r)));
      if (mutation) rows.forEach(row=>Object.assign(row,mutation));
      return rows;
    }
    chain.maybeSingle=async()=>({data:run()[0]||null});
    chain.then=resolve=>resolve({data:run(),error:null});
    return chain;
  },
};
const modules = {
  'next/server': { NextResponse:{json:(body,init={})=>({body,status:init.status||200})} },
  '@/lib/brazil-datetime': datetime,
  '@/lib/pediatric-intake-form': model,
  '@/lib/patient-portal/server': { ...guardian, getValidPatientSession:async()=>authenticated?{supabase:client,access}:null },
};
const route = load('src/app/api/paciente/fichas-acompanhamento/route.ts',modules);
const notices = load('src/app/api/paciente/notificacoes/route.ts',modules);
const request = (passport, id, answers={}, submit=true) => ({url:`https://portal.test/?passport=${passport}`,json:async()=>({id,answers,submit})});
const hasPediatricNotice = r => r.body.notices.some(n=>n.kind==='followup_form'&&n.passport==='643'&&n.description.includes('acompanhamento pediátrico'));

let response = await route.GET(request('338'));
assert.equal(response.status,200);
assert.equal(response.body.forms[0].id,'legacy');
assert(calls.some(c=>c[0]==='neq'&&c[1]==='status'&&c[2]==='cancelled'));
authenticated=false; calls=[];
assert.equal((await route.GET(request('338'))).status,401);
assert.equal(calls.length,0);
authenticated=true;
assert.equal((await route.POST(request('338','legacy',{goal:'fixture'}))).status,200);
assert.equal(forms[0].answers.goal,'fixture');
assert.equal((await route.POST(request('338','legacy'))).status,409);
assert.equal((await route.GET(request('643'))).body.forms[0].id,'pediatric'); // Legacy guardian link

access = {patient_passport:'643',user_id:'child'};
assert.equal((await route.GET(request('643'))).body.forms.length,0);
assert.equal((await route.POST(request('643','pediatric',{commitment:'Estou de acordo'}))).status,403);
assert.equal(hasPediatricNotice(await notices.GET(request('643'))),false);
access = {patient_passport:null,user_id:'unapproved'};
assert.equal((await route.GET(request('643'))).status,403);
access = {patient_passport:'901',user_id:'wrong-user'};
assert.equal((await route.GET(request('643'))).body.forms.length,0);
assert.equal(hasPediatricNotice(await notices.GET(request('643'))),false);
access = {patient_passport:null,user_id:'guardian'};
assert.equal(hasPediatricNotice(await notices.GET(request('643'))),true);
assert.equal((await route.POST(request('643','pediatric'))).status,400);
assert.equal((await route.POST(request('643','pediatric',{childPassport:'wrong',guardianName:'Responsável'},false))).status,200);
assert.equal(forms[1].status,'draft');
assert.equal(forms[1].answers.childPassport,'643');
assert.equal((await route.POST(request('643','pediatric',{
  ...forms[1].answers, commitment:'Estou de acordo', birthComplication:'Não', birthComplicationDetails:'hide',
  allergies:'Sim', allergiesDetails:'exemplo', childBirthDate:'2026-02-30', availability:['Noite','Tarde','Errado','Tarde'], unexpectedKey:'ignore',
}))).status,200);
assert.equal(forms[1].status,'submitted');
assert.equal(forms[1].answers.allergiesDetails,'exemplo');
assert.deepEqual(Array.from(forms[1].answers.availability),['Tarde','Noite']);
for (const key of ['childBirthDate','birthComplicationDetails','unexpectedKey']) assert.equal(forms[1].answers[key],undefined);
assert.equal((await route.POST(request('643','pediatric'))).status,409);
assert.equal(hasPediatricNotice(await notices.GET(request('643'))),false);
console.log('PASS portal: old form, child and unauthorized denial, guardian notice, draft, consent, validated submission');
