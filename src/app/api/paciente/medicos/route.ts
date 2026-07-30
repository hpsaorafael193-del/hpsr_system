import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";
import { isClinicalProfessional, profileMatchesClinicalSpecialty } from "@/lib/clinical-scheduling";

export const runtime = "nodejs";


export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const specialty = String(new URL(request.url).searchParams.get("specialty") || "").trim();
    if (!specialty) return NextResponse.json({ ok: true, doctors: [] });

    const { data, error } = await valid.supabase
      .from("profiles")
      .select("id,name,specialty,role,crm")
      .eq("access_status", "Aprovado")
      .order("name", { ascending: true })
      .limit(120);
    if (error) throw error;

    const doctors = (data || [])
      .filter((row) => isClinicalProfessional(row))
      .filter((row) => profileMatchesClinicalSpecialty(row, specialty))
      .map((row) => ({
        id: String(row.id),
        name: String(row.name || "Profissional"),
        specialty: String(row.specialty || specialty),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    return NextResponse.json({ ok: true, doctors }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    console.error("[patient-portal] doctors", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar os médicos." }, { status: 500 });
  }
}
