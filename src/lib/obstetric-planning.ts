/** Datas de planejamento do RP: a data final é referência independente, não data calculada. */
export type PlanningKind = "gestacional" | "in_vitro";
export type PlanningStep = { number: number; title: string; description: string; week: number; date: string };
export const GESTATIONAL_WEEKS = [12, 16, 20, 24, 28, 32, 36, 38] as const;
export function addPlanningDays(value: string, count: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + count));
  return date.toISOString().slice(0, 10);
}
export function calculatePlanningSteps(kind: PlanningKind, initial: string, finalDate: string): PlanningStep[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(initial) || !/^\d{4}-\d{2}-\d{2}$/.test(finalDate) || finalDate < initial) return [];
  const regular = kind === "in_vitro"
    ? [0, 7, 14, 21].map((days, index) => ({ number: index + 1, title: `Consulta ${index + 1}`, description: "Conteúdo clínico conforme modelo oficial FIV.", week: index + 1, date: addPlanningDays(initial, days) }))
    : GESTATIONAL_WEEKS.map((week, index) => ({ number: index + 1, title: `Consulta ${index + 1}`, description: "Conteúdo clínico conforme modelo oficial gestacional.", week, date: addPlanningDays(initial, (week - 12) * 7) }));
  return [...regular, { number: regular.length + 1, title: kind === "in_vitro" ? "Entrega do resultado do Beta-hCG" : "Parto (previsão)", description: "Data de referência informada pela médica.", week: kind === "in_vitro" ? 5 : 40, date: finalDate }];
}
export function validatePlanningSteps(steps: PlanningStep[]) {
  if (!steps.length || steps.some((step) => !/^\d{4}-\d{2}-\d{2}$/.test(step.date))) return "Informe datas válidas para todas as etapas.";
  if (new Set(steps.slice(0, -1).map((step) => step.date)).size !== steps.length - 1) return "Há etapas na mesma data. Ajuste as datas para manter o registro individual das consultas.";
  return "";
}
