const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const ts=require('typescript');
// Test-only dependencies live outside the application and are never distributed.
const {JSDOM}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'jsdom') : 'jsdom');
const {createCanvas}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas') : '@napi-rs/canvas');
const dom=new JSDOM('<!doctype html><html><body></body></html>');global.window=dom.window;global.document=dom.window.document;global.Node=dom.window.Node;global.NodeFilter=dom.window.NodeFilter;
const create=document.createElement.bind(document);document.createElement=(name,...args)=>name==='canvas'?createCanvas(794,1123):create(name,...args);
const root=process.cwd();const cache={};function load(file){if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.filename=file;m.paths=module.paths;m.require=(id)=>{let target=id.startsWith('@/')?path.join(root,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!target)return require(id);for(const suffix of ['', '.ts','.tsx'])if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile())return load(target+suffix);throw Error('Missing '+id);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}


const engine=load(path.join(root,'src/data/exames/adaptive-engine.ts'));
const baseline=process.env.HPSR_EXAM_BASELINE ? load(path.resolve(process.env.HPSR_EXAM_BASELINE)) : null;
const monitoring=Object.values(load(path.join(root,'src/data/exames/models/gineco_usg_monitorizacao_folicular.ts')))[0];
function report(model,variables,profileId='normal',generationSeed=0){return engine.renderAdaptiveExamReport(engine.resolveAdaptiveExam(model,{...engine.createInitialAdaptiveConfiguration(model),profileId,generationSeed,variables}));}
function parse(html){const el=document.createElement('div');el.innerHTML=html;return el;}
function table(html){return [...parse(html).querySelectorAll('table tr')].map(tr=>[...tr.children].map(c=>c.textContent));}
function section(html,id){return parse(html).querySelector('[data-hpsr-block="'+id+'"]')?.textContent||'';}
for(const generationSeed of [0,1,7,16])for(const zero of ['0','00','0.0','0,0']){
 const html=report(monitoring,{foco_monitorizacao:'Folículos',dia_estimulacao:zero},'normal',generationSeed);
 const rows=table(html);for(const label of ['Ovário direito','Ovário esquerdo','Folículo dominante'])assert(rows.some(row=>row[0]===label));
 const follicleRows=rows.filter(row=>/Folículos/.test(row[0]||''));assert.equal(follicleRows.length,2);
 for(const row of follicleRows)for(const n of row[1].match(/\d+/g)||[])assert(Number(n)>=2&&Number(n)<=10,row[1]);
 assert(!rows.some(row=>/18 mm|dominante de 18|trilaminar/i.test(row[1]||'')));
 assert(/basal/.test(section(html,'tecnica')));assert(/basal/.test(section(html,'interpretacao')));assert(/sem dominância/.test(section(html,'conclusao')));
 assert(!/18 mm/.test(section(html,'interpretacao')));
}
console.log('PASS normal follicular day-zero baseline across four seeds and four zero representations: small antral follicles, no assumed dominant 18mm follicle; method, reading and conclusion agree');
for(const day of ['', '1','5','10']){
 const config={...engine.createInitialAdaptiveConfiguration(monitoring),profileId:'normal',generationSeed:7,variables:{foco_monitorizacao:'Folículos',dia_estimulacao:day}};
 const now=engine.renderAdaptiveExamReport(engine.resolveAdaptiveExam(monitoring,config));if(baseline){const before=baseline.renderAdaptiveExamReport(baseline.resolveAdaptiveExam(monitoring,config));assert.deepEqual(table(now),table(before));}
}
console.log('PASS blank day remains unknown; positive days preserve observed profile values rather than inventing growth solely from elapsed days');
for(const profileId of ['alterado','indefinido','personalizado']){
 const config={...engine.createInitialAdaptiveConfiguration(monitoring),profileId,generationSeed:7,variables:{foco_monitorizacao:'Folículos',dia_estimulacao:'0'}};
 if(baseline)assert.deepEqual(table(engine.renderAdaptiveExamReport(engine.resolveAdaptiveExam(monitoring,config))),table(baseline.renderAdaptiveExamReport(baseline.resolveAdaptiveExam(monitoring,config))));
}
const custom=report(monitoring,{foco_monitorizacao:'Folículos',dia_estimulacao:'0',foliculo_dominante:'Folículo observado de 19 mm'});assert(table(custom).some(row=>row[1]?.includes('19 mm')));assert(!/sem dominância/.test(section(custom,'conclusao')));
console.log('PASS altered/indeterminate/custom profiles and explicit clinician-entered observations are preserved');
const endo=report(monitoring,{foco_monitorizacao:'Endométrio',dia_estimulacao:'10',dia_preparo_endometrial:'0'});assert(table(endo).every(row=>!/Folículo|Ovário/.test(row[0])));assert(/basal/.test(section(endo,'conclusao')));assert(!/trilaminar/.test(section(endo,'achados')));
const config={...engine.createInitialAdaptiveConfiguration(monitoring),profileId:'normal',generationSeed:7,variables:{foco_monitorizacao:'Endométrio',dia_estimulacao:'0',dia_preparo_endometrial:'5'}};if(baseline)assert.deepEqual(table(engine.renderAdaptiveExamReport(engine.resolveAdaptiveExam(monitoring,config))),table(baseline.renderAdaptiveExamReport(baseline.resolveAdaptiveExam(monitoring,config))));
console.log('PASS endometrial focus uses its own preparation day and ignores hidden stimulation-day values');
for(const id of ['lab_hemograma_completo','hormonal_painel_hormonal_completo','lab_sorologia','gineco_usg_monitorizacao_folicular']){
 const model=Object.values(load(path.join(root,'src/data/exames/models',id+'.ts')))[0];const html=report(model,{},'normal',7),el=parse(html);const reading=el.querySelector('[data-hpsr-block="interpretacao"]');assert(reading);assert(reading.textContent.split(/\s+/).length>=20,id);assert(reading.textContent.split(/\s+/).length<180,id);assert(!/A avaliação considera o contexto informado/.test(reading.textContent),id);
 assert([...el.querySelectorAll('[data-hpsr-section-heading]')].every(h=>h.style.fontSize==='17px'));
 const conclusion=el.querySelector('[data-hpsr-block="conclusao"]');assert(conclusion.textContent.length<reading.textContent.length);assert(!reading.textContent.includes(conclusion.textContent.replace(/^\d+\. Conclusão/, '').trim()),id);
}
console.log('PASS expanded evidence-based readings, distinct brief conclusions and source-owned 17px section titles');

const painter=load(path.join(root,'src/lib/clinical-body-renderer.ts'));
const paginator=load(path.join(root,'src/data/exames/final-renderer.tsx'));
const sample=report(monitoring,{foco_monitorizacao:'Folículos',dia_estimulacao:'0'});
const parts=paginator.splitClinicalReportHtmlIntoPages(sample);const painted=[];
const raw=createCanvas(794,1123).getContext('2d');const ctx=new Proxy(raw,{get(t,k){if(k==='fillText')return(...args)=>{painted.push({text:args[0],font:t.font});return t.fillText(...args)};const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true;}});
parts.forEach((html,index)=>painter.renderClinicalBody(ctx,html,42,214,710,214+(index===parts.length-1?714:834),'exam'));
assert(painted.some(p=>p.text.includes('Método')&&p.font.includes('17px')));assert(painted.some(p=>p.text.includes('Conclusão')&&p.font.includes('17px')));
console.log('PASS 17px section headings painted on the real canvas, with complete basal reading and conclusion inside page limits');
