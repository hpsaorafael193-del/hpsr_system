const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
function load(file,mocks={}) {const m=new Module(path.resolve(file),module);m.paths=module.paths;m.require=id=>id in mocks?mocks[id]:require(id);m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,path.resolve(file));return m.exports;}
(async()=>{
 const owner='11111111-1111-4111-8111-111111111111';let count=0,leases=0,fail=false,session=true;
 const client={auth:{getSession:async()=>({data:{session:session?{user:{id:owner}}:null}})},storage:{from:()=>({upload:async()=>{count++;return {error:fail?{message:'upload failed'}:null};}})},from:()=>({upsert:async()=>{leases++;return {error:null};}})};
 const realOptimization=load('src/lib/clinical-image-optimization.ts');
 const api=load('src/lib/clinical-image-assets.ts',{'@/lib/supabase':{createClient:()=>client},'@/lib/clinical-image-optimization':{...realOptimization,optimizeClinicalImage:async b=>b}});
 const source='data:image/png;base64,'+Buffer.alloc(300000,1).toString('base64');
 const original={doctor:{signatureImage:source},renderSnapshot:{document:{metadata:{signatureImage:source}}}};
 const a=await api.persistClinicalImages(original,{recordId:'exam-test'});
 assert.equal(count,1);assert.equal(leases,1);assert.equal(a.imageAssets.length,1);assert.equal(original.doctor.signatureImage,source);assert(JSON.stringify(a).length<1200);
 const draft=await api.persistClinicalImages(original,{draft:'exam',owner});assert.equal(count,1);assert(draft.doctor.signatureImage.includes('draft=exam'));
 const rebase=await api.persistClinicalImages(draft,{recordId:'exam-next'});assert.equal(count,1);assert(rebase.doctor.signatureImage.includes('recordId=exam-next'));assert(!rebase.doctor.signatureImage.includes('draft='));
 assert(api.compactKnownClinicalImages(original,{draft:'exam',owner},owner));assert.equal(api.compactKnownClinicalImages({signatureImage:'data:image/png;base64,dW5rbm93bg=='},{draft:'exam',owner},owner),null);
 fail=true;await assert.rejects(api.persistClinicalImages({signatureImage:'data:image/png;base64,dW5pcXVl'},{recordId:'failed'}));fail=false;await api.persistClinicalImages({signatureImage:'data:image/png;base64,dW5pcXVl'},{recordId:'retry'});
 session=false;await assert.rejects(api.persistClinicalImages(original,{recordId:'expired'}),/Sessão expirada/);session=true;
 assert.equal(api.clinicalAssetPath('/api/clinical-assets?path=../../secret'),null);assert(api.clinicalSaveError({code:'57014'}).includes('histórico'));
 console.log('PASS: deduplicated uploads, lightweight payload, rebased references, leases, unchanged input, failure/retry and expired sessions.');
 // Exercise the real route with explicit authorization scenarios.
 let staff=true,user=owner,patient=false,accessible=true,record=true,published=true;
 const assetPath=a.imageAssets[0];
 const row=()=>record?{patient_passport:'338',image_asset_paths:[assetPath],released_image_asset_paths:published?[assetPath]:[]}:null;
 function chain(isPatient=false){return{select(){return this},eq(k,v){if(isPatient&&k==='is_confidential'&&v===false&&!published)this.blocked=true;return this},not(){return this},maybeSingle:async function(){return {data:this.blocked?null:row()}}};}
 const caller={auth:{getUser:async()=>({data:{user:user?{id:user}:null}})},rpc:async()=>({data:staff}),from:()=>chain()};
 const service={storage:{from:()=>({download:async()=>({data:new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'})})})}};
 const route=load('src/app/api/clinical-assets/route.ts',{'@supabase/ssr':{createServerClient:()=>caller},'@/lib/patient-portal/server':{getServiceClient:()=>service,getValidPatientSession:async()=>patient?{supabase:{from:()=>chain(true)}}:null,resolvePortalPatientPassport:async()=>accessible?'338':null}});
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.invalid';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test';
 const {NextRequest}=require('next/server');const req=(suffix='')=>new NextRequest('https://site.invalid/api/clinical-assets?path='+encodeURIComponent(assetPath)+'&recordId=exam-test'+suffix);
 const originalResponse=await route.GET(req());assert.equal(originalResponse.status,200);assert.equal(originalResponse.headers.get('location'),null);assert.equal(originalResponse.headers.get('content-type'),'image/png');assert.equal(originalResponse.headers.get('cache-control'),'private, no-store');assert.equal(originalResponse.headers.get('x-content-type-options'),'nosniff');assert.deepEqual(new Uint8Array(await originalResponse.arrayBuffer()),new Uint8Array([137,80,78,71]));staff=false;user=null;assert.equal((await route.GET(req())).status,403);
 patient=true;assert.equal((await route.GET(req())).status,200);accessible=false;assert.equal((await route.GET(req())).status,403);accessible=true;published=false;assert.equal((await route.GET(req())).status,403);published=true;patient=false;user=owner;staff=true;record=false;assert.equal((await route.GET(req())).status,403);
 assert.equal((await route.GET(new NextRequest('https://site.invalid/api/clinical-assets?path=bad'))).status,400);
 console.log('PASS: real asset route denies anonymous, missing record, revoked release and guardian denial; authorizes staff and allowed published patient.');
 // Real canvas encoding verifies signature geometry, alpha and legibility-preserving caps.
 const canvasPackage=process.env.HPSR_EDITOR_TEST_DEPS?path.join(process.env.HPSR_EDITOR_TEST_DEPS,'@napi-rs/canvas'):'@napi-rs/canvas';
 let native;try{native=require(canvasPackage)}catch{console.log('Canvas test skipped: set HPSR_EDITOR_TEST_DEPS for native canvas');return;}
 const urls=new Map();let revoked=0;const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 URL.createObjectURL=blob=>{const key='blob:test-'+urls.size;urls.set(key,blob);return key};URL.revokeObjectURL=url=>{urls.delete(url);revoked++};
 global.Image=class{constructor(){this.native=new native.Image()}get naturalWidth(){return this.native.width}get naturalHeight(){return this.native.height}set src(value){urls.get(value).arrayBuffer().then(bytes=>{this.native.onload=()=>this.onload();this.native.onerror=e=>this.onerror(e);this.native.src=Buffer.from(bytes)}).catch(e=>this.onerror(e));}};
 global.document={createElement:()=>{const c=native.createCanvas(1,1);return {get width(){return c.width},set width(v){c.width=v},get height(){return c.height},set height(v){c.height=v},getContext:()=>({drawImage:(img,...args)=>c.getContext('2d').drawImage(img.native,...args)}),toBlob:(callback,type)=>callback(new Blob([c.toBuffer(type)],{type}))};}};
 const c=native.createCanvas(2000,500),ctx=c.getContext('2d');ctx.strokeStyle='#30160a';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(100,400);ctx.lineTo(1800,100);ctx.stroke();
 const optimized=await realOptimization.optimizeClinicalImage(new Blob([c.toBuffer('image/png')],{type:'image/png'}),'signature');const decoded=await native.loadImage(Buffer.from(await optimized.arrayBuffer()));assert.equal(decoded.width,1600);assert.equal(decoded.height,400);
 const out=native.createCanvas(1600,400);out.getContext('2d').drawImage(decoded,0,0);const pixels=out.getContext('2d').getImageData(0,0,1600,400).data;assert(pixels.some((v,i)=>i%4===3&&v>0));assert.equal(pixels[3],0);assert.equal(urls.size,0);assert(revoked>0);
 const attachment=native.createCanvas(2800,3600),attachmentContext=attachment.getContext('2d');attachmentContext.fillStyle='#fff';attachmentContext.fillRect(0,0,2800,3600);attachmentContext.fillStyle='#111';attachmentContext.font='80px sans-serif';attachmentContext.fillText('Anexo legível 144',150,250);
 const attachmentOut=await realOptimization.optimizeClinicalImage(new Blob([attachment.toBuffer('image/png')],{type:'image/png'}),'attachment');
 const attachmentDecoded=await native.loadImage(Buffer.from(await attachmentOut.arrayBuffer()));assert.equal(attachmentDecoded.width,2400);assert.equal(attachmentDecoded.height,3086);assert.equal(attachmentOut.type,'image/webp');assert.equal(await realOptimization.optimizeClinicalImage(attachmentOut,'attachment'),attachmentOut);assert.equal(urls.size,0);
 console.log('PASS: real attachment caps, proportional WebP conversion and unchanged repeated optimization.');
 URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;
 console.log('PASS: actual signature PNG remains transparent with visible ink, correct proportions and object URL cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
