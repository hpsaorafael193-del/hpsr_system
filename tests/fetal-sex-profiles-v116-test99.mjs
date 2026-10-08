import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const read=p=>readFileSync(p,'utf8');
const modelSource=stripTypeScriptTypes(read('src/data/exames/models/genetico_sexagem_fetal.ts').replace(/^import .*;\n/gm,'')).replaceAll('export ','');
const engine=stripTypeScriptTypes(read('src/data/exames/adaptive-engine.ts').replace(/import type \{[\s\S]*?\} from "\.\/types";/,'')).replaceAll('export ','');
const {model,initial,resolve,render}=new Function(modelSource+engine+';return {model:genetico_sexagem_fetalModel,initial:createInitialAdaptiveConfiguration,resolve:resolveAdaptiveExam,render:renderAdaptiveExamReport}')();
assert.equal(model.profiles.length,7);
assert.equal(new Set(model.profiles.map(p=>p.id)).size,7);
assert(!model.profiles.some(p=>['normal','alterado'].includes(p.id)));
for(const profile of model.profiles) for(const generationSeed of [0,1,3]) {
 const resolved=resolve(model,{...initial(model),profileId:profile.id,generationSeed});
 assert.equal(resolved.profile.id,profile.id);
 const report=render(resolved);
 assert(report.includes(profile.conclusion));
 assert(report.includes(profile.results.resultado));
 assert(!/neutr[oó]fil|padrão alterado|sem alterações significativas/i.test(report));
 if(profile.id.startsWith('gemelar')) assert(report.includes('contexto do RP')||report.includes('cenário de RP'));
}
for(const [old,current] of [['normal','feminino'],['alterado','masculino'],['indefinido','inconclusivo']]) assert.equal(resolve(model,{...initial(model),profileId:old}).profile.id,current);
console.log('PASS seven fetal-sex profiles, unique selectable values, generated conclusions/results and stable refresh semantics');
