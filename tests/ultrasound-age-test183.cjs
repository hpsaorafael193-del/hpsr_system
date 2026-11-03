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

const ids=['obst_us_rotina_completo','obst_us_3d','obst_us_4d','img_us_morfologica'];
for(const id of ids){const model=models.find(m=>m.id===id);for(const weeks of ['12','20','32','36']){
 for(const profileId of [model.editorModel.defaultProfileId,...model.profiles.filter(p=>p.id==='primeiro_trimestre'||p.status==='alterado').map(p=>p.id)]){
 const {html,resolved}=render(model,{profileId,clinicalContext:'Primeiro trimestre',variables:{idade_gestacional:weeks},generationSeed:2});const el=parse(html);
 for(const block of ['tecnica','achados','interpretacao','conclusao']){
  const t=el.querySelector(`[data-hpsr-block="${block}"]`)?.textContent||'';
  assert(t.includes(weeks+' semanas'),id+'/'+profileId+'/'+weeks+'/'+block+': '+t);
  if(weeks!=='12')assert(!t.includes('12 semanas'),id+' stale age in '+block);
  if(Number(weeks)>=28)assert(!/primeiro trimestre|1[º°] trimestre/i.test(t),id+' stale trimester '+block);
 }
 if(model.profiles.find(p=>p.id===profileId)?.status==='alterado')assert.equal(resolved.profile.id,profileId,'pathological profile preserved');
 }
}
 const custom=render(model,{profileId:'personalizado',variables:{idade_gestacional:'32',impressao:'Conclusão escrita pelo médico',biometria_fetal:'Biometria manual'}});
 assert(custom.html.includes('Conclusão escrita pelo médico'));if(id==='obst_us_rotina_completo')assert(custom.html.includes('Biometria manual'));
}
const routine=models.find(m=>m.id==='obst_us_rotina_completo');const orig=JSON.stringify(routine);
const early=render(routine,{profileId:'primeiro_trimestre',variables:{idade_gestacional:'12'}}),late=render(routine,{profileId:'primeiro_trimestre',variables:{idade_gestacional:'32'}});
assert(!parse(late.html).textContent.includes('12 semanas'));assert.equal(JSON.stringify(routine),orig,'catalogue remains immutable');
assert(render(routine,{variables:{idade_gestacional:'32 semanas e 3 dias'}}).html.includes('32 semanas e 3 dias'));
const source=fs.readFileSync('src/app/dashboard/exames/page.tsx','utf8');const vm=require('node:vm'),ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const wanted=new Set(['normalizeBlockId','extractAutomaticBlocks','updateTableValuesOnly','mergeAutomaticBlocks']);const declarations=ast.statements.filter(n=>ts.isFunctionDeclaration(n)&&wanted.has(n.name?.text)).map(n=>n.getText(ast));
const sandbox={document,window};vm.createContext(sandbox);vm.runInContext(ts.transpileModule(declarations.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,sandbox);
const merged=sandbox.mergeAutomaticBlocks(early.html,late.html);assert(!parse(merged).textContent.includes('12 semanas'),'editor refreshed all automatic fields');
const manual=parse(early.html);manual.querySelector('[data-hpsr-block="interpretacao"]').dataset.hpsrUserEdited='true';manual.querySelector('[data-hpsr-block="interpretacao"]').innerHTML='<p>Texto manual preservado</p>';
assert(sandbox.mergeAutomaticBlocks(manual.innerHTML,late.html).includes('Texto manual preservado'));
console.log('PASS gestational ultrasound age across method, findings, reading and conclusion; 12/20/32/36 weeks, pathological/custom preservation and actual editor merge');
