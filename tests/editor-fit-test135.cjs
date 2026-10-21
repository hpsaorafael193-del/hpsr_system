const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const ts=require('typescript');
// Test-only dependencies live outside the application and are never distributed.
const {JSDOM}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'jsdom') : 'jsdom');
const {createCanvas}=require(process.env.HPSR_EDITOR_TEST_DEPS ? path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas') : '@napi-rs/canvas');
const dom=new JSDOM('<!doctype html><html><body></body></html>');global.window=dom.window;global.document=dom.window.document;global.Node=dom.window.Node;global.NodeFilter=dom.window.NodeFilter;
const create=document.createElement.bind(document);document.createElement=(name,...args)=>name==='canvas'?createCanvas(794,1123):create(name,...args);
const root=process.cwd();const cache={};function load(file){if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.filename=file;m.paths=module.paths;m.require=(id)=>{let target=id.startsWith('@/')?path.join(root,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!target)return require(id);for(const suffix of ['', '.ts','.tsx'])if(fs.existsSync(target+suffix)&&fs.statSync(target+suffix).isFile())return load(target+suffix);throw Error('Missing '+id);};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}


const layout=load(path.join(root,'src/lib/use-clinical-editor-layout.ts'));
for(const width of [1,120,240,280,320,375,425,510,600,709,710,711,900,1400]){
 const scale=layout.clinicalEditorFitScale(width);assert(scale>0&&scale<=1);assert(710*scale<=width+.001,`content overflows at ${width}`);
}
assert.equal(layout.clinicalEditorFitScale(900),1);assert.equal(layout.clinicalEditorFitScale(710),1);
const css=fs.readFileSync('src/app/globals.css','utf8');const latest=css.slice(css.indexOf('/* test.135'));
const style=document.createElement('style');style.textContent=css.slice(css.indexOf('/* test.132'))+'\n'+latest;document.head.append(style);
document.body.innerHTML='<div class="hpsr-exams-page"><div class="hpsr-exams-editor-viewport"><div class="hpsr-exam-editor-sheet"><div class="relative"><div class="hpsr-continuous-editor"></div></div></div></div></div>';
const viewport=document.querySelector('.hpsr-exams-editor-viewport'),sheet=document.querySelector('.hpsr-exam-editor-sheet');
assert.equal(window.getComputedStyle(viewport).overflowX,'hidden');assert.equal(window.getComputedStyle(viewport).overflowY,'auto');
assert.equal(Number.parseFloat(window.getComputedStyle(sheet).minWidth),0);assert.equal(window.getComputedStyle(sheet).maxWidth,'794px');assert.equal(window.getComputedStyle(sheet).width,'100%');
const source=fs.readFileSync('src/app/dashboard/exames/page.tsx','utf8');assert(source.includes('useClinicalEditorLayout(editorRef, updateEditorPageGuides, true)'));
console.log('PASS responsive sheet, no fixed minimum width, vertical-only viewport, and logical content fits 14 narrow/wide widths without horizontal overflow');
