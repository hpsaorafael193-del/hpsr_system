import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');
const css = read('src/app/globals.css');

assert.equal(pkg.version, '1.1.16-test.30');
assert(page.includes('<div className="hpsr-topbar" aria-hidden="true" />'), 'Acompanhamento deve exibir a faixa institucional escura no topo.');
assert(page.includes('hpsr-obstetric-editor-list grid min-w-0 gap-4'), 'Definição e Planejamento previsto devem ficar em listagem vertical.');
assert(!page.includes('xl:grid-cols-[minmax(0,1.03fr)_minmax(390px,0.97fr)]'), 'Não deve manter layout lado a lado no editor.');
const definition = page.indexOf('id="acompanhamento-dados"');
const planned = page.indexOf('id="acompanhamento-conteudo"');
const history = page.indexOf('id="acompanhamento-historico"');
assert(definition > -1 && planned > definition && history > planned, 'A ordem deve ser Definição médica → Planejamento previsto → Histórico.');
assert(!page.includes('hpsr-obstetric-stage-shell min-w-0'), 'Planejamento previsto não deve usar shell absoluto de coluna lateral.');
assert(page.includes('hpsr-stage-scroll'), 'Planejamento previsto continua na listagem vertical, mas pode limitar internamente o conteúdo integral quando ele for longo.');
assert(css.includes('Acompanhamento em listagem vertical total'), 'CSS deve documentar a nova estrutura vertical.');
console.log('PASS v1.1.16-test.30: Acompanhamento em listagem vertical total, com faixa institucional e conteúdo integral limitado quando longo.');
