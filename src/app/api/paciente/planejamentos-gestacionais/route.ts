import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const passport = await resolvePortalPatientPassport(request, valid);
    if (!passport) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });

    const { data, error } = await valid.supabase.from("clinical_followup_plans")
      .select("id,patient_name,doctor_name,start_date,end_date,planning_notes,consultation_schedule,total_consultations,portal_released_at,plan_type,planning_released_document_path,planning_released_snapshot,doctor_id,status")
      .eq("patient_passport", passport)
      .in("plan_type", ["gestacional", "in_vitro"])
      .in("specialty", ["Obstetra", "Ginecologia"])
      .neq("status", "Arquivado")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;

    const planIds = (data || []).map((plan) => plan.id);
    let releasedOccurrences: any[] = [];
    if (planIds.length) {
      const { data: occurrenceData, error: occurrenceError } = await valid.supabase.from("clinical_followup_occurrences")
        .select("id,plan_id,doctor_id,step_number,planned_date,rp_marker,step_title,individual_released_at,individual_released_document_path,individual_released_snapshot")
        .in("plan_id", planIds)
        .not("individual_released_at", "is", null)
        .order("step_number", { ascending: true });
      if (occurrenceError) throw occurrenceError;
      releasedOccurrences = occurrenceData || [];
    }

    const byPlan = new Map<string, any[]>();
    for (const occurrence of releasedOccurrences) {
      const list = byPlan.get(occurrence.plan_id) || [];
      list.push(occurrence);
      byPlan.set(occurrence.plan_id, list);
    }

    const plans = (data || []).map((plan) => {
      const occurrences = byPlan.get(plan.id) || [];
      const integralAvailable = Boolean(
        plan.portal_released_at &&
        plan.planning_released_document_path?.startsWith(`${plan.doctor_id}/${plan.id}/`)
      );
      const integralSnapshot = integralAvailable && plan.planning_released_snapshot && typeof plan.planning_released_snapshot === "object"
        ? plan.planning_released_snapshot
        : null;
      const individuals = occurrences.map((occurrence) => {
        const snapshot = occurrence.individual_released_snapshot && typeof occurrence.individual_released_snapshot === "object"
          ? occurrence.individual_released_snapshot
          : {};
        const documentAvailable = Boolean(occurrence.individual_released_document_path?.startsWith(`${plan.doctor_id}/${plan.id}/individual/${occurrence.id}/`));
        return {
          id: occurrence.id,
          step_number: occurrence.step_number,
          planned_date: occurrence.planned_date,
          marker: occurrence.rp_marker,
          title: occurrence.step_title,
          ...snapshot,
          png_url: documentAvailable ? `/api/paciente/planejamentos-gestacionais/individual?occurrenceId=${encodeURIComponent(occurrence.id)}&passport=${encodeURIComponent(passport)}` : null,
          released_at: occurrence.individual_released_at,
        };
      });
      return {
        id: plan.id,
        patient_name: plan.patient_name,
        doctor_name: plan.doctor_name,
        plan_type: plan.plan_type,
        ...(integralSnapshot || {
          start_date: null,
          end_date: null,
          planning_notes: null,
          consultation_schedule: null,
          total_consultations: null,
        }),
        portal_released_at: integralAvailable ? plan.portal_released_at : null,
        png_url: integralAvailable ? `/api/paciente/planejamentos-gestacionais/documento?planId=${encodeURIComponent(plan.id)}&passport=${encodeURIComponent(passport)}` : null,
        individuals,
      };
    }).filter((plan) => plan.png_url || plan.individuals.length);

    return NextResponse.json({ plans }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (caught) {
    console.error("[patient-portal] obstetric plans", caught);
    return NextResponse.json({ error: "Não foi possível carregar os planejamentos liberados." }, { status: 500 });
  }
}
