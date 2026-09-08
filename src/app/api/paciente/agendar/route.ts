import { brazilIso } from "@/lib/brazil-datetime";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const body = await request.json();
    const resolvedPassport = await resolvePortalPatientPassport(request, valid);
    if (!resolvedPassport) return NextResponse.json({ ok: false, error: "Paciente não autorizado para esta sessão." }, { status: 403 });
    const patientPassport = normalizePassport(resolvedPassport);
    const { data: patientRow, error: patientError } = await valid.supabase.from("patient_registry").select("name,city_phone").eq("passport", patientPassport).maybeSingle();
    if (patientError) throw patientError;
    if (!patientRow) return NextResponse.json({ ok: false, error: "Paciente não encontrado no prontuário." }, { status: 404 });
    const patient = String(patientRow.name || body.patient || "").trim();
    const specialty = String(body.specialty || "").trim();
    const preferredDate = "";
    const preferredPeriod = "";
    const preferredTime = "";
    const reason = String(body.reason || "").trim();
    const notes = String(body.notes || "").trim();
    const flowType = String(body.flowType || "Consulta comum").trim();
    const flowDetails = String(body.flowDetails || "").trim();
    const discordId = String(body.discordId || "").replace(/\D/g, "").trim();
    const cityPhone = String(patientRow.city_phone || "").trim();
    const allowedFlowTypes = ["Consulta comum", "Acompanhamento"];
    const normalizedReason = reason
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const isPsychotechnicalRequest = /psico\s*tecnic/.test(normalizedReason);

    if (flowType === "Consulta comum" && isPsychotechnicalRequest) {
      return NextResponse.json({
        ok: false,
        code: "SEPARATE_EXAM_FLOW",
        error: "Psicotécnico é um exame e deve ser solicitado pela área Solicitar exame. Ele não consome vaga de consulta.",
      }, { status: 409 });
    }

    if (["Acompanhamento com especialista", "Exames"].includes(flowType)) {
      return NextResponse.json({
        ok: false,
        code: "SEPARATE_PATIENT_FLOW",
        error: flowType === "Exames"
          ? "Solicitações de exame possuem uma área própria no Portal do Paciente."
          : "Acompanhamentos ativos são conduzidos pelo médico e não precisam de uma nova solicitação de consulta.",
      }, { status: 409 });
    }
    if (!patient || !specialty || !reason || !allowedFlowTypes.includes(flowType)) {
      return NextResponse.json({ ok: false, error: "Preencha os campos obrigatórios." }, { status: 400 });
    }
    if (!cityPhone && !discordId) {
      return NextResponse.json({ ok: false, code: "CONTACT_REQUIRED", error: "Este paciente não possui telefone da cidade cadastrado. Informe o ID do Discord para que o médico consiga entrar em contato." }, { status: 400 });
    }
    if (flowType === "Acompanhamento" && !flowDetails) {
      return NextResponse.json({ ok: false, error: "Informe qual acompanhamento você precisa iniciar." }, { status: 400 });
    }

    const activeBookingResult = await valid.supabase.rpc("hpsr_patient_has_active_booking", {
      target_passport: patientPassport,
      target_specialty: specialty,
      exclude_appointment_id: null,
    });
    if (activeBookingResult.error) throw activeBookingResult.error;
    if (activeBookingResult.data) {
      return NextResponse.json(
        { ok: false, error: `Você já possui uma consulta ativa em ${specialty}. Aguarde ela ser realizada, cancelada ou encerrada antes de solicitar outra.` },
        { status: 409 },
      );
    }

    const { data: capacityCandidates, error: capacityError } = await valid.supabase.rpc("hpsr_specialty_capacity_candidates", { p_specialty: specialty });
    if (capacityError) throw capacityError;
    if (!Array.isArray(capacityCandidates) || capacityCandidates.length === 0) {
      return NextResponse.json({ ok: false, code: "NO_CAPACITY", error: "Sem vagas no momento para esta especialidade." }, { status: 409 });
    }

    const now = brazilIso();
    const id = `HPSR-PAC-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const payload = {
      patient,
      passport: patientPassport,
      requestedByPassport: normalizePassport(valid.access.patient_passport),
      requestedByRelationship: patientPassport === normalizePassport(valid.access.patient_passport) ? "Titular" : "Responsável",
      specialty,
      preferredDate,
      preferredPeriod,
      preferredTime,
      schedulingMode: "medical_contact",
      schedulingNotice: "O paciente apenas solicita a consulta. O médico entra em contato pelo ID do Discord informado ou pelo telefone da cidade cadastrado para combinar o dia e o horário.",
      cityPhone,
      discordId,
      contactChannel: discordId ? "discord" : "city_phone",
      reason,
      notes,
      flowType,
      flowDetails: flowType === "Acompanhamento" ? flowDetails : "",
      source: "patient_portal",
      physician: "A definir",
      doctorNotificationUnread: true,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await valid.supabase.from("appointments").insert({
      id,
      passport: patientPassport,
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
      reference: patientPassport,
      created_at: now,
    });

    return NextResponse.json({ ok: true, id, status: "Solicitação enviada" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || "");
    if (errorMessage.includes("já possui uma consulta ativa")) {
      return NextResponse.json({ ok: false, error: errorMessage }, { status: 409 });
    }
    console.error("[patient-portal] create appointment", error);
    return NextResponse.json({ ok: false, error: "Não foi possível solicitar a consulta." }, { status: 500 });
  }
}
