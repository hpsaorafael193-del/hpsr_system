import { brazilIso } from "@/lib/brazil-datetime";
import { isValidDiscordId, normalizeDiscordId } from "@/lib/phone";
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
    const submittedDiscordId = normalizeDiscordId(body.discordId);
    if (!specialty || !reason) return NextResponse.json({ ok: false, error: "Informe a especialidade e o exame ou necessidade solicitada." }, { status: 400 });

    const { data: patientRow, error: patientError } = await valid.supabase
      .from("patient_registry")
      .select("name,city_phone,discord")
      .eq("passport", patientPassport)
      .maybeSingle();
    if (patientError) throw patientError;
    if (!patientRow) return NextResponse.json({ ok: false, error: "Paciente não encontrado no prontuário." }, { status: 404 });

    const cityPhone = String(patientRow.city_phone || "").trim();
    const storedDiscordId = String(patientRow.discord || "").trim();
    if (submittedDiscordId && !isValidDiscordId(submittedDiscordId)) return NextResponse.json({ ok: false, error: "Informe um ID do Discord válido com 17 a 20 dígitos." }, { status: 400 });
    const discordId = submittedDiscordId || storedDiscordId;
    if (!cityPhone && !discordId) {
      return NextResponse.json({ ok: false, code: "CONTACT_REQUIRED", error: "Este paciente não possui telefone da cidade cadastrado. Informe o ID do Discord para permitir o contato da equipe." }, { status: 400 });
    }

    if (submittedDiscordId && submittedDiscordId !== storedDiscordId) {
      const { error: contactUpdateError } = await valid.supabase.from("patient_registry").update({ discord: submittedDiscordId, updated_at: brazilIso() }).eq("passport", patientPassport);
      if (contactUpdateError) throw contactUpdateError;
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
      cityPhone,
      discordId,
      contactChannel: discordId ? "discord" : "city_phone",
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
