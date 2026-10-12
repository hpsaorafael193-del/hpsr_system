import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const sources=['src/lib/obstetric-default-content.ts','src/lib/obstetric-planning.ts','src/lib/fiv-project.ts'].map(file=>stripTypeScriptTypes(readFileSync(file,'utf8').replace(/^import .*;\n/gm,'')).replaceAll('export ',''));
const {normalizePlanningSteps,validatePlanningSteps,fivStepsForPatient,mergeFivProjectSteps,validateFivParticipants}=new Function(sources.join('\n')+';return {normalizePlanningSteps,validatePlanningSteps,fivStepsForPatient,mergeFivProjectSteps,validateFivParticipants};')();
const steps=normalizePlanningSteps('in_vitro',[
 {fiv_step_id:'shared',fiv_recipient:'ambas',date:'2026-10-12',title:'Consulta conjunta',planned_text:'Orientações comuns'},
 {fiv_step_id:'g-only',fiv_recipient:'gestante',date:'2026-10-19',planned_text:'Privado gestante'},
 {fiv_step_id:'d-only',fiv_recipient:'doadora',date:'2026-10-19',planned_text:'Privado doadora'},
]);
assert.equal(validateFivParticipants('G','D',steps),'');
assert.match(validateFivParticipants('G','',steps),/doadora/);
assert.equal(validatePlanningSteps('in_vitro',steps),'');
assert.match(validatePlanningSteps('in_vitro',[...steps,{...steps[0],fiv_step_id:'duplicate',fiv_recipient:'doadora'}]),/mesma data/);
const g=fivStepsForPatient(steps,'gestante'),d=fivStepsForPatient(steps,'doadora');
assert.equal(g.length,2);assert.equal(d.length,2);
assert.ok(!JSON.stringify(g).includes('Privado doadora'));
assert.ok(!JSON.stringify(d).includes('Privado gestante'));
assert.deepEqual(g.map(step=>step.number),[1,2]);assert.deepEqual(d.map(step=>step.number),[1,2]);
const merged=mergeFivProjectSteps([{fiv_role:'gestante',consultation_schedule:g},{fiv_role:'doadora',consultation_schedule:d}]);
assert.equal(merged.length,3);assert.equal(merged[0].fiv_recipient,'ambas');
const changed=d.map(step=>step.fiv_step_id==='shared'?{...step,planned_text:'Alteração só doadora',description:'Alteração só doadora'}:step);
const divergent=mergeFivProjectSteps([{fiv_role:'gestante',consultation_schedule:g},{fiv_role:'doadora',consultation_schedule:changed}]);
assert.equal(divergent.filter(step=>step.fiv_step_id==='shared').length,2);
assert.ok(!JSON.stringify(fivStepsForPatient(divergent,'gestante')).includes('Alteração só doadora'));
assert.ok(JSON.stringify(fivStepsForPatient(divergent,'doadora')).includes('Alteração só doadora'));
assert.equal(validatePlanningSteps('in_vitro',divergent),'');
console.log('PASS shared stages, per-patient dates, privacy, re-open merge and divergent individual content');
