import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAO_PAULO_TIMEZONE = "America/Sao_Paulo";
const BOOKING_CUTOFF_MS = 24 * 60 * 60 * 1000;

function dateInSaoPaulo(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() + BOOKING_CUTOFF_MS);
    const cutoffDate = dateInSaoPaulo(cutoff);

    const { data: occurrences, error: occurrenceError } = await valid.supabase
      .from("clinical_followup_occurrences")
      .select("id,doctor_id,specialty,planned_date,status,patient_name")
      .eq("patient_passport", valid.access.patient_passport)
      .gte("planned_date", cutoffDate)
      .in("status", ["Planejada", "Aguardando abertura", "Horários disponíveis"])
      .order("planned_date", { ascending: true })
      .limit(100);

    if (occurrenceError) throw occurrenceError;

    if (!occurrences?.length) {
      return NextResponse.json({
        ok: true,
        slots: [],
        window: { cutoffAt: cutoff.toISOString(), eligible: false },
      });
    }

    const doctorIds = [...new Set(occurrences.map((occurrence) => String(occurrence.doctor_id)))];
    const specialties = [...new Set(occurrences.map((occurrence) => String(occurrence.specialty)))];
    const lastOccurrenceDate = String(occurrences.at(-1)?.planned_date || cutoffDate);

    const { data: availableSlots, error: slotsError } = await valid.supabase
      .from("clinical_appointment_slots")
      .select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status")
      .eq("status", "Disponível")
      .in("doctor_id", doctorIds)
      .in("specialty", specialties)
      .gt("starts_at", cutoff.toISOString())
      .lte("starts_at", `${lastOccurrenceDate}T23:59:59-03:00`)
      .order("starts_at", { ascending: true })
      .limit(500);

    if (slotsError) throw slotsError;

    const occurrenceKeys = new Set(
      occurrences.map((occurrence) =>
        [String(occurrence.planned_date), String(occurrence.doctor_id), String(occurrence.specialty)].join("::")
      )
    );

    const matchingSlots = (availableSlots || []).filter((slot) => {
      const slotDate = dateInSaoPaulo(new Date(slot.starts_at));
      const key = [slotDate, String(slot.doctor_id), String(slot.specialty)].join("::");
      return occurrenceKeys.has(key);
    });

    const nextAvailableDate = matchingSlots.length
      ? dateInSaoPaulo(new Date(matchingSlots[0].starts_at))
      : null;

    const slots = nextAvailableDate
      ? matchingSlots.filter(
          (slot) => dateInSaoPaulo(new Date(slot.starts_at)) === nextAvailableDate
        )
      : [];

    const patientName = String(occurrences[0]?.patient_name || "");

    return NextResponse.json({
      ok: true,
      slots,
      patientName,
      window: {
        cutoffAt: cutoff.toISOString(),
        nextAvailableDate,
        eligible: slots.length > 0,
      },
    });
  } catch (error) {
    console.error("[patient-portal] available slots", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível carregar os horários disponíveis." },
      { status: 500 }
    );
  }
}
