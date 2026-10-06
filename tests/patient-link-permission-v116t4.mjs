import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migration = path.join(root, 'supabase/migrations/20261005200000_allow_authenticated_clinical_capacity_for_link_trigger.sql');
if (!fs.existsSync(migration)) throw new Error('Migration de correção de vínculo ausente.');
const sql = fs.readFileSync(migration, 'utf8').toLowerCase();
if (!sql.includes('grant execute on function public.hpsr_clinical_capacity(uuid, text) to authenticated')) {
  throw new Error('A função de capacidade não foi concedida ao papel authenticated.');
}
if (!sql.includes('revoke execute on function public.hpsr_clinical_capacity(uuid, text) from public, anon')) {
  throw new Error('A migration deve manter public/anon sem execução direta.');
}
if (!sql.includes('service_role')) throw new Error('service_role precisa continuar com EXECUTE.');
console.log('PASS patient-link-permission-v116t4');
