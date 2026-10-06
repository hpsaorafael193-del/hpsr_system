import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const page = fs.readFileSync(new URL('../src/app/dashboard/obstetra/page.tsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

assert.equal(pkg.version, '1.1.16-test.30');
assert.match(page, /id="acompanhamento-historico"[^>]*hpsr-gestational-history/);
assert(page.includes('Acompanhamento · edição individual'));
assert(page.includes('Editar consultas'));
assert(page.includes('hpsr-stage-scroll'), 'Planejamento previsto deve usar viewport interno somente quando o conteúdo integral exceder a altura confortável.');
assert(page.includes('hpsr-obstetric-editor-list'), 'Editor deve seguir listagem vertical total.');
assert.match(css, /hpsr-obstetric-stage-preview\s*>\s*\.hpsr-stage-scroll[\s\S]{0,260}max-height:\s*clamp\(440px, 58dvh, 640px\)[\s\S]{0,180}overflow-y:\s*auto/);
assert.match(css, /hpsr-stage-scroll[\s\S]{0,260}overscroll-behavior-y:\s*auto/);
assert.match(css, /@media \(max-width: 767px\)[\s\S]{0,300}hpsr-stage-scroll[\s\S]{0,180}max-height:\s*none[\s\S]{0,120}overflow-y:\s*visible/);
console.log('PASS v1.1.16-test.30: listagem vertical limita apenas o conteúdo integral quando necessário, sem prender a rolagem com pouco conteúdo.');
