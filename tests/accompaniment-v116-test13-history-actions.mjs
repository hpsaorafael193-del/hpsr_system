import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');

assert.equal(pkg.version, '1.1.16-test.30');
const historyStart = page.indexOf('id="acompanhamento-historico"');
const modalStart = page.indexOf('Acompanhamento · edição individual');
assert(historyStart >= 0 && modalStart > historyStart);
const historySlice = page.slice(historyStart, modalStart);
assert(historySlice.includes('Editar consultas'));
assert(historySlice.includes('Liberar integral'));
assert(historySlice.includes('Excluir'));
assert(!historySlice.includes('Editar integral'));

console.log('PASS v1.1.16-test.30: histórico remove Editar integral e mantém Editar consultas, Liberar integral e Excluir.');
