import { normalizePlanningSteps, type PlanningStep } from "@/lib/obstetric-planning";
export type FivRole = "gestante" | "doadora";
export type FivRecipient = FivRole | "ambas";
export function fivStepsForPatient(steps: PlanningStep[], role: FivRole) {
  return steps.filter(step => step.fiv_recipient === "ambas" || (step.fiv_recipient || "gestante") === role).map((step, index) => ({ ...step, number: index + 1, fiv_order: step.number, fiv_recipient: role }));
}
export function mergeFivProjectSteps(plans: Array<{ fiv_role?: FivRole | null; consultation_schedule: PlanningStep[] | null }>) {
  const result: PlanningStep[] = [];
  const source = plans.flatMap(plan => (plan.consultation_schedule || []).map(step => ({ ...step, fiv_recipient: plan.fiv_role || "gestante" })));
  for (const step of source) {
    const shared = step.fiv_step_id && result.find(other => other.fiv_step_id === step.fiv_step_id && other.fiv_recipient !== step.fiv_recipient && other.fiv_recipient !== "ambas" && other.date === step.date && other.title === step.title && other.marker === step.marker && other.week === step.week && other.planned_text === step.planned_text && other.description === step.description);
    if (shared) shared.fiv_recipient = "ambas";
    else result.push({ ...step });
  }
  // Conteúdos individuais divergentes permanecem separados, mesmo com o mesmo ID de origem.
  return normalizePlanningSteps("in_vitro", result.sort((a,b) => (a.fiv_order || a.number) - (b.fiv_order || b.number)));
}
export function validateFivParticipants(gestante: string, doadora: string, steps: PlanningStep[]) {
  if (doadora && gestante === doadora) return "A gestante e a doadora devem ser pacientes diferentes.";
  if (steps.some(step => step.fiv_recipient === "doadora" || step.fiv_recipient === "ambas") && !doadora) return "Selecione a doadora ou destine suas etapas à gestante.";
  if (!fivStepsForPatient(steps,"gestante").length) return "Defina pelo menos uma etapa para a gestante.";
  if (doadora && !fivStepsForPatient(steps,"doadora").length) return "A doadora ainda não tem etapas. Em Paciente da etapa, escolha Doadora ou Ambas, ou use Compartilhar etapas novas com ambas.";
  return "";
}
