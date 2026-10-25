const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const ts=require('typescript');
// Test-only dependencies live outside the application and are never distributed.
const {JSDOM}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'jsdom') : 'jsdom');
const {createCanvas}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas') : '@napi-rs/canvas');
const dom=new JSDOM('<!doctype html><html><body></body></html>');global.window=dom.window;global.document=dom.window.document;global.Node=dom.window.Node;global.NodeFilter=dom.window.NodeFilter;
const create=document.createElement.bind(document);document.createElement=(name,...args)=>name==='canvas'?createCanvas(794,1123):create(name,...args);
const root=process.cwd();const cache={};function load(file){if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.filename=file;m.paths=module.paths;m.require=(id)=>{let target=id.startsWith('@/')?path.join(root,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!target)return require(id);for(const suffix of ['', '.ts','.tsx'])if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile())return load(target+suffix);throw Error('Missing '+id);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}


const engine=load(path.join(root,'src/data/exames/adaptive-engine.ts'));

const models=fs.readdirSync('src/data/exames/models').filter(n=>n.endsWith('.ts')).map(n=>Object.values(load(path.join(root,'src/data/exames/models',n)))[0]);
function parse(html){const el=document.createElement('div');el.innerHTML=html;return el;}
function render(model,patch={}){const config={...engine.createInitialAdaptiveConfiguration(model),...patch};const resolved=engine.resolveAdaptiveExam(model,config);return {resolved,html:engine.renderAdaptiveExamReport(resolved)};}
let fields=0;
for(const model of models){
 const custom=model.profiles.find(p=>p.status==='personalizado');if(!custom)continue;
 const {resolved,html}=render(model,{profileId:custom.id,variables:{}});
 const el=parse(html);
 for(const parameter of resolved.parameters){assert(resolved.dynamicFields.some(f=>f.id===parameter.id),'Missing custom input '+model.id+'/'+parameter.id);}
 assert(!/\b134\b|18 mm/.test(el.querySelector('[data-hpsr-block="conclusao"]')?.textContent||''));
 // Every exposed manual result is consumed by generation, not merely echoed in Method.
 for(const parameter of resolved.parameters){
  const marker='Achado individual '+parameter.id;
  const changed=render(model,{profileId:custom.id,variables:{[parameter.id]:marker}});
  assert(parse(changed.html).querySelector('table') || parse(changed.html).textContent.includes(marker));
  assert(changed.html.includes(marker),model.id+'/'+parameter.id);fields++;
 }
 // Clinical context remains recorded once in Method; do not duplicate it as reading boilerplate.
 const contextual=render(model,{variables:{contexto_clinico:'Dor persistente após trauma'}});
 if(contextual.resolved.dynamicFields.some(f=>f.id==='contexto_clinico')){
  const reading=parse(contextual.html).querySelector('[data-hpsr-block="interpretacao"]')?.textContent||'';
  assert(parse(contextual.html).textContent.includes('Dor persistente após trauma'),model.id);assert(!reading.includes('A avaliação considera o contexto informado'),model.id);
 }
}
const ctg=models.find(m=>m.id==='obst_cardiotocografia');
assert(ctg.profiles.find(p=>p.id==='normal').name.includes('reativo'));
const a=render(ctg,{clinicalContext:'Vigilância anteparto'}),b=render(ctg,{clinicalContext:'Trabalho de parto'});
assert(a.html.includes('duração e qualidade'));assert(b.html.includes('dinâmica das contrações'));
const values=html=>[...parse(html).querySelectorAll('table tr')].map(tr=>tr.textContent);
assert.deepEqual(values(a.html),values(b.html),'Indication alone must not manufacture an abnormal measurement');
const manual=render(ctg,{profileId:'normal',variables:{fcf_basal:'177',variabilidade:'Reduzida'}});
assert(manual.html.includes('177 bpm'));assert(!parse(manual.html).querySelector('[data-hpsr-block="conclusao"]').textContent.includes('padrão esperado'));
const monitoring=models.find(m=>m.id==='gineco_usg_monitorizacao_folicular');
const hidden=render(monitoring,{variables:{foco_monitorizacao:'Endométrio',papel_no_protocolo:'Doadora',dia_estimulacao:'0',dia_preparo_endometrial:'6'}});
assert(!Object.hasOwn(hidden.resolved.variables,'dia_estimulacao'));
assert(!hidden.html.includes('sem dominância folicular'));
const source=fs.readFileSync('src/app/dashboard/exames/page.tsx','utf8');
const save=source.slice(source.indexOf('setSaveStatus(`Salvo às'),source.indexOf('console.error("[HPSR][Exames] Falha ao salvar'));
assert(save.includes('setPreview({ open: false, document: null, pageIndex: 0 })'));assert(!save.includes('open: true'));
console.log(`PASS ${models.length} models; ${fields} custom input-to-report checks, contextual readings, CTG purposes, manual findings, hidden fields and save modal closure`);

const vm=require('node:vm'),ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const wanted=new Set(['normalizeBlockId','extractAutomaticBlocks','updateTableValuesOnly','mergeAutomaticBlocks']);
const declarations=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&wanted.has(n.name?.text)).map(n=>n.getText(ast));
const sandbox={document,window};vm.createContext(sandbox);vm.runInContext(ts.transpileModule(declarations.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,sandbox);
const fol=render(monitoring,{variables:{foco_monitorizacao:'Folículos',dia_estimulacao:'0'}});
const endo=render(monitoring,{variables:{foco_monitorizacao:'Endométrio',dia_preparo_endometrial:'0'}});
const merged=sandbox.mergeAutomaticBlocks(fol.html,endo.html);assert.deepEqual(values(merged),values(endo.html));
assert(!merged.includes('Folículos antrais na avaliação basal'));
const contextualMerge=sandbox.mergeAutomaticBlocks(a.html,b.html);assert(contextualMerge.includes('dinâmica das contrações'));assert(!contextualMerge.includes('duração e qualidade'));
console.log('PASS actual editor merge replaces obsolete automatic rows on focus change and refreshes context-dependent reading');
let contextModels=0,variableChecks=0;
for(const model of models){
 const initial=render(model);
 for(const field of initial.resolved.dynamicFields.filter(f=>f.source==='variable')){
  let value=field.tipo==='boolean' ? !field.value : field.tipo==='select' ? field.options?.find(option=>option!==field.value) : field.tipo==='number' ? '2' : 'Contexto individual de acompanhamento';
  if(value===undefined)continue;
  const changed=render(model,{variables:{[field.id]:value}});
  assert.notEqual(changed.html,initial.html,`Inert active field ${model.id}/${field.id}`);variableChecks++;
 }
 if(initial.resolved.dynamicFields.some(f=>f.id==='contexto_clinico')){
  const contextual=render(model,{variables:{contexto_clinico:'Dor persistente após trauma'}});
  assert(parse(contextual.html).textContent.includes('Dor persistente após trauma'),model.id);contextModels++;
 }
}
console.log(`PASS ${variableChecks} active-variable mutation checks and ${contextModels} context-aware catalogue readings, including models without a custom profile`);
