import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.version, '1.1.16-test.30');

const cache = {};
function load(file){
  if(cache[file]) return cache[file].exports;
  const mod={exports:{}}; cache[file]=mod;
  const js=ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('require','module','exports',js)((name)=>name==='@/lib/obstetric-default-content'?load('src/lib/obstetric-default-content.ts'):require(name),mod,mod.exports);
  return mod.exports;
}
const planning=load('src/lib/obstetric-planning.ts');
const monday=planning.createPlanningSuggestion('gestacional','2026-10-05','2026-12-05');
assert.equal(monday.targetWeekdayLabel,'segunda-feira');
assert.deepEqual(monday.candidateDates,['2026-10-05','2026-10-12','2026-10-19','2026-10-26','2026-11-02','2026-11-09','2026-11-16','2026-11-23']);
const thursday=planning.createPlanningSuggestion('in_vitro','2026-10-08','2026-11-30');
assert.equal(thursday.targetWeekdayLabel,'quinta-feira');
assert.deepEqual(thursday.candidateDates,['2026-10-08','2026-10-15','2026-10-22','2026-10-29','2026-11-05']);
assert.match(thursday.steps[4].planned_text,/β-hCG/);
console.log('PASS cronograma usa o dia da semana da data inicial para Gestacional e FIV');

const page=read('src/app/dashboard/obstetra/page.tsx');
assert.doesNotMatch(page,/cronograma gestacional será sugerido em quartas-feiras/i);
assert.doesNotMatch(page,/Conduta \/ Orientações \/ Retorno/);
assert.match(page,/clinical_appointment_slots/);
assert.match(page,/Isso é apenas um aviso e não altera o planejamento/);
assert.match(page,/Exames e resultados/);
console.log('PASS agenda publicada é apenas aviso; retorno removido do relatório individual');

const doc=read('src/lib/obstetric-document.ts');
assert.match(doc,/official-gestational-individual-v3\.png/);
assert.match(doc,/official-ivf-individual-v3\.png/);
assert.match(doc,/exams: \{ x: 45, y: 861, width: 1357, height: 137 \}/);
assert.match(doc,/renderIndividualPlanningCanvas\(\{ kind, patient, passport, doctor, step, evolution, exams, observation \}/);
assert.match(doc,/export async function renderIndividualPlanning\(args: Parameters<typeof renderIndividualPlanningCanvas>/);
assert.doesNotMatch(doc,/layout\.conduct/);
for (const path of [
  'public/clinical-assistant/official-gestational-individual-v3.png',
  'public/clinical-assistant/official-ivf-individual-v3.png',
]) {
  const b=readFileSync(path);
  assert.equal(b.toString('ascii',1,4),'PNG');
  assert.equal(b.readUInt32BE(16),1448);
  assert.equal(b.readUInt32BE(20),1086);
}
console.log('PASS novos modelos individuais 1448x1086 com área própria para exames');

const portal=read('src/components/public/PatientGestationalPlansPanel.tsx');
const api=read('src/app/api/paciente/planejamentos-gestacionais/route.ts');
assert.doesNotMatch(portal,/Conduta \/ Retorno/);
assert.doesNotMatch(portal,/conduct_text/);
assert.doesNotMatch(api,/conduct_text:/);
assert.match(portal,/Resultados: \$\{item\.exam_explanation\}/);
console.log('PASS Portal usa Planejamento + Evolução/Observações + Exames, sem seção de retorno');
