import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');
const css = read('src/app/globals.css');

assert.equal(pkg.version, '1.1.16-test.30');
assert(page.includes('id="acompanhamento-conteudo"'));
assert(page.includes('hpsr-planning-step-row'));
assert(!page.includes('hpsr-planning-step-card rounded-[15px] border border-[#e6d0c1]'));
assert(page.includes('id="acompanhamento-historico"'));
assert(page.includes('hpsr-planning-history-row'));
assert(!page.includes('hpsr-planning-history-item rounded-[18px] border'));
assert(page.includes('divide-y divide-[#d9c1b4]'));
assert(css.includes('uma única superfície externa e conteúdo direto, sem cartões aninhados'));
assert(css.includes('#acompanhamento-conteudo'));
assert(css.includes('#acompanhamento-historico'));

console.log('PASS v1.1.16-test.30: Planejamento previsto e Histórico usam superfície única, sem cartões aninhados.');
