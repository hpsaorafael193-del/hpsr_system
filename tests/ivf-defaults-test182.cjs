const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const cache={};const {createCanvas,Image:CanvasImage}=require('@napi-rs/canvas');let drawn=[];
class Image extends CanvasImage {set src(value){super.src=fs.readFileSync('public'+value)} get src(){return super.src}}
const document={fonts:{ready:Promise.resolve()},createElement(){const c=createCanvas(1,1),ctx=c.getContext('2d'),fill=ctx.fillText.bind(ctx);const font=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ctx),'font');Object.defineProperty(ctx,'font',{get(){return font.get.call(ctx)},set(v){font.set.call(ctx,v.replace(/^550 /,'600 '))}});ctx.fillText=(text,...args)=>{drawn.push(String(text));return fill(text,...args)};return c;}};
function load(file){if(cache[file])return cache[file];const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:id=>id.startsWith('@/lib/')?load('src/lib/'+id.slice(6)+'.ts'):require(id),Date,Set,Map,console,Image,document});return cache[file]=m.exports;}
const p=load('src/lib/obstetric-planning.ts'),defaults=load('src/lib/obstetric-default-content.ts'),d=load('src/lib/obstetric-document.ts');

const plan=p.createPlanningSuggestion('in_vitro','2026-11-03','2026-12-01');
assert.equal(plan.steps.length,5);
const required=['sorológicos','estradiol e LH','ICSI','48h','BETA-HCG'];
for(let i=0;i<5;i++){assert.equal(plan.steps[i].planned_text,defaults.DEFAULT_IVF_CONTENT[i]);assert(plan.steps[i].planned_text.includes(required[i]));assert(plan.steps[i].planned_text.includes('INJEÇÃO:'));assert.equal(plan.steps[i].content_template,'ivf-v2');}
const custom={...plan.steps[0],planned_text:'  Protocolo personalizado  ',description:'Original',fiv_step_id:'id-preservado',fiv_recipient:'doadora'};
const empty={...plan.steps[1],planned_text:' ',description:'',date:'2026-12-09',fiv_step_id:'outra-etapa',fiv_recipient:'ambas'};delete empty.content_template;
const old=[custom,empty],before=JSON.stringify(old),filled=p.fillEmptyPlanningSteps('in_vitro',old);
assert.equal(JSON.stringify(old),before);assert.equal(filled[0],custom);assert.equal(filled.length,2);assert.equal(filled[1].planned_text,defaults.DEFAULT_IVF_CONTENT[1]);assert.equal(filled[1].date,empty.date);assert.equal(filled[1].fiv_step_id,empty.fiv_step_id);assert.equal(filled[1].fiv_recipient,'ambas');
assert.equal(p.normalizePlanningSteps('in_vitro',[{...empty,planned_text:'',description:''}])[0].planned_text,'');
assert.equal(p.fillEmptyPlanningSteps('in_vitro',[{...empty,description:'Descrição antiga'}])[0].description,'Descrição antiga');
assert.equal(p.normalizePlanningSteps('in_vitro',plan.steps)[0].content_template,'ivf-v2');
const partition={...empty,week:4,fiv_order:4,number:1};assert.equal(p.fillEmptyPlanningSteps('in_vitro',[partition])[0].planned_text,defaults.DEFAULT_IVF_CONTENT[3],'ROPA original order rather than local row number');
(async()=>{
 drawn=[];
 const canvas=await d.renderIntegralPlanningCanvas({kind:'in_vitro',patient:'Paciente teste',passport:'TEST',doctor:'Médico teste',steps:plan.steps,referenceDate:'2026-12-01'});
 const normalize=t=>t.replace(/\s+/g,' ').trim();let text=normalize(drawn.join(' '));
 for(const row of defaults.DEFAULT_IVF_CONTENT)assert(text.includes(normalize(row)),'full integral: '+row);
 assert(!text.includes('…'));fs.writeFileSync('/workspace/scratch/a2ed3f78c53f/ivf182/preview.png',canvas.toBuffer('image/png'));
 for(const step of plan.steps){drawn=[];await d.renderIndividualPlanningCanvas({kind:'in_vitro',patient:'Paciente teste',passport:'TEST',doctor:'Médico teste',step,evolution:'',exams:'',observation:''});text=normalize(drawn.join(' '));assert(text.includes(normalize(step.planned_text)),'full individual');assert(!text.includes('…'));}
 console.log('PASS five complete IVF defaults, blank-only fill, dates/ROPA identity/custom text preserved, snapshots unchanged; integral and all individual rows drawn completely');
})().catch(e=>{console.error(e);process.exit(1)});
