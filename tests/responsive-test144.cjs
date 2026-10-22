/* Controlled browser fixtures use the real profile/menu and pharmaceutical components.
 * Set HPSR_BROWSER_EXECUTABLE and PLAYWRIGHT_MODULE to a local browser installation. */
const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const css=fs.readdirSync('.next/static/css').filter(x=>x.endsWith('.css')).map(x=>fs.readFileSync('.next/static/css/'+x,'utf8')).join('\n')+'\n'+fs.readFileSync('src/app/responsive.css','utf8');
const profile={id:'11111111-1111-4111-8111-111111111111',systemName:'Profissional com nome de teste extenso',role:'Médico Supervisor',signaturePath:'test.png'};
let forceOpen=false,firstState=true;const cache={};
function load(file){file=path.resolve(file);if(cache[file])return cache[file].exports;const m=new Module(file,module);cache[file]=m;m.paths=module.paths;m.require=id=>{
 if(id==='react'&&file.endsWith('UserMenu.tsx'))return {...React,useState:initial=>{const open=firstState&&forceOpen;firstState=false;return React.useState(open?true:initial)}};
 if(id==='next/navigation')return {useRouter:()=>({push:()=>{}}),usePathname:()=>'/dashboard/guia-farmaceutico'};
 if(id==='@/components/theme/ThemeProvider')return {useTheme:()=>({theme:'dark',toggleTheme:()=>{}})};
 if(id==='@/components/auth/CurrentUserProfileProvider')return {useCurrentUserProfile:()=>({profile,refreshProfile:async()=>{}})};
 if(id==='@/lib/supabase')return {createClient:()=>null,isSupabaseConfigured:()=>false};
 if(id.endsWith('.module.css')){const name=path.basename(id,'.module.css');const out={};for(const hit of css.matchAll(new RegExp('\\.'+name+'_([a-zA-Z0-9_]+)__([a-zA-Z0-9_-]+)','g')))out[hit[1]]=name+'_'+hit[1]+'__'+hit[2];return {__esModule:true,default:out};}
 if(id.startsWith('@/')){const target=path.join(process.cwd(),'src',id.slice(2));for(const ext of ['.ts','.tsx'])if(fs.existsSync(target+ext))return load(target+ext);}
 return require(id);
 };m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return m.exports;}
(async()=>{
 forceOpen=true;firstState=true;const {UserMenu}=load('src/components/layout/UserMenu.tsx');const menu=renderToStaticMarkup(React.createElement(UserMenu));
 forceOpen=false;const {PharmaGuideClient}=load('src/components/dashboard/PharmaGuideClient.tsx');const pharmacy=renderToStaticMarkup(React.createElement(PharmaGuideClient));
 assert(menu.includes('Modo escuro'));assert(pharmacy.includes('PharmaGuideClient_page__'));
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
 const browser=await chromium.launch({executablePath:process.env.HPSR_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote'],headless:true});
 try{
 const page=await browser.newPage();await page.route('**/*',route=>route.abort());
 let cases=0;
 for(const mode of ['light','dark'])for(const [width,height]of [[320,740],[375,812],[768,1024],[900,700],[1024,768],[1440,900],[1920,1080],[2560,1080],[844,390]]){
  await page.setViewportSize({width,height});await page.setContent(`<html data-theme="${mode}"><head><style>${css}</style><style>.test-main{padding:12px;min-width:0}@media(min-width:1024px){.test-main{margin-left:292px}}</style></head><body><div class="hpsr-dashboard-shell"><main class="test-main">${pharmacy}</main><div class="hpsr-account-controls fixed right-3 top-3 z-[90]">${menu}</div><div class="hpsr-render-page" style="position:fixed;left:-9999px;width:794px;height:1123px;background:white"><span class="text-hpsr-text">Folha preservada</span></div></div></body></html>`);
  const box=await page.locator('.hpsr-profile-menu').boundingBox();assert(box&&box.x>=-1&&box.x+box.width<=width+1,`${mode} ${width}: profile menu outside viewport`);assert(box.y+box.height<=height+1,`${width}: menu exceeds height`);
  const bad=await page.evaluate(()=>[...document.querySelectorAll('main button, main input, main select')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1)}).map(e=>e.textContent?.slice(0,30)));
  assert.deepEqual(bad,[],`${mode} ${width}: offscreen controls`);
  if(width<=480){const label=await page.locator('[class*=medicationName] strong').first().boundingBox();assert(label&&label.width>=90,`${width}: medication label squeezed by category badge`);}
  const sheet=await page.locator('.hpsr-render-page').evaluate(e=>({width:e.getBoundingClientRect().width,bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e.firstElementChild).color}));assert.equal(sheet.width,794);assert.equal(sheet.bg,'rgb(255, 255, 255)');assert.equal(sheet.color,'rgb(42, 7, 0)');
  if(mode==='dark'&&[375,1440].includes(width))await page.screenshot({path:`/tmp/hpsr144-${width}.png`});cases++;
 }
 console.log(`PASS ${cases} controlled browser layouts: 320–2560px, portrait/landscape, profile menu and real pharmacy controls; clinical sheet geometry and colors preserved.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
