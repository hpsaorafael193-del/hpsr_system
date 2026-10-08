import { isDateOnly, normalizePlanningSteps, planningKey, type PlanningKind, type PlanningStep } from "@/lib/obstetric-planning";

/** Rascunho temporário da aba Obstetra; nunca substitui o registro oficial no Supabase. */
export type ObstetricPlanningDraft = {
  version: 2;
  selectedPassport: string;
  donorPassport?: string;
  fivProjectId?: string;
  planType: PlanningKind;
  startDate: string;
  endDate: string;
  planningNotes: string;
  editingPlanId: string;
  confirmedKey: string;
  confirmedSteps: PlanningStep[];
};

export function obstetricDraftKey(doctorId: string) {
  return `hpsr-obstetric-planning-draft-v2:${doctorId}`;
}

function isDateOrEmpty(value: unknown): value is string {
  return typeof value === "string" && (!value || isDateOnly(value));
}

export function parseObstetricDraft(raw: string | null): ObstetricPlanningDraft | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const draft = value as Record<string, unknown>;
    if (draft.version !== 2 || (draft.planType !== "gestacional" && draft.planType !== "in_vitro")) return null;
    if (!isDateOrEmpty(draft.startDate) || !isDateOrEmpty(draft.endDate)) return null;
    if (typeof draft.selectedPassport !== "string" || typeof draft.planningNotes !== "string" || typeof draft.editingPlanId !== "string") return null;
    if (typeof draft.confirmedKey !== "string") return null;

    const planType = draft.planType as PlanningKind;
    const confirmedSteps = normalizePlanningSteps(planType, draft.confirmedSteps);
    const expectedKey = planningKey(planType, String(draft.startDate || ""), String(draft.endDate || ""));
    const keepConfirmed = draft.confirmedKey === expectedKey && confirmedSteps.length > 0;

    return {
      version: 2,
      selectedPassport: draft.selectedPassport.slice(0, 80),
      donorPassport: typeof draft.donorPassport === "string" ? draft.donorPassport.slice(0,80) : "",
      fivProjectId: typeof draft.fivProjectId === "string" && /^[0-9a-f-]{36}$/i.test(draft.fivProjectId) ? draft.fivProjectId : "",
      planType,
      startDate: draft.startDate,
      endDate: draft.endDate,
      planningNotes: draft.planningNotes.slice(0, 4000),
      editingPlanId: draft.editingPlanId.slice(0, 100),
      confirmedKey: keepConfirmed ? draft.confirmedKey : "",
      confirmedSteps: keepConfirmed ? confirmedSteps : [],
    };
  } catch {
    return null;
  }
}
