const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');const cache={};function load(name){if(cache[name])return cache[name];const m={exports:{}};const src=ts.transpileModule(fs.readFileSync('src/lib/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(src,{exports:m.exports,module:m,require:p=>p.startsWith('@/lib/')?load(p.slice(6)):require(p),URLSearchParams,crypto,Date,Set,console});return cache[name]=m.exports;}
const lib=load('followup-navigation');for(const tab of ['gestacional','in_vitro','pediatria','vacina_gestacional','vacina_infantil'])assert.equal(new URL(lib.followupTabHref(tab),'https://example.test').pathname,'/dashboard/acompanhamento');
for(const [role,specialty,query,expected]of [
 ['Médico Especialista','Pediatria','','pediatria'],
 ['Médico Especialista','Pediatria','?specialty=pediatria&view=vaccination','vacina_infantil'],
 ['Médico Especialista','Pediatria','?specialty=ginecologia','pediatria'],
 ['Médico Especialista','Obstetra','?specialty=pediatria','gestacional'],
 ['Médico Especialista','Ginecologia','','in_vitro'],
 ['Vice Diretor / Dev','','?specialty=pediatria','pediatria'],
 ['Vice Diretor / Dev','','?specialty=pediatria&view=vaccination','vacina_infantil'],
 ['Vice Diretor / Dev','','?specialty=ginecologia','in_vitro'],
 ['Vice Diretor / Dev','','?view=vaccination','vacina_gestacional'],
 ['Residente','Pediatria','?specialty=pediatria',null]
])assert.equal(lib.initialFollowupTab(role,specialty,query),expected);
console.log('PASS all modalities share canonical address; initial selection and deep links respect specialties and administrative permissions.');
