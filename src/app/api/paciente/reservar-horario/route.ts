import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const { slotId, patientName } = await request.json() as { slotId?: string; patientName?: string };
    if (!slotId || !patientName?.trim()) return NextResponse.json({ ok: false, error: "Informe o paciente e selecione um horário." }, { status: 400 });

    const { data: slot, error: slotError } = await valid.supabase.from("clinical_appointment_slots")
      .select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status")
      .eq("id", slotId).maybeSingle();
    if (slotError || !slot || slot.status !== "Disponível" || new Date(slot.starts_at).getTime() <= Date.now()) {
      return NextResponse.json({ ok: false, error: "Este horário não está mais disponível." }, { status: 409 });
    }

    const passport = valid.access.patient_passport;
    const { data: existing } = await valid.supabase.from("clinical_appointment_slots")
      .select("id").eq("patient_passport", passport).eq("doctor_id", slot.doctor_id).eq("specialty", slot.specialty)
      .eq("status", "Ocupado").gte("starts_at", new Date().toISOString()).limit(1);
    if (existing?.length) return NextResponse.json({ ok: false, error: "Você já possui uma consulta futura com este médico nesta especialidade." }, { status: 409 });

    const now = new Date().toISOString();
    const appointmentId = `HPSR-AGENDA-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const { data: reserved, error: reserveError } = await valid.supabase.from("clinical_appointment_slots")
      .update({ status: "Ocupado", patient_passport: passport, patient_name: patientName.trim(), appointment_id: appointmentId, booked_at: now, updated_at: now })
      .eq("id", slotId).eq("status", "Disponível").select("id").maybeSingle();
    if (reserveError) throw reserveError;
    if (!reserved) return NextResponse.json({ ok: false, error: "Este horário acabou de ser reservado por outro paciente. Escolha outro horário." }, { status: 409 });

    const starts = new Date(slot.starts_at);
    const date = starts.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const time = starts.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
    const payload = { patient: patientName.trim(), passport, specialty: slot.specialty, physician: slot.doctor_name, preferredDate: date, date, time, preferredPeriod: time, reason: "Agendamento pelo Portal do Paciente", source: "patient_portal_slot", slotId, createdAt: now, updatedAt: now };
    const { error: appointmentError } = await valid.supabase.from("appointments").insert({ id: appointmentId, passport, patient: patientName.trim(), status: "Confirmada", payload, created_at: now, updated_at: now });
    if (appointmentError) {
      await valid.supabase.from("clinical_appointment_slots").update({ status: "Disponível", patient_passport: null, patient_name: null, appointment_id: null, booked_at: null, updated_at: new Date().toISOString() }).eq("id", slotId).eq("appointment_id", appointmentId);
      throw appointmentError;
    }
    return NextResponse.json({ ok: true, appointmentId, status: "Confirmada" });
  } catch (error) {
    console.error("[patient-portal] reserve slot", error);
    return NextResponse.json({ ok: false, error: "Não foi possível confirmar o agendamento." }, { status: 500 });
  }
}
