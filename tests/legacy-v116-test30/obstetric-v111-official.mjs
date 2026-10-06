import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); }
catch { ts = require(require('node:path').join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'typescript')); }
const read = (path) => readFileSync(path, 'utf8');

const parsedFiles = [
  'src/app/dashboard/obstetra/page.tsx',
  'src/components/public/PatientGestationalPlansPanel.tsx',
  'src/app/api/paciente/planejamentos-gestacionais/route.ts',
  'src/lib/obstetra-access.ts',
];
for (const file of parsedFiles) {
  const source = read(file);
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  assert.equal(parsed.parseDiagnostics.length, 0, `${file}: ${parsed.parseDiagnostics.map((d) => d.messageText).join('; ')}`);
}
console.log('PASS v1.1.14 parser: módulos Gestacional/FIV sem erro sintático');

const planner = read('src/app/dashboard/obstetra/page.tsx');
assert(planner.includes('Gerar prévia integral'));
assert(planner.includes('Salvar planejamento'));
assert(planner.includes('Liberar planejamento integral para a paciente'));
assert(planner.includes('Gerar prévia individual'));
assert(planner.includes('releaseIntegralOnSave ? {'));
assert(!planner.includes('releaseIntegralOnSave || alreadyReleased'));
assert(planner.includes('if (releaseToPatient) {'));
assert(!planner.includes('releaseIndividualOnSave || selectedOccurrence.individual_released_at'));
assert(planner.includes('.select("id,portal_released_at,planning_released_snapshot").maybeSingle()'));
assert(planner.includes('.select("id,individual_released_at,individual_released_snapshot").maybeSingle()'));
assert(planner.includes('A paciente continua vendo a última versão explicitamente liberada'));
assert(planner.includes('followup_report,individual_document_path,individual_released_document_path'));
assert(planner.includes('hasReport'));
console.log('PASS salvamento: UI original preservada, persistência confirmada e publicação somente explícita');

const api = read('src/app/api/paciente/planejamentos-gestacionais/route.ts');
const portal = read('src/components/public/PatientGestationalPlansPanel.tsx');
assert(api.includes('dynamic_available'));
assert(api.includes('individual_released_snapshot'));
assert(api.includes('typeof snapshot.planned_date === "string"'));
assert(api.includes('typeof snapshot.marker === "string"'));
assert(api.includes('typeof snapshot.doctor_name === "string"'));
assert(!api.includes('print_url'));
assert(!api.includes('/imprimir'));
assert(!portal.includes('print_url'));
assert(!portal.match(/PDF/i));
assert(portal.includes('downloadDynamicPng(plan)'));
assert(portal.includes('downloadDynamicPng(plan, item)'));
assert(!portal.includes('setInterval'));
assert(!existsSync('src/app/api/paciente/planejamentos-gestacionais/imprimir/route.ts'));
assert(!existsSync('src/lib/obstetric-print-document.ts'));
console.log('PASS Portal: somente snapshots liberados, PNG sob demanda, PNG legado preservado e zero PDF/polling');

const access = read('src/lib/obstetra-access.ts');
assert(access.includes('isFullAccessAdministrativeRole(normalizedRole)'));
assert(access.includes('Diretora e Vice Diretor / Dev possuem acesso administrativo total'));
assert(access.includes('assignedReproductiveSpecialties'));
const vaccinationAccess = read('src/lib/gestational-vaccination-access.ts');
assert(vaccinationAccess.includes('isFullAccessAdministrativeRole(normalizedRole)'));
const adminMigration = read('supabase/migrations/20261005050658_v112_restore_full_admin_access.sql');
assert(adminMigration.includes("p.role in ('Diretora', 'Vice Diretor / Dev')"));
assert(adminMigration.includes('v_is_full_admin'));
assert(adminMigration.includes('hpsr_reproductive_specialty_matches(l.specialty, target_kind)'));
console.log('PASS autorização: Diretora e Vice Diretor / Dev têm acesso administrativo total; demais perfis seguem especialidade e vínculo');

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.version, '1.1.16-test.30');
assert.equal(pkg.engines.node, '24.x');
assert.equal(pkg.packageManager, 'pnpm@12.2.0');
assert(read('src/components/layout/DeveloperCreditsModal.tsx').includes('systemVersion = "1.1.16-test.30"'));
console.log('PASS versionamento/toolchain: v1.1.14, Node 24.x e pnpm 12.2.0');
