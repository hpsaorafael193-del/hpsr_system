import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(p, 'utf8');
const doc = read('src/lib/obstetric-document.ts');
const defaults = read('src/lib/obstetric-default-content.ts');
const pkg = JSON.parse(read('package.json'));

assert.equal(pkg.version, '1.1.16-test.30');
assert.match(doc, /official-gestational-integral-v3\.png/);
assert.match(doc, /official-ivf-integral-v3\.png/);
assert.match(doc, /width: 1920,[\s\S]*height: 1280/);
assert.match(doc, /dateRows: \[400, 503, 610, 712, 814, 919, 1023, 1121\]/);
assert.match(doc, /dateRows: \[463, 628, 792, 958, 1133\]/);
assert.match(doc, /referenceBox: \{ x: 989, y: 1190, width: 875, height: 54 \}/);
assert.match(doc, /referenceBox: null/);
assert.match(doc, /Data prevista para o parto:/);
assert.match(defaults, /exame de sangue β-hCG/);

for (const [path, width, height] of [
  ['public/clinical-assistant/official-gestational-integral-v3.png', 1920, 1280],
  ['public/clinical-assistant/official-ivf-integral-v3.png', 1920, 1280],
]) {
  const b = readFileSync(path);
  assert.equal(b.toString('ascii', 1, 4), 'PNG');
  assert.equal(b.readUInt32BE(16), width);
  assert.equal(b.readUInt32BE(20), height);
}
console.log('PASS v1.1.16-test.30: novos modelos integrais Gestacional/FIV, mapeamento 1920x1280 e β-hCG na 5ª etapa');
