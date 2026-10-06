import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');

assert.equal(pkg.version, '1.1.16-test.30');
// O workspace Integral | Individual continua removido.
assert(!page.includes('Integral | Individual'));
// As consultas continuam com o visual simples anterior, agora dentro do modal.
assert(page.includes('grid gap-2 md:grid-cols-2 xl:grid-cols-3'));
assert(page.includes('hpsr-planning-visit-card rounded-[15px] border p-3 text-left transition'));
assert(!page.includes('group relative min-w-[210px]'));
assert(!page.includes('flex gap-2.5 overflow-x-auto pb-2'));
assert(!page.includes('Com evolução'));
assert(page.includes('Editar consultas'));
assert(page.includes('Acompanhamento · edição individual'));
assert(page.includes('← Anterior'));
assert(page.includes('Próxima →'));

console.log('PASS v1.1.16-test.30: consultas preservam o visual simples e a edição individual foi movida para modal.');
