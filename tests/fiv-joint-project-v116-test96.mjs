import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const defaults = stripTypeScriptTypes(readFileSync('src/lib/obstetric-default-content.ts','utf8').replace(/^import .*;\n/gm,'')).replaceAll('export ','');
const planning = stripTypeScriptTypes(readFileSync('src/lib/obstetric-planning.ts','utf8').replace(/^import .*;\n/gm,'')).replaceAll('export ','');
const project = stripTypeScriptTypes(readFileSync('src/lib/fiv-project.ts','utf8').replace(/^import .*;\n/gm,'')).replaceAll('export ','');
const { normalizePlanningSteps,validatePlanningSteps,fivStepsForPatient,mergeFivProjectSteps,validateFivParticipants } = new Function(defaults+planning+project+';return { normalizePlanningSteps,validatePlanningSteps,fivStepsForPatient,mergeFivProjectSteps,validateFivParticipants };')();
const source = normalizePlanningSteps('in_vitro',[
 {title:'Gestante A',date:'2026-10-08',planned_text:'Somente gestante A',fiv_recipient:'gestante',fiv_step_id:'G1'},
 {title:'Doadora A',date:'2026-10-08',planned_text:'Somente doadora A',fiv_recipient:'doadora',fiv_step_id:'D1'},
 {title:'Gestante B',date:'2026-10-15',planned_text:'Somente gestante B',fiv_recipient:'gestante',fiv_step_id:'G2'},
]);
const g=fivStepsForPatient(source,'gestante'),d=fivStepsForPatient(source,'doadora');
assert.equal(g.length,2);assert.equal(d.length,1);assert.deepEqual(g.map(s=>s.number),[1,2]);assert.deepEqual(g.map(s=>s.fiv_order),[1,3]);
assert(!JSON.stringify(g).includes('Somente doadora'));assert(!JSON.stringify(d).includes('Somente gestante'));
assert.deepEqual(mergeFivProjectSteps([{fiv_role:'gestante',consultation_schedule:g},{fiv_role:'doadora',consultation_schedule:d}]).map(s=>s.fiv_step_id),['G1','D1','G2']);
assert.equal(validateFivParticipants('G','D',source),'');assert.match(validateFivParticipants('G','G',source),/diferentes/);assert.match(validateFivParticipants('G','',source),/doadora/);
assert.equal(validateFivParticipants('G','',g),'');
assert.equal(validatePlanningSteps('in_vitro',source),'');
assert.match(validatePlanningSteps('in_vitro',[...source,{...source[1]}]),/mesma data/);
const view=readFileSync('src/app/dashboard/obstetra/page.tsx','utf8');
assert.match(view,/p_release_gestante: releaseIntegralOnSave, p_release_doadora: releaseDonorOnSave/);
assert.match(view,/p_expected_versions: Object.fromEntries/);
assert.match(view,/mergeFivProjectSteps\(members\)/);
assert.match(view,/donorCanvas/);
assert.match(view,/Paciente doadora · opcional/);
assert.match(view,/Editar etapas desta paciente/);
const api=readFileSync('src/app/api/paciente/planejamentos-gestacionais/route.ts','utf8');
assert.match(api,/\.eq\("patient_passport", passport\)/);
assert(!api.includes('fiv_project_id'),'Portal must not fetch the other participant through the shared project');
console.log('PASS one project, per-patient stage partition, stable IDs/order, same-day different participants, solo FIV, role validation and isolated portal reads');
