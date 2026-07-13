import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const { data, error } = await valid.supabase
      .from("appointments")
      .select("id,passport,patient,status,payload,created_at,updated_at")
      .eq("passport", valid.access.patient_passport)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const appointments = (data || []).map((row) => {
      const payload = (row.payload || {}) as Record<string, unknown>;
      return {
        id: row.id,
        patient: row.patient,
        status: row.status,
        specialty: String(payload.specialty || "Não informada"),
        preferredDate: String(payload.preferredDate || payload.date || ""),
        preferredPeriod: String(payload.preferredPeriod || payload.time || ""),
        physician: String(payload.physician || payload.doctor || "A definir"),
        reason: String(payload.reason || ""),
        notes: String(payload.notes || ""),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ ok: true, appointments });
  } catch (error) {
    console.error("[patient-portal] list appointments", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar as consultas." }, { status: 500 });
  }
}
