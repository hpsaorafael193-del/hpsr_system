/** One-time conversion of historical inline images. Original bytes are preserved.
 * Default is a metadata-only dry run. Apply only after publishing the new image API.
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL.
 */
import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
const apply=process.argv.includes('--apply');
const limit=Math.min(100,Math.max(1,Number(process.argv.find(v=>v.startsWith('--limit='))?.split('=')[1]||20)));
const after=process.argv.find(v=>v.startsWith('--after='))?.slice(8);
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw Error('Configure as credenciais de serviço somente no ambiente do servidor.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
if(apply){
 if(!process.env.APP_URL)throw Error('APP_URL é obrigatório para --apply.');
 const probe=await fetch(new URL('/api/clinical-assets?path=invalid',process.env.APP_URL));
 if(probe.status!==400)throw Error('Publique a API de imagens da versão 144 antes de migrar registros antigos.');
}
let query=db.from('clinical_records').select('id,updated_at,created_by').order('id').limit(limit);
if(after)query=query.gt('id',after);
const {data:ids,error}=await query;if(error)throw error;
if(!apply){console.log(JSON.stringify({mode:'dry-run',records:ids.length,next:ids.at(-1)?.id||null,message:'Nenhuma imagem lida nem alterada. Use --apply somente após publicar a 144.'}));process.exit(0);}
const extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/avif':'avif','image/bmp':'bmp'};
let changed=0,conflicts=0;
for(const item of ids){
 const {data:row,error:readError}=await db.from('clinical_records').select('id,updated_at,created_by,payload,released_render_payload,image_asset_paths,released_image_asset_paths').eq('id',item.id).single();if(readError)throw readError;
 const owner=/^[a-f0-9-]{36}$/i.test(row.created_by||'')?row.created_by:'00000000-0000-0000-0000-000000000000';
 const converted=new Map();let files=0;
 async function externalize(payload){
  if(!payload)return payload;const paths=new Set();
  async function asset(source,signature){
   const existing=source.startsWith('/api/clinical-assets?')?new URL(source,'https://local.invalid').searchParams.get('path'):null;
   let path=existing||converted.get(source);
   if(!path){
    const response=await fetch(source);if(!response.ok)throw Error('Falha ao ler original; registro não foi alterado.');
    const blob=await response.blob(),ext=extensions[blob.type];if(!ext)throw Error('Imagem antiga com formato não suportado; registro preservado.');
    const bytes=Buffer.from(await blob.arrayBuffer()),hash=createHash('sha256').update(bytes).digest('hex');
    path=`${owner}/${signature?'signatures':'attachments'}/${hash}.${ext}`;
    const {error:uploadError}=await db.storage.from('clinical-assets').upload(path,bytes,{contentType:blob.type,upsert:false});if(uploadError&&!/duplicate|already exists|409/i.test(uploadError.message+' '+uploadError.statusCode))throw uploadError;
    const {data:download,error:downloadError}=await db.storage.from('clinical-assets').download(path);if(downloadError)throw downloadError;
    if(createHash('sha256').update(Buffer.from(await download.arrayBuffer())).digest('hex')!==hash)throw Error('A cópia não corresponde aos bytes originais; registro preservado.');
    converted.set(source,path);files++;
   }
   paths.add(path);return '/api/clinical-assets?'+new URLSearchParams({path,recordId:row.id});
  }
  async function walk(value,field=''){
   if(typeof value==='string'){
    if(value.startsWith('data:image/')||value.startsWith('/api/clinical-assets?'))return asset(value,field==='signatureImage');
    for(const match of [...value.matchAll(/data:image\/[^\s"'<>]+/g)])value=value.replace(match[0],await asset(match[0],false));return value;
   }
   if(Array.isArray(value))return Promise.all(value.map(v=>walk(v,field)));
   if(value&&typeof value==='object'){const out={};for(const [k,v]of Object.entries(value))if(k!=='imageAssets')out[k]=await walk(v,k);return out;}return value;
  }
  const out=await walk(payload);return {...out,imageAssets:[...paths]};
 }
 const payload=await externalize(row.payload),published=await externalize(row.released_render_payload);
 if(!files)continue;
 const update={payload,image_asset_paths:payload?.imageAssets||[]};
 if(published){update.released_render_payload=published;update.released_image_asset_paths=published.imageAssets;}
 const {data:saved,error:writeError}=await db.from('clinical_records').update(update).eq('id',row.id).eq('updated_at',row.updated_at).select('id');
 if(writeError)throw writeError;if(saved?.length)changed++;else conflicts++;
}
console.log(JSON.stringify({mode:'apply',changed,conflicts,next:ids.at(-1)?.id||null,message:'Nenhum registro clínico ou arquivo original foi excluído.'}));
