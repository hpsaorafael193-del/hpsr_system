import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const specialty = String(request.nextUrl.searchParams.get("specialty") || "").trim();
    if (!specialty) return NextResponse.json({ ok: true, specialty: "", available: false, professionals: 0 });
    const { data, error } = await valid.supabase.rpc("hpsr_specialty_capacity_candidates", { p_specialty: specialty });
    if (error) throw error;
    const candidates = Array.isArray(data) ? data : [];
    return NextResponse.json({ ok: true, specialty, available: candidates.length > 0, professionals: candidates.length });
  } catch (error) {
    console.error("[patient-portal] capacity", error);
    return NextResponse.json({ ok: false, error: "Não foi possível consultar as vagas desta especialidade." }, { status: 500 });
  }
}
