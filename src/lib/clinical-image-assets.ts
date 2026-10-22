import { createClient } from "@/lib/supabase";
import { imageDigest, optimizeClinicalImage } from "@/lib/clinical-image-optimization";
export const CLINICAL_IMAGE_BUCKET = "clinical-assets";
export type ImageContext = { recordId: string } | { draft: "exam" | "document"; owner: string };
const known = new Map<string, string>();
const uploads = new Map<string, Promise<void>>();
const leased = new Map<string, number>();
const pathPattern = /^[0-9a-f-]{36}\/(signatures|attachments)\/[0-9a-f]{64}\.(png|jpg|jpeg|webp|gif|avif|bmp)$/i;
export function clinicalAssetPath(source: string): string | null {
  if (!source.startsWith("/api/clinical-assets?")) return null;
  const path = new URL(source, "https://hpsr.invalid").searchParams.get("path");
  return path && pathPattern.test(path) ? path : null;
}
function reference(path: string, context: ImageContext) {
  const params = new URLSearchParams({ path });
  if ("recordId" in context) params.set("recordId", context.recordId);
  else { params.set("draft", context.draft); params.set("owner", context.owner); }
  return `/api/clinical-assets?${params}`;
}
export function clinicalSaveError(error: unknown): string {
  const value = error as { message?: string; code?: string } | null;
  return value?.code === "57014" ? "O banco excedeu o tempo para salvar. Confira o histórico antes de tentar novamente." : value?.message || "Não foi possível salvar. Tente novamente.";
}
function remember(key: string, path: string) {
  if (key.length > 12000000) return;
  while (known.size && (known.size >= 12 || [...known.keys()].reduce((n,k) => n+k.length,0) + key.length > 12000000)) known.delete(known.keys().next().value!);
  known.set(key, path);
}
export async function persistClinicalImages<T extends Record<string, any>>(payload: T, context: ImageContext): Promise<T & { imageAssets: string[] }> {
  const client = createClient(); if (!client) throw new Error("Banco indisponível.");
  const { data, error } = await client.auth.getSession(); if (error || !data.session?.user) throw new Error("Sessão expirada. Entre novamente antes de salvar.");
  const owner = data.session.user.id, paths = new Set<string>();
  const local = new Map<string, Promise<string>>();
  async function asset(source: string, signature: boolean): Promise<string> {
    const key = `${owner}:${signature ? "signature" : "attachment"}:${source}`;
    let path = clinicalAssetPath(source) || known.get(key);
    if (!path) {
      const response = await fetch(source); if (!response.ok) throw new Error("Não foi possível preservar a imagem. Nada foi salvo.");
      const blob = await optimizeClinicalImage(await response.blob(), signature ? "signature" : "attachment");
      const ext: Record<string,string> = { "image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/gif":"gif","image/avif":"avif","image/bmp":"bmp" };
      if (!ext[blob.type]) throw new Error("Formato de imagem não suportado.");
      path = `${owner}/${signature ? "signatures" : "attachments"}/${await imageDigest(blob)}.${ext[blob.type]}`;
      if (!uploads.has(path)) {
        const uploading = (async () => { const { error } = await client!.storage.from(CLINICAL_IMAGE_BUCKET).upload(path!, blob, { contentType: blob.type, upsert:false }); if (error && !/duplicate|already exists|409/i.test(`${error.message} ${(error as any).statusCode}`)) throw error; })();
        uploads.set(path, uploading); uploading.catch(() => uploads.delete(path!));
      }
      await uploads.get(path);
      if (uploads.size > 128) uploads.delete(uploads.keys().next().value!);
      remember(key, path);
    }
    if (path.startsWith(`${owner}/`) && Date.now() - (leased.get(path) || 0) > 3600000) {
      const { error } = await client!.from("clinical_image_leases").upsert({path,owner_id:owner,expires_at:new Date(Date.now()+86400000).toISOString()});
      if (error) throw error;
      if (leased.size > 256) leased.delete(leased.keys().next().value!);
      leased.set(path,Date.now());
    }
    paths.add(path); return reference(path,context);
  }
  function once(source:string,signature:boolean) { const key=`${signature}:${source}`;if(!local.has(key))local.set(key,asset(source,signature));return local.get(key)!; }
  async function walk(value: any, field = ""): Promise<any> {
    if (typeof value === "string") {
      if (clinicalAssetPath(value) || /^(data:image\/|blob:)/.test(value) || (field === "signatureImage" && /^https?:/.test(value))) return once(value,field === "signatureImage");
      const matches = [...value.matchAll(/data:image\/[^\s"'<>]+/g)];
      for (const match of matches) value = value.replace(match[0],await once(match[0],false));
      return value;
    }
    if (Array.isArray(value)) return Promise.all(value.map(v => walk(v,field)));
    if (value && typeof value === "object") { const result: Record<string,any> = {};for (const [key,v] of Object.entries(value)) if(key!=="imageAssets") result[key]=await walk(v,key);return result; }
    return value;
  }
  const result = await walk(payload); return {...result,imageAssets:[...paths]};
}
/** Keepalive must never resend binary images or use a URL tied to another record. */
export function compactKnownClinicalImages<T>(payload:T,context:ImageContext,owner:string): (T & {imageAssets:string[]}) | null {
  const paths=new Set<string>();let missing=false;
  function walk(v:any,field=""):any {
    if(typeof v==='string') {
      const p=clinicalAssetPath(v)||known.get(`${owner}:${field==='signatureImage'?'signature':'attachment'}:${v}`);
      if(p){paths.add(p);return reference(p,context);}
      if(/^(data:image\/|blob:)/.test(v)||(field==='signatureImage'&&/^https?:/.test(v))||/data:image\//.test(v))missing=true;
      return v;
    }
    if(Array.isArray(v))return v.map(x=>walk(x,field));
    if(v&&typeof v==='object'){const o:Record<string,any>={};for(const [k,x]of Object.entries(v))if(k!=='imageAssets')o[k]=walk(x,k);return o;}return v;
  }
  const result=walk(payload);return missing?null:{...result,imageAssets:[...paths]};
}
