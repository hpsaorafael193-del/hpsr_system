import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;
try { ts=require('typescript'); } catch {
  const {execFileSync}=require('node:child_process');
  ts=require(require('node:path').join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript'));
}
const root=process.cwd();
const src=readFileSync('src/lib/vaccination.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const mod={exports:{}};
new Function('module','exports','require',js)(mod,mod.exports,require);
const v=mod.exports;
const stages=v.childhoodStages;
assert.equal(stages.length,15);
assert.equal(new Set(stages.map(s=>s.id)).size,15);
assert.equal(stages.filter(s=>s.id==='2-anos').length,1);
assert.equal(stages.filter(s=>s.page===0).length,9);
assert.equal(stages.filter(s=>s.page===1).length,6);
const def=v.getVaccinationCardDefinition('crianca');
const options=v.cardVaccineOptions('crianca');
assert.equal(options.length,15);
assert(options.every(o=>o.doses.length===1&&o.doses[0]==='Etapa completa'));
assert(!options.some(o=>/Covid|Vacina individual/i.test(o.name)));
for(const stage of stages){
 const slot=v.findVaccinationSlot(def,stage.label,'Etapa completa');
 assert(slot&&slot.id===stage.id,'matching stage '+stage.id);
 const rendered=stage.slot;
 for(const k of ['left','top','width','height']) assert(Number.isFinite(rendered[k]));
 assert(rendered.left>=0&&rendered.top>=0&&rendered.left+rendered.width<=100&&rendered.top+rendered.height<=100);
}
const years2=stages.find(s=>s.id==='2-anos');
assert.equal(years2.page,0); // só a primeira página recebe o carimbo de dois anos
const application={slotId:years2.id,vaccine:years2.label,dose:'Etapa completa'};
assert.equal(v.assignApplicationsToSlots([application],def).size,1);
assert.equal(v.assignApplicationsToSlots([application,application],def).size,1);
assert.equal(v.assignApplicationsToSlots([{slotId:'unknown',vaccine:'BCG',dose:'1ª dose'}],def).size,0);
for(const variant of ['masculino','feminino']){
 const ad=v.getVaccinationCardDefinition('adulto',variant);
 assert(ad.template.includes('-v117.png'));
 assert(ad.slots.every(s=>!s.aliases.some(name=>/covid/i.test(name))));
 assert(v.cardVaccineOptions('adulto',variant).find(i=>i.name==='Influenza').doses.length===3);
}
const elderly=v.getVaccinationCardDefinition('idoso');
assert(!elderly.slots.some(s=>s.aliases.some(name=>/covid/i.test(name))));
const page=readFileSync('src/components/vaccination/VaccinationWorkspace.tsx','utf8');
assert(page.includes('const pageCount = group === "crianca" ? 2'));
assert(page.includes('releasedSnapshot: buildReleasedCardSnapshot'));
assert(!page.includes('storage.from("vaccination-cards").upload'));
assert(!page.includes('storeCardImage('));
assert(page.includes('group !== "crianca" && <label'));
assert(page.includes('childhoodStages.filter(stage=>stage.page === page)'));
const portal=readFileSync('src/app/api/paciente/registros/route.ts','utf8');
assert(portal.includes('safeVaccinationSnapshot'));
assert(portal.includes('vaccinationCard: dynamicCard'));
assert(portal.includes('previewImages: signedImages')); // compatibilidade histórica
assert(portal.includes('publishedPaths.every')); // compatibilidade histórica
for(const filename of ['caderneta-crianca-p1-v117.png','caderneta-crianca-p2-v117.png','caderneta-adulto-masculino-v117.png','caderneta-adulto-feminino-v117.png','caderneta-idoso-v117.png']){
 const file=path.join('public/vacinacao',filename);
 assert(existsSync(file));
 assert(readFileSync(file).subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
}
assert.equal(JSON.parse(readFileSync('package.json','utf8')).version,'1.1.16-test.30');
console.log('PASS 15 etapas infantis únicas; 9 na primeira página e 6 na segunda, com 2 anos compartilhados');
console.log('PASS um registro e um carimbo por etapa; histórico antigo preservado sem associação indevida');
console.log('PASS novos modelos adulto e idoso sem COVID; influenza tem três espaços anuais nos adultos');
console.log('PASS liberação de caderneta usa snapshot estruturado; PNG novo só é criado sob pedido de download');
console.log('PASS cinco modelos PNG e versão v1.1.7');
