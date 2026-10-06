import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const read = name => readFileSync(name, 'utf8');
const release = read('src/lib/patient-followup-release.ts');
const result = ts.transpileModule(release,{ compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true });
assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const mod = {exports:{}};
new Function('module','exports',result.outputText)(mod,mod.exports);
const {publicIntegralSnapshot,publicIndividualSnapshot,releasedReportExists} = mod.exports;
const confidential = {
 step_number:2,planned_date:'2026-10-12',planned_text:'Consulta prevista',
 evolution_text:'Atendimento realizado',exams_performed:'Ultrassom',exam_explanation:'Resumo autorizado',
 patient_observations:'Observação publicada',conduct_text:'Retorno',
 medical_observation_text:'SEGREDO OBSERVAÇÃO',private_draft:'SEGREDO RASCUNHO',
};
const publicConsultation = publicIndividualSnapshot(confidential);
assert(!('private_draft' in publicConsultation));
assert(!('medical_observation_text' in publicConsultation));
assert.equal(publicConsultation.exams_performed,'Ultrassom');
assert.equal(publicConsultation.patient_observations,'Observação publicada');
assert(releasedReportExists(publicConsultation));
assert(!releasedReportExists(publicIndividualSnapshot({planned_text:'Agendado'})));
const publicIntegral = publicIntegralSnapshot({start_date:'2026-10-10', private_draft:'SEGREDO',consultation_schedule:[{number:1,planned_text:'Exame previsto',private_draft:'SEGREDO 2'}]});
assert(!('private_draft' in publicIntegral));
assert(!('private_draft' in publicIntegral.consultation_schedule[0]));
const api = read('src/app/api/paciente/planejamentos-gestacionais/route.ts');
assert(api.includes('...publicIndividualSnapshot(snapshot)'));
assert(api.includes('publicIntegralSnapshot(plan.planning_released_snapshot)'));
assert(api.includes('.not("individual_released_at", "is", null)'));
assert(api.includes('integralAvailable && integralSnapshot'));
const ui = read('src/components/public/PatientGestationalPlansPanel.tsx');
const card = read('src/components/public/FollowupConsultationCard.tsx');
assert(ui.includes('FollowupConsultationCard'));
assert(ui.includes('Relatórios disponíveis'));
assert(ui.includes('resumo de exames'));
assert(card.includes('Relatório após o atendimento'));
assert(card.includes('Resumo e explicação médica'));
assert(card.includes('Observações do médico para você'));
assert(!card.includes('private_draft'));
for (const file of ['src/components/public/PatientGestationalPlansPanel.tsx','src/components/public/FollowupConsultationCard.tsx','src/app/api/paciente/planejamentos-gestacionais/route.ts']) {
 const parsed = ts.transpileModule(read(file),{fileName:file,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
 assert.equal((parsed.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,`TypeScript syntax: ${file}`);
}
assert.equal(JSON.parse(read('package.json')).version,'1.1.11');
assert.equal(JSON.parse(read('package.json')).packageManager,'pnpm@12.2.0');
console.log('PASS v1.1.11: consulta completa, resumos, privacidade de snapshots, acesso por liberação, integridade sintática e pnpm 12');
