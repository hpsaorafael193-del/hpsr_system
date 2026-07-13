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

    const appointments = (data || []).map((row: any) => {
      const payload = (row.payload || {}) as Record<string, unknown>;
      const status = String(row.status || payload.status || "Enviada — médico a definir");
      return {
        id: row.id,
        patient: row.patient,
        status,
        specialty: String(payload.specialty || "Não informada"),
        preferredDate: String(payload.preferredDate || payload.date || ""),
        preferredPeriod: String(payload.preferredPeriod || payload.time || ""),
        physician: String(payload.physician || payload.doctor || "Médico a definir"),
        reason: String(payload.reason || ""),
        notes: String(payload.notes || ""),
        proposedDate: String(payload.proposedDate || ""),
        proposedTime: String(payload.proposedTime || ""),
        rescheduleReason: String(payload.rescheduleReason || ""),
        patientAvailability: String(payload.patientAvailability || ""),
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


export async function PATCH(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const body = await request.json() as { id?: string; action?: string; availability?: string };
    if (!body.id || !body.action) return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
    const { data: row, error: readError } = await valid.supabase.from("appointments").select("id,passport,payload,status").eq("id", body.id).eq("passport", valid.access.patient_passport).maybeSingle();
    if (readError || !row) return NextResponse.json({ ok: false, error: "Consulta não encontrada." }, { status: 404 });
    const payload = { ...((row.payload || {}) as Record<string, unknown>), patientResponseAt: new Date().toISOString() } as Record<string, unknown>;
    let status = String(row.status || "");
    if (body.action === "accept_reschedule") status = "Reagendamento aceito";
    else if (body.action === "decline_reschedule") status = "Reagendamento recusado";
    else if (body.action === "send_availability") { status = "Disponibilidade informada"; payload.patientAvailability = String(body.availability || "").trim(); }
    else if (body.action === "withdraw") status = "Desistência solicitada";
    else return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
    payload.status = status;
    const { error } = await valid.supabase.from("appointments").update({ status, payload, updated_at: new Date().toISOString() }).eq("id", body.id).eq("passport", valid.access.patient_passport);
    if (error) throw error;
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[patient-portal] appointment action", error);
    return NextResponse.json({ ok: false, error: "Não foi possível atualizar a consulta." }, { status: 500 });
  }
}
