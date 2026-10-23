const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const source = fs.readFileSync('src/app/dashboard/exames/page.tsx', 'utf8');
const helper = fs.readFileSync('src/lib/dna-participants.ts', 'utf8');
const sandbox = { exports: {} };
vm.createContext(sandbox);
vm.runInContext(ts.transpileModule(helper, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, sandbox);
const { dnaParticipants, syncDnaParticipants } = sandbox.exports;
const primary = { name: 'Paciente A', passport: 'TEST-A', role: 'Filho(a)' };
const secondary = { name: 'Paciente B', passport: 'TEST-B', role: 'Suposto pai' };
assert.throws(() => dnaParticipants(primary, { ...secondary, passport: ' test-a ' }), /diferentes/);
assert.throws(() => dnaParticipants(primary, { ...secondary, name: '' }), /válido/);
const report = '<h1>DNA</h1><section data-hpsr-block="resultados"><p>Resultado manual: 99,99%</p></section>';
const identified = syncDnaParticipants(report, dnaParticipants(primary, secondary));
assert(identified.includes('Paciente A') && identified.includes('Paciente B'));
assert(identified.includes('Resultado manual: 99,99%'));
assert.equal(syncDnaParticipants(identified, dnaParticipants(primary, secondary)), identified);
assert.equal(syncDnaParticipants(identified, []), report);
assert(syncDnaParticipants(report, [{ ...primary, name: '<script>bad</script>' }, secondary]).includes('&lt;script&gt;'));
const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let save;
function walk(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'saveExam') save = node.getText(ast); ts.forEachChild(node, walk); }
walk(ast); assert(save);
async function scenario({ dna = true, second = secondary, insertError = false, imageError = false, releaseError = false, confidential = false } = {}) {
  const inserted = [], contexts = [], released = [], notices = [], errors = [];
  const doc = { metadata: { patient: primary, doctor: { name: 'Médico' }, examName: 'DNA', protocol: 'TEST', date: '2026-10-22', time: '12:00' }, pages: [{ type: 'report', reportHtml: identified }] };
  const client = {
    from: table => { assert.equal(table, 'clinical_records'); return { insert: async rows => { inserted.push(rows); return { error: insertError ? new Error('Falha de gravação') : null }; } }; },
    rpc: async (name, args) => { assert.equal(name, 'set_clinical_record_visibility'); released.push(args.target_record_id); return { error: releaseError ? new Error('Falha de liberação') : null }; },
  };
  const context = { dnaParticipants, patient: primary, secondPatient: second, primaryDnaRole: primary.role, secondaryDnaRole: secondary.role, isDnaExam: dna,
    doctor: { name: 'Médico' }, examSaveLock: { current: false }, setSavingExam() {}, syncEditorFromDom() {},
    captureExamSnapshot: async document => ({ kind: 'exam', document }), preview: { open: false }, buildPreviewDocument: () => doc,
    brazilIso: () => '2026-10-22T15:00:00Z', brazilDateTimeIso: () => '2026-10-22T15:00:00Z', createClient: () => client,
    persistClinicalImages: async (payload, ctx) => { contexts.push(ctx.recordId); if (imageError && contexts.length === 2) throw new Error('Falha de imagem'); return { ...payload, imageAssets: ['shared-file'], imageReference: `/api/clinical-assets?recordId=${ctx.recordId}` }; },
    selectedDoctorId: 'doctor-test', selectedExam: { id: dna ? 'lab_teste_dna' : 'lab_hemograma_completo' }, selectedExamId: 'lab_teste_dna', attachments: [], isConfidential: confidential,
    setPreview() {}, setSaveStatus() {}, setLastSavedAt() {}, currentUserProfile: { systemName: 'Médico', passport: 'TEST-D' }, registerSystemActivity() {},
    window: { dispatchEvent() {} }, CustomEvent: class {}, hpsrSuccess: message => notices.push(message), clinicalSaveError: e => e.message,
    setAppDialog: value => errors.push(value), console: { error() {} },
  };
  vm.createContext(context);
  await vm.runInContext(ts.transpileModule(save + '\nsaveExam();', { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context);
  assert.equal(context.examSaveLock.current, false);
  return { inserted, contexts, released, notices, errors };
}
(async () => {
  const dual = await scenario();
  assert.equal(dual.inserted.length, 1, 'Both records must be sent in one insert');
  assert.equal(dual.inserted[0].length, 2);
  const [a, b] = dual.inserted[0];
  assert.equal(a.patient_passport, primary.passport); assert.equal(b.patient_passport, secondary.passport);
  assert.equal(b.payload.patient.name, secondary.name);
  assert.equal(a.payload.relatedExamId, b.payload.relatedExamId);
  assert.equal(JSON.stringify(a.payload.renderSnapshot), JSON.stringify(b.payload.renderSnapshot));
  assert.equal(a.image_asset_paths[0], b.image_asset_paths[0], 'Reuse image files');
  assert.notEqual(a.payload.imageReference, b.payload.imageReference, 'Each record authorizes its own image references');
  assert.equal(dual.released.length, 2);
  assert(dual.notices[0].includes('Paciente A e Paciente B'));
  for (const args of [{ dna: false }, { second: null }]) assert.equal((await scenario(args)).inserted[0].length, 1);
  const invalid = await scenario({ second: primary }); assert.equal(invalid.inserted.length, 0); assert.equal(invalid.errors.length, 1);
  const uploadFailure = await scenario({ imageError: true }); assert.equal(uploadFailure.inserted.length, 0); assert.equal(uploadFailure.errors.length, 1);
  const writeFailure = await scenario({ insertError: true }); assert.equal(writeFailure.released.length, 0); assert.equal(writeFailure.errors.length, 1);
  const privateSave = await scenario({ confidential: true }); assert.equal(privateSave.released.length, 0); assert(privateSave.inserted[0].every(row => row.is_confidential));
  const pending = await scenario({ releaseError: true }); assert.equal(pending.inserted[0].length, 2); assert.equal(pending.errors.length, 0); assert(pending.notices[0].includes('pendente'));
  assert(source.includes('secondPatient, primaryDnaRole, secondaryDnaRole'));
  assert(source.includes('setSecondPatient(draft.secondPatient || null)'));
  console.log('PASS DNA: identities, escaping, duplicate rejection, both charts in one insert, per-record image authorization, shared snapshots/files, single-patient compatibility, confidentiality, failure paths and draft persistence.');
})().catch(error => { console.error(error); process.exitCode = 1; });
