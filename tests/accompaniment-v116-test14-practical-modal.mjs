import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');

assert.equal(pkg.version, '1.1.16-test.30');
assert(page.includes('Acompanhamento · edição individual'));
assert(page.includes('Exames e resultados'));
assert(page.includes('Um único campo para resumir exames realizados e seus resultados.'));
assert(page.includes('Anotação interna opcional'));
assert(page.includes('consolidatedEvolution'));
assert(page.includes('consolidatedExamSummary'));
assert(page.includes('consolidatedInternalNote'));

const editorStart = page.indexOf('{individualEditorOpen &&');
const editorEnd = page.indexOf('{readyIntegralPreview', editorStart);
assert(editorStart >= 0 && editorEnd > editorStart);
const editor = page.slice(editorStart, editorEnd);
assert(!editor.includes('Observações compartilháveis'));
assert(!editor.includes('Rascunho privado'));
assert(!editor.includes('Consulta atual</p><dl'));
assert(editor.includes('Gerar prévia individual'));
assert(editor.includes('persistIndividual(false)'));
assert(editor.includes('Salvar ${selectedPlan.plan_type === "in_vitro" ? "etapa" : "consulta"}'));

const footerPos = editor.indexOf('<footer');
assert(footerPos >= 0);
assert(editor.indexOf('Gerar prévia individual', footerPos) > footerPos);
assert(editor.indexOf('persistIndividual(false)', footerPos) > footerPos);

// O mesmo modal cobre Gestacional e FIV por selectedPlan.plan_type; não há formulário paralelo por modalidade.
assert(editor.includes('selectedPlan.plan_type === "in_vitro"'));
assert.equal((editor.match(/Acompanhamento · edição individual/g) || []).length, 1);

console.log('PASS v1.1.16-test.30: modal individual simplificado, visual de Acompanhamento, campos consolidados e ações no rodapé.');
