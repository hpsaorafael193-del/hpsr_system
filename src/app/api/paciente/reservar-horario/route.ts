import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
import { CLINICAL_BOOKING_CUTOFF_MS, CLINICAL_TIMEZONE, clinicalDateKey, normalizeClinicalSpecialty } from "@/lib/clinical-scheduling";

export const runtime = "nodejs";

function specialtyTokens(value: unknown) {
  return String(value ?? "")
    .split(/[,;/|]+/)
    .map((item) => normalizeClinicalSpecialty(item))
    .filter(Boolean);
}

function matchesAllowedSpecialty(slotSpecialty: unknown, allowed: string[]) {
  const slotTokens = specialtyTokens(slotSpecialty);
  return allowed.some((wanted) => slotTokens.some((candidate) =>
    candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate)
  ));
}

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const { slotId } = (await request.json()) as { slotId?: string };
    if (!slotId) return NextResponse.json({ ok: false, error: "Selecione um horário válido." }, { status: 400 });

    const resolvedPassport = await resolvePortalPatientPassport(request, valid);
    if (!resolvedPassport) return NextResponse.json({ ok: false, error: "Paciente não autorizado para esta sessão." }, { status: 403 });
    const passport = normalizePassport(resolvedPassport);

    const [patientResult, slotResult, specialtiesResult] = await Promise.all([
      valid.supabase.from("patient_registry").select("name").eq("passport", passport).maybeSingle(),
      valid.supabase.from("clinical_appointment_slots").select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status").eq("id", slotId).maybeSingle(),
      valid.supabase.rpc("patient_portal_allowed_specialties", { target_passport: passport }),
    ]);
    const { data: patient, error: patientError } = patientResult;
    const { data: slot, error: slotError } = slotResult;
    if (patientError) throw patientError;
    if (slotError) throw slotError;
    if (specialtiesResult.error) throw specialtiesResult.error;
    if (!patient) return NextResponse.json({ ok: false, error: "Paciente não encontrado no prontuário." }, { status: 404 });
    if (!slot || slot.status !== "Disponível") return NextResponse.json({ ok: false, error: "Este horário não está mais disponível." }, { status: 409 });

    const allowedSpecialties = (Array.isArray(specialtiesResult.data) ? specialtiesResult.data : [])
      .map((item) => normalizeClinicalSpecialty(item))
      .filter(Boolean);
    if (!matchesAllowedSpecialty(slot.specialty, allowedSpecialties)) {
      return NextResponse.json({ ok: false, error: "Este horário não pertence às especialidades liberadas no seu prontuário." }, { status: 403 });
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
    console.error("[patient-portal] reserve slot", error);
    return NextResponse.json({ ok: false, error: "Não foi possível escolher e confirmar o horário." }, { status: 500 });
  }
}
