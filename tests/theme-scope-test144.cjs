const fs=require('fs'),ts=require('typescript'),vm=require('vm'),assert=require('node:assert/strict');
let pathname='/dashboard',stored='dark',blocked=false,cursor=0,dirty=false;const slots=[],queue=[],listeners=new Set();
const document={documentElement:{dataset:{theme:'light'}}};
const window={location:{pathname},addEventListener:(_type,f)=>listeners.add(f),removeEventListener:(_type,f)=>listeners.delete(f)};
const storage={getItem(){if(blocked)throw Error('blocked');return stored},setItem(_k,v){if(blocked)throw Error('blocked');stored=v}};
function effect(fn,deps){const index=cursor++,old=slots[index];if(!old||deps.some((v,i)=>v!==old.deps[i])){queue.push(()=>{old?.cleanup?.();slots[index]={deps,cleanup:fn()}});}}
const React={createContext:()=>({Provider:'provider'}),useContext:()=>{},useRef:v=>{const index=cursor++;if(!slots[index])slots[index]={current:v};return slots[index]},useState:v=>{const index=cursor++;if(!slots[index])slots[index]={value:v};return [slots[index].value,next=>{if(slots[index].value!==next)dirty=true;slots[index].value=next}]},useEffect:effect,useLayoutEffect:effect};
const providerExports={};const moduleObject={exports:providerExports};
const sandbox={exports:providerExports,module:moduleObject,window,document,localStorage:storage,require:id=>id==='react'?React:id==='next/navigation'?{usePathname:()=>pathname}:id==='react/jsx-runtime'?{jsx:(type,props)=>({type,props})}:require(id)};
const code=ts.transpileModule(fs.readFileSync('src/components/theme/ThemeProvider.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(code,sandbox);
function render(){let output;do{dirty=false;cursor=0;output=providerExports.ThemeProvider({children:null});while(queue.length)queue.shift()();}while(dirty);return output.props.value;}
assert.equal(render().theme,'dark');assert.equal(document.documentElement.dataset.theme,'dark');
pathname='/';let state=render();assert.equal(state.theme,'light');assert.equal(document.documentElement.dataset.theme,'light');assert.equal(stored,'dark');state.toggleTheme();assert.equal(stored,'dark');
pathname='/paciente';assert.equal(render().theme,'light');for(const listener of listeners)listener({key:'hpsr-ui-theme',newValue:'dark'});assert.equal(document.documentElement.dataset.theme,'light');
pathname='/dashboard/perfil';assert.equal(render().theme,'dark');state=render();state.toggleTheme();assert.equal(render().theme,'light');assert.equal(stored,'light');
blocked=true;render().toggleTheme();assert.equal(render().theme,'dark');pathname='/login';assert.equal(render().theme,'light');pathname='/dashboard/exames';assert.equal(render().theme,'dark');
console.log('PASS: dashboard → public → patient portal → dashboard transitions; preference retained, public toggle denied, cross-tab event scoped and blocked storage tolerated.');
