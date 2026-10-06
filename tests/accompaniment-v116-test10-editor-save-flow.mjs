import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');

assert.equal(pkg.version, '1.1.16-test.10');

// Espaço único de edição.
assert(page.includes('type PlanningEditorMode = "integral" | "individual"'));
assert(page.includes('editorMode === "integral"'));
assert(page.includes('switchEditorMode("integral")'));
assert(page.includes('switchEditorMode("individual")'));
assert(page.includes('Planejamento previsto por consulta'));
assert(page.includes('Abrir / editar'));
assert(!page.includes('id="acompanhamento-individual"'));

// Salvamento explícito, sem exigir prévia.
assert.match(page, /async function saveIntegralPlan\(\): Promise<boolean>/);
assert.match(page, /async function saveIndividual\(\): Promise<boolean>/);
assert(!page.includes('Gere e confira a prévia atual antes de salvar.'));
assert(!page.includes('Gere e confira a prévia individual antes de salvar.'));
assert(page.includes('Salvar alterações'));
assert(page.includes('Salvar planejamento'));

// Mudança de contexto protegida com 3 caminhos.
assert(page.includes('pendingEditorNavigation'));
assert(page.includes('Salvar e continuar'));
assert(page.includes('Descartar'));
assert(page.includes('Cancelar'));
assert(page.includes('requestEditorNavigation'));
assert(page.includes('activeEditorDirty'));

// Individual não permite editar dados integrais pela coluna esquerda.
assert(page.includes('Modo individual ativo: os dados gerais e o cronograma integral ficam somente para consulta.'));
assert(page.includes('disabled={editorMode === "individual"}'));

// Salvar continua separado de liberar e PNG só é materializado no clique de download.
assert(page.includes('Salvar atualiza os dados internos. Liberar para a paciente continua sendo uma ação separada.'));
assert(page.includes('downloadCanvasPng'));
assert(page.includes('canvas.toBlob'));

console.log('PASS v1.1.16-test.10: histórico localiza; editor alterna Integral/Individual; salvamento explícito e proteção contra perda de edição');
