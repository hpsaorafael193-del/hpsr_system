import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
import { CLINICAL_BOOKING_CUTOFF_MS } from "@/lib/clinical-scheduling";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SLOTS = 300;

type SlotRow = {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const resolvedPassport = await resolvePortalPatientPassport(request, valid);
    if (!resolvedPassport) return NextResponse.json({ ok: false, error: "Paciente não autorizado para esta sessão." }, { status: 403 });
    const passport = normalizePassport(resolvedPassport);
    const cutoff = new Date(Date.now() + CLINICAL_BOOKING_CUTOFF_MS);

    const [patientResult, slotsResult] = await Promise.all([
      valid.supabase
        .from("patient_registry")
        .select("name")
        .eq("passport", passport)
        .maybeSingle(),
      valid.supabase.rpc("patient_portal_available_slots", {
        target_passport: passport,
        cutoff_at: cutoff.toISOString(),
        max_rows: MAX_SLOTS,
      }),
    ]);

    if (patientResult.error) throw patientResult.error;
    if (slotsResult.error) throw slotsResult.error;
    const slots = ((slotsResult.data || []) as SlotRow[]).map((slot) => ({
      ...slot,
      occurrenceId: null,
    }));

    let allowedSpecialties: string[] = [];
    let reason = "";
    if (slots.length === 0) {
      const specialtiesResult = await valid.supabase.rpc("patient_portal_allowed_specialties", {
        target_passport: passport,
      });
      if (specialtiesResult.error) throw specialtiesResult.error;
      allowedSpecialties = Array.isArray(specialtiesResult.data)
        ? specialtiesResult.data.map(String).filter(Boolean)
        : [];
      reason = allowedSpecialties.length === 0
        ? "Nenhuma especialidade de agenda foi liberada ou identificada no histórico deste paciente."
        : "Ainda não existem horários disponíveis para as especialidades liberadas no prontuário ou identificadas no histórico.";
    } else {
      allowedSpecialties = Array.from(new Set(slots.map((slot) => slot.specialty).filter(Boolean)));
    }

    return NextResponse.json({
      ok: true,
      slots,
      patientName: String(patientResult.data?.name || ""),
      allowedSpecialties,
      diagnostics: { reason },
      window: { cutoffAt: cutoff.toISOString(), eligible: slots.length > 0 },
    });
  } catch (error) {
    console.error("[patient-portal] available slots", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar os horários." }, { status: 500 });
  }
}
