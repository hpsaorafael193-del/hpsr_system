import { brazilDate, brazilIso } from "@/lib/brazil-datetime";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
import { normalizeClinicalSpecialty } from "@/lib/clinical-scheduling";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const MAX_AVAILABLE_SLOTS = 500;
const MAX_SLOTS_PER_LINK = 24;

function isFinalOccurrenceStatus(value: unknown) {
  const status = String(value || "").trim().toLocaleLowerCase("pt-BR");
  return ["consulta realizada", "realizada", "concluída", "concluido", "concluído", "cancelada", "cancelado", "não compareceu", "nao compareceu"].includes(status);
}

function specialtyMatches(left: unknown, right: unknown) {
  const leftTokens = String(left || "").split(/[,;/|]+/).map(normalizeClinicalSpecialty).filter(Boolean);
  const rightTokens = String(right || "").split(/[,;/|]+/).map(normalizeClinicalSpecialty).filter(Boolean);
  return leftTokens.some((leftToken) => rightTokens.some((rightToken) =>
    leftToken === rightToken || leftToken.includes(rightToken) || rightToken.includes(leftToken)
  ));
}

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });
    const targetPassport = await resolvePortalPatientPassport(request, valid);
    if (!targetPassport) return NextResponse.json({ ok: false, error: "Acesso não autorizado para este paciente." }, { status: 403 });

    const [plansResult, occurrencesResult, accessResult] = await Promise.all([
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
      valid.supabase
        .from("patient_portal_access")
        .select("schedule_assignments")
        .eq("patient_passport", targetPassport)
        .maybeSingle(),
    ]);

    const firstError = plansResult.error || occurrencesResult.error || accessResult.error;
    if (firstError) throw firstError;

    const plans = (plansResult.data || []) as any[];
    const occurrences = (occurrencesResult.data || []) as any[];
    const assignments = Array.isArray((accessResult.data as any)?.schedule_assignments)
      ? ((accessResult.data as any).schedule_assignments as any[])
      : [];

    type Link = {
      key: string;
      planId: string;
      linkType: "plan" | "assignment";
      doctorId: string;
      doctorName: string;
      specialty: string;
      frequency: string;
      status: string;
      startDate: string;
      endDate: string;
      totalConsultations: number;
    };

    const linksByKey = new Map<string, Link>();
    for (const assignment of assignments) {
      const doctorId = String(assignment?.doctor_id || "").trim();
      const specialty = String(assignment?.specialty || "").trim();
      if (!doctorId || !specialty) continue;
      const key = `${doctorId}|${normalizeClinicalSpecialty(specialty)}`;
      linksByKey.set(key, {
        key,
        planId: `link:${doctorId}:${normalizeClinicalSpecialty(specialty)}`,
        linkType: "assignment",
        doctorId,
        doctorName: String(assignment?.doctor_name || "Médico responsável"),
        specialty,
        frequency: "Vínculo de atendimento",
        status: "Vinculado",
        startDate: "",
        endDate: "",
        totalConsultations: 0,
      });
    }

    // Vínculos administrativos explícitos são a referência de roteamento da agenda.
    // Quando existem, planos formais apenas enriquecem a mesma combinação médico/especialidade;
    // planos de outro médico não voltam a aparecer por trás de uma associação corrigida pelo interno.
    for (const plan of plans) {
      const doctorId = String(plan.doctor_id || "");
      const specialty = String(plan.specialty || "");
      if (!doctorId || !specialty) continue;
      const key = `${doctorId}|${normalizeClinicalSpecialty(specialty)}`;
      if (assignments.length > 0 && !linksByKey.has(key)) continue;
      linksByKey.set(key, {
        key,
        planId: String(plan.id || ""),
        linkType: "plan",
        doctorId,
        doctorName: String(plan.doctor_name || "Médico responsável"),
        specialty,
        frequency: String(plan.frequency || ""),
        status: String(plan.status || "Ativo"),
        startDate: String(plan.start_date || ""),
        endDate: String(plan.end_date || ""),
        totalConsultations: Number(plan.total_consultations || 0),
      });
    }

    const links = [...linksByKey.values()];
    const doctorIds = [...new Set(links.map((link) => link.doctorId).filter(Boolean))];
    const linkedSlotIds = [...new Set(occurrences.map((item) => String(item.slot_id || "")).filter(Boolean))];
    const cutoffAt = `${brazilDate()}T23:59:59.999-03:00`;

    const slotQueries: Array<PromiseLike<any>> = [];
    if (doctorIds.length) {
      slotQueries.push(valid.supabase
        .from("clinical_appointment_slots")
        .select("id,doctor_id,doctor_name,specialty,starts_at,ends_at,status,appointment_id")
        .in("doctor_id", doctorIds)
        .eq("status", "Disponível")
        .gt("starts_at", cutoffAt)
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

    const slotResults = slotQueries.length ? await Promise.all(slotQueries) : [];
    let resultIndex = 0;
    let availableSlots: any[] = [];
    if (doctorIds.length) {
      const result = slotResults[resultIndex++];
      if (result.error) throw result.error;
      availableSlots = result.data || [];
    }
    let linkedSlots: any[] = [];
    if (linkedSlotIds.length) {
      const result = slotResults[resultIndex];
      if (result.error) throw result.error;
      linkedSlots = result.data || [];
    }

    const linkedById = new Map(linkedSlots.map((slot) => [String(slot.id), slot]));
    const occurrencesByPlan = new Map<string, any[]>();
    for (const occurrence of occurrences) {
      const key = String(occurrence.plan_id || "");
      const current = occurrencesByPlan.get(key) || [];
      current.push(occurrence);
      occurrencesByPlan.set(key, current);
    }

    const today = brazilDate();
    const followups = links.map((link) => {
      const planOccurrences = link.linkType === "plan" ? (occurrencesByPlan.get(link.planId) || []) : [];
      const scheduledOccurrence = planOccurrences
        .filter((occurrence) => occurrence.slot_id)
        .map((occurrence) => ({ occurrence, slot: linkedById.get(String(occurrence.slot_id)) as any }))
        .filter((item) => item.slot?.starts_at && new Date(String(item.slot.starts_at)).getTime() >= new Date(`${today}T00:00:00-03:00`).getTime())
        .sort((left, right) => String(left.slot.starts_at).localeCompare(String(right.slot.starts_at)))[0];

      const pendingOccurrence = link.linkType === "plan"
        ? (planOccurrences.find((occurrence) => !occurrence.slot_id && !occurrence.appointment_id && !isFinalOccurrenceStatus(occurrence.status))
          || planOccurrences.find((occurrence) => !occurrence.slot_id && !occurrence.appointment_id)
          || null)
        : { id: link.planId, planned_date: "", status: "Vinculado" };

      const matchingSlots = availableSlots.filter((slot) =>
        String(slot.doctor_id || "") === link.doctorId && specialtyMatches(slot.specialty, link.specialty)
      ).slice(0, MAX_SLOTS_PER_LINK);

      let scheduleState: "waiting" | "available" | "scheduled" = "waiting";
      let scheduledAt = "";
      let currentOccurrence = pendingOccurrence;
      if (scheduledOccurrence?.slot?.starts_at) {
        scheduleState = "scheduled";
        scheduledAt = String(scheduledOccurrence.slot.starts_at);
        currentOccurrence = scheduledOccurrence.occurrence;
      } else if (pendingOccurrence && matchingSlots.length > 0) {
        scheduleState = "available";
      }

      return {
        planId: link.planId,
        linkType: link.linkType,
        doctorId: link.doctorId,
        doctorName: link.doctorName,
        specialty: link.specialty,
        frequency: link.frequency,
        status: link.status,
        startDate: link.startDate,
        endDate: link.endDate,
        totalConsultations: link.totalConsultations,
        nextOccurrence: currentOccurrence ? {
          id: String(currentOccurrence.id || link.planId),
          plannedDate: String(currentOccurrence.planned_date || ""),
          status: String(currentOccurrence.status || "Vinculado"),
          scheduleState,
          scheduledAt,
          availableCount: scheduleState === "available" ? matchingSlots.length : 0,
          availableSlots: scheduleState === "available" ? matchingSlots.map((slot) => ({
            id: String(slot.id || ""),
            doctorId: String(slot.doctor_id || ""),
            doctorName: String(slot.doctor_name || link.doctorName || "Médico responsável"),
            specialty: String(slot.specialty || link.specialty || ""),
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
