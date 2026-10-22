const fs=require('node:fs'),postcss=require('postcss'),tailwind=require('tailwindcss');
const exclusion=':not(:where(.hpsr-render-page,.hpsr-render-page *,[data-hpsr-document],[data-hpsr-document] *))';
function convert(hex,prop){
 let v=hex.slice(1);if(v.length===3||v.length===4)v=v.split('').map(x=>x+x).join('');
 const alpha=v.length===8?v.slice(6):'';
 const [r,g,b]=[0,2,4].map(i=>parseInt(v.slice(i,i+2),16));
 const light=(r*.2126+g*.7152+b*.0722)/255,max=Math.max(r,g,b),min=Math.min(r,g,b);
 const text=/^(color|caret-color|fill|stroke|text-decoration-color)$/.test(prop)||/foreground|muted|wine|text/.test(prop);
 const semantic=g>r*1.18&&g>b*1.05?'green':r>b*1.35&&b>g*1.12?'red':b>r*1.25&&b>g*1.08?'blue':null;
 let out;
 if(/border|outline/.test(prop) && max-min>70 && max>150) return hex;
 if(semantic)out=text?({green:'#83e5c0',red:'#ffb4bf',blue:'#a9cefa'}[semantic]):({green:'#15382c',red:'#481d25',blue:'#1b3046'}[semantic]);
 else if(text)out=light>.83?'#f3ede7':light>.35?'#c9b9ac':'#e9b495';
 else if(/border|outline|ring/.test(prop))out=light>.55?'#4d3d31':'#463326';
 else if(light>.9)out='#231c17';else if(light>.7)out='#2b231d';else if(light>.4)out='#38291f';
 else if(light>.24)out='#463022';else if(light>.13)out='#302016';else out='#1d1611';
 return out+alpha;
}
function transform(value,prop){
 if(!/color|background|shadow|fill|stroke|^--/.test(prop))return value;
 // Preserve gradient structure, alpha and shadows; adapt only their palette.
 return value.replace(/#[\da-f]{8}\b|#[\da-f]{6}\b|#[\da-f]{4}\b|#[\da-f]{3}\b/gi,h=>convert(h,prop))
 .replace(/rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)([^)]*)\)/g,(_,r,g,b,tail)=>{
 const c=convert('#'+[r,g,b].map(n=>Number(n).toString(16).padStart(2,'0')).join(''),prop);
 const rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)).join(' '),a=tail.trim().replace(/^,\s*/,'/ ');
 return `rgb(${rgb}${a?' '+a:''})`;
 });
}
async function main(){
 const result=await postcss([tailwind(require('node:path').resolve('tailwind.config.ts'))]).process(fs.readFileSync('src/app/globals.css','utf8'),{from:'src/app/globals.css'});
 const output=postcss.root();let count=0;
 function collect(container,target){container.each(n=>{
 if(n.type==='atrule'){if(['media','container','supports'].includes(n.name)&&!/print/.test(n.params)){const m=postcss.atRule({name:n.name,params:n.params});collect(n,m);if(m.nodes?.length)target.append(m);}return;}
 if(n.type!=='rule')return;
 const ds=[];n.each(d=>{if(d.type==='decl'){const value=/\.(header|hero)\b/.test(n.selector)&&/^background/.test(d.prop)&&/gradient\(/.test(d.value)?(d.prop==='background-image'?'linear-gradient(110deg,#672614,#48160c 65%,#2a0700)':'linear-gradient(110deg,#672614,#48160c 65%,#2a0700)'):transform(d.value,d.prop);if(value!==d.value)ds.push(d.clone({value}));}});if(!ds.length)return;
 const ss=n.selectors.filter(s=>!s.includes(':root')&&!s.includes('hpsr-render-page'));if(!ss.length)return;
 const r=postcss.rule({selector:ss.map(s=>{if(s==='html')return 'html[data-theme="dark"]';const match=s.match(/(::[\w-]+(?:\([^)]*\))?)$/);const pseudo=match?match[1]:'';const base=pseudo?s.slice(0,-pseudo.length):s;return `html[data-theme="dark"] :is(${base||'*'})${exclusion}${pseudo}`;}).join(',\n')});ds.forEach(d=>r.append(d));target.append(r);count++;
 });}collect(result.root,output);
 fs.writeFileSync('src/app/dark-generated.css','/* Generated native dark palette. Do not edit: run npm run theme:generate. */\n@media screen {\n'+output.toString()+'\n}\n');console.log(`Dark palette: ${count} scoped rules`);
 const marker='/* HPSR DARK MODULE PALETTE */';
 function modules(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=require('node:path').join(dir,entry.name);if(entry.isDirectory())modules(file);else if(file.endsWith('.module.css')){
 const original=fs.readFileSync(file,'utf8').split(marker)[0].trimEnd();const dark=postcss.root();
 postcss.parse(original).walkRules(rule=>{
 if(rule.parent.type==='atrule'&&/keyframes|print/.test(rule.parent.name+' '+rule.parent.params))return;
 const ds=[];rule.walkDecls(d=>{const value=/\.(header|hero)\b/.test(rule.selector)&&/^background/.test(d.prop)&&/gradient\(/.test(d.value)?(d.prop==='background-image'?'linear-gradient(110deg,#672614,#48160c 65%,#2a0700)':'linear-gradient(110deg,#672614,#48160c 65%,#2a0700)'):transform(d.value,d.prop);if(value!==d.value)ds.push(d.clone({value}));});
 if(!ds.length)return;
 const clone=postcss.rule({selector:rule.selectors.map(s=>`:global(html[data-theme="dark"]) ${s}`).join(',')});ds.forEach(d=>clone.append(d));dark.append(clone);
 });
 fs.writeFileSync(file,original+'\n\n'+marker+'\n@media screen {\n'+dark.toString()+'\n}\n');
 }}}modules('src');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});module.exports={transform,convert};
