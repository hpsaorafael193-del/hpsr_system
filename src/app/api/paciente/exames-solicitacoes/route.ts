import { brazilIso } from "@/lib/brazil-datetime";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const targetPassport = await resolvePortalPatientPassport(request, valid);
    if (!targetPassport) return NextResponse.json({ ok: false, error: "Acesso não autorizado para este paciente." }, { status: 403 });

    const { data, error } = await valid.supabase
      .from("appointments")
      .select("id,status,created_at,updated_at,specialty:payload->>specialty,reason:payload->>reason,notes:payload->>notes,answer:payload->>answer,doctor:payload->>doctor,physician:payload->>physician")
      .eq("passport", targetPassport)
      .eq("payload->>flowType", "Exames")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      requests: (data || []).map((row: any) => ({
        id: String(row.id || ""),
        status: String(row.status || "Solicitação enviada"),
        specialty: String(row.specialty || "Não informada"),
        reason: String(row.reason || ""),
        notes: String(row.notes || ""),
        answer: String(row.answer || ""),
        doctor: String(row.doctor || row.physician || ""),
        createdAt: String(row.created_at || ""),
        updatedAt: String(row.updated_at || ""),
      })),
    });
  } catch (error) {
    console.error("[patient-portal] list exam requests", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar as solicitações de exame." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const targetPassport = await resolvePortalPatientPassport(request, valid);
    if (!targetPassport) return NextResponse.json({ ok: false, error: "Acesso não autorizado para este paciente." }, { status: 403 });

    const patientPassport = normalizePassport(targetPassport);
    const body = await request.json();
    const specialty = String(body.specialty || "").trim();
    const reason = String(body.reason || "").trim();
    const notes = String(body.notes || "").trim();
    const discordId = String(body.discordId || "").replace(/\D/g, "").trim();
    if (!specialty || !reason) return NextResponse.json({ ok: false, error: "Informe a especialidade e o exame ou necessidade solicitada." }, { status: 400 });

    const { data: patientRow, error: patientError } = await valid.supabase
      .from("patient_registry")
      .select("name,email")
      .eq("passport", patientPassport)
      .maybeSingle();
    if (patientError) throw patientError;
    if (!patientRow) return NextResponse.json({ ok: false, error: "Paciente não encontrado no prontuário." }, { status: 404 });

    const accountEmail = patientPassport === normalizePassport(valid.access.patient_passport) ? String(valid.access.email || "").trim().toLowerCase() : "";
    const registryEmail = String(patientRow.email || "").trim().toLowerCase();
    const contactEmail = registryEmail || accountEmail;
    if (!contactEmail && !discordId) {
      return NextResponse.json({ ok: false, code: "CONTACT_REQUIRED", error: "Este paciente não possui e-mail cadastrado. Informe o ID do Discord para permitir o contato da equipe." }, { status: 400 });
    }

    const now = brazilIso();
    const id = `HPSR-EXM-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const patient = String(patientRow.name || "Paciente").trim();
    const payload = {
      patient,
      passport: patientPassport,
      requestedByPassport: normalizePassport(valid.access.patient_passport),
      requestedByRelationship: patientPassport === normalizePassport(valid.access.patient_passport) ? "Titular" : "Responsável",
      requestKind: "exam",
      flowType: "Exames",
      specialty,
      reason,
      notes,
      contactEmail,
      discordId: contactEmail ? "" : discordId,
      contactChannel: contactEmail ? "email" : "discord",
      source: "patient_portal",
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
      action: "Exame solicitado",
      description: `Solicitação de exame para ${specialty} criada pelo Portal do Paciente.`,
      actor: patient,
      reference: patientPassport,
      created_at: now,
    });

    return NextResponse.json({ ok: true, id, status: "Solicitação enviada" });
  } catch (error) {
    console.error("[patient-portal] create exam request", error);
    return NextResponse.json({ ok: false, error: "Não foi possível enviar a solicitação de exame." }, { status: 500 });
  }
}
