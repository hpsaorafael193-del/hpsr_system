import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    }

    const { slotId } = (await request.json()) as { slotId?: string };
    if (!slotId) {
      return NextResponse.json({ ok: false, error: "Selecione um horário." }, { status: 400 });
    }

    const { data: slot } = await valid.supabase
      .from("clinical_appointment_slots")
      .select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status")
      .eq("id", slotId)
      .maybeSingle();

    if (!slot || slot.status !== "Disponível") {
      return NextResponse.json(
        { ok: false, error: "Este horário não está mais disponível." },
        { status: 409 }
      );
    }

    const startsAt = new Date(slot.starts_at);
    const cutoffAt = new Date(startsAt.getTime() - BOOKING_CUTOFF_MS);
    if (Date.now() >= cutoffAt.getTime()) {
      return NextResponse.json(
        {
          ok: false,
          error: "A confirmação deste horário foi encerrada 24 horas antes da consulta. Escolha a próxima ocorrência disponível.",
        },
        { status: 409 }
      );
    }

    const plannedDate = dateInSaoPaulo(startsAt);
    const passport = valid.access.patient_passport;

    const { data: occurrence } = await valid.supabase
      .from("clinical_followup_occurrences")
      .select("id,patient_name,status,charge_units")
      .eq("patient_passport", passport)
      .eq("doctor_id", slot.doctor_id)
      .eq("specialty", slot.specialty)
      .eq("planned_date", plannedDate)
      .in("status", ["Planejada", "Aguardando abertura", "Horários disponíveis"])
      .maybeSingle();

    if (!occurrence) {
      return NextResponse.json(
        { ok: false, error: "Não existe consulta planejada para este horário." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const appointmentId = `HPSR-AGENDA-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

    const { data: reserved, error: reserveError } = await valid.supabase
      .from("clinical_appointment_slots")
      .update({
        status: "Ocupado",
        patient_passport: passport,
        patient_name: occurrence.patient_name,
        appointment_id: appointmentId,
        booked_at: now,
        updated_at: now,
      })
      .eq("id", slotId)
      .eq("status", "Disponível")
      .select("id")
      .maybeSingle();

    if (reserveError) throw reserveError;
    if (!reserved) {
      return NextResponse.json(
        { ok: false, error: "Este horário acabou de ser confirmado por outro paciente." },
        { status: 409 }
      );
    }

    const time = startsAt.toLocaleTimeString("pt-BR", {
      timeZone: SAO_PAULO_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
    });

    const payload = {
      patient: occurrence.patient_name,
      passport,
      specialty: slot.specialty,
      physician: slot.doctor_name,
      preferredDate: plannedDate,
      date: plannedDate,
      time,
      preferredPeriod: time,
      reason: "Consulta de acompanhamento",
      source: "clinical_followup",
      slotId,
      occurrenceId: occurrence.id,
      chargeUnits: occurrence.charge_units || 1,
      presenceConfirmed: true,
      bookingCutoffAt: cutoffAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    const { error: appointmentError } = await valid.supabase.from("appointments").insert({
      id: appointmentId,
      passport,
      patient: occurrence.patient_name,
      status: "Confirmada",
      payload,
      created_at: now,
      updated_at: now,
    });

    if (appointmentError) {
      await valid.supabase
        .from("clinical_appointment_slots")
        .update({
          status: "Disponível",
          patient_passport: null,
          patient_name: null,
          appointment_id: null,
          booked_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", slotId)
        .eq("appointment_id", appointmentId);
      throw appointmentError;
    }

    await valid.supabase
      .from("clinical_followup_occurrences")
      .update({
        status: "Horário confirmado",
        slot_id: slotId,
        appointment_id: appointmentId,
        updated_at: now,
      })
      .eq("id", occurrence.id);

    return NextResponse.json({ ok: true, appointmentId, status: "Confirmada" });
  } catch (error) {
    console.error("[patient-portal] reserve slot", error);
    return NextResponse.json(
      { ok: false, error: "Não foi possível confirmar o horário." },
      { status: 500 }
    );
  }
}
