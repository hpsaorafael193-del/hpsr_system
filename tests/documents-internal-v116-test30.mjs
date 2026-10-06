import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.version, '1.1.16-test.30');

const documents = read('src/app/dashboard/documentos/page.tsx');
const exams = read('src/app/dashboard/exames/page.tsx');
const history = read('src/components/dashboard/ClinicalHistoryPanel.tsx');
const internal = read('src/app/dashboard/interno/page.tsx');
const portal = read('src/app/api/paciente/registros/route.ts');
const migration = read('supabase/migrations/20261006033000_structured_exam_release_snapshots.sql');
const adminMigration = read('supabase/migrations/20261006030000_structured_documents_and_internal_admin.sql');
const rpcMigration = read('supabase/migrations/20261006033500_restrict_internal_admin_rpc_execution.sql');

// Documento clínico: banco é fonte oficial; edição e preview são estruturados/dinâmicos.
assert.doesNotMatch(documents, /window\.localStorage|localStorage\.(?:setItem|getItem)|sessionStorage\.(?:setItem|getItem)/);
assert.match(documents, /schemaVersion: 2/);
assert.match(documents, /documentKind: "medical-document"/);
assert.match(documents, /loadDocumentForEditing/);
assert.match(documents, /DocumentVisualPreviewPage/);
assert.match(documents, /Salvar e atualizar Portal/);
assert.match(documents, /releasedSnapshot/);
assert.doesNotMatch(documents, /previewImages:\s*renderedImages|previewImage:\s*renderedImages/);
assert.match(documents, /canvas\.toBlob/);
assert.equal((documents.match(/renderDocumentCanvas\(/g) || []).length, 2, 'renderDocumentCanvas deve existir e ser chamado apenas no download');

// Exames: preview React e PNG só no download explícito; novos registros não persistem PNG.
assert.doesNotMatch(exams, /window\.localStorage|localStorage\.(?:setItem|getItem)|sessionStorage\.(?:setItem|getItem)/);
assert.match(exams, /RenderedExamPageView/);
assert.match(exams, /examKind: "structured-exam"/);
assert.match(exams, /set_clinical_record_confidentiality/);
assert.doesNotMatch(exams, /previewImages:\s*renderedImages|previewImage:\s*renderedImages/);
assert.match(exams, /canvas\.toBlob/);
assert.equal((exams.match(/renderPreviewPage\(/g) || []).length, 2, 'renderPreviewPage deve existir e ser chamado apenas no download');

// Histórico permite reabrir Documento para edição.
assert.match(history, /onEdit\?: \(recordId: string\) => void/);
assert.match(history, /Editar documento/);

// Portal usa a versão publicada e não o rascunho atual quando há snapshot.
assert.match(portal, /payload\?\.releasedSnapshot/);
assert.match(portal, /const visiblePayload = releasedSnapshot \|\| payload/);
assert.match(portal, /released_document_title/);
assert.match(portal, /released_exam_name/);

// Interno ganha administração de documentos/exames, sem editor clínico.
assert.match(internal, /"documentos"/);
assert.match(internal, /Documentos e registros clínicos/);
assert.match(internal, /hpsr_internal_correct_record_metadata/);
assert.match(internal, /hpsr_internal_set_record_visibility/);
assert.match(internal, /O conteúdo clínico não é editável pelo Interno/);

// Supabase: release snapshot, RPC administrativo e execução restrita ao autenticado.
assert.match(migration, /lower\(record_type\) in \('documento', 'exame'\)/);
assert.match(migration, /releasedSnapshot/);
assert.match(adminMigration, /hpsr_internal_correct_record_metadata/);
assert.match(adminMigration, /hpsr_internal_set_record_visibility/);
assert.match(rpcMigration, /from public, anon/);
assert.match(rpcMigration, /to authenticated/);

console.log('PASS v1.1.16-test.30: Documentos/Exames estruturados, publicação por snapshot e administração Interno auditados.');
