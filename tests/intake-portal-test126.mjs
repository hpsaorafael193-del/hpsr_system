import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Run the real API handlers with a server-verified session and an isolated query double.
const source=fs.readFileSync('src/app/api/paciente/fichas-acompanhamento/route.ts','utf8');
let authenticated=true, authorized='338', status='requested', calls=[];
const form={id:'cora-fixture',patient_passport:'338',status:'requested',answers:{}};
const client={from(table){calls.push(['from',table]);const chain={};
 for(const method of ['select','eq','neq','order','limit','update'])chain[method]=(...args)=>{calls.push([method,...args]);return chain;};
 chain.maybeSingle=async()=>({data:{...form,status}});
 chain.single=async()=>({data:{...form,status:'submitted'}});
 chain.then=(resolve)=>resolve({data:[form],error:null});return chain;}};
const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{
 exports,console,require(name){if(name==='next/server')return {NextResponse:{json:(body,init={})=>({body,status:init.status||200})}};
 if(name.includes('brazil-datetime'))return {brazilIso:()=>new Date().toISOString()};
 if(name.includes('patient-portal/server'))return {getValidPatientSession:async()=>authenticated?{supabase:client}:null,resolvePortalPatientPassport:async()=>authorized};
 throw new Error(name);}});
let response=await exports.GET({});assert.equal(response.status,200);assert.equal(response.body.forms[0].id,form.id);
assert(calls.some(c=>c[0]==='eq'&&c[1]==='patient_passport'&&c[2]==='338'));
assert(calls.some(c=>c[0]==='neq'&&c[1]==='status'&&c[2]==='cancelled'));
authenticated=false;calls=[];assert.equal((await exports.GET({})).status,401);assert.equal(calls.length,0);
authenticated=true;authorized=null;assert.equal((await exports.GET({})).status,403);assert.equal(calls.length,0);
authorized='338';const request={json:async()=>({id:form.id,answers:{goal:'fixture'},submit:true})};
assert.equal((await exports.POST(request)).status,200);assert(calls.some(c=>c[0]==='update'&&c[1].status==='submitted'&&c[1].answers.goal==='fixture'));
status='submitted';calls=[];assert.equal((await exports.POST(request)).status,409);assert(!calls.some(c=>c[0]==='update'));
console.log('PASS real intake API handlers: own form, session/ownership denial, submit and locked submitted form');
