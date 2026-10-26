import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getServiceClient, getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const validPath = /^[0-9a-f-]{36}\/(signatures|attachments)\/[0-9a-f]{64}\.(png|jpg|jpeg|webp|gif|avif|bmp)$/i;
export async function GET(request: NextRequest) {
  try {
    const path=request.nextUrl.searchParams.get("path")||"", recordId=request.nextUrl.searchParams.get("recordId"),draft=request.nextUrl.searchParams.get("draft"),owner=request.nextUrl.searchParams.get("owner");
    if(!validPath.test(path))return NextResponse.json({error:"Imagem inválida."},{status:400});
    const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if(!key||!process.env.NEXT_PUBLIC_SUPABASE_URL)throw Error('Unavailable');
    const caller=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll:()=>{}}});
    const {data:auth}=await caller.auth.getUser();let allowed=false;
    if(auth.user){
      const {data:staff}=await caller.rpc('is_hpsr_staff');
      if(staff){
        if(recordId){const {data:r}=await caller.from('clinical_records').select('image_asset_paths,released_image_asset_paths').eq('id',recordId).maybeSingle();allowed=!!r&&(r.image_asset_paths?.includes(path)||r.released_image_asset_paths?.includes(path));}
        else if(owner===auth.user.id&&(draft==='exam'||draft==='document')){const {data:r}=await caller.from(draft==='exam'?'exam_editor_drafts':'document_editor_drafts').select('image_asset_paths').eq('owner_id',owner).maybeSingle();allowed=!!r?.image_asset_paths?.includes(path);}
      }
    }
    if(!allowed&&recordId){
      const session=await getValidPatientSession(request);
      if(session){const {data:r}=await session.supabase.from('clinical_records').select('patient_passport,released_image_asset_paths').eq('id',recordId).eq('is_confidential',false).not('released_at','is',null).maybeSingle();
        if(r?.released_image_asset_paths?.includes(path)){const url=new URL(request.url);url.searchParams.set('passport',r.patient_passport);allowed=!!(await resolvePortalPatientPassport(new Request(url),session));}
      }
    }
    if(!allowed)return NextResponse.json({error:"Acesso não autorizado."},{status:403});
    const {data:file,error}=await getServiceClient().storage.from('clinical-assets').download(path);
    if(error||!file)return NextResponse.json({error:"Imagem não encontrada."},{status:404});
    // Keep authorized asset bytes on the site's origin. A redirect can taint a canvas
    // even when its initial URL is relative and the signature itself is unchanged.
    const types:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',bmp:'image/bmp'};
    const contentType=types[path.split('.').pop()!.toLowerCase()] || 'application/octet-stream';
    return new NextResponse(file.stream(),{status:200,headers:{
      'Content-Type':contentType,'Cache-Control':'private, no-store',
      'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
    }});
  } catch {return NextResponse.json({error:"Não foi possível carregar a imagem."},{status:503});}
}
