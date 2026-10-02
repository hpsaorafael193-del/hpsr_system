import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/patient-portal/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  let createdUser = "", createdAccount = false, createdAccess = "";
  try {
    const body = await request.json();
    const name = String(body.name || "").trim().replace(/\s+/g," ").slice(0,160);
    const email = String(body.email || "").trim().toLowerCase().slice(0,254);
    const password = String(body.password || "");
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return NextResponse.json({error:"Informe nome, e-mail e senha de pelo menos 6 caracteres."},{status:400});
    }
    const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
    let userId = "";
    if (token) {
      const r = await supabase.auth.getUser(token);
      if (r.error || !r.data.user || r.data.user.email?.toLowerCase() !== email) {
        return NextResponse.json({error:"Use a sua conta autenticada e o mesmo e-mail."},{status:401});
      }
      userId = r.data.user.id;
    } else {
      const r = await supabase.auth.admin.createUser({email,password,email_confirm:true,
        user_metadata:{account_type:"guardian",name}});
      if (r.error || !r.data.user) return NextResponse.json({error:"Se este e-mail já está cadastrado, entre com sua senha para adicionar a criança."},{status:409});
      userId = createdUser = r.data.user.id;
    }
    const existing = await supabase.from("patient_accounts").select("user_id,email,patient_passport,display_name")
      .eq("user_id",userId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data && existing.data.email?.toLowerCase() !== email) {
      return NextResponse.json({error:"O e-mail não corresponde à conta."},{status:409});
    }
    if (existing.data && !existing.data.display_name) {
      const named=await supabase.from("patient_accounts").update({display_name:name}).eq("user_id",userId);
      if(named.error) throw named.error;
    }
    if (!existing.data) {
      const r=await supabase.from("patient_accounts").insert({user_id:userId,patient_passport:null,email,display_name:name});
      if (r.error) throw r.error;
      createdAccount=true;
    }
    const access=await supabase.from("patient_portal_access").select("id").eq("user_id",userId).maybeSingle();
    if (access.error) throw access.error;
    if (!access.data) {
      const old=existing.data?.patient_passport ? await supabase.from("patient_portal_access")
        .select("id").eq("patient_passport",existing.data.patient_passport).maybeSingle() : {data:null,error:null};
      if(old.error) throw old.error;
      if (old.data) {
        const r=await supabase.from("patient_portal_access").update({user_id:userId})
          .eq("id",old.data.id);
        if(r.error) throw r.error;
      } else {
        const r=await supabase.from("patient_portal_access").insert({
          user_id:userId,patient_passport:existing.data?.patient_passport || null,
          email,access_enabled:true,triage_status:"Classificado",
        }).select("id").single();
        if(r.error) throw r.error;
        createdAccess=r.data.id;
      }
    }
    return NextResponse.json({ok:true,message:createdUser ? "Conta criada. Entre para cadastrar a criança." : "Conta pronta para cadastrar crianças."});
  } catch(e) {
    console.error("[guardian account]",e);
    if(createdAccess) await supabase.from("patient_portal_access").delete().eq("id",createdAccess);
    if(createdAccount && createdUser) await supabase.from("patient_accounts").delete().eq("user_id",createdUser);
    if(createdUser) await supabase.auth.admin.deleteUser(createdUser);
    return NextResponse.json({error:"Não foi possível concluir o cadastro da conta."},{status:500});
  }
}
