import type { PlanningKind, PlanningStep } from "@/lib/obstetric-planning";
export function mergeIndividualIntoDraft(kind: PlanningKind, steps: PlanningStep[], number: number, text: string, stepId?: string | null, role: "gestante" | "doadora" = "gestante") {
  return steps.flatMap(step => {
    const match = kind === "in_vitro" && stepId ? step.fiv_step_id === stepId : step.number === number;
    if (!match) return [step];
    const changed = { ...step, planned_text: text, description: text };
    if (kind !== "in_vitro") return [changed];
    if (step.fiv_recipient === "ambas") return [{ ...changed, fiv_recipient: role }, { ...step, fiv_recipient: role === "gestante" ? "doadora" as const : "gestante" as const }];
    return [step.fiv_recipient === role ? changed : step];
  });
}
export function individualDraftKey(doctor: string, occurrence: string) { return `hpsr-individual-draft-v1:${doctor}:${occurrence}`; }
export function parseIndividualDraft(raw: string | null) {
  try {
    const value = JSON.parse(raw || "null");
    if (!value || typeof value.version !== "string" || typeof value.baseline !== "string" || !value.form) return null;
    const keys = ["planned", "evolution", "observation", "exams", "explanation", "patientObservations", "privateDraft"];
    if (keys.some(key => typeof value.form[key] !== "string")) return null;
    return { version: value.version, baseline: value.baseline, form: Object.fromEntries(keys.map(key => [key, value.form[key]])) as Record<string, string> };
  } catch { return null; }
}

/** Reabre cada campo onde foi salvo; não mistura resultados/observações com evolução. */
export function individualEditorFields(occurrence: {
  planned_text?: string | null; evolution_text?: string | null; medical_observation_text?: string | null;
  followup_report?: { exams_performed?: string; exam_explanation?: string; patient_observations?: string; private_draft?: string } | null;
}) {
  return {
    planned: occurrence.planned_text || "",
    evolution: occurrence.evolution_text || "",
    observation: occurrence.medical_observation_text || "",
    exams: occurrence.followup_report?.exams_performed || "",
    explanation: occurrence.followup_report?.exam_explanation || "",
    patientObservations: occurrence.followup_report?.patient_observations || "",
    privateDraft: occurrence.followup_report?.private_draft || "",
  };
}
