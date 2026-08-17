import { brazilIso } from "@/lib/brazil-datetime";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

function brazilDateFromTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeSpecialty(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const targetPassport = await resolvePortalPatientPassport(request, valid);
    if (!targetPassport) return NextResponse.json({ ok: false, error: "Acesso não autorizado para este paciente." }, { status: 403 });

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

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
        .gte("planned_date", today)
        .order("planned_date", { ascending: true })
        .limit(120),
    ]);

    const firstError = plansResult.error || occurrencesResult.error;
    if (firstError) throw firstError;

    const plans = plansResult.data || [];
    const occurrences = occurrencesResult.data || [];
    const linkedSlotIds = [...new Set(occurrences.map((item: any) => String(item.slot_id || "")).filter(Boolean))];
    const doctorIds = [...new Set((plans as any[]).map((item) => String(item.doctor_id || "")).filter(Boolean))];
    const lastPlannedDate = (occurrences as any[]).reduce((latest, item) => String(item.planned_date || "") > latest ? String(item.planned_date || "") : latest, today);

    let availableSlots: any[] = [];
    let linkedSlots: any[] = [];
    const slotQueries: Array<PromiseLike<any>> = [];
    if (doctorIds.length && occurrences.length) {
      slotQueries.push(valid.supabase
        .from("clinical_appointment_slots")
        .select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status,appointment_id")
        .in("doctor_id", doctorIds)
        .eq("status", "Disponível")
        .gte("starts_at", brazilIso())
        .lte("starts_at", `${lastPlannedDate}T23:59:59-03:00`)
        .order("starts_at", { ascending: true })
        .limit(150));
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
    if (doctorIds.length && occurrences.length) {
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

    const followups = (plans as any[]).map((plan) => {
      const futureOccurrences = occurrencesByPlan.get(String(plan.id)) || [];
      const next = futureOccurrences[0] || null;
      let scheduleState: "waiting" | "available" | "scheduled" = "waiting";
      let scheduledAt = "";
      let availableCount = 0;

      if (next?.slot_id) {
        const linked = linkedById.get(String(next.slot_id));
        if (linked?.starts_at) {
          scheduleState = "scheduled";
          scheduledAt = String(linked.starts_at);
        }
      }

      if (next && scheduleState !== "scheduled") {
        const planSpecialty = normalizeSpecialty(plan.specialty);
        const plannedDate = String(next.planned_date || "");
        const matches = (availableSlots as any[]).filter((slot) => {
          const sameDoctor = String(slot.doctor_id || "") === String(plan.doctor_id || "");
          const slotSpecialty = normalizeSpecialty(slot.specialty);
          const specialtyMatches = slotSpecialty === planSpecialty || slotSpecialty.includes(planSpecialty) || planSpecialty.includes(slotSpecialty);
          return sameDoctor && specialtyMatches && brazilDateFromTimestamp(String(slot.starts_at || "")) === plannedDate;
        });
        availableCount = matches.length;
        if (availableCount > 0) scheduleState = "available";
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
        nextOccurrence: next ? {
          id: String(next.id || ""),
          plannedDate: String(next.planned_date || ""),
          status: String(next.status || "Planejada"),
          scheduleState,
          scheduledAt,
          availableCount,
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
