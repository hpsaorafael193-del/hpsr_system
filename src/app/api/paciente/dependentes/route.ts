import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const body = await request.json();
    const name = String(body.name || "").trim().replace(/\s+/g," ");
    const passport = normalizePassport(body.passport);
    const age = String(body.age || "").trim().toLowerCase().replace(/\s+/g," ");
    const relationship = String(body.relationship || "Responsável legal").trim();
    const additionalGuardianName = String(body.additionalGuardianName || "").trim().replace(/\s+/g," ").slice(0,160);
    if (name.length < 2 || name.length > 160 || !passport || passport.length > 80
      || !/^\d{1,3} (mes|meses|ano|anos)$/.test(age) || relationship.length < 2 || relationship.length > 80) {
      return NextResponse.json({ ok:false,error:"Informe nome, passaporte e idade em meses ou anos." },{ status:400 });
    }
    const { data: account, error: accountError } = await valid.supabase.from("patient_accounts")
      .select("user_id,patient_passport").eq("user_id",valid.access.user_id).maybeSingle();
    if (accountError) throw accountError;
    if (!account) return NextResponse.json({ ok:false,error:"Conta de responsável não encontrada." },{ status:403 });
    const { data, error } = await valid.supabase.rpc("hpsr_register_child_by_guardian",{
      p_guardian_user_id:account.user_id,p_child_passport:passport,p_child_name:name,p_age:age,
      p_relationship:relationship,p_additional_guardian_name:additionalGuardianName || null,
    });
    if (error) {
      if (error.code === "23505") return NextResponse.json({ ok:false,error:"Este passaporte já existe com outro nome. Solicite a conferência pela Direção." },{status:409});
      if (error.code === "42501") return NextResponse.json({ ok:false,error:"O vínculo precisa de conferência pela Direção." },{status:403});
      throw error;
    }
    return NextResponse.json({ ok:true,patient:{passport,name,relationship,access_type:data.status === "authorized" ? "guardian":"pending_guardian"},
      message:data.status === "authorized" ? "Vínculo já autorizado." : "Cadastro registrado. Aguarde a validação pela Direção do hospital." });
  } catch(error) {
    console.error("[patient-portal] dependent registration",error);
    return NextResponse.json({ok:false,error:"Não foi possível registrar a criança. Tente novamente."},{status:500});
  }
}
