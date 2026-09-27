import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const passport = await resolvePortalPatientPassport(request, valid);
    if (!passport) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    // A sessão do Portal é validada no servidor; nunca aceitar uma lista de passaportes do cliente.
    const { data, error } = await valid.supabase.from("clinical_followup_plans")
      .select("id,patient_name,doctor_name,start_date,end_date,planning_notes,consultation_schedule,total_consultations,portal_released_at")
      .eq("patient_passport", passport).eq("specialty", "Obstetra")
      .not("portal_released_at", "is", null).neq("status", "Arquivado")
      .order("portal_released_at", { ascending: false }).limit(30);
    if (error) throw error;
    return NextResponse.json({ plans: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[patient-portal] gestational plans", error);
    return NextResponse.json({ error: "Não foi possível carregar os planejamentos gestacionais." }, { status: 500 });
  }
}
