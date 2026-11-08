export type FollowupFormType = "gestational" | "ivf_ropa" | "pediatric";
export type IntakeQuestion = {
  key: string;
  label: string;
  type?: "text" | "date" | "textarea" | "yesno" | "single" | "multi";
  options?: string[];
  hint?: string;
  showIf?: [string, string];
};
export type IntakeSection = { title: string; questions: IntakeQuestion[] };

export const followupFormLabels: Record<FollowupFormType, string> = {
  gestational: "Acompanhamento obstétrico",
  ivf_ropa: "FIV (Método ROPA)",
  pediatric: "Acompanhamento pediátrico",
};

export const pediatricIntakeIntro = "Este formulário é utilizado fora do RP para organização do acompanhamento pediátrico da criança dentro da cidade. O objetivo é manter coerência, realismo e segurança, garantindo que as interações médicas sejam leves e adequadas para personagens infantis.";
export const pediatricCommitment = "Declaro que compreendo que o acompanhamento pediátrico tem como objetivo manter coerência, segurança e organização dentro da cidade, respeitando as orientações médicas e evitando situações de risco ou complicações graves envolvendo personagens infantis.";

const yesNoDetails = (key: string, label: string, details: string): IntakeQuestion[] => [
  { key, label, type: "yesno" },
  { key: key + "Details", label: details, type: "textarea", showIf: [key, "Sim"] },
];

export const pediatricIntakeSections: IntakeSection[] = [
  { title: "Informações do responsável", questions: [
    { key: "guardianName", label: "Nome do responsável" },
    { key: "guardianPassport", label: "Passaporte do responsável" },
    { key: "guardianContact", label: "Contato do responsável na cidade" },
    { key: "secondGuardianName", label: "Nome do segundo responsável (se houver)" },
    { key: "secondGuardianPassport", label: "Passaporte do segundo responsável" },
    { key: "secondGuardianContact", label: "Contato do segundo responsável na cidade" },
  ] },
  { title: "Informações da criança", questions: [
    { key: "childName", label: "Nome da criança" },
    { key: "childPassport", label: "Passaporte da criança" },
    { key: "childAge", label: "Idade atual no RP" },
    { key: "childBirthDate", label: "Data de nascimento", type: "date" },
    { key: "childLivesWith", label: "A criança vive com", type: "single", options: ["Ambos os responsáveis", "Apenas um responsável", "Outros familiares"] },
  ] },
  { title: "Histórico de nascimento", questions: [
    { key: "birthLocation", label: "Onde a criança nasceu?", type: "single", options: ["Na cidade", "Fora da cidade"] },
    { key: "deliveryType", label: "Como foi o parto?", type: "single", options: ["Normal", "Cesárea", "Não houve RP do parto"] },
    { key: "birthTerm", label: "A criança nasceu", type: "single", options: ["Prematura", "A termo"] },
    { key: "plannedPregnancy", label: "A gravidez foi", type: "single", options: ["Planejada", "Não planejada"] },
    ...yesNoDetails("birthComplication", "Houve alguma complicação no nascimento?", "Qual foi a complicação no nascimento?"),
  ] },
  { title: "Histórico médico da criança", questions: [
    ...yesNoDetails("medicalCondition", "A criança possui alguma condição médica?", "Qual condição médica?"),
    ...yesNoDetails("hospitalization", "Já foi internada alguma vez no RP?", "Qual foi a internação?"),
    ...yesNoDetails("allergies", "A criança possui alergias?", "Quais alergias?"),
    ...yesNoDetails("medication", "Faz uso de algum medicamento?", "Quais medicamentos?"),
  ] },
  { title: "Desenvolvimento da criança no RP", questions: [
    { key: "previousFollowup", label: "A criança já teve acompanhamento pediátrico antes?", type: "yesno" },
    { key: "behavior", label: "Como é o comportamento da criança?", type: "textarea", hint: "Ex.: agitada, tranquila, curiosa, tímida." },
    { key: "school", label: "A criança já frequenta", type: "single", options: ["Escola", "Ainda não"] },
    { key: "developmentGoals", label: "Existe algum ponto do desenvolvimento que vocês gostariam de trabalhar no RP?", type: "textarea", hint: "Ex.: dificuldade alimentar, sono, adaptação escolar, comportamento." },
    { key: "agingPace", label: "Qual será o ritmo de envelhecimento da criança dentro do RP?", hint: "Ex.: 1 ano a cada X meses de RP." },
  ] },
  { title: "Compromisso com o RP", questions: [
    { key: "commitment", label: pediatricCommitment, type: "single", options: ["Estou de acordo"] },
  ] },
  { title: "Observações adicionais", questions: [
    { key: "observations", label: "Informações adicionais sobre o RP da criança", type: "textarea", hint: "Espaço livre para acrescentar qualquer informação importante." },
  ] },
  { title: "Disponibilidade para consultas", questions: [
    { key: "availability", label: "Quais períodos funcionam para vocês?", type: "multi", options: ["Manhã", "Tarde", "Noite"] },
  ] },

];

export const pediatricIntakeQuestions = pediatricIntakeSections.flatMap(({ questions }) => questions);

export function sanitizePediatricIntakeAnswers(input: unknown, passport: string) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const result: Record<string, string | string[]> = {};
  for (const { key, showIf, type, options } of pediatricIntakeQuestions) {
    if (showIf && result[showIf[0]] !== showIf[1]) continue;
    if (key === "childPassport") {
      result[key] = passport;
      continue;
    }
    const value = source[key];
    const allowed = type === "yesno" ? ["Sim", "Não"] : options;
    if (type === "multi") {
      if (Array.isArray(value)) result[key] = (allowed || []).filter(option => value.includes(option));
    } else if (typeof value === "string" && value.trim() && (!allowed || allowed.includes(value))) {
      const trimmed = value.trim();
      if (type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || !Number.isFinite(Date.parse(trimmed)) || new Date(trimmed).toISOString().slice(0, 10) !== trimmed)) continue;
      result[key] = trimmed.slice(0, type === "textarea" ? 4000 : 300);
    }
  }
  return result;
}
