import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';
const src=stripTypeScriptTypes(readFileSync('src/lib/planning-edit-persistence.ts','utf8').replace(/^import .*;\n/gm,'')).replaceAll('export ','');
const {mergeIndividualIntoDraft,parseIndividualDraft,individualDraftKey,individualEditorFields}=new Function(src+';return {mergeIndividualIntoDraft,parseIndividualDraft,individualDraftKey,individualEditorFields};')();
const steps=[{number:1,date:'2026-10-21',planned_text:'Antigo',description:'Antigo'},{number:2,date:'2026-10-28',planned_text:'Rascunho outra consulta',description:'Rascunho outra consulta'}];
const merged=mergeIndividualIntoDraft('gestacional',steps,1,'Novo salvo');assert.equal(merged[0].planned_text,'Novo salvo');assert.equal(merged[0].date,'2026-10-21');assert.equal(merged[1].planned_text,'Rascunho outra consulta');assert.equal(steps[0].planned_text,'Antigo');
const fiv=mergeIndividualIntoDraft('in_vitro',[{...steps[0],fiv_step_id:'shared',fiv_recipient:'ambas'}],1,'Só doadora','shared','doadora');
assert.equal(fiv.length,2);assert.equal(fiv.find(s=>s.fiv_recipient==='doadora').planned_text,'Só doadora');assert.equal(fiv.find(s=>s.fiv_recipient==='gestante').planned_text,'Antigo');
assert.notEqual(individualDraftKey('A','1'),individualDraftKey('B','1'));
const draft={version:'saved-version',baseline:'old-baseline',form:{planned:'conteúdo\nnovo',evolution:'novo',observation:'interno',exams:'exame',explanation:'resultado',patientObservations:'obs',privateDraft:'rascunho'}};
assert.deepEqual(parseIndividualDraft(JSON.stringify(draft)),draft);assert.equal(parseIndividualDraft('{}'),null);
const page=readFileSync('src/app/dashboard/obstetra/page.tsx','utf8');assert.ok(page.includes('save_gestational_planning_atomic'));assert.ok(page.includes('save_reproductive_individual_atomic'));assert.ok(!page.includes('async function syncOccurrences'));assert.ok(page.includes('mergeIndividualIntoDraft'));assert.ok(page.includes('saved.reviewedVersions'));assert.ok(page.includes('individualExpectedVersion'));assert.ok(page.includes('discardPendingIndividualChanges'));
console.log('PASS saved individual content synchronizes integral drafts without replacing dates/other drafts, shared-stage privacy, per-user restore/version tokens and transactional save flow');

const restored=individualEditorFields({planned_text:'p',evolution_text:'e',medical_observation_text:'i',followup_report:{exams_performed:'x',exam_explanation:'r',patient_observations:'o',private_draft:'d'}});
assert.deepEqual(restored,{planned:'p',evolution:'e',observation:'i',exams:'x',explanation:'r',patientObservations:'o',privateDraft:'d'});
console.log('PASS reopening preserves every field in its original input');
// Reopen the correct participant: local consultation number 1 exists in both FIV plans.
const a=page.indexOf('  async function openIndividualEditorAtStep('),b=page.indexOf('\n  function closeIndividualEditorNow()',a);
const openSource=stripTypeScriptTypes('const run='+page.slice(a,b).trim());
const participants=[{id:'G',fiv_project_id:'P',fiv_role:'gestante',consultation_schedule:[{number:1,fiv_step_id:'shared'}]},{id:'D',fiv_project_id:'P',fiv_role:'doadora',consultation_schedule:[{number:1,fiv_step_id:'shared'}]}];
const selected=[];
const open=new Function('plans','busy','setSelectedPlanId','setIndividualBaseline','setPendingIndividualAction','setIndividualPreview','setIndividualEditorOpen','setError','setMessage','loadOccurrences','openIndividual',openSource+';return run;')(participants,false,id=>selected.push(id),()=>{},()=>{},()=>{},()=>{},()=>{},()=>{},async id=>[{id,step_number:1}],()=>{});
await open(participants[1],1);assert.equal(selected.pop(),'D');await open(participants[0],1,{fiv_step_id:'shared',fiv_recipient:'doadora'});assert.equal(selected.pop(),'D');
const draftSources=['src/lib/obstetric-default-content.ts','src/lib/obstetric-planning.ts','src/lib/obstetric-planning-draft.ts'].map(file=>stripTypeScriptTypes(readFileSync(file,'utf8').replace(/^import .*;\n/gm,'')).replaceAll('export ',''));
const {parseObstetricDraft}=new Function(draftSources.join('\n')+';return {parseObstetricDraft};')();
const longNotes='Texto que deve permanecer. '.repeat(300);
const parent=parseObstetricDraft(JSON.stringify({version:2,selectedPassport:'P',planType:'gestacional',startDate:'2026-10-15',endDate:'2026-11-15',planningNotes:longNotes,editingPlanId:'plan',confirmedKey:'gestacional:2026-10-15:2026-11-15',confirmedSteps:steps,reviewedVersions:{'00000000-0000-4000-8000-000000001190':'2026-10-14T04:00:00Z'}}));
assert.equal(parent.planningNotes,longNotes);assert.equal(parent.reviewedVersions['00000000-0000-4000-8000-000000001190'],'2026-10-14T04:00:00Z');assert.equal(parent.confirmedSteps[0].date,'2026-10-21');
console.log('PASS correct FIV participant at equal local step number and complete parent draft restoration with review versions');
