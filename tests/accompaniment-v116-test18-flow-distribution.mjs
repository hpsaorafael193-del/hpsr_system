import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');

assert.equal(pkg.version, '1.1.16-test.30');
assert(page.includes('Planejamento ativo'), 'Definição médica deve oferecer seletor de planejamento ativo.');
assert(page.includes('Novo planejamento · ainda não salvo'), 'Seletor deve representar o fluxo de novo planejamento.');
assert(page.includes('<Plus size={15} />Novo planejamento'), 'Cabeçalho deve ter atalho explícito para novo planejamento.');
assert(page.includes('Troque rapidamente entre acompanhamentos já salvos.'), 'Fluxo rápido deve evitar dependência do histórico para editar.');
assert(page.includes('max-w-[1040px]'), 'Identidade e cronograma devem ter largura interna controlada em telas grandes.');
assert(page.includes('max-w-[760px]'), 'Observações gerais devem usar largura prática em vez de esticar por toda a página.');
assert(page.includes('max-w-[920px]'), 'Metadados das consultas devem ter distribuição compacta.');
assert(page.includes('max-w-[980px]'), 'Conteúdo previsto deve ter largura confortável e controlada.');
assert(page.includes('Buscar paciente, passaporte, data ou modalidade'), 'Histórico deve possuir busca rápida.');
assert(page.includes('filteredHistoryPlans.map'), 'Histórico deve renderizar a lista filtrada.');
assert(page.includes('setEditingPlanId(planId);'), 'Após salvar, o planejamento deve continuar como planejamento ativo.');
assert(!page.includes('Editar integral'), 'Botão redundante Editar integral não deve retornar.');
console.log('PASS v1.1.16-test.30: fluxo rápido por planejamento ativo e distribuição compacta preservados.');
