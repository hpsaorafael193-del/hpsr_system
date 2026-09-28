import type { PlanningKind, PlanningStep } from "@/lib/obstetric-planning";

/** Rascunho temporário da aba Obstetra; nunca substitui o registro oficial no Supabase. */
export type ObstetricPlanningDraft = {
  version: 1;
  selectedPassport: string;
  manualPatient: boolean;
  manualPatientData: { name: string; passport: string };
  planType: PlanningKind;
  startDate: string;
  endDate: string;
  planningNotes: string;
  editingPlanId: string;
  overriddenSteps: { key: string; steps: PlanningStep[] } | null;
};

export function obstetricDraftKey(doctorId: string) {
  return `hpsr-obstetric-planning-draft-v1:${doctorId}`;
}

function isDateOrEmpty(value: unknown): value is string {
  return typeof value === "string" && (!value || /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function parseObstetricDraft(raw: string | null): ObstetricPlanningDraft | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const draft = value as Record<string, unknown>;
    if (draft.version !== 1 || (draft.planType !== "gestacional" && draft.planType !== "in_vitro")) return null;
    if (!isDateOrEmpty(draft.startDate) || !isDateOrEmpty(draft.endDate)) return null;
    if (typeof draft.selectedPassport !== "string" || typeof draft.manualPatient !== "boolean" ||
        typeof draft.planningNotes !== "string" || typeof draft.editingPlanId !== "string") return null;
    if (!draft.manualPatientData || typeof draft.manualPatientData !== "object") return null;
    const manualData = draft.manualPatientData as Record<string, unknown>;
    if (typeof manualData.name !== "string" || typeof manualData.passport !== "string") return null;

    const calculationKey = `${draft.planType}:${draft.startDate}:${draft.endDate}`;
    let overriddenSteps: ObstetricPlanningDraft["overriddenSteps"] = null;
    if (draft.overriddenSteps && typeof draft.overriddenSteps === "object") {
      const override = draft.overriddenSteps as Record<string, unknown>;
      const expectedLength = draft.planType === "in_vitro" ? 5 : 9;
      if (override.key === calculationKey && Array.isArray(override.steps) && override.steps.length === expectedLength &&
          override.steps.every((step: unknown, index: number) => {
            if (!step || typeof step !== "object") return false;
            const item = step as Record<string, unknown>;
            return item.number === index + 1 && typeof item.week === "number" &&
              typeof item.title === "string" && typeof item.description === "string" &&
              isDateOrEmpty(item.date) && Boolean(item.date);
          })) {
        overriddenSteps = { key: calculationKey, steps: override.steps as PlanningStep[] };
      }
    }

    return {
      version: 1,
      selectedPassport: draft.selectedPassport.slice(0, 80),
      manualPatient: draft.manualPatient,
      manualPatientData: { name: manualData.name.slice(0, 200), passport: manualData.passport.slice(0, 80) },
      planType: draft.planType,
      startDate: draft.startDate,
      endDate: draft.endDate,
      planningNotes: draft.planningNotes.slice(0, 4000),
      editingPlanId: draft.editingPlanId.slice(0, 100),
      overriddenSteps,
    };
  } catch {
    return null;
  }
}