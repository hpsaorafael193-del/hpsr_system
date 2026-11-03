import type { IntelligentExamModel, IntelligentExamProfile } from "./types";

const SUPPORTED = new Set(["obst_us_rotina_completo", "obst_us_3d", "obst_us_4d", "img_us_morfologica"]);
export function isGestationalUltrasound(model: Pick<IntelligentExamModel, "id">) {
  return SUPPORTED.has(model.id);
}

/** Only an explicitly supplied age drives suggestions; never redate saved exams. */
export function ultrasoundGestationalAge(model: Pick<IntelligentExamModel, "id">, variables: Record<string, string | boolean>) {
  if (!isGestationalUltrasound(model)) return null;
  const raw = String(variables.idade_gestacional ?? "").trim();
  const match = raw.match(/^(\d{1,2})(?:\s*(?:semanas?|s))?(?:\s*(?:e|\+)\s*([0-6])\s*(?:dias?|d))?$/i);
  if (!match) return null;
  const weeks = Number(match[1]);
  if (weeks < 1 || weeks > 45) return null;
  const days = match[2] ? Number(match[2]) : 0;
  const value = `${weeks}${days ? ` semanas e ${days} dias` : ""}`;
  return { weeks, value, text: `${weeks} semanas${days ? ` e ${days} dias` : ""}`, trimester: weeks < 14 ? "primeiro" : weeks < 28 ? "segundo" : "terceiro" };
}

export function contextualizeUltrasoundProfile(model: IntelligentExamModel, profile: IntelligentExamProfile, variables: Record<string, string | boolean>) {
  const age = ultrasoundGestationalAge(model, variables);
  if (!age || profile.status === "personalizado") return profile;
  let source = profile;
  // A dated contextual preset must not keep first-trimester anatomy at 32 weeks.
  // Preserve pathological and multiple-pregnancy profiles selected by the doctor.
  if (profile.id === "primeiro_trimestre" && age.weeks >= 14) {
    source = model.profiles.find(item => item.id === model.editorModel.defaultProfileId && item.id !== "primeiro_trimestre") || profile;
  } else if ((profile.id === model.editorModel.defaultProfileId || profile.id === "normal") && age.weeks < 14) {
    source = model.profiles.find(item => item.id === "primeiro_trimestre") || profile;
  }
  const adapt = (text: string) => text
    .replace(/\b\d{1,2}\s+semanas?(?:\s+e\s+[0-6]\s+dias?)?/gi, age.text)
    .replace(/\b(?:primeiro|segundo|terceiro) trimestre\b/gi, `${age.trimester} trimestre`)
    .replace(/\b[123][º°o]\s*trimestre\b/gi, `${age.trimester} trimestre`);
  return {
    ...source,
    results: Object.fromEntries(Object.entries(source.results || {}).map(([id, value]) => [id, id === "idade_gestacional" ? age.value : adapt(value)])),
    resultSummary: adapt(source.resultSummary),
    interpretation: `Idade gestacional informada: ${age.text} (${age.trimester} trimestre). ${adapt(source.interpretation)}`,
    conclusion: `${adapt(source.conclusion)} Idade gestacional informada: ${age.text}.`,
  };
}
