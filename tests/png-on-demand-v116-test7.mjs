import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.version, '1.1.16-test.30');

const obstetra = read('src/app/dashboard/obstetra/page.tsx');
const obstetricDoc = read('src/lib/obstetric-document.ts');
const vaccination = read('src/components/vaccination/VaccinationWorkspace.tsx');
const portalApi = read('src/app/api/paciente/registros/route.ts');
const patientRecords = read('src/components/public/PatientRecordsPanel.tsx');

// Pré-visualizações obstétricas usam Canvas e só convertem para PNG no botão de download.
assert.match(obstetra, /renderIntegralPlanningCanvas/);
assert.match(obstetra, /renderIndividualPlanningCanvas/);
assert.match(obstetra, /setIntegralPreview\(\{ canvas/);
assert.match(obstetra, /setIndividualPreview\(\{ canvas/);
assert.match(obstetra, /async function downloadCanvasPng/);
assert.match(obstetricDoc, /export async function renderIntegralPlanningCanvas/);
assert.match(obstetricDoc, /export async function renderIndividualPlanningCanvas/);
assert.match(obstetricDoc, /canvasToPngBlob/);

// Salvar/liberar caderneta não cria nem envia PNG novo.
assert.doesNotMatch(vaccination, /storage\.from\("vaccination-cards"\)\.upload/);
assert.doesNotMatch(vaccination, /storeCardImage\(/);
assert.match(vaccination, /releasedSnapshot: buildReleasedCardSnapshot/);
assert.match(vaccination, /Nenhum PNG foi criado ou armazenado/);

// Portal usa snapshot estruturado; PNG legado continua como fallback histórico.
assert.match(portalApi, /safeVaccinationSnapshot/);
assert.match(portalApi, /vaccinationCard: dynamicCard/);
assert.match(portalApi, /Compatibilidade histórica/);
assert.match(patientRecords, /renderVaccinationCard/);
assert.match(patientRecords, /downloadVaccinationCard/);
assert.match(patientRecords, /canvas\.toBlob/);

// Planejamentos salvam snapshots/dados e zeram caminhos de PNG novos.
assert.match(obstetra, /planning_document_path: null/);
assert.match(obstetra, /individual_document_path: null/);

console.log('PASS v1.1.16-test.30: PNG somente sob demanda; previews e liberações usam Canvas/dados estruturados');
