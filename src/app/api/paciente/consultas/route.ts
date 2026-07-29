import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

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
      .select("id,passport,patient,status,created_at,updated_at,specialty:payload->>specialty,preferred_date:payload->>preferredDate,date:payload->>date,preferred_period:payload->>preferredPeriod,preferred_time:payload->>preferredTime,time:payload->>time,physician:payload->>physician,doctor:payload->>doctor,reason:payload->>reason,notes:payload->>notes,proposed_date:payload->>proposedDate,proposed_time:payload->>proposedTime,reschedule_reason:payload->>rescheduleReason,patient_availability:payload->>patientAvailability,patient_alternative_date:payload->>patientAlternativeDate,patient_alternative_time:payload->>patientAlternativeTime,patient_response:payload->>patientResponse,answer:payload->>answer,flow_type:payload->>flowType,flow_details:payload->>flowDetails")
      .eq("passport", targetPassport)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const appointments = (data || []).map((row: any) => {
      const status = String(row.status || "Enviada — médico a definir");
      return {
        id: row.id,
        patient: row.patient,
        status,
        specialty: String(row.specialty || "Não informada"),
        preferredDate: String(row.preferred_date || row.date || ""),
        preferredPeriod: String(row.preferred_period || ""),
        preferredTime: String(row.preferred_time || row.time || ""),
        physician: String(row.physician || row.doctor || "Médico a definir"),
        reason: String(row.reason || ""),
        notes: String(row.notes || ""),
        flowType: String(row.flow_type || "Consulta comum"),
        flowDetails: String(row.flow_details || ""),
        proposedDate: String(row.proposed_date || ""),
        proposedTime: String(row.proposed_time || ""),
        rescheduleReason: String(row.reschedule_reason || ""),
        patientAvailability: String(row.patient_availability || ""),
        patientAlternativeDate: String(row.patient_alternative_date || ""),
        patientAlternativeTime: String(row.patient_alternative_time || ""),
        patientResponse: String(row.patient_response || ""),
        answer: String(row.answer || ""),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return NextResponse.json({ ok: true, appointments });
  } catch (error) {
    console.error("[patient-portal] list appointments", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar as consultas." }, { status: 500 });
  }
}


export async function PATCH(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const targetPassport = await resolvePortalPatientPassport(request, valid);
    if (!targetPassport) return NextResponse.json({ ok: false, error: "Acesso não autorizado para este paciente." }, { status: 403 });
    const body = await request.json() as {
      id?: string;
      action?: string;
      availability?: string;
      alternativeDate?: string;
      alternativeTime?: string;
    };
    if (!body.id || !body.action) return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
    const { data: row, error: readError } = await valid.supabase.from("appointments").select("id,passport,payload,status").eq("id", body.id).eq("passport", targetPassport).maybeSingle();
    if (readError || !row) return NextResponse.json({ ok: false, error: "Consulta não encontrada." }, { status: 404 });
    const payload = { ...((row.payload || {}) as Record<string, unknown>), patientResponseAt: new Date().toISOString() } as Record<string, unknown>;
    let status = String(row.status || "");
    if (body.action === "accept_reschedule") {
      status = "Reagendamento aceito";
      payload.patientResponse = "Aceitou a data e o horário sugeridos pelo médico";
      payload.preferredDate = payload.proposedDate;
      payload.date = payload.proposedDate;
      payload.time = payload.proposedTime;
    }
    else if (body.action === "propose_alternative") {
      const alternativeDate = String(body.alternativeDate || "").trim();
      const alternativeTime = String(body.alternativeTime || "").trim();
      if (!alternativeDate || !alternativeTime) {
        return NextResponse.json({ ok: false, error: "Informe a nova data e o novo horário de preferência." }, { status: 400 });
      }
      status = "Nova proposta do paciente";
      payload.patientAlternativeDate = alternativeDate;
      payload.patientAlternativeTime = alternativeTime;
      payload.patientAvailability = String(body.availability || "").trim();
      payload.patientResponse = "Preferiu sugerir outra data e horário";
    }
    else if (body.action === "decline_reschedule") {
      status = "Reagendamento recusado";
      payload.patientResponse = "Recusou a sugestão de reagendamento";
    }
    else if (body.action === "send_availability") {
      status = "Disponibilidade informada";
      payload.patientAvailability = String(body.availability || "").trim();
      payload.patientResponse = "Informou disponibilidade para novo agendamento";
    }
    else if (body.action === "withdraw") {
      status = "Desistência solicitada";
      payload.patientResponse = "Desistiu do acompanhamento";
      payload.withdrawalReason = String(body.availability || "").trim();
    }
    else return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
    if (["accept_reschedule", "propose_alternative", "decline_reschedule", "send_availability", "withdraw"].includes(body.action) && String(row.status) !== "Reagendamento solicitado") {
      return NextResponse.json({ ok: false, error: "Esta solicitação de reagendamento já foi respondida ou não está mais disponível." }, { status: 409 });
    }
    payload.status = status;
    const updatedAt = new Date().toISOString();
    const { data: updated, error } = await valid.supabase.from("appointments").update({ status, payload, updated_at: updatedAt }).eq("id", body.id).eq("passport", targetPassport).select("id,status").maybeSingle();
    if (!error && !updated) return NextResponse.json({ ok: false, error: "O banco não confirmou a resposta da consulta." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[patient-portal] appointment action", error);
    return NextResponse.json({ ok: false, error: "Não foi possível atualizar a consulta." }, { status: 500 });
  }
}
