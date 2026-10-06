import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const page = read('src/app/dashboard/obstetra/page.tsx');
const pkg = JSON.parse(read('package.json'));

assert.equal(pkg.version, '1.1.16-test.30');
assert(page.includes('Ir ao histórico'), 'Definição médica deve ter atalho para o histórico.');
assert(page.includes('document.getElementById("acompanhamento-historico")?.scrollIntoView'), 'Atalho deve navegar para o histórico na mesma página.');
assert(page.includes('onClick={() => beginEditing(plan)}'), 'Clique no planejamento do histórico deve carregar a edição integral nas áreas superiores.');
assert(page.includes('document.getElementById("acompanhamento-dados")?.scrollIntoView'), 'Ao carregar um histórico, a tela deve voltar para a Definição médica.');
assert(page.includes('onClick={(event) => event.stopPropagation()}'), 'Ações internas do histórico não devem disparar a abertura integral do item.');
assert(page.includes('Editar consultas'), 'Editar consultas deve continuar como ação separada do histórico.');
assert(!page.includes('>Editar integral</button>'), 'Histórico não deve reintroduzir botão redundante Editar integral.');

console.log('PASS v1.1.16-test.30: atalho para Histórico e clique direto no planejamento carregam a edição integral sem botão redundante.');
