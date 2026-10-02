import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A visibilidade da aba especializada é calculada por acompanhamento/vínculo,
// nunca a partir de gênero, e não concede acesso aos dados por si só.
export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const passport = await resolvePortalPatientPassport(request, valid);
    if (!passport) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    const [plans, links] = await Promise.all([
      valid.supabase.from("clinical_followup_plans").select("id,plan_type,specialty,status")
        .eq("patient_passport", passport).in("plan_type", ["gestacional", "in_vitro"]).neq("status", "Arquivado").limit(30),
      valid.supabase.from("patient_doctor_links").select("specialty")
        .eq("patient_passport", passport).limit(50),
    ]);
    if (plans.error || links.error) throw plans.error || links.error;
    const specialties = (links.data || []).map((row) => String(row.specialty || "").toLocaleLowerCase("pt-BR"));
    const obstetricsLink = specialties.some((name) => name.includes("obstetr"));
    const gestational = (plans.data || []).some((plan) => plan.plan_type === "gestacional");
    const fertility = (plans.data || []).some((plan) => plan.plan_type === "in_vitro");
    return NextResponse.json({ ok: true, showGestation: gestational || obstetricsLink, showIVF: fertility },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[patient-portal] context", error);
    return NextResponse.json({ error: "Falha ao consultar especialidades." }, { status: 500 });
  }
}
