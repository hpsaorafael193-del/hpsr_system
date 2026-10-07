import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
let loads = 0;
class Canvas { toDataURL() { return 'data:image/png;base64,normalized'; } }
class FakeImage {
  set src(value) { loads++; queueMicrotask(() => value === 'broken' ? this.onerror() : this.onload()); }
}
const code = stripTypeScriptTypes(readFileSync('src/lib/exam-signature-image.ts', 'utf8')).split('// Bounded, memory-only reuse across pages of the same exam preview.')[1].replace('export function', 'function');
const load = new Function('Image', 'HTMLCanvasElement', 'normalizeSignatureImage', code + ';return loadSignaturePreview;')(FakeImage, Canvas, () => new Canvas());
const first = load('same');
assert.equal(load('same'), first, 'Share in-flight image loading');
assert.equal(await first, 'data:image/png;base64,normalized');
await load('same'); assert.equal(loads, 1, 'Reuse normalization across preview pages');
await load('broken'); await load('broken'); assert.equal(loads, 3, 'Failed loads can retry');
for (let i = 0; i < 9; i++) await load('signature-' + i);
const before = loads; await load('same'); assert.equal(loads, before + 1, 'Evict older entries instead of accumulating images');
console.log('PASS signature preview reuse, failure retry and bounded cache');
