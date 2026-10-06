/** Campos públicos do acompanhamento, extraídos SOMENTE do snapshot liberado.
 * Nunca repassar payload completo ou os campos internos do atendimento. */
export type ReleasedFollowup = {
  step_number: number;
  planned_date: string;
  marker: string;
  title: string;
  planned_text: string;
  evolution_text: string;
  conduct_text: string;
  exams_performed: string;
  exam_explanation: string;
  patient_observations: string;
};

const publicText = (value: unknown, length = 5000): string =>
  typeof value === "string" ? value.slice(0, length) : "";

export function publicIndividualSnapshot(raw: unknown): ReleasedFollowup {
  const snapshot = raw && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown> : {};
  return {
    step_number: typeof snapshot.step_number === "number" && Number.isInteger(snapshot.step_number)
      && snapshot.step_number > 0 ? snapshot.step_number : 0,
    planned_date: publicText(snapshot.planned_date, 32),
    marker: publicText(snapshot.marker, 150),
    title: publicText(snapshot.title, 150),
    planned_text: publicText(snapshot.planned_text),
    evolution_text: publicText(snapshot.evolution_text),
    conduct_text: publicText(snapshot.conduct_text),
    exams_performed: publicText(snapshot.exams_performed),
    exam_explanation: publicText(snapshot.exam_explanation),
    patient_observations: publicText(snapshot.patient_observations),
  };
}

export function releasedReportExists(item: Pick<ReleasedFollowup,
  "evolution_text" | "conduct_text" | "exams_performed" | "exam_explanation" | "patient_observations">): boolean {
  return Boolean([item.evolution_text, item.conduct_text, item.exams_performed,
    item.exam_explanation, item.patient_observations].some(value => value.trim()));
}

export type ReleasedIntegral = {
  start_date: string | null;
  end_date: string | null;
  planning_notes: string | null;
  consultation_schedule: Array<{
    number: number; title: string; marker: string; date: string;
    week: number; description: string; planned_text: string;
  }>;
  total_consultations: number | null;
};

export function publicIntegralSnapshot(raw: unknown): ReleasedIntegral | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const snapshot = raw as Record<string, unknown>;
  const schedule = Array.isArray(snapshot.consultation_schedule) ? snapshot.consultation_schedule : [];
  return {
    start_date: typeof snapshot.start_date === "string" ? publicText(snapshot.start_date, 32) : null,
    end_date: typeof snapshot.end_date === "string" ? publicText(snapshot.end_date, 32) : null,
    planning_notes: typeof snapshot.planning_notes === "string" ? publicText(snapshot.planning_notes) : null,
    consultation_schedule: schedule.slice(0, 30).filter(step => step && typeof step === "object" && !Array.isArray(step)).map((rawStep: Record<string, unknown>) => ({
      number: typeof rawStep.number === "number" ? rawStep.number : 0,
      title: publicText(rawStep.title, 150), marker: publicText(rawStep.marker, 150),
      date: publicText(rawStep.date, 32), week: typeof rawStep.week === "number" ? rawStep.week : 0,
      description: publicText(rawStep.description), planned_text: publicText(rawStep.planned_text),
    })),
    total_consultations: typeof snapshot.total_consultations === "number" ? snapshot.total_consultations : null,
  };
}
