const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const manifest=JSON.parse(fs.readFileSync('docs/assets-removidos-189.json','utf8'));
const source=fs.readFileSync('src/app/dashboard/calculadora/page.tsx','utf8');
const active=[...source.matchAll(/imagem:\s*"([^"]+)"/g)].map(m=>'public/calculadora/'+m[1]);
assert.equal(active.length,19);assert.deepEqual([...active].sort(),manifest.active_files);
for(const file of active){assert(fs.existsSync(file));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),manifest.active_sha256[file],file+' active bytes changed');}
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const extensions=new Set(['.ts','.tsx','.js','.mjs','.cjs','.css','.html','.json','.sql','.svg']);
const sources=['src','public','supabase','scripts'].flatMap(walk).filter(f=>extensions.has(path.extname(f))).map(f=>[f,fs.readFileSync(f,'utf8')]);
for(const item of manifest.removed){assert(!fs.existsSync(item.path),item.path+' was retained');const relative=item.path.replace(/^public\//,''),short=item.path.replace(/^public\/calculadora\//,'');for(const [file,text]of sources)assert(!text.includes(relative)&&!text.includes(short),file+' references removed icon');}
const users=sources.filter(([file,text])=>text.includes('Icones/')||text.includes('/calculadora/')).map(([file])=>file);assert.deepEqual(users,['src/app/dashboard/calculadora/page.tsx'],'unreviewed dynamic asset consumer');
assert.equal(walk('public/calculadora/Icones').length,19);
const receipt=source.slice(source.indexOf('items: selectedItems.map'),source.indexOf('const saveResult = await saveFinancialReceipt'));
assert(!/imagem|image|icon|\.png|\.webp/.test(receipt),'receipts acquired a dependency on product icon paths');
console.log('PASS 52 legacy icons removed without runtime references; all 19 active images byte-identical to base; dynamic mapping and receipt independence verified');
