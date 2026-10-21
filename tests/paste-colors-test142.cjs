const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const ts=require('typescript');
// Test-only dependencies live outside the application and are never distributed.
const {JSDOM}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'jsdom') : 'jsdom');
const {createCanvas}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas') : '@napi-rs/canvas');
const dom=new JSDOM('<!doctype html><html><body></body></html>');global.window=dom.window;global.document=dom.window.document;global.Node=dom.window.Node;global.NodeFilter=dom.window.NodeFilter;
const create=document.createElement.bind(document);document.createElement=(name,...args)=>name==='canvas'?createCanvas(794,1123):create(name,...args);
const root=process.cwd();const cache={};function load(file){if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.filename=file;m.paths=module.paths;m.require=(id)=>{let target=id.startsWith('@/')?path.join(root,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!target)return require(id);for(const suffix of ['', '.ts','.tsx'])if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile())return load(target+suffix);throw Error('Missing '+id);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}

const paste=load(path.join(root,'src/lib/clinical-paste.ts'));
const rich=load(path.join(root,'src/lib/rich-text-canvas.ts'));
const oldRich=load(path.join(root,'src/lib/rich-text-canvas-legacy.ts'));
const body=load(path.join(root,'src/lib/clinical-body-renderer.ts'));
const docs=load(path.join(root,'src/lib/clinical-body-renderer-v2.ts'));
const incoming='<div class="site-theme" style="background: black; color: inherit; padding:40px"><style>p{background:red}</style><script>alert(1)</script><p bgcolor="red" style="background-color:yellow;color:initial"><b>Negrito</b> <i>Itálico</i> <u>Sublinhado</u><mark>Marcado fora</mark></p><table style="background-color:blue"><tr><td colspan="2" style="background:purple">Tabela</td></tr></table><ul><li>Item</li></ul><span style="color: rgb(200, 0, 0)">Vermelho</span></div>';
const clean=paste.normalizeClinicalPasteHtml(incoming);const parsed=document.createElement('div');parsed.innerHTML=clean;
assert(!/background|bgcolor|site-theme|padding|<mark|<script|<style|inherit|initial/.test(clean),clean);
for(const tag of ['b','i','u','table','ul','li'])assert(parsed.querySelector(tag));
assert.equal(parsed.querySelector('td').getAttribute('colspan'),'2');assert(parsed.textContent.includes('Marcado fora'));assert(clean.includes('rgb(200, 0, 0)'));
console.log('PASS paste strips all source backgrounds and theme CSS, preserving text, emphasis, lists, table structure and explicit text color');
function tracked(){const c=createCanvas(794,1123).getContext('2d');const events=[];const context=new Proxy(c,{get(t,k){if(k==='fillText'||k==='fillRect')return(...args)=>{events.push({op:k,color:t.fillStyle,text:k==='fillText'?args[0]:null});return t[k](...args)};const v=t[k];return typeof v==='function'?v.bind(t):v},set(t,k,v){t[k]=v;return true}});return {context,events};}
for(const renderer of [rich,oldRich])for(const previous of ['#4b2118','#f7ebe0'])for(const style of ['background-color: initial; color: inherit','background-color:var(--site-bg);color:var(--site-text)','background-color: unset; color: currentColor']){
 const {context,events}=tracked();context.fillStyle=previous;const el=document.createElement('p');el.innerHTML='<span style="'+style+'">Texto recuperado</span>';
 renderer.drawRichTextElement(context,el,0,0,710,714,{color:'#4b2118',baseFontSize:12});assert(events.some(x=>x.op==='fillText'));assert(events.filter(x=>x.op==='fillText').every(x=>x.color==='#4b2118'));assert(!events.some(x=>x.op==='fillRect'));
}
console.log('PASS exact pasted initial/inherit regression and CSS variables: no bars, no invisible text, independent of previous canvas color in both rich renderers');
for(const renderer of [body,docs]){
 const {context,events}=tracked();const kind=renderer===body?'exam':'document';
 const html='<p data-hpsr-narrative-panel="true"><span style="background-color:initial;color:inherit">Leitura preservada</span></p><table style="background-color:initial"><tr><td style="color:inherit">Resultado preservado</td></tr></table>';
 const measured=renderer.measureClinicalBody(html,kind);assert.equal(renderer.renderClinicalBody(context,html,0,0,710,900,kind),measured);assert(events.filter(x=>x.op==='fillText').every(x=>x.color==='#4b2118'));
}
const {context,events}=tracked();const el=document.createElement('p');el.innerHTML='<b><span style="background-color:yellow;color:red">Destaque manual</span></b>';rich.drawRichTextElement(context,el,0,0,710,714);assert(events.some(x=>x.op==='fillRect'&&['#ffff00','yellow'].includes(x.color)));assert(events.some(x=>x.op==='fillText'&&['#ff0000','red'].includes(x.color)));
console.log('PASS existing narrative panels and tables stay readable; intentional editor highlighting and foreground color survive canvas output');
for(const name of ['exames','documentos']){const s=fs.readFileSync('src/app/dashboard/'+name+'/page.tsx','utf8');assert(s.includes('onPaste={(event)'));assert(s.includes('normalizeClinicalPasteHtml(html)'));}
console.log('PASS both editors route HTML clipboard content through the same normalizer');
