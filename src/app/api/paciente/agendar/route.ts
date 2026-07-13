import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const body = await request.json();
    const patient = String(body.patient || "").trim();
    const specialty = String(body.specialty || "").trim();
    const preferredDate = String(body.preferredDate || "").trim();
    const preferredPeriod = String(body.preferredPeriod || "").trim();
    const reason = String(body.reason || "").trim();
    const notes = String(body.notes || "").trim();

    if (!patient || !specialty || !preferredDate || !preferredPeriod || !reason) {
      return NextResponse.json({ ok: false, error: "Preencha os campos obrigatórios." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = `HPSR-PAC-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const payload = {
      patient,
      passport: valid.access.patient_passport,
      specialty,
      preferredDate,
      preferredPeriod,
      reason,
      notes,
      source: "patient_portal",
      physician: "A definir",
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await valid.supabase.from("appointments").insert({
      id,
      passport: valid.access.patient_passport,
      patient,
      status: "Solicitação enviada",
      payload,
      created_at: now,
      updated_at: now,
    });
    if (error) throw error;

    await valid.supabase.from("system_activities").insert({
      id: `activity-${Date.now()}-${randomUUID().slice(0, 6)}`,
      module: "Portal do Paciente",
      action: "Consulta solicitada",
      description: `Solicitação de consulta para ${specialty} criada pelo Portal do Paciente.`,
      actor: patient,
      reference: valid.access.patient_passport,
      created_at: now,
    });

    return NextResponse.json({ ok: true, id, status: "Solicitação enviada" });
  } catch (error) {
    console.error("[patient-portal] create appointment", error);
    return NextResponse.json({ ok: false, error: "Não foi possível solicitar a consulta." }, { status: 500 });
  }
}
