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
      .select("id,passport,patient,status,created_at,updated_at,specialty:payload->>specialty,preferred_date:payload->>preferredDate,date:payload->>date,preferred_period:payload->>preferredPeriod,time:payload->>time,physician:payload->>physician,doctor:payload->>doctor,reason:payload->>reason,notes:payload->>notes,proposed_date:payload->>proposedDate,proposed_time:payload->>proposedTime,reschedule_reason:payload->>rescheduleReason,patient_availability:payload->>patientAvailability")
      .eq("passport", valid.access.patient_passport)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const appointments = (data || []).map((row: any) => {
      const status = String(row.status || "Enviada — médico a definir");
      return {
        id: row.id,
        patient: row.patient,
        status,
        specialty: String(row.specialty || "Não informada"),
        preferredDate: String(row.preferred_date || row.date || ""),
        preferredPeriod: String(row.preferred_period || row.time || ""),
        physician: String(row.physician || row.doctor || "Médico a definir"),
        reason: String(row.reason || ""),
        notes: String(row.notes || ""),
        proposedDate: String(row.proposed_date || ""),
        proposedTime: String(row.proposed_time || ""),
        rescheduleReason: String(row.reschedule_reason || ""),
        patientAvailability: String(row.patient_availability || ""),
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
