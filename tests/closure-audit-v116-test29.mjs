import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const doc = read('src/lib/obstetric-document.ts');
const obstetra = read('src/app/dashboard/obstetra/page.tsx');
const vax = read('src/components/vaccination/VaccinationWorkspace.tsx');
const vaxlib = read('src/lib/vaccination.ts');
const portal = read('src/components/public/PatientGestationalPlansPanel.tsx');

assert.equal(pkg.version, '1.1.16-test.30');

// Tipografia clínica: integral e individual usam fonte maior, com redução automática se necessário.
assert(doc.includes('fontSize: compact ? 24 : 25'));
assert(doc.includes('fontSize: compact ? 23 : 26'));
assert(doc.includes('fontSize: 26, lineHeight: 31'));
assert(doc.includes('fontSize: 25, lineHeight: 30'));
assert(doc.includes('fontSize: Math.max(22, Math.min(25, rowHeight * 0.22))'));
assert(doc.includes('fontSize -= 0.5'));

// Modelos/mapeamentos aprovados seguem com as mesmas regiões estruturais.
for (const marker of [
  'src: "/clinical-assistant/official-gestational-integral-v3.png"',
  'src: "/clinical-assistant/official-ivf-integral-v3.png"',
  'src: "/clinical-assistant/official-gestational-individual-v3.png"',
  'src: "/clinical-assistant/official-ivf-individual-v3.png"',
  'planned: { x: 45, y: 431, width: 1357, height: 121 }',
  'evolution: { x: 45, y: 647, width: 1357, height: 119 }',
  'exams: { x: 45, y: 861, width: 1357, height: 137 }',
]) assert(doc.includes(marker), `mapeamento ausente: ${marker}`);

// PNG dos planejamentos só é materializado no download explícito.
assert(obstetra.includes('async function downloadCanvasPng'));
assert(obstetra.includes('Baixar PNG'));
assert(!obstetra.includes('.upload('));
assert(obstetra.includes('renderIntegralPlanningCanvas'));
assert(obstetra.includes('renderIndividualPlanningCanvas'));

// Vacinação: gestacional + geral usam observações em três pautas e snapshot estruturado.
assert(vax.includes('normalizeVaccinationObservations'));
assert(vax.includes('.split("\\n").slice(0, 3).join("\\n")'));
assert(vax.includes('enterKeyHint="enter"'));
assert(vax.includes('Shift+Enter'));
assert(vax.includes('releasedSnapshot: buildReleasedCardSnapshot'));
assert(vax.includes('publishedPath: null'));
assert(!vax.includes('.upload('));
for (const marker of [
  'template: "/vacinacao/caderneta-gestante.png"',
  'template: "/vacinacao/caderneta-crianca-p1-v117.png"',
  'template: "/vacinacao/caderneta-idoso-v117.png"',
  'lineYs: [927, 974, 1020]',
  'lineYs: [949, 986, 1023]',
  'lineYs: [975, 1012, 1048]',
  'lineYs: [972, 1000, 1030]',
]) assert(vaxlib.includes(marker), `vacinação sem marcador: ${marker}`);
assert(vax.includes('lineYs: [960, 996, 1032]'));

// Portal mantém conteúdo liberado e gera PNG apenas por ação do usuário.
assert(portal.includes('Baixar PNG'));
assert(portal.includes('renderIntegralPlanning'));
assert(portal.includes('renderIndividualPlanning'));

console.log('PASS v1.1.16-test.30: auditoria de fechamento Acompanhamento + Vacinação + PNG sob demanda');
