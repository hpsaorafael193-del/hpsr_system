const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const ts=require('typescript');
// Test-only dependencies live outside the application and are never distributed.
const {JSDOM}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'jsdom') : 'jsdom');
const {createCanvas}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas') : '@napi-rs/canvas');
const dom=new JSDOM('<!doctype html><html><body></body></html>');global.window=dom.window;global.document=dom.window.document;global.Node=dom.window.Node;global.NodeFilter=dom.window.NodeFilter;
const create=document.createElement.bind(document);document.createElement=(name,...args)=>name==='canvas'?createCanvas(794,1123):create(name,...args);
const root=process.cwd();const cache={};function load(file){if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.filename=file;m.paths=module.paths;m.require=(id)=>{let target=id.startsWith('@/')?path.join(root,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!target)return require(id);for(const suffix of ['', '.ts','.tsx'])if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile())return load(target+suffix);throw Error('Missing '+id);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}

const current=load(path.join(root,'src/data/exames/adaptive-engine.ts'));
const baselinePath=process.env.HPSR_EXAM_BASELINE;
const baseline=baselinePath ? load(path.resolve(baselinePath)) : null;
const language=load(path.join(root,'src/data/exames/report-language.ts'));
const models=fs.readdirSync('src/data/exames/models').filter(n=>n.endsWith('.ts')).map(n=>Object.values(load(path.join(root,'src/data/exames/models',n)))[0]);
const tableValues=html=>{const el=document.createElement('div');el.innerHTML=html;return [...el.querySelectorAll('table')].map(t=>[...t.querySelectorAll('tr:not([data-hpsr-table-group])')].map(r=>[...r.children].map(c=>c.textContent)));};
let cases=0,profiles=0;const review=[];
for(const model of models){let modelProfiles=0;for(const profile of model.profiles){profiles++;modelProfiles++;
 for(const generationSeed of [0,1,7]){
  const config={...current.createInitialAdaptiveConfiguration(model),profileId:profile.id,generationSeed};
  const resolved=current.resolveAdaptiveExam(model,config);
  const html=current.renderAdaptiveExamReport(resolved);
  assert(html.includes('data-hpsr-section-heading="true"'));
  assert(!/Principais resultados:|Resumo principal:|nova amostragem|achados atualizados|documentam o padrão alterado selecionado/.test(html),model.id+'/'+profile.id);
  if(baseline){const before=baseline.resolveAdaptiveExam(model,config);assert.deepEqual(resolved,before);assert.deepEqual(tableValues(html),tableValues(baseline.renderAdaptiveExamReport(before)),model.id+'/'+profile.id);}
  const el=document.createElement('div');el.innerHTML=html;
  const interpretation=el.querySelector('[data-hpsr-block="interpretacao"]')?.textContent||'';
  const conclusion=el.querySelector('[data-hpsr-block="conclusao"]')?.textContent||'';
  assert(conclusion.trim(),model.id+'/'+profile.id);
  if(model.id==='genetico_sexagem_fetal'&&profile.id.startsWith('gemelar_'))assert(interpretation.includes('não distingue'));
  if(model.id==='geral_exame_toxicologico')assert(conclusion.includes('não define, sozinho'));
  if(model.id==='lab_hba1c_completa'&&profile.id!=='personalizado'){for(const token of interpretation.match(/5,4%|108 mg|5,9%|123 mg|7,2%|160 mg/g)||[])assert(tableValues(html).flat(2).some(cell=>cell.includes(token)), 'Stale HbA1c value: '+token);}
  cases++;
 }
}review.push({id:model.id,profiles:modelProfiles});}
assert.equal(models.length,86);
assert.equal(language.uniqueReportParagraphs('Sem alteração. Sem alteração. Alteração presente.'),'Sem alteração. Alteração presente.');
assert.equal(language.uniqueReportParagraphs('Sem alteração. Alteração presente.','Sem alteração.'),'Alteração presente.');
assert(language.clearReportLanguage('Conclusão sem definição diagnóstica isolada.').includes('sem permitir um diagnóstico por si só'));
console.log(`PASS ${models.length} models, ${profiles} profiles, ${cases} scenarios; ${baseline?'numeric results/reference tables identical to baseline':'all catalogue assertions passed'}`);
if(process.env.HPSR_COPY_REVIEW_OUTPUT)fs.writeFileSync(process.env.HPSR_COPY_REVIEW_OUTPUT,JSON.stringify({models:models.length,profiles,cases,numericBaselineCompared:!!baseline,coverage:review},null,2));
const renderer=load(path.join(root,'src/lib/clinical-body-renderer.ts'));
const pagination=load(path.join(root,'src/data/exames/final-renderer.tsx'));
const canvasContext=createCanvas(794,1123).getContext('2d');
let rectangles=0;const drawContext=new Proxy(canvasContext,{get(target,key){if(key==='fillRect')return (...args)=>{rectangles++;return target.fillRect(...args)};const value=target[key];return typeof value==='function'?value.bind(target):value;},set(target,key,value){target[key]=value;return true;}});
const decorated='<h2 data-hpsr-section-heading="true">Resultados</h2><p><span style="color:blue;background-color:yellow">Escolha do editor</span></p>';
const measured=renderer.measureClinicalBody(decorated,'exam');
assert.equal(renderer.renderClinicalBody(drawContext,decorated,0,0,710,714,'exam'),measured);assert(rectangles>=2);
assert.equal(renderer.measureClinicalBody('<h2>Resultados</h2>','exam'),renderer.measureClinicalBody('<h2 data-hpsr-section-heading="true">Resultados</h2>','exam'));
const source=decorated.repeat(70);const sheets=pagination.splitClinicalReportHtmlIntoPages(source);
assert(sheets.length>1);sheets.forEach((sheet,index)=>{assert(renderer.measureClinicalBody(sheet,'exam')<=(index===sheets.length-1?714:834)+.01);assert(sheet.includes('data-hpsr-section-heading'));});
console.log('PASS source-owned decoration and manual colors share measurement/drawing; pagination remains inside the body');
