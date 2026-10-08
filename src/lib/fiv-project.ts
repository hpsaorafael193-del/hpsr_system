import { normalizePlanningSteps, type PlanningStep } from "@/lib/obstetric-planning";
export type FivRole = "gestante" | "doadora";
export function fivStepsForPatient(steps: PlanningStep[], role: FivRole) {
  return steps.filter(step => (step.fiv_recipient || "gestante") === role).map((step, index) => ({ ...step, number: index + 1, fiv_order: step.number, fiv_recipient: role }));
}
export function mergeFivProjectSteps(plans: Array<{ fiv_role?: FivRole | null; consultation_schedule: PlanningStep[] | null }>) {
  return normalizePlanningSteps("in_vitro", plans.flatMap(plan => (plan.consultation_schedule || []).map(step => ({ ...step, fiv_recipient: plan.fiv_role || "gestante" }))).sort((a,b) => (a.fiv_order || a.number) - (b.fiv_order || b.number)));
}
export function validateFivParticipants(gestante: string, doadora: string, steps: PlanningStep[]) {
  if (doadora && gestante === doadora) return "A gestante e a doadora devem ser pacientes diferentes.";
  if (steps.some(step => step.fiv_recipient === "doadora") && !doadora) return "Selecione a doadora ou destine suas etapas à gestante.";
  if (!fivStepsForPatient(steps,"gestante").length) return "Defina pelo menos uma etapa para a gestante.";
  if (doadora && !fivStepsForPatient(steps,"doadora").length) return "Defina pelo menos uma etapa para a doadora selecionada.";
  return "";
}
