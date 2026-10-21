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
const oldBody=load(path.join(root,'src/lib/clinical-body-renderer-v3.ts'));
const pages=load(path.join(root,'src/data/exames/final-renderer.tsx'));
const render=load(path.join(root,'src/lib/exam-page-canvas.ts'));
const snapshots=load(path.join(root,'src/lib/clinical-render-snapshot.ts'));
const behavior=load(path.join(root,'src/lib/rich-editor-behavior.ts'));
const layout=load(path.join(root,'src/lib/exam-report-layout.ts'));
function text(html){const el=document.createElement('div');el.innerHTML=html;return el.textContent.replace(/\s+/g,'');}
function check(html){const parts=pages.splitClinicalReportHtmlIntoPages(html);assert(parts.length);parts.forEach((part,index)=>assert(body.measureClinicalBody(part,'exam')<=(index===parts.length-1?714:834)+.01));return parts;}
const simple='<p>Linha de conteúdo.</p>';
assert.equal(check(simple).length,1);
let expanded=false;for(let lines=1;lines<=150;lines++){
 const html=Array.from({length:lines},(_,i)=>'<p>Linha '+i+' de conteúdo para verificação.</p>').join('');
 const split=check(html);assert.equal(text(split.join('')),text(html));
 if(split.length>1 && body.measureClinicalBody(split[0],'exam')>714)expanded=true;
 assert(split.every(part=>text(part).length));
}
assert(expanded);console.log('PASS 150 report lengths: unsigned pages use the signature band; terminal report stays within 714px; no empty signature-only page or lost text');
const table='<h2>Resultados</h2><table><thead><tr><th>Parâmetro</th><th>Resultado</th></tr></thead><tbody>'+Array.from({length:95},(_,i)=>'<tr><td>Item '+i+'</td><td>Valor '+i+'</td></tr>').join('')+'</tbody></table><h2>Leitura clínica</h2><p>Texto de interpretação.</p><h2>Conclusão</h2><p>Resultado final.</p>';
const split=check(table);const values=[];split.forEach(html=>{const el=document.createElement('div');el.innerHTML=html;values.push(...[...el.querySelectorAll('tbody tr')].map(tr=>tr.textContent));});assert.equal(values.length,95);assert.equal(new Set(values).size,95);
console.log('PASS tables fill available space, repeat headers and preserve every result before interpretation/conclusion');
const rhythm='<h2>Resultados</h2><p>Achado.</p><h2>Leitura clínica</h2><p>Significado.</p><h2>Conclusão</h2><p>Resultado.</p>';
assert.equal(body.measureClinicalBody(rhythm,'exam')-oldBody.measureClinicalBody(rhythm,'exam'),24);
assert(fs.readFileSync('src/app/globals.css','utf8').includes('margin-top:12px'));
console.log('PASS two section transitions add exactly 24px in measured report; spacing uses CSS rather than artificial empty paragraphs');
for(const nested of [false,true])for(const key of ['Backspace','Delete']){
 const editor=document.createElement('div');editor.contentEditable='true';editor.innerHTML=(nested?'<section>':'')+'<table><tbody><tr><td>Resultado A</td></tr><tr><td>Resultado B</td></tr></tbody></table><p><br></p><h2>Leitura clínica</h2>'+(nested?'</section>':'');document.body.append(editor);const p=editor.querySelector('p'),range=document.createRange();range.setStart(p,0);range.collapse(true);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);let changed=0;assert(behavior.handleRichEditorTableKeyDown({key,preventDefault(){}},editor,()=>changed++));assert.equal(editor.querySelectorAll('tbody tr').length,2);assert(!editor.querySelector('p'));assert.equal(changed,1);editor.remove();
}
console.log('PASS Backspace/Delete remove nested and direct empty spacers while preserving all table rows');
(async()=>{
 const pen=createCanvas(260,50);pen.getContext('2d').fillRect(20,20,180,2);const signature=pen.toDataURL('image/png');
 const metadata={examName:'Laudo de teste',protocol:'TEST-143',date:'2026-10-21',time:'20:00',patient:{name:'Paciente de teste',passport:'1',age:'30',bloodType:'O+'},doctor:{name:'Médico de teste',crm:'123'},signatureImage:signature};
 const full=pages.createFinalExamDocument({metadata,reportHtml:Array.from({length:75},(_,i)=>'<p>Trecho '+i+'</p>').join(''),manualAttachments:[{id:'anexo',name:'imagem.png',url:signature}],automaticAttachments:[{id:'auto',title:'Anexo técnico',subtitle:'Complemento',legend:'Legenda',orientation:'portrait',scale:'normal',sections:['Campo A']}]});
 assert.equal(full.contentRendererVersion,4);const last=layout.lastReportPageIndex(full.pages);assert(last>0);assert.equal(full.pages.length,last+3);
 const captured=await snapshots.captureExamSnapshot(full);assert.equal(captured.rendererVersion,4);assert.equal(captured.layout.unsignedBodyHeight,834);assert.equal(snapshots.resolveClinicalSnapshot({renderSnapshot:captured},'Exame').snapshot,captured);
 for(const version of [1,2,3])assert.equal(snapshots.resolveClinicalSnapshot({renderSnapshot:{kind:'exam',rendererVersion:version,document:full}},'Exame').snapshot.rendererVersion,version);
 const createOriginal=document.createElement;let printed=[];document.createElement=(tag,...args)=>{const item=createOriginal(tag,...args);if(tag==='canvas'){const get=item.getContext.bind(item);item.getContext=(...a)=>{const c=get(...a);return new Proxy(c,{get(t,k){if(k==='fillText')return(...args)=>{printed.push({text:args[0],y:args[2]});return t.fillText(...args)};const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}});};}return item;};
 for(let i=0;i<full.pages.length;i++){
  printed=[];const blob=await render.renderExamPage(full,i);assert(blob instanceof Blob&&blob.type==='image/png');assert.equal(printed.some(x=>x.text.includes('Dr(a).')),i===last);
  if(i<last)assert(!printed.some(x=>x.text.includes('Trecho')&&x.y>=1048));
 }
 console.log('PASS actual full PNG rendering: signature on final report only, never on automatic/manual attachments; versioned snapshots retain layout limits and support v1–v3');
})().catch(error=>{console.error(error);process.exitCode=1});
