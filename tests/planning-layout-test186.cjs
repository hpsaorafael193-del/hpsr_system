const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const cache={};const {createCanvas,Image:CanvasImage}=require('@napi-rs/canvas');let drawn=[];
class Image extends CanvasImage {set src(value){super.src=fs.readFileSync('public'+value)} get src(){return super.src}}
const document={fonts:{ready:Promise.resolve()},createElement(){const c=createCanvas(1,1),ctx=c.getContext('2d'),fill=ctx.fillText.bind(ctx);const font=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ctx),'font');Object.defineProperty(ctx,'font',{get(){return font.get.call(ctx)},set(v){font.set.call(ctx,v.replace(/^550 /,'600 '))}});ctx.fillText=(text,...args)=>{drawn.push(String(text));return fill(text,...args)};return c;}};
function load(file){if(cache[file])return cache[file];const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:id=>id.startsWith('@/lib/')?load('src/lib/'+id.slice(6)+'.ts'):require(id),Date,Set,Map,console,Image,document});return cache[file]=m.exports;}
const p=load('src/lib/obstetric-planning.ts'),defaults=load('src/lib/obstetric-default-content.ts'),d=load('src/lib/obstetric-document.ts');

(async()=>{
for(const kind of ['gestacional','in_vitro']){
 const steps=p.createPlanningSuggestion(kind,'2026-11-03','2027-01-05').steps;
 const canvas=await d.renderIntegralPlanningCanvas({kind,patient:'Paciente teste',passport:'TEST',doctor:'Médico teste',steps,referenceDate:'2027-01-05'});
 const original=createCanvas(1920,1280),ctx=original.getContext('2d'),source=new CanvasImage();await new Promise((resolve,reject)=>{source.onload=resolve;source.onerror=reject;source.src=fs.readFileSync('public/clinical-assistant/official-'+(kind==='gestacional'?'gestational':'ivf')+'-integral-v3.png');});ctx.drawImage(source,0,0);
 const actual=canvas.getContext('2d').getImageData(0,0,1920,1280).data,expected=ctx.getImageData(0,0,1920,1280).data;
 // Every pixel outside identity/date/content fields must retain the approved art.
 let changedOutside=0;for(let y=0;y<1280;y++)for(let x=0;x<1920;x++){
  const identity=x>=190&&x<=930&&y>=200&&y<=342;
  const dates=x>=350&&x<=615&&y>=360&&y<=1250;
  const content=x>=989&&x<=1864&&y>=340&&y<=1264;
  if(identity||dates||content)continue;
  const i=(y*1920+x)*4;if(actual[i]!==expected[i]||actual[i+1]!==expected[i+1]||actual[i+2]!==expected[i+2]||actual[i+3]!==expected[i+3])changedOutside++;
 }
 assert.equal(changedOutside,0,kind+' approved background must not be repainted');
 // Main right-hand row dividers stay exact, including the ninth gestational row.
 const dividers=kind==='gestacional'?[445,558,665,766,870,975,1075,1170]:[550,714,878,1059];
 for(const y of dividers)for(let x=1020;x<1850;x++){const i=(y*1920+x)*4;assert.equal(actual[i],expected[i],'divider preserved');assert.equal(actual[i+1],expected[i+1]);assert.equal(actual[i+2],expected[i+2]);}
 assert.equal(canvas.height,1280);assert.equal(canvas.width,1920);
}
console.log('PASS approved gestational/IVF artwork and row dividers preserved pixel-for-pixel outside editable fields; no replacement grid');
})().catch(e=>{console.error(e);process.exit(1)});
