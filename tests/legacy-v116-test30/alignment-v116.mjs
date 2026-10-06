import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const obstetric = readFileSync('src/lib/obstetric-document.ts', 'utf8');
const vaccination = readFileSync('src/lib/vaccination.ts', 'utf8');
const workspace = readFileSync('src/components/vaccination/VaccinationWorkspace.tsx', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

assert.equal(pkg.version, '1.1.16-test.30');

// Planejamentos: integrais 1920×1280 e novos individuais 1448×1086 usam mapeamento próprio por arte.
for (const marker of [
  'doctor: { x: 203, y: 220, width: 705 }',
  'patient: { x: 213, y: 257, width: 698 }',
  'passport: { x: 295, y: 299, width: 616 }',
  'doctor: { x: 267, y: 236, width: 531 }',
  'patient: { x: 227, y: 281, width: 691 }',
  'passport: { x: 299, y: 329, width: 627 }',
  'doctor: { x: 159, y: 179, width: 495 }',
  'patient: { x: 132, y: 211, width: 522 }',
  'passport: { x: 132, y: 246, width: 522 }',
  'doctor: { x: 208, y: 180, width: 452 }',
  'patient: { x: 132, y: 211, width: 528 }',
  'passport: { x: 132, y: 246, width: 528 }',
]) assert.ok(obstetric.includes(marker), `alinhamento ausente: ${marker}`);

// Caderneta gestacional: linhas reais do novo modelo.
assert.match(vaccination, /pregnantIdentity[\s\S]*lineY: 17\.68[\s\S]*lineY: 20\.61[\s\S]*lineY: 23\.74/);
// Infantil página 1 também corrige o deslocamento vertical antigo.
assert.match(vaccination, /childIdentity[\s\S]*lineY:17\.27[\s\S]*lineY:20\.21[\s\S]*lineY:23\.16/);
// Demais cadernetas possuem coordenadas específicas por arte, não uma posição genérica.
assert.match(vaccination, /adultMaleIdentity[\s\S]*lineY:17\.91[\s\S]*lineY:20\.86[\s\S]*lineY:23\.94/);
assert.match(vaccination, /adultFemaleIdentity[\s\S]*lineY:17\.54[\s\S]*lineY:20\.40[\s\S]*lineY:23\.62/);
assert.match(vaccination, /elderlyIdentity[\s\S]*lineY:17\.45[\s\S]*lineY:20\.49[\s\S]*lineY:23\.30/);

// Observações: primeira linha respeita o rótulo e as demais reaproveitam a largura disponível.
assert.ok(vaccination.includes('lineYs?: number[]; baselineOffset?: number'));
assert.ok(vaccination.includes('continuationX?: number; continuationWidth?: number'));
assert.ok(vaccination.includes('x: 292, y: 927, width: 985'));
assert.ok(workspace.includes('lineYs: [960, 996, 1032]'));
assert.ok(workspace.includes('ctx.textBaseline = "alphabetic"'));
assert.ok(workspace.includes('baselineY:'));
assert.ok(workspace.includes('const lineGeometry = (index: number) =>'));

// Página 2 infantil usa suas próprias linhas reais.
assert.ok(workspace.includes('lineY:19.25'));
assert.ok(workspace.includes('lineY:22.55'));
assert.ok(workspace.includes('lineY:16.15'));

console.log('PASS v1.1.16-test.30: microalinhamento dos planejamentos e pautas de observação validado');
