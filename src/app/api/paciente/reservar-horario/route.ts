import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
import {
  CLINICAL_BOOKING_CUTOFF_MS,
  CLINICAL_TIMEZONE,
  clinicalDateKey,
} from "@/lib/clinical-scheduling";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const { slotId, occurrenceId } = (await request.json()) as { slotId?: string; occurrenceId?: string };
    if (!slotId || !occurrenceId) {
      return NextResponse.json({ ok: false, error: "Selecione um horário válido." }, { status: 400 });
    }

    const { data: slot, error: slotError } = await valid.supabase
      .from("clinical_appointment_slots")
      .select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status")
      .eq("id", slotId)
      .maybeSingle();
    if (slotError) throw slotError;
    if (!slot || slot.status !== "Disponível") {
      return NextResponse.json({ ok: false, error: "Este horário não está mais disponível." }, { status: 409 });
    }

    const startsAt = new Date(slot.starts_at);
    const cutoffAt = new Date(startsAt.getTime() - CLINICAL_BOOKING_CUTOFF_MS);
    if (Date.now() >= cutoffAt.getTime()) {
      return NextResponse.json({
        ok: false,
        error: "A confirmação deste horário foi encerrada 24 horas antes da consulta. Escolha a próxima ocorrência disponível.",
      }, { status: 409 });
    }

    const plannedDate = clinicalDateKey(startsAt);
    const resolvedPassport = await resolvePortalPatientPassport(request, valid);
    if (!resolvedPassport) return NextResponse.json({ ok: false, error: "Paciente não autorizado para esta sessão." }, { status: 403 });
    const passport = normalizePassport(resolvedPassport);
    const { data: occurrence, error: occurrenceError } = await valid.supabase
      .from("clinical_followup_occurrences")
      .select("id,plan_id,doctor_id,patient_name,patient_passport,specialty,planned_date,status,charge_units")
      .eq("id", occurrenceId)
      .ilike("patient_passport", passport)
      .maybeSingle();
    if (occurrenceError) throw occurrenceError;

    let doctorMatches = Boolean(occurrence && String(occurrence.doctor_id) === String(slot.doctor_id));
    if (occurrence && !doctorMatches && occurrence.plan_id) {
      const { data: plan, error: planError } = await valid.supabase
        .from("clinical_followup_plans")
        .select("doctor_id,doctor_name")
        .eq("id", occurrence.plan_id)
        .maybeSingle();
      if (planError) throw planError;
      const normalizeDoctorName = (value: unknown) => String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("pt-BR");
      doctorMatches = Boolean(
        String(plan?.doctor_id || "") === String(slot.doctor_id)
        || (normalizeDoctorName(plan?.doctor_name) && normalizeDoctorName(plan?.doctor_name) === normalizeDoctorName(slot.doctor_name))
      );
    }

    const validOccurrence = occurrence
      && doctorMatches
      && String(occurrence.planned_date) === plannedDate
      && ["Planejada", "Aguardando abertura", "Horários disponíveis", "Pendente", "Ativa", "Ativo"].includes(String(occurrence.status));

    if (!validOccurrence) {
      return NextResponse.json({ ok: false, error: "Este horário não pertence ao seu acompanhamento médico." }, { status: 409 });
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
      return NextResponse.json({ ok: false, error: "Este horário acabou de ser confirmado por outro paciente." }, { status: 409 });
    }

    const time = startsAt.toLocaleTimeString("pt-BR", {
      timeZone: CLINICAL_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
    });
    const payload = {
      patient: occurrence.patient_name,
      passport,
      specialty: occurrence.specialty || slot.specialty,
      physician: slot.doctor_name,
      doctorId: slot.doctor_id,
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
      doctorNotification: "Horário confirmado pelo paciente",
      doctorNotificationUnread: true,
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

    const { error: occurrenceUpdateError } = await valid.supabase
      .from("clinical_followup_occurrences")
      .update({ status: "Horário confirmado", slot_id: slotId, appointment_id: appointmentId, updated_at: now })
      .eq("id", occurrence.id)
      .eq("status", occurrence.status);
    if (occurrenceUpdateError) throw occurrenceUpdateError;

    return NextResponse.json({ ok: true, appointmentId, status: "Confirmada" });
  } catch (error) {
    console.error("[patient-portal] reserve slot", error);
    return NextResponse.json({ ok: false, error: "Não foi possível confirmar o horário." }, { status: 500 });
  }
}
