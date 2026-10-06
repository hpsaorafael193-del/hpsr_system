import fs from 'node:fs';
const page = fs.readFileSync(new URL('../src/app/dashboard/obstetra/page.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const checks = [
  pkg.version === '1.1.16-test.30',
  page.includes('xl:grid-cols-[200px_200px_minmax(300px,1fr)] xl:items-start'),
  page.includes('flex flex-wrap items-start gap-2 xl:pt-[22px]'),
  page.includes('className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-hpsr-wine'),
  page.includes('className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine'),
];
if (checks.some((value) => !value)) {
  console.error('FAIL v1.1.16-test.30: alinhamento da linha de cronograma não corresponde ao contrato esperado.');
  process.exit(1);
}
console.log('PASS v1.1.16-test.30: datas e ações do cronograma compartilham altura e alinhamento visual.');
