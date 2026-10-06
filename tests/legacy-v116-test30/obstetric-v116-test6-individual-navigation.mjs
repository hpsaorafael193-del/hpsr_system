import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');

assert.equal(pkg.version, '1.1.16-test.30');
assert(page.includes('const previousOccurrence ='));
assert(page.includes('const nextOccurrence ='));
assert(page.includes('← Anterior'));
assert(page.includes('Próxima →'));
assert(page.includes('requestOpenIndividual'));
assert(page.includes('selectedOccurrenceId === occurrence.id'));
assert(page.includes('grid gap-2 md:grid-cols-2 xl:grid-cols-3'));
assert(page.includes('Acompanhamento · edição individual'));

console.log('PASS v1.1.16-test.30: navegação individual preservada dentro do modal de edição.');
