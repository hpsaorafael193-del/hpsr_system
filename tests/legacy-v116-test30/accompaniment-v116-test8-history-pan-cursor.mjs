import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const page = read('src/app/dashboard/obstetra/page.tsx');
const vaccination = read('src/components/vaccination/VaccinationWorkspace.tsx');
const css = read('src/app/globals.css');

assert.equal(pkg.version, '1.1.16-test.30');

// Histórico permanece limpo e encaminha a edição individual para um modal próprio.
assert(page.includes('Acompanhamentos salvos'));
assert(page.includes('Editar consultas'));
assert(page.includes('Acompanhamento · edição individual'));
assert(page.includes('Consultas do planejamento'));
assert(page.includes('grid gap-2 md:grid-cols-2 xl:grid-cols-3'));
assert(!page.includes('group relative min-w-[210px]'));

// Prévia ampliada de vacinação pode ser movida e ampliada.
assert(vaccination.includes('expandedPreviewViewportRef'));
assert(vaccination.includes('beginExpandedPreviewPan'));
assert(vaccination.includes('moveExpandedPreviewPan'));
assert(vaccination.includes('cursor: expandedPreviewDragging ? "grabbing" : "grab"'));
assert(vaccination.includes('expandedPreviewZoom'));
assert(vaccination.includes('clique e arraste a caderneta'));

// Campos de texto mantêm cursor/caret visíveis.
assert(css.includes('cursor: text !important'));
assert(css.includes('caret-color: currentColor !important'));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const source = walk('src').filter((p) => /\.(tsx?|css)$/.test(p)).map(read).join('\n');
assert(!/cursor\s*:\s*none/i.test(source));
assert(!/cursor-none/.test(source));
assert(!/caret-color\s*:\s*transparent/i.test(source));
assert(!/requestPointerLock/.test(source));

console.log('PASS v1.1.16-test.30: histórico limpo com editor individual em modal, pan da vacinação e cursor de texto auditados');
