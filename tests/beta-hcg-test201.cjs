const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const ts=require('typescript');
// Test-only dependencies live outside the application and are never distributed.
const {JSDOM}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'jsdom') : 'jsdom');
const {createCanvas}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas') : '@napi-rs/canvas');
const dom=new JSDOM('<!doctype html><html><body></body></html>');global.window=dom.window;global.document=dom.window.document;global.Node=dom.window.Node;global.NodeFilter=dom.window.NodeFilter;
const create=document.createElement.bind(document);document.createElement=(name,...args)=>name==='canvas'?createCanvas(794,1123):create(name,...args);
const root=process.cwd();const cache={};function load(file){if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.filename=file;m.paths=module.paths;m.require=(id)=>{let target=id.startsWith('@/')?path.join(root,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!target)return require(id);for(const suffix of ['', '.ts','.tsx'])if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile())return load(target+suffix);throw Error('Missing '+id);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}


const engine=load(path.join(root,'src/data/exames/adaptive-engine.ts'));

const model=load(path.join(root,'src/data/exames/models/lab_beta_hcg_completo.ts')).lab_beta_hcg_completoModel;
function run(profileId,variables={},seed=0,clinicalContext='Rotina'){
 const resolved=engine.resolveAdaptiveExam(model,{...engine.createInitialAdaptiveConfiguration(model),profileId,variables,generationSeed:seed,clinicalContext});
 const el=document.createElement('div');el.innerHTML=engine.renderAdaptiveExamReport(resolved);
 const rows=[...el.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent));
 const beta=rows.find(r=>r[0]==='β-hCG Quantitativo');
 const val=Number(beta[1].split(' ')[0].replaceAll('.','').replace(',','.'));
 return {el,rows,val,reading:el.querySelector('[data-hpsr-block="interpretacao"]').textContent,conclusion:el.querySelector('[data-hpsr-block="conclusao"]').textContent};
}
const ranges=[[3,9,130],[3.5,9,130],[4,75,2600],[5,850,20800],[6,4000,100200],[8,11500,289000],[12,18300,137000],[20,1400,53000],[32,940,60000]];
let count=0;
for(let seed=0;seed<40;seed++) for(const [w,min,max] of ranges) for(const profile of ['positivo','seguimento','indeterminado','negativo']){
 const x=run(profile,{idade_gestacional_referida:String(w)},seed,'FIV');
 assert(x.rows.find(r=>r[0]==='Idade Gestacional Informada')[1].includes(String(w)));
 assert(x.rows.find(r=>r[0]==='β-hCG Quantitativo')[2].includes('inconclusivo: 5–25'));
 if(profile==='positivo'||profile==='seguimento'){assert(x.val>=min&&x.val<=max,`${profile} ${w}: ${x.val}`);assert(x.val>25);assert(x.conclusion.includes('β-hCG positivo'),JSON.stringify(x));}
 if(profile==='indeterminado'){assert(x.val>=5&&x.val<=25);assert(x.conclusion.includes('β-hCG inconclusivo'));}
 if(profile==='negativo'){assert(x.val<5);assert(x.conclusion.includes('β-hCG negativo'));}
 assert(x.reading.includes('reprodução assistida'));count++;
}
for(const [v,state] of [['4,9','negativo'],['5','inconclusivo'],['25','inconclusivo'],['25,1','positivo'],['82','positivo'],['1.840','positivo']]){
 const x=run('personalizado',{beta_hcg_quantitativo:v,idade_gestacional_referida:'32',resultado_qualitativo:'Inconclusivo'});
 assert(x.conclusion.includes('β-hCG '+state));assert(x.rows.find(r=>r[0]==='Resultado Qualitativo')[1].toLowerCase()===state);
 if(v!=='1.840') assert(x.reading.includes('fora da faixa'));
}
assert(run('personalizado',{idade_gestacional_referida:'32',beta_hcg_quantitativo:'82'}).conclusion.includes('fora da faixa'));
assert(run('positivo',{idade_gestacional_referida:'2'}).conclusion.includes('não é possível classificar'));
assert(run('personalizado',{}).conclusion.includes('não é possível classificar'));
console.log('PASS beta-HCG:',count,'generated cases, thresholds, manual conflicts and missing data');
