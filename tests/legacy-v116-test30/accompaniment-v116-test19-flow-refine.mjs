import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/app/dashboard/obstetra/page.tsx', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

assert.equal(pkg.version, '1.1.16-test.30');
assert(page.includes('const manageablePlans = useMemo'), 'Seletor rápido deve considerar todos os planejamentos que o perfil pode gerenciar.');
assert(page.includes('manageablePlans.map((plan)'), 'Planejamento ativo deve permitir trocar entre modalidades autorizadas sem depender do histórico.');
assert(page.includes('Editando registro salvo'), 'Definição médica deve deixar claro quando um registro existente está em edição.');
assert(page.includes('historyTypeFilter'), 'Histórico deve oferecer filtro de modalidade.');
assert(page.includes('>Todos</button>'), 'Histórico deve possuir filtro Todos.');
assert(page.includes('>Gestacional</button>'), 'Histórico deve possuir filtro Gestacional quando autorizado.');
assert(page.includes('>FIV</button>'), 'Histórico deve possuir filtro FIV quando autorizado.');
assert(page.includes('Em edição</span>'), 'Histórico deve identificar o planejamento atualmente carregado.');
assert(page.includes('max-w-[1080px]'), 'Barra rápida de contexto deve ter largura interna controlada.');
assert(!page.includes('lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'), 'Página não deve voltar ao editor principal em duas colunas.');
console.log('PASS v1.1.16-test.30: seletor global autorizado, filtros do histórico e distribuição refinada validados.');
