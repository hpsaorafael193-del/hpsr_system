const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const ts=require('typescript');
// Test-only dependencies live outside the application and are never distributed.
const {JSDOM}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'jsdom') : 'jsdom');
const {createCanvas}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas') : '@napi-rs/canvas');
const dom=new JSDOM('<!doctype html><html><body></body></html>');global.window=dom.window;global.document=dom.window.document;global.Node=dom.window.Node;global.NodeFilter=dom.window.NodeFilter;
const create=document.createElement.bind(document);document.createElement=(name,...args)=>{if(name!=='canvas')return create(name,...args);const canvas=createCanvas(794,1123);canvas.toBlob=callback=>callback(new Blob([canvas.toBuffer('image/png')],{type:'image/png'}));return canvas;};
const root=process.cwd();const cache={};function load(file){if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.filename=file;m.paths=module.paths;m.require=(id)=>{let target=id.startsWith('@/')?path.join(root,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!target)return require(id);for(const suffix of ['', '.ts','.tsx'])if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile())return load(target+suffix);throw Error('Missing '+id);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}

const {Image:NativeImage,GlobalFonts}=require(path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas'));
if(fs.existsSync('/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf')){
 GlobalFonts.registerFromPath('/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf','Arial');
 GlobalFonts.registerFromPath('/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf','Arial');
}
Object.defineProperty(document,'fonts',{value:{ready:Promise.resolve()}});
global.Image=class extends NativeImage {set src(value){super.src=value.startsWith('/')?fs.readFileSync(path.join(root,'public',value)):value;}get src(){return super.src;}};
const body=load(path.join(root,'src/lib/clinical-body-renderer.ts'));
const oldBody=load(path.join(root,'src/lib/clinical-body-renderer-v2.ts'));
const pages=load(path.join(root,'src/data/exames/final-renderer.tsx'));
const render=load(path.join(root,'src/lib/exam-page-canvas.ts'));
const snapshots=load(path.join(root,'src/lib/clinical-render-snapshot.ts'));
const engine=load(path.join(root,'src/data/exames/adaptive-engine.ts'));
const model=Object.values(load(path.join(root,'src/data/exames/models/lab_hemograma_completo.ts')))[0];
(async()=>{
 const signature=createCanvas(260,50);const pen=signature.getContext('2d');pen.strokeStyle='#111';pen.lineWidth=2;pen.beginPath();pen.moveTo(20,35);pen.bezierCurveTo(90,-5,30,60,190,15);pen.stroke();
 const metadata={examName:'Hemograma',protocol:'TEST-131',date:'2026-10-20',time:'20:30',patient:{name:'Paciente de demonstração',passport:'1234',age:'30 anos',bloodType:'O+'},doctor:{name:'Profissional de demonstração',crm:'12345'},signatureImage:signature.toDataURL('image/png')};
 const resolved=engine.resolveAdaptiveExam(model,{...engine.createInitialAdaptiveConfiguration(model),profileId:'normal'});
 const html=engine.renderAdaptiveExamReport(resolved);
 const split=pages.splitClinicalReportHtmlIntoPages(html);
 assert(split.length);for(const part of split)assert(body.measureClinicalBody(part,'exam')<=714.01);
 const rootHtml=document.createElement('div');rootHtml.innerHTML=html;assert.equal(rootHtml.querySelectorAll('[data-hpsr-table-group]').length,3);
 const long=html+'<p>'+('Texto complementar de demonstração. '.repeat(210))+'</p>';
 const parts=pages.splitClinicalReportHtmlIntoPages(long);assert(parts.length>1);for(const part of parts)assert(body.measureClinicalBody(part,'exam')<=714.01);
 const full={contentRendererVersion:3,pages:parts.map((reportHtml,index)=>({id:String(index),type:'report',label:'Laudo',reportHtml})),automaticAttachments:[],metadata};
 const captured=await snapshots.captureExamSnapshot(full);assert.equal(captured.rendererVersion,3);assert.equal(captured.document.contentRendererVersion,3);assert(captured.document.metadata.signatureImage.startsWith('data:'));
 assert.equal(snapshots.resolveClinicalSnapshot({renderSnapshot:captured},'Exame').snapshot,captured);
 for(const version of [1,2]){const old={kind:'exam',rendererVersion:version,document:{...full,contentRendererVersion:version===2?2:undefined}};assert.equal(snapshots.resolveClinicalSnapshot({renderSnapshot:old},'Exame').snapshot,old);}
 const outputs=[];for(let i=0;i<full.pages.length;i++)outputs.push(await render.renderExamPage(full,i));
 assert(outputs.every(x=>x instanceof Blob && x.type==='image/png'));
 // Capture the actual page renderer's emitted strings, including signature visibility.
 const printed=[];const createCanvasOriginal=document.createElement;
 document.createElement=(tag,...args)=>{const item=createCanvasOriginal(tag,...args);if(tag==='canvas'){const get=item.getContext.bind(item);item.getContext=(...a)=>{const ctx=get(...a);return new Proxy(ctx,{get(target,key){if(key==='fillText')return (...values)=>{printed.push(values[0]);return target.fillText(...values)};const v=target[key];return typeof v==='function'?v.bind(target):v;},set(target,key,value){target[key]=value;return true;}});};}return item;};
 await render.renderExamPage(full,0);assert(!printed.some(t=>t.includes('Dr(a).')));assert(printed.some(t=>t.includes('Continua na próxima')));
 printed.length=0;await render.renderExamPage(full,full.pages.length-1);assert(printed.some(t=>t.includes('Dr(a).')));assert(printed.some(t=>t.includes('Página '+full.pages.length+' de '+full.pages.length)));
 if(process.env.HPSR_VISUAL_OUTPUT){fs.mkdirSync(process.env.HPSR_VISUAL_OUTPUT,{recursive:true});for(const [i,blob] of outputs.entries())fs.writeFileSync(path.join(process.env.HPSR_VISUAL_OUTPUT,`page-${i+1}.png`),Buffer.from(await blob.arrayBuffer()));}
 console.log('PASS v3 full PNG pages, accurate fitting, 3 hematology groups, preserved asset snapshot, old snapshot resolution, last-page signature and continuation footer');
})().catch(error=>{console.error(error);process.exitCode=1;});
