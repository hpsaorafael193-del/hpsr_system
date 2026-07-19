import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    await valid.supabase.rpc("cleanup_old_clinical_slots");
    const from = new Date().toISOString();
    const until = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString();
    const { data, error } = await valid.supabase.from("clinical_appointment_slots")
      .select("id,doctor_name,specialty,starts_at,ends_at,status")
      .eq("status", "Disponível").gte("starts_at", from).lte("starts_at", until).order("starts_at");
    if (error) throw error;
    return NextResponse.json({ ok: true, slots: data || [] });
  } catch (error) {
    console.error("[patient-portal] available slots", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar os horários disponíveis." }, { status: 500 });
  }
}
