import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync('src/app/api/paciente/registros/route.ts','utf8');
const ast=ts.createSourceFile('route.ts',source,ts.ScriptTarget.Latest,true);
const fn=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='safeRecord');
assert(fn);
const context={sanitizeClinicalHtml:value=>value,sanitizeRenderSnapshot:value=>value,resolveRecordDate:value=>value.examDate};
vm.createContext(context);vm.runInContext(ts.transpileModule(fn.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,context);
for(const type of ['Exame','Documento']){
 const published={examName:'Published',reportHtml:'Published body',examDate:'2026-10-20',doctor:{name:'Doctor',signatureImage:'original-signature'},renderSnapshot:{kind:'exam',version:'published'}};
 const draft={examName:'Private draft',reportHtml:'Private draft body',doctor:{name:'Changed doctor'},renderSnapshot:{version:'private'}};
 const row={record_type:type,payload:{...draft,releasedSnapshot:{examName:'Old legacy'}},released_render_payload:published,is_confidential:false};
 let result=context.safeRecord(row);assert.equal(result.title,'Published');assert.equal(result.html,'Published body');assert.equal(result.renderPayload.doctor.signatureImage,'original-signature');assert.equal(result.renderPayload.renderSnapshot.version,'published');
 row.released_render_payload=null;row.payload.releasedSnapshot=published;result=context.safeRecord(row);assert.equal(result.title,'Published');assert.equal(result.html,'Published body');
}
console.log('PASS actual portal serializer: published snapshot wins over private draft; legacy snapshots and exact signatures preserved');
