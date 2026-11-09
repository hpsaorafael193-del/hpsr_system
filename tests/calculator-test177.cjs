const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');const dom=new JSDOM('<div id="root"></div>',{url:'https://hpn-saorafael.com.br/dashboard/calculadora'});global.window=dom.window;global.document=dom.window.document;Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true});global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client');
function moduleCode(file,require){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{module:m,exports:m.exports,require,React,window:dom.window,document:dom.window.document,console,Date,Map,Set,Object,Math});return m.exports;}
const pricing=moduleCode('src/data/service-pricing.ts',()=>{});let saved;
const Page=moduleCode('src/app/dashboard/calculadora/page.tsx',id=>{if(id==='react')return React;if(id==='lucide-react')return new Proxy({},{get:()=>()=>null});if(id==='@/data/service-pricing')return pricing;if(id.includes('brazil-datetime'))return {brazilIso:d=>d.toISOString()};if(id.includes('PageHeader'))return {PageHeader:()=>null};if(id.includes('CurrentUserProfile'))return {useCurrentUserProfile:()=>({profile:{signatureName:'Teste',systemName:'Teste',crm:'1'}})};if(id.includes('administrative-storage'))return {saveFinancialReceipt:async r=>{saved=r;return {synced:true}},registerSystemActivity:()=>{}};if(id.includes('HpsrDialogProvider'))return {hpsrAlert:async()=>{}};throw Error(id)}).default;
const root=createRoot(document.getElementById('root'));
const buttons=()=>[...document.querySelectorAll('button')];async function click(text){const b=buttons().find(b=>b.textContent.trim()===text);assert(b,text);await act(async()=>b.click());}
function price(name){const card=[...document.querySelectorAll('article')].find(a=>a.querySelector('h3')?.textContent===name);assert(card,name);const text=[...card.querySelectorAll('p')].map(p=>p.textContent.trim()).find(s=>s.startsWith('R$'));assert(text,name+' currency');return text.replace(/\s+/g,' ');}
const civil={'KIT MÉDICO':2300,'ATADURA':200,'BANDAGEM':300,'ADRENALINA':7800,'SINKALME':300,'RITMONEURY':300,'ANALGÉSICO':200,'REMÉDIOS':800};
const services={'CIRURGIA':250000,'TRATAMENTO':1800,'DESLOCAMENTO':1800,'DESLOCAMENTO (ILHAS)':3800,'RESSONÂNCIA MAGNÉTICA':4800,'RAIO-X':2800,'EXAMES':3800,'GESSO':1800,'CONSULTA COM ESPECIALISTA':24800,'PSICOTÉCNICO':40000,'INTERNAÇÃO':40000,'PARTO NORMAL':250000,'PARTO CESÁREA':300000,'PARTO HUMANIZADO':320000};
const currency=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\s+/g,' ');
function assertPrices(values,pm=false){for(const [name,value]of Object.entries(values)){const specialized=name.startsWith('CONSULTA')||name.startsWith('DESLOCAMENTO')||name.startsWith('PARTO')||['CIRURGIA','INTERNAÇÃO','PSICOTÉCNICO'].includes(name);assert.equal(price(name),currency(pm&&!specialized?value*.9:value),name);}}
async function tab(name){await act(async()=>buttons().find(b=>b.textContent.includes(name)).click());}
async function add(name){const card=[...document.querySelectorAll('article')].find(a=>a.querySelector('h3')?.textContent===name);await act(async()=>card.querySelectorAll('button')[1].click());}
(async()=>{
window.sessionStorage.setItem('hpsr-calculator-draft-v1',JSON.stringify({cart:{p9:99,p7:1},convenio:'sem',isPmSale:false}));
await act(async()=>root.render(React.createElement(Page)));
assertPrices(civil);await click('PM');assertPrices(civil,true);
await add('KIT MÉDICO');await add('KIT MÉDICO');
await tab('Serviços Médicos');assertPrices(services,true);assert(!document.body.textContent.includes('URSOS MÉDICOS'));
await add('EXAMES');await add('CONSULTA COM ESPECIALISTA');
// Receipt persistence uses the actual calculated unit prices, not rendered substring matches.
dom.window.HTMLCanvasElement.prototype.getContext=()=>null;
await click('Gerar recibo');assert(saved);assert.equal(saved.total,3236000);assert.equal(saved.tabletHpTotal,342000);assert.equal(saved.doctorTotal,2894000);assert(!saved.items.some(i=>['p9','p7','p12'].includes(i.id)));assert.equal(saved.items.find(i=>i.id==='p6').unitPrice,2480000);
await click('Civil');assertPrices(services);
const plan=buttons().find(b=>b.textContent.includes('Plano Médico')&&b.textContent.includes('20%'));await act(async()=>plan.click());await click('PM');assertPrices(services);await click('Gerar recibo');assert.equal(saved.total,2656000,'PM plus plan uses only 20% of civil base');assert.equal(saved.tabletHpTotal,304000);
await add('PSICOTÉCNICO');
const split=document.querySelector('[aria-label="Divisão: PSICOTÉCNICO"]');
assert(split.textContent.replace(/\s+/g,' ').includes('Médico:R$ 25.000,00'));
assert(split.textContent.replace(/\s+/g,' ').includes('HP:R$ 15.000,00'));
await click('Gerar recibo');
assert.equal(saved.total,6656000);assert.equal(saved.tabletHpTotal,1804000);assert.equal(saved.doctorTotal,4852000);
assert.equal(saved.items.find(i=>i.id==='p12').total,4000000);
for (const [name, hp] of [['PARTO NORMAL',225000],['PARTO CESÁREA',275000],['PARTO HUMANIZADO',295000]]) {
  await add(name);
  const division=document.querySelector(`[aria-label="Divisão: ${name}"]`);
  assert(division.textContent.replace(/\s+/g,' ').includes('Médico:'+currency(25000)));
  assert(division.textContent.replace(/\s+/g,' ').includes('HP:'+currency(hp)));
}
await click('Gerar recibo');
assert.equal(saved.total,93656000);assert.equal(saved.tabletHpTotal,81304000);assert.equal(saved.doctorTotal,12352000);
const imgs=[...document.querySelectorAll('img')].filter(i=>i.src.includes('/hpsr/'));assert.equal(imgs.length,14);for(const img of imgs)assert(fs.existsSync('public'+new URL(img.src).pathname));
await act(async()=>root.unmount());dom.window.close();console.log('PASS exact 22 prices, PM exclusions, noncumulative plan, real receipt totals and repasses, old bear draft discarded, 14 service icons verified');
})().catch(e=>{console.error(e);process.exit(1)});
