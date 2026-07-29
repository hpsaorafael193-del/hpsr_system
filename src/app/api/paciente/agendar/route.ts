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
    const preferredTime = String(body.preferredTime || "").trim();
    const reason = String(body.reason || "").trim();
    const notes = String(body.notes || "").trim();
    const flowType = String(body.flowType || "Consulta comum").trim();
    const flowDetails = String(body.flowDetails || "").trim();
    const allowedFlowTypes = ["Consulta comum", "Acompanhamento prolongado", "Exames", "Outros"];

    if (!patient || !specialty || !preferredDate || !preferredPeriod || !reason || !allowedFlowTypes.includes(flowType)) {
      return NextResponse.json({ ok: false, error: "Preencha os campos obrigatórios." }, { status: 400 });
    }
    if (preferredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(preferredTime)) {
      return NextResponse.json({ ok: false, error: "Informe um horário preferencial válido." }, { status: 400 });
    }
    if (flowType === "Outros" && !flowDetails) {
      return NextResponse.json({ ok: false, error: "Descreva o objetivo da solicitação selecionada como Outros." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = `HPSR-PAC-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const payload = {
      patient,
      passport: valid.access.patient_passport,
      specialty,
      preferredDate,
      preferredPeriod,
      preferredTime,
      reason,
      notes,
      flowType,
      flowDetails: flowType === "Outros" ? flowDetails : "",
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
      description: `Solicitação de ${flowType.toLowerCase()} para ${specialty} criada pelo Portal do Paciente.`,
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
