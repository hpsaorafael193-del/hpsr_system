import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');

assert.equal(pkg.version, '1.1.16-test.30');
assert(page.includes('const [individualEditorOpen, setIndividualEditorOpen]'));
assert(page.includes('openIndividualEditor(plan)'));
assert(page.includes('Editar consultas'));
assert(page.includes('Acompanhamento · edição individual'));
assert(page.includes('requestCloseIndividualEditor'));
assert(page.includes('Salvar e continuar'));
assert(page.includes('Descartar'));
assert(page.includes('Cancelar'));
assert(page.includes('persistIndividual(false)'));
assert(page.includes('Salvar atualiza os dados internos'));
assert(page.includes('planning_document_path: null'));
assert(page.includes('individual_document_path: null'));
// O histórico não contém mais o editor individual expandido na própria página.
const historyStart = page.indexOf('id="acompanhamento-historico"');
const modalStart = page.indexOf('Acompanhamento · edição individual');
assert(historyStart >= 0 && modalStart > historyStart);
const historySlice = page.slice(historyStart, modalStart);
assert(!historySlice.includes('id="acompanhamento-individual"'));
assert(!historySlice.includes('Relatório individual'));

console.log('PASS v1.1.16-test.30: histórico usa botão Editar consultas e o editor individual abre em modal com salvamento explícito.');
