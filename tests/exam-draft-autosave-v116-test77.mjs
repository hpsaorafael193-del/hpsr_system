import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const code = stripTypeScriptTypes(readFileSync('src/lib/use-exam-draft.ts','utf8'))
  .replace(/^import .*;$/gm,'').replace('export function useExamDraft','function useExamDraft');
const table = process.argv.includes('--documents') ? 'document_editor_drafts' : 'exam_editor_drafts';
let stored;
const owner='11111111-1111-4111-8111-111111111111';
const slots=[];let cursor=0;let scheduled=false;let active=true;
let payload={schemaVersion:1,patient:{name:''},reportHtml:''};
let output;const effects=[];const writes=[];const departures=[];
let fail=false;let releaseLoad;
const loading = new Promise(resolve=>{releaseLoad=resolve});
const client={auth:{onAuthStateChange:fn=>{fn('INITIAL_SESSION',{user:{id:owner},access_token:'test-session'});return {data:{subscription:{unsubscribe(){}}}}},getUser:async()=>({data:{user:{id:owner}}})},from(actualTable){assert.equal(actualTable,table);return {select(){return {eq(){return {maybeSingle:()=>stored ? Promise.resolve({data:stored,error:null}) : loading}}}},async upsert(row){writes.push(row);await new Promise(resolve=>setTimeout(resolve,20));if(fail)return {error:new Error('offline')};stored=row;return {error:null}}}}};
const listeners=new Map();
const eventTarget={addEventListener(name,fn){listeners.set(name,fn)},removeEventListener(name){listeners.delete(name)}};
const doc={...eventTarget,visibilityState:'visible'};
function schedule(){if(!scheduled&&active){scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}}
function useState(initial){const i=cursor++;slots[i]??={value:initial};return [slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v;schedule()}]}
function useRef(value){const i=cursor++;slots[i]??={current:value};return slots[i]}
function useEffect(fn,deps){const i=cursor++;const old=slots[i];if(!old||deps.some((d,j)=>!Object.is(d,old.deps[j]))){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn()})}}
const fakeProcess={env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-test-key'}};
const hook=new Function('useState','useRef','useEffect','createClient','window','document','fetch','process',code+';return useExamDraft;')(useState,useRef,useEffect,()=>client,eventTarget,doc,async(url,options)=>{departures.push(JSON.parse(options.body));return {ok:true}},fakeProcess);
function render(){cursor=0;output=hook(owner,payload,value=>{payload=value;schedule()},table);while(effects.length)effects.shift()()}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const pause=()=>new Promise(resolve=>setTimeout(resolve,450));
render();await tick();assert.equal(output.ready,false);assert.equal(writes.length,0,'Never overwrite a draft before loading it');
releaseLoad({data:{payload:{schemaVersion:1,patient:{name:'Paciente recuperado'},reportHtml:'<p>Texto existente</p>'},client_saved_at:new Date().toISOString()},error:null});
await tick();assert.equal(output.ready,true);assert.equal(payload.patient.name,'Paciente recuperado');await pause();assert.equal(writes.length,0,'Restoring an unchanged draft does not write it again'); assert.equal(listeners.has('beforeunload'),false,'Draft never blocks leaving');
payload={...payload,patient:{name:'Paciente alterado'}};render();await pause();assert.equal(writes.at(-1).payload.patient.name,'Paciente alterado','Autosave metadata edits even without typing in the report');
payload={...payload,reportHtml:'<p>Última alteração antes de recarregar</p>'};render();listeners.get('pagehide')();assert.equal(departures.at(-1).payload.reportHtml,payload.reportHtml,'Flush latest text on refresh');await pause();
fail=true;payload={...payload,reportHtml:'<p>Recuperar após falha</p>'};render();await pause();assert.match(output.status,/não salvo/);fail=false;await output.retry();await tick();assert.equal(output.status,'Rascunho salvo');assert.equal(writes.at(-1).payload.reportHtml,payload.reportHtml);
payload={...payload,reportHtml:'<p>Voltar da outra aba</p>'};render();
active=false;for(const slot of slots)slot?.cleanup?.();
slots.length=0;payload={schemaVersion:1,patient:{name:''},reportHtml:''};active=true;render();
await new Promise(resolve=>setTimeout(resolve,60));
assert.equal(payload.reportHtml,'<p>Voltar da outra aba</p>','Immediate return waits for the departing save before restoring');
active=false;for(const slot of slots)slot?.cleanup?.();
console.log('PASS exam draft hydration, metadata autosave, refresh flush and failure retry');
