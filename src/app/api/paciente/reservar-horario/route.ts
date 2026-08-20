import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const body = (await request.json()) as { slotId?: string; planId?: string; linkType?: "plan" | "assignment"; doctorId?: string; specialty?: string };
    if (!body.slotId) {
      return NextResponse.json({ ok: false, error: "Selecione um horário válido." }, { status: 400 });
    }
    if (body.linkType === "plan" && !body.planId) {
      return NextResponse.json({ ok: false, error: "Acompanhamento inválido." }, { status: 400 });
    }
    if (body.linkType === "assignment" && (!body.doctorId || !body.specialty)) {
      return NextResponse.json({ ok: false, error: "Vínculo médico inválido." }, { status: 400 });
    }

    const resolvedPassport = await resolvePortalPatientPassport(request, valid);
    if (!resolvedPassport) return NextResponse.json({ ok: false, error: "Paciente não autorizado para esta sessão." }, { status: 403 });
    const passport = normalizePassport(resolvedPassport);

    const { data, error } = await valid.supabase.rpc("book_patient_schedule_slot", {
      target_passport: passport,
      target_slot_id: body.slotId,
      target_plan_id: body.linkType === "plan" ? body.planId || null : null,
      target_doctor_id: body.linkType === "assignment" ? body.doctorId || null : null,
      target_specialty: body.linkType === "assignment" ? body.specialty || null : null,
      requested_by_passport: normalizePassport(valid.access.patient_passport),
    });
    if (error) throw error;
    const result = (data || {}) as { ok?: boolean; appointment_id?: string; doctor_name?: string; starts_at?: string; error?: string; code?: string };
    if (!result.ok) {
      const status = ["ACTIVE_BOOKING", "SLOT_UNAVAILABLE", "SAME_DAY_CLOSED"].includes(String(result.code || "")) ? 409 : 400;
      return NextResponse.json({ ok: false, error: result.error || "Não foi possível confirmar o horário." }, { status });
    }

    return NextResponse.json({ ok: true, appointmentId: result.appointment_id, doctorName: result.doctor_name, startsAt: result.starts_at, status: "Confirmada" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "");
    if (message.includes("já possui uma consulta ativa")) return NextResponse.json({ ok: false, error: message }, { status: 409 });
    console.error("[patient-portal] reserve schedule slot", error);
    return NextResponse.json({ ok: false, error: "Não foi possível confirmar o horário. Atualize a agenda e tente novamente." }, { status: 500 });
  }
}
