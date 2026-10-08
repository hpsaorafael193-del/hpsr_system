import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.version, '1.1.16-test.101');

const rules = read('SYSTEM_ENVIRONMENT_RULES.md');
assert(rules.includes('barra fina escura'));
assert(rules.includes('Não criar um container decorativo envolvendo a página inteira'));
assert(rules.includes('Supabase é a fonte persistente oficial'));
assert(rules.includes('O sistema não gera PDF'));
assert(rules.includes('Identidade profissional é o UUID do perfil'));

const obstetra = read('src/app/dashboard/obstetra/page.tsx');
const direction = read('src/app/dashboard/direcao/page.tsx');
const userMenu = read('src/components/layout/UserMenu.tsx');
const timeClock = read('src/components/dashboard/TimeClockAdministrativeReport.tsx');
for (const source of [obstetra, direction, userMenu, timeClock]) {
  assert(!/window\.(confirm|alert|prompt)\s*\(/.test(source));
}
assert(obstetra.includes('hpsrConfirm'));
assert(direction.includes('hpsrAlert'));
assert(userMenu.includes('hpsrConfirm'));
assert(timeClock.includes('hpsrPrompt'));

const adminStorage = read('src/lib/administrative-storage.ts');
assert(!adminStorage.includes('localStorage'));
assert(adminStorage.includes('Supabase é a fonte oficial'));

const examTypes = read('src/data/exames/types.ts');
assert(!examTypes.includes('pdfModel'));
assert(examTypes.includes('documentModel'));

const legacyAssistant = read('src/app/dashboard/assistente-clinico/page.tsx');
const legacyObstetrics = read('src/app/dashboard/obstetricia/page.tsx');
assert(legacyAssistant.includes('redirect("/dashboard")'));
assert(legacyObstetrics.includes('redirect("/dashboard/obstetra")'));

const migration = read('supabase/migrations/20261006200000_sync_professional_names_and_release_cleanup.sql');
assert(migration.includes('hpsr_sync_professional_display_name'));
assert(migration.includes('hpsr_apply_professional_display_name'));
assert(migration.includes('drop policy if exists "public appointment insert"'));
assert(migration.includes("Luidhy Luddhiev"));

const noResponseMigration = read('supabase/migrations/20261006170000_harden_appointments_and_close_no_response_links.sql');
assert(noResponseMigration.includes("v_reason = 'Falta de resposta'"));
assert(noResponseMigration.includes("status = 'Arquivado'"));
assert(noResponseMigration.includes("status = 'Cancelado'"));
assert(noResponseMigration.includes("status = 'Cancelada'"));
const patientLinks = read('src/app/dashboard/agendamento/pacientes/page.tsx');
assert(patientLinks.includes('result.commitmentsPreserved !== false'));
assert(patientLinks.includes('appointmentManagementStatus: "Sem resposta"'));
assert(patientLinks.includes('.update({ status: "Arquivado", updated_at: endedAt })'));

assert(existsSync('tests/portal-audit.mjs'));
console.log('PASS release audit v1.1.16-test.101');
