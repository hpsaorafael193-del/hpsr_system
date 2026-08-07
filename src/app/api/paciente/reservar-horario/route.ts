import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
import { CLINICAL_BOOKING_CUTOFF_MS, CLINICAL_TIMEZONE, clinicalDateKey } from "@/lib/clinical-scheduling";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const { slotId } = (await request.json()) as { slotId?: string };
    if (!slotId) return NextResponse.json({ ok: false, error: "Selecione um horário válido." }, { status: 400 });

    const resolvedPassport = await resolvePortalPatientPassport(request, valid);
    if (!resolvedPassport) return NextResponse.json({ ok: false, error: "Paciente não autorizado para esta sessão." }, { status: 403 });
    const passport = normalizePassport(resolvedPassport);

    const [patientResult, slotResult] = await Promise.all([
      valid.supabase.from("patient_registry").select("name").eq("passport", passport).maybeSingle(),
      valid.supabase.from("clinical_appointment_slots").select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status").eq("id", slotId).maybeSingle(),
    ]);
    const { data: patient, error: patientError } = patientResult;
    const { data: slot, error: slotError } = slotResult;
    if (patientError) throw patientError;
    if (slotError) throw slotError;
    if (!patient) return NextResponse.json({ ok: false, error: "Paciente não encontrado no prontuário." }, { status: 404 });
    if (!slot || slot.status !== "Disponível") return NextResponse.json({ ok: false, error: "Este horário não está mais disponível." }, { status: 409 });

    const activeBookingResult = await valid.supabase.rpc("hpsr_patient_has_active_booking", {
      target_passport: passport,
      target_specialty: slot.specialty,
      exclude_appointment_id: null,
    });
    if (activeBookingResult.error) throw activeBookingResult.error;
    if (activeBookingResult.data) {
      return NextResponse.json(
        { ok: false, error: `Você já possui uma consulta ativa em ${slot.specialty}. Aguarde ela ser realizada, cancelada ou encerrada antes de escolher outro horário.` },
        { status: 409 },
      );
    }

    const allowedResult = await valid.supabase.rpc("patient_portal_slot_allowed", {
      target_passport: passport,
      target_doctor_id: slot.doctor_id,
      target_specialty: slot.specialty,
    });
    if (allowedResult.error) throw allowedResult.error;
    if (!allowedResult.data) {
      return NextResponse.json({ ok: false, error: "Este horário não pertence ao médico e à especialidade liberados para o seu prontuário." }, { status: 403 });
    }

    const startsAt = new Date(slot.starts_at);
    const cutoffAt = new Date(startsAt.getTime() - CLINICAL_BOOKING_CUTOFF_MS);
    if (Date.now() >= cutoffAt.getTime()) {
      return NextResponse.json({ ok: false, error: "A confirmação deste horário foi encerrada 24 horas antes da consulta." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const appointmentId = `HPSR-AGENDA-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const { data: reserved, error: reserveError } = await valid.supabase
      .from("clinical_appointment_slots")
      .update({
        status: "Ocupado",
        patient_passport: passport,
        patient_name: patient.name,
        appointment_id: appointmentId,
        booked_at: now,
        updated_at: now,
      })
      .eq("id", slotId)
      .eq("status", "Disponível")
      .select("id")
      .maybeSingle();
    if (reserveError) throw reserveError;
    if (!reserved) return NextResponse.json({ ok: false, error: "Este horário acabou de ser escolhido por outro paciente." }, { status: 409 });

    const date = clinicalDateKey(startsAt);
    const time = startsAt.toLocaleTimeString("pt-BR", { timeZone: CLINICAL_TIMEZONE, hour: "2-digit", minute: "2-digit" });
    const payload = {
      patient: patient.name,
      passport,
      requestedByPassport: normalizePassport(valid.access.patient_passport),
      requestedByRelationship: passport === normalizePassport(valid.access.patient_passport) ? "Titular" : "Responsável",
      specialty: slot.specialty,
      physician: slot.doctor_name,
      doctor: slot.doctor_name,
      doctorId: slot.doctor_id,
      preferredDate: date,
      date,
      time,
      preferredPeriod: time,
      reason: "Consulta escolhida na agenda do especialista",
      source: "clinical_availability",
      slotId,
      presenceConfirmed: true,
      doctorNotification: "Horário escolhido e confirmado pelo paciente",
      doctorNotificationUnread: true,
      bookingCutoffAt: cutoffAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    const { error: appointmentError } = await valid.supabase.from("appointments").insert({
      id: appointmentId,
      passport,
      patient: patient.name,
      status: "Confirmada",
      payload,
      created_at: now,
      updated_at: now,
    });
    if (appointmentError) {
      await valid.supabase.from("clinical_appointment_slots").update({
        status: "Disponível",
        patient_passport: null,
        patient_name: null,
        appointment_id: null,
        booked_at: null,
        updated_at: new Date().toISOString(),
      }).eq("id", slotId).eq("appointment_id", appointmentId);
      throw appointmentError;
    }

    return NextResponse.json({ ok: true, appointmentId, status: "Confirmada", doctorName: slot.doctor_name });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error || "");
    if (errorMessage.includes("já possui uma consulta ativa")) {
      return NextResponse.json({ ok: false, error: errorMessage }, { status: 409 });
    }
    console.error("[patient-portal] reserve slot", error);
    return NextResponse.json({ ok: false, error: "Não foi possível escolher e confirmar o horário." }, { status: 500 });
  }
}
