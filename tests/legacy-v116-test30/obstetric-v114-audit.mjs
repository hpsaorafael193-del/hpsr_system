import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const files = ['src/lib/obstetric-default-content.ts','src/lib/obstetric-planning.ts','src/app/dashboard/obstetra/page.tsx','src/components/public/PatientGestationalPlansPanel.tsx'];
for(const file of files){const src=readFileSync(file,'utf8');const parsed=ts.createSourceFile(file,src,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);if(parsed.parseDiagnostics.length)throw new Error(`${file}: ${parsed.parseDiagnostics.map(d=>d.messageText).join('; ')}`)}
console.log('PASS parser TypeScript/TSX dos módulos alterados');
const cache = {};
function load(file){if(cache[file])return cache[file].exports;const mod={exports:{}};cache[file]=mod;const src=readFileSync(file,'utf8');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','module','exports',js)((name)=>name==='@/lib/obstetric-default-content'?load('src/lib/obstetric-default-content.ts'):require(name),mod,mod.exports);return mod.exports}
const p=load('src/lib/obstetric-planning.ts');
const pregnancy=p.createPlanningSuggestion('gestacional','2026-10-02','2026-12-02');
if(pregnancy.steps.length!==8||pregnancy.steps[0].date!=='2026-10-02'||pregnancy.steps.at(-1).date!=='2026-11-20') throw new Error('Gestacional: 8 consultas semanais devem preservar a sexta-feira da data inicial');
if(pregnancy.targetWeekdayLabel!=='sexta-feira'||pregnancy.steps.some((s)=>!s.planned_text))throw new Error('Gestacional sem dia dinâmico ou conteúdo de base');
console.log('PASS gestacional: 8 consultas semanais preservam o dia da data inicial; parto não vira 9ª consulta');
const ivf=p.createPlanningSuggestion('in_vitro','2026-10-05','2026-11-12');
if(ivf.steps.length!==5||ivf.steps.map((s)=>s.date).join(',')!=='2026-10-05,2026-10-12,2026-10-19,2026-10-26,2026-11-02'||ivf.steps.some(s=>!s.planned_text))throw new Error('FIV: cinco datas semanais automáticas inválidas');
if(ivf.targetWeekdayLabel!=='segunda-feira') throw new Error('FIV não preservou o dia da data inicial');
if(p.planningAdvisories('in_vitro',ivf.steps,'2026-10-05','2026-11-12').some(w=>w.includes('fora de'))) throw new Error('FIV: cronograma sugerido não deveria gerar aviso de dia divergente');
console.log('PASS FIV: 5 etapas semanais automáticas; 5ª etapa permanece β-hCG e datas seguem editáveis');
const editor=readFileSync('src/app/dashboard/obstetra/page.tsx','utf8');
for(const literal of ['followup_report','exams_performed','exam_explanation','patient_observations','private_draft','setConfirmedKey(confirmedSteps.length','overflow-y-auto','flex-1','Conteúdo integral'])if(!editor.includes(literal))throw new Error('Editor não contém '+literal);
console.log('PASS relatórios pós-consulta, campos internos e preservação do cronograma');
const portalApi=readFileSync('src/app/api/paciente/planejamentos-gestacionais/route.ts','utf8');
if(portalApi.includes('followup_report')||portalApi.includes('medical_observation_text')||portalApi.includes('private_draft'))throw new Error('API do Portal expõe registro interno');
if(!portalApi.includes('individual_released_snapshot')||!portalApi.includes('.not("individual_released_at", "is", null)'))throw new Error('Portal sem liberação individual');
console.log('PASS Portal: acesso somente aos snapshots individuais liberados');
const patient=readFileSync('src/components/public/PatientGestationalPlansPanel.tsx','utf8');
for(const field of ['exams_performed','exam_explanation','patient_observations','visibilitychange'])if(!patient.includes(field))throw new Error('Portal sem campo: '+field);
console.log('PASS Portal: exames, explicação, observações autorizadas e atualização da visualização');
