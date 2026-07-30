import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";
import { isClinicalProfessional, profileMatchesClinicalSpecialty } from "@/lib/clinical-scheduling";

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
    const requestedDoctorId = String(body.requestedDoctorId || "").trim();
    const requestedDoctorName = String(body.requestedDoctorName || "").trim();
    const allowedFlowTypes = ["Consulta comum", "Acompanhamento com especialista", "Exames", "Outros"];

    if (!patient || !specialty || !preferredDate || !preferredPeriod || !reason || !allowedFlowTypes.includes(flowType)) {
      return NextResponse.json({ ok: false, error: "Preencha os campos obrigatórios." }, { status: 400 });
    }
    if (preferredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(preferredTime)) {
      return NextResponse.json({ ok: false, error: "Informe um horário preferencial válido." }, { status: 400 });
    }
    if (flowType === "Acompanhamento com especialista" && (!requestedDoctorId || !requestedDoctorName)) {
      return NextResponse.json({ ok: false, error: "Selecione o médico responsável pelo acompanhamento." }, { status: 400 });
    }
    if (flowType === "Outros" && !flowDetails) {
      return NextResponse.json({ ok: false, error: "Descreva o objetivo da solicitação selecionada como Outros." }, { status: 400 });
    }

    let verifiedDoctorId = "";
    let verifiedDoctorName = "";
    if (flowType === "Acompanhamento com especialista") {
      const { data: doctor, error: doctorError } = await valid.supabase
        .from("profiles")
        .select("id,name,specialty,role,crm,access_status")
        .eq("id", requestedDoctorId)
        .eq("access_status", "Aprovado")
        .maybeSingle();
      if (doctorError) throw doctorError;
      if (!doctor || !isClinicalProfessional(doctor) || !profileMatchesClinicalSpecialty(doctor, specialty)) {
        return NextResponse.json({ ok: false, error: "O médico selecionado não está disponível para esta especialidade." }, { status: 400 });
      }
      verifiedDoctorId = String(doctor.id);
      verifiedDoctorName = String(doctor.name || requestedDoctorName);
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
      requestedDoctorId: flowType === "Acompanhamento com especialista" ? verifiedDoctorId : "",
      requestedDoctorName: flowType === "Acompanhamento com especialista" ? verifiedDoctorName : "",
      source: "patient_portal",
      physician: flowType === "Acompanhamento com especialista" ? verifiedDoctorName : "A definir",
      doctorNotificationUnread: flowType === "Acompanhamento com especialista",
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await valid.supabase.from("appointments").insert({
      id,
      passport: valid.access.patient_passport,
      patient,
      status: flowType === "Acompanhamento com especialista" ? "Acompanhamento aguardando confirmação" : "Solicitação enviada",
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

    return NextResponse.json({ ok: true, id, status: flowType === "Acompanhamento com especialista" ? "Acompanhamento aguardando confirmação" : "Solicitação enviada" });
  } catch (error) {
    console.error("[patient-portal] create appointment", error);
    return NextResponse.json({ ok: false, error: "Não foi possível solicitar a consulta." }, { status: 500 });
  }
}
