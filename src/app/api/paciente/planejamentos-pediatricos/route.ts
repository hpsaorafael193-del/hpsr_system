import {NextRequest,NextResponse} from 'next/server';
import {getValidPatientSession,resolvePortalPatientPassport} from '@/lib/patient-portal/server';
import {pediatricSnapshot} from '@/lib/pediatric-document';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 try{const valid=await getValidPatientSession(request);if(!valid)return NextResponse.json({error:'Sessão expirada.'},{status:401});
 const passport=await resolvePortalPatientPassport(request,valid);if(!passport)return NextResponse.json({error:'Acesso não autorizado.'},{status:403});
 const {data,error}=await valid.supabase.from('pediatric_plan_publications').select('id,plan_id,visit_id,snapshot,published_at').eq('patient_passport',passport).eq('published',true).order('published_at',{ascending:false}).limit(200);
 if(error)throw error;return NextResponse.json({publications:(data||[]).map(r=>({...r,snapshot:pediatricSnapshot(r.snapshot)}))},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'Não foi possível carregar o planejamento pediátrico.'},{status:500});}
}
