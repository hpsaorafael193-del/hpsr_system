import { addBrazilDays, brazilDate, brazilIso } from "@/lib/brazil-datetime";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
import { normalizeClinicalSpecialty } from "@/lib/clinical-scheduling";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const MAX_AVAILABLE_SLOTS = 240;
const MAX_SLOTS_PER_FOLLOWUP = 24;

function isFinalOccurrenceStatus(value: unknown) {
  const status = String(value || "").trim().toLocaleLowerCase("pt-BR");
  return ["consulta realizada", "realizada", "concluída", "concluido", "concluído", "cancelada", "cancelado", "não compareceu", "nao compareceu"].includes(status);
}

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const targetPassport = await resolvePortalPatientPassport(request, valid);
    if (!targetPassport) return NextResponse.json({ ok: false, error: "Acesso não autorizado para este paciente." }, { status: 403 });

    const [plansResult, occurrencesResult] = await Promise.all([
      valid.supabase
        .from("clinical_followup_plans")
        .select("id,doctor_id,doctor_name,patient_name,patient_passport,specialty,frequency,start_date,end_date,total_consultations,status,created_at,updated_at")
        .eq("patient_passport", targetPassport)
        .neq("status", "Arquivado")
        .order("created_at", { ascending: false })
        .limit(50),
      valid.supabase
        .from("clinical_followup_occurrences")
        .select("id,plan_id,doctor_id,patient_passport,specialty,planned_date,status,slot_id,appointment_id,updated_at")
        .eq("patient_passport", targetPassport)
        .order("planned_date", { ascending: true })
        .limit(240),
    ]);

    const firstError = plansResult.error || occurrencesResult.error;
    if (firstError) throw firstError;

    const plans = plansResult.data || [];
    const occurrences = occurrencesResult.data || [];
    const linkedSlotIds = [...new Set(occurrences.map((item: any) => String(item.slot_id || "")).filter(Boolean))];
    const doctorIds = [...new Set((plans as any[]).map((item) => String(item.doctor_id || "")).filter(Boolean))];

    // Regra do HPSR: no próprio dia o paciente não pode mais pegar uma vaga daquele dia.
    // Portanto a agenda oferecida começa sempre no próximo dia civil de São Paulo.
    const tomorrow = addBrazilDays(1);
    const tomorrowStart = `${tomorrow}T00:00:00-03:00`;

    const slotQueries: Array<PromiseLike<any>> = [];
    if (doctorIds.length) {
      slotQueries.push(valid.supabase
        .from("clinical_appointment_slots")
        .select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status,appointment_id")
        .in("doctor_id", doctorIds)
        .eq("status", "Disponível")
        .gte("starts_at", tomorrowStart)
        .order("starts_at", { ascending: true })
        .limit(MAX_AVAILABLE_SLOTS));
    }
    if (linkedSlotIds.length) {
      slotQueries.push(valid.supabase
        .from("clinical_appointment_slots")
        .select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status,appointment_id")
        .in("id", linkedSlotIds)
        .limit(linkedSlotIds.length));
    }

    const slotResults = await Promise.all(slotQueries);
    let resultIndex = 0;
    let availableSlots: any[] = [];
    let linkedSlots: any[] = [];
    if (doctorIds.length) {
      const result = slotResults[resultIndex++];
      if (result.error) throw result.error;
      availableSlots = result.data || [];
    }
    if (linkedSlotIds.length) {
      const result = slotResults[resultIndex];
      if (result.error) throw result.error;
      linkedSlots = result.data || [];
    }

    const linkedById = new Map(linkedSlots.map((slot: any) => [String(slot.id), slot]));
    const occurrencesByPlan = new Map<string, any[]>();
    for (const occurrence of occurrences as any[]) {
      const key = String(occurrence.plan_id || "");
      const current = occurrencesByPlan.get(key) || [];
      current.push(occurrence);
      occurrencesByPlan.set(key, current);
    }

    const today = brazilDate();
    const followups = (plans as any[]).map((plan) => {
      const planOccurrences = occurrencesByPlan.get(String(plan.id)) || [];
      const scheduledOccurrence = planOccurrences
        .filter((occurrence) => occurrence.slot_id)
        .map((occurrence) => ({ occurrence, slot: linkedById.get(String(occurrence.slot_id)) }))
        .filter((item) => item.slot?.starts_at && new Date(String(item.slot.starts_at)).getTime() >= new Date(`${today}T00:00:00-03:00`).getTime())
        .sort((left, right) => String(left.slot.starts_at).localeCompare(String(right.slot.starts_at)))[0];

      // As datas planejadas são referência. A próxima ocorrência pendente pode ter uma
      // data de referência antiga; ela continua válida até ser vinculada a um atendimento.
      const pendingOccurrence = planOccurrences.find((occurrence) => !occurrence.slot_id && !occurrence.appointment_id && !isFinalOccurrenceStatus(occurrence.status))
        || planOccurrences.find((occurrence) => !occurrence.slot_id && !occurrence.appointment_id)
        || null;

      const planSpecialty = normalizeClinicalSpecialty(plan.specialty);
      const planSlots = (availableSlots as any[]).filter((slot) => {
        const sameDoctor = String(slot.doctor_id || "") === String(plan.doctor_id || "");
        const sameSpecialty = normalizeClinicalSpecialty(slot.specialty) === planSpecialty;
        return sameDoctor && sameSpecialty;
      }).slice(0, MAX_SLOTS_PER_FOLLOWUP);

      let scheduleState: "waiting" | "available" | "scheduled" = "waiting";
      let scheduledAt = "";
      let currentOccurrence = pendingOccurrence;
      if (scheduledOccurrence?.slot?.starts_at) {
        scheduleState = "scheduled";
        scheduledAt = String(scheduledOccurrence.slot.starts_at);
        currentOccurrence = scheduledOccurrence.occurrence;
      } else if (pendingOccurrence && planSlots.length > 0) {
        scheduleState = "available";
      }

      return {
        planId: String(plan.id || ""),
        doctorId: String(plan.doctor_id || ""),
        doctorName: String(plan.doctor_name || "Médico responsável"),
        specialty: String(plan.specialty || "Não informada"),
        frequency: String(plan.frequency || ""),
        status: String(plan.status || "Ativo"),
        startDate: String(plan.start_date || ""),
        endDate: String(plan.end_date || ""),
        totalConsultations: Number(plan.total_consultations || 0),
        nextOccurrence: currentOccurrence ? {
          id: String(currentOccurrence.id || ""),
          plannedDate: String(currentOccurrence.planned_date || ""),
          status: String(currentOccurrence.status || "Planejada"),
          scheduleState,
          scheduledAt,
          availableCount: scheduleState === "available" ? planSlots.length : 0,
          availableSlots: scheduleState === "available" ? planSlots.map((slot) => ({
            id: String(slot.id || ""),
            doctorId: String(slot.doctor_id || ""),
            doctorName: String(slot.doctor_name || plan.doctor_name || "Médico responsável"),
            specialty: String(slot.specialty || plan.specialty || ""),
            startsAt: String(slot.starts_at || ""),
            endsAt: String(slot.ends_at || ""),
          })) : [],
        } : null,
      };
    });

    const agendaAvailableCount = followups.filter((item) => item.nextOccurrence?.scheduleState === "available").length;
    const scheduledCount = followups.filter((item) => item.nextOccurrence?.scheduleState === "scheduled").length;

    return NextResponse.json({ ok: true, followups, agendaAvailableCount, scheduledCount, checkedAt: brazilIso() });
  } catch (error) {
    console.error("[patient-portal] followups", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar os acompanhamentos." }, { status: 500 });
  }
}
