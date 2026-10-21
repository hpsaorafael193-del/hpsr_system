const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const ts=require('typescript');
// Test-only dependencies live outside the application and are never distributed.
const {JSDOM}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'jsdom') : 'jsdom');
const {createCanvas}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas') : '@napi-rs/canvas');
const dom=new JSDOM('<!doctype html><html><body></body></html>');global.window=dom.window;global.document=dom.window.document;global.Node=dom.window.Node;global.NodeFilter=dom.window.NodeFilter;
const create=document.createElement.bind(document);document.createElement=(name,...args)=>name==='canvas'?createCanvas(794,1123):create(name,...args);
const root=process.cwd();const cache={};function load(file){if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.filename=file;m.paths=module.paths;m.require=(id)=>{let target=id.startsWith('@/')?path.join(root,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!target)return require(id);for(const suffix of ['', '.ts','.tsx'])if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile())return load(target+suffix);throw Error('Missing '+id);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}

const vm=require('node:vm');
const source=fs.readFileSync('src/app/dashboard/exames/page.tsx','utf8');
const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const wanted=new Set(['normalizeBlockId','extractAutomaticBlocks','updateTableValuesOnly','mergeAutomaticBlocks','cleanEditorHtml']);const functions=[];
for(const node of ast.statements)if(ts.isFunctionDeclaration(node)&&wanted.has(node.name?.text))functions.push(node.getText(ast));
assert.equal(functions.length,wanted.size);
const sandbox={document,window};vm.createContext(sandbox);vm.runInContext(ts.transpileModule(functions.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,sandbox);
const engine=load(path.join(root,'src/data/exames/adaptive-engine.ts'));
const model=Object.values(load(path.join(root,'src/data/exames/models/lab_hemograma_completo.ts')))[0];
const resolved=engine.resolveAdaptiveExam(model,{...engine.createInitialAdaptiveConfiguration(model),profileId:'anemia'});
const generated=engine.renderAdaptiveExamReport(resolved);
const current=document.createElement('div');current.innerHTML=generated;current.querySelector('[data-hpsr-block="conclusao"]').remove();
current.insertAdjacentHTML('beforeend','<section data-hpsr-block="observacoes" data-hpsr-user-edited="true"><h2>Observações</h2><p>OBSERVACAO_MANUAL_PRESERVADA</p></section>');
const repaired=sandbox.mergeAutomaticBlocks(current.innerHTML,generated);current.innerHTML=repaired;
assert(current.querySelector('[data-hpsr-block="conclusao"]'));assert(current.textContent.includes('OBSERVACAO_MANUAL_PRESERVADA'));
current.querySelector('[data-hpsr-block="conclusao"]').dataset.hpsrUserEdited='true';current.querySelector('[data-hpsr-block="conclusao"] p').textContent='CONCLUSAO_MANUAL';
assert(sandbox.mergeAutomaticBlocks(current.innerHTML,generated).includes('CONCLUSAO_MANUAL'));
const mixed='<div style="color:red"><p>Inicio</p><div><p>Observacoes</p></div><h2>Conclusao</h2><p>FIM_MISTO</p></div>';
const cleaned=sandbox.cleanEditorHtml(mixed);const parsed=document.createElement('div');parsed.innerHTML=cleaned;
assert.equal(parsed.textContent,'InicioObservacoesConclusaoFIM_MISTO');assert(parsed.querySelector('div[style] div p'));
const body=load(path.join(root,'src/lib/clinical-body-renderer.ts'));
const pages=load(path.join(root,'src/data/exames/final-renderer.tsx'));
const guides=load(path.join(root,'src/lib/clinical-editor-guides.ts'));
const report=generated+'<h2>Observações</h2><p>'+('Detalhe clinico registrado. '.repeat(420))+'</p><h2>Conclusão</h2><p>CONCLUSAO_FINAL_132</p>';
const parts=pages.splitClinicalReportHtmlIntoPages(report);assert(parts.length>2);
let printed=[];const c=createCanvas(794,1123).getContext('2d');const ctx=new Proxy(c,{get(t,k){if(k==='fillText')return(...args)=>{printed.push(args[0]);return t.fillText(...args)};const v=t[k];return typeof v==='function'?v.bind(t):v;},set(t,k,v){t[k]=v;return true;}});
parts.forEach((part,index)=>{const cap=index===parts.length-1?714:834;assert(body.measureClinicalBody(part,'exam')<=cap+.01);body.renderClinicalBody(ctx,part,42,214,710,214+cap,'exam');});
assert(printed.join(' ').includes('CONCLUSAO_FINAL_132'));
const original=document.createElement('div');original.innerHTML='<p>Inicio</p><p>CONCLUSAO_FINAL</p>';
assert.throws(()=>guides.clinicalPageSourceOffsets(original,['<p>Inicio</p>'],true),/final do laudo/);
assert.throws(()=>guides.clinicalPageSourceOffsets(original,['<p>CONCLUSAO_FINAL</p>'],true),/omitiu/);
// Real CSS declarations, including the old conflicting auto-section rules.
const css=fs.readFileSync('src/app/globals.css','utf8');const legacy=css.slice(css.indexOf('.hpsr-continuous-editor {'),css.indexOf('/* Exames: apenas'));
const latest=css.slice(css.indexOf('/* test.132'));
const style=document.createElement('style');style.textContent=legacy+'\n'+latest;document.head.append(style);
document.body.innerHTML='<div class="hpsr-exams-page"><div class="hpsr-exams-workspace"><div class="hpsr-continuous-editor">'+generated+'</div></div></div>';
const table=document.querySelector('table'),paragraph=document.querySelector('section p');
assert.equal(window.getComputedStyle(table).width,'710px');assert.equal(window.getComputedStyle(table).tableLayout,'fixed');
assert.equal(window.getComputedStyle(paragraph).marginBottom,'5px');
assert(!source.includes('max-w-[1100px]'));assert(source.includes('className="hpsr-exam-editor-sheet'));
assert(source.includes('captureExamSnapshot(buildPreviewDocument())'));
console.log('PASS missing conclusion restored; manual content preserved; mixed blocks normalized safely; multipage observations retain final conclusion in actual drawing; incomplete pagination blocked; editor width/table CSS override legacy rules');

const files=fs.readdirSync('src/data/exames/models').filter(n=>n.endsWith('.ts'));let count=0;
for(const file of files){const m=Object.values(load(path.join(root,'src/data/exames/models',file)))[0];for(const profile of m.profiles){
 const r=engine.resolveAdaptiveExam(m,{...engine.createInitialAdaptiveConfiguration(m),profileId:profile.id,generationSeed:7});
 const html=engine.renderAdaptiveExamReport(r);const pagesOfModel=pages.splitClinicalReportHtmlIntoPages(html);
 pagesOfModel.forEach((page,index)=>assert(body.measureClinicalBody(page,'exam')<=(index===pagesOfModel.length-1?714:834)+.01,m.id+'/'+profile.id));
 const all=document.createElement('div');all.innerHTML=pagesOfModel.join('');assert(/Conclusão/i.test(all.textContent),m.id+'/'+profile.id);count++;
}}
console.log(`PASS ${files.length} models / ${count} profiles paginated with complete ending and every page inside the body`);
assert(source.includes('useClinicalEditorLayout(editorRef, updateEditorPageGuides, true)'));
