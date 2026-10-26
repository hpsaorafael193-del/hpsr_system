// Use Playwright with a Chromium binary; set HPSR_PLAYWRIGHT_MODULE and HPSR_BROWSER_EXECUTABLE if needed.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),Module=require('node:module'),crypto=require('node:crypto');
const app=path.resolve(__dirname,'../..'),deps=path.join(app,'node_modules');
const ts=require(path.join(deps,'typescript')),native=require(path.join(deps,'@napi-rs/canvas'));
const {chromium}=require(process.env.HPSR_PLAYWRIGHT_MODULE || 'playwright');
const {NextRequest}=require(path.join(deps,'next/server'));
const assetPath='11111111-1111-4111-8111-111111111111/signatures/'+'a'.repeat(64)+'.png';
const c=native.createCanvas(240,70),ink=c.getContext('2d');ink.strokeStyle='#181818';ink.lineWidth=3;ink.beginPath();ink.moveTo(12,58);ink.bezierCurveTo(100,0,160,70,220,12);ink.stroke();const bytes=c.toBuffer('image/png');
function compile(file,mocks){const m=new Module(file,module);m.paths=[deps];m.require=id=>id in mocks?mocks[id]:require(require.resolve(id,{paths:[app]}));m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);return m.exports;}
const route=compile(path.join(app,'src/app/api/clinical-assets/route.ts'),{
 '@supabase/ssr':{createServerClient:(_url,_key,options)=>({auth:{getUser:async()=>({data:{user:options.cookies.getAll().some(c=>c.name==='staff'&&c.value==='1')?{id:'staff'}:null}})},rpc:async()=>({data:true}),from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{image_asset_paths:[assetPath],released_image_asset_paths:[]}})})})},
 '@/lib/patient-portal/server':{getServiceClient:()=>({storage:{from:()=>({download:async()=>({data:new Blob([bytes],{type:'image/png'})})})}}),getValidPatientSession:async()=>null,resolvePortalPatientPassport:async()=>null},
});
process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.invalid';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test';
// Bundle the actual pure canvas modules with the installed TypeScript compiler.
const mods=new Map();function bundle(file){file=path.resolve(file);if(mods.has(file))return file;mods.set(file,'');let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;code=code.replace(/require\(["']([^"']+)["']\)/g,(_all,id)=>{let p=id.startsWith('@/')?path.join(app,'src',id.slice(2)):id.startsWith('.')?path.resolve(path.dirname(file),id):null;if(!p)throw Error('Unexpected browser dependency: '+id);p=['.ts','.tsx','/index.ts',''].map(ext=>p+ext).find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());return 'require('+JSON.stringify(bundle(p))+')'});mods.set(file,code);return file;}
const exam=bundle(path.join(app,'src/lib/exam-page-canvas.ts')),doc=bundle(path.join(app,'src/lib/document-page-canvas.ts'));
const script='(()=>{const modules={'+[...mods].map(([k,v])=>JSON.stringify(k)+':function(module,exports,require){'+v+'}').join(',')+'};const cache={};function require(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;modules[id](m,m.exports,require);return m.exports;}window.realRenderers={exam:require('+JSON.stringify(exam)+').renderExamPage,document:require('+JSON.stringify(doc)+').renderSavedDocumentCanvas};})();';
async function listen(server){await new Promise(r=>server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+server.address().port;}
(async()=>{
 let browser;const remote=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'image/png','Access-Control-Allow-Origin':'*'});res.end(bytes)});const remoteUrl=await listen(remote);
 const site=http.createServer(async(req,res)=>{try{
  const target=new URL(req.url,'http://site.invalid');
  if(target.pathname==='/legacy-redirect'){res.writeHead(302,{Location:remoteUrl+'/signature.png'});return res.end();}
  if(target.pathname==='/api/clinical-assets'){const response=await route.GET(new NextRequest('http://site.invalid'+req.url,{headers:{cookie:req.headers.cookie||''}}));res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(Buffer.from(await response.arrayBuffer()));}
  if(target.pathname==='/logo-hpsr.png'||target.pathname.endsWith('logo-horizontal.png')){res.writeHead(200,{'Content-Type':'image/png'});return res.end(bytes);}
  res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html><body></body></html>');
 }catch(e){res.writeHead(500);res.end(String(e))}});const siteUrl=await listen(site);
 try{
  browser=await chromium.launch({executablePath:process.env.HPSR_BROWSER_EXECUTABLE || undefined,args:["--no-sandbox","--disable-gpu"],headless:true});const context=await browser.newContext();await context.addCookies([{url:siteUrl,name:'staff',value:'1'}]);const page=await context.newPage();await page.goto(siteUrl);await page.addScriptTag({content:script});
  const result=await page.evaluate(async(assetPath)=>{
   const src='/api/clinical-assets?path='+encodeURIComponent(assetPath)+'&recordId=exam-test';
   async function exportImage(url){const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url});const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);try{const blob=await new Promise(resolve=>canvas.toBlob(resolve));return {ok:!!blob,size:blob.size}}catch(e){return {ok:false,name:e.name}}}
   const before=await exportImage('/legacy-redirect');const after=await exportImage(src);
   const patient={name:'Paciente de teste',passport:'TEST',age:'20',bloodType:'A+'},doctor={name:'Dra Original',crm:'123',role:'Médica'};
   const results=[];
   for(const signature of [src,'/legacy-redirect']){
    const document={contentRendererVersion:4,metadata:{patient,doctor,signatureImage:signature,date:'2026-10-26',time:'12:00',protocol:'TEST',examName:'Exame de teste'},pages:[{id:'1',type:'report',label:'Página 1',reportHtml:'<h2>Resultado</h2><p>Registro preservado.</p>'}],automaticAttachments:[]};
    const exam=await window.realRenderers.exam(document,0);if(!exam)throw Error('No exam PNG');
    const canvas=await window.realRenderers.document({kind:'document',rendererVersion:2,layout:{width:794,height:1123},pages:['<h2>Documento</h2><p>Registro preservado.</p>'],metadata:{title:'Documento',date:'2026-10-26',patient,doctor:{...doctor,signatureImage:signature}}},0);
    const doc=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!doc)throw Error('No document PNG');
    document.pages=[{id:'annex',type:'manual-attachments',label:'Anexo',manualAttachments:[{id:'a',name:'anexo',url:signature}]}];
    const annex=await window.realRenderers.exam(document,0);if(!annex)throw Error('No attachment PNG');
    results.push({signature:signature.startsWith('/api')?'authorized same-origin asset':'relative redirect with CORS',exam:exam.size,document:doc.size,annex:annex.size});
   }
   const response=await fetch(src);return {before,after,results,status:response.status,redirected:response.redirected,hash:[...new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer()))].map(v=>v.toString(16).padStart(2,'0')).join('')};
  },assetPath);
  assert.equal(result.before.ok,false);assert.equal(result.before.name,'SecurityError');assert.equal(result.after.ok,true);assert.equal(result.redirected,false);assert.equal(result.status,200);assert.equal(result.hash,crypto.createHash('sha256').update(bytes).digest('hex'));assert.equal(result.results.length,2);
  const anonymous=await browser.newPage();assert.equal((await anonymous.request.get(siteUrl+'/api/clinical-assets?path='+encodeURIComponent(assetPath)+'&recordId=exam-test')).status(),403);await anonymous.close();
  console.log('PASS real Chromium: reproduced original tainted canvas; actual authenticated route preserves original image bytes without redirect; actual exam, document and attachment renderers export PNG for local assets and relative cross-origin redirects; anonymous access denied.');console.log(JSON.stringify(result.results));
 }finally{if(browser)await browser.close();await new Promise(r=>site.close(r));await new Promise(r=>remote.close(r));}
})().catch(e=>{console.error(e);process.exit(1)});
