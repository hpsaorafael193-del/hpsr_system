/** Textos iniciais do RP, inspirados nos modelos oficiais enviados pelo hospital.
 * São sugestões EDITÁVEIS; não substituem o julgamento clínico do médico.
 * Nunca reaplicar sobre um planejamento já salvo ou personalizado.
 */
import type { PlanningKind } from "@/lib/obstetric-planning";

export const DEFAULT_GESTATIONAL_CONTENT = [
  "Confirmação da gestação, cálculo da data prevista para o parto e abertura da caderneta gestacional. Avaliação inicial e revisão dos exames e vacinas anteriores.",
  "Avaliação inicial do crescimento fetal e atualização vacinal. Revisar resultados da consulta anterior e exames de acompanhamento indicados pela médica.",
  "Avaliação anatômica fetal, batimentos cardíacos e condições uterinas. Considerar ultrassonografia morfológica e atualização da caderneta.",
  "Acompanhamento materno e avaliação de rastreamento para diabetes gestacional. Revisar exames anteriores e orientar os próximos cuidados.",
  "Avaliação do crescimento e movimentação fetal, resultados de exames e possível necessidade de suplementação, conforme avaliação médica.",
  "Avaliação do líquido amniótico e bem-estar fetal. Revisar resultados anteriores, exames solicitados e recomendações de acompanhamento.",
  "Planejamento do parto e orientações sobre sinais de alerta. Revisar exames de fim de gestação e condições para a internação.",
  "Definição da via de parto e preparo para internação. Conferência dos exames finais e das orientações à paciente.",
] as const;

export const DEFAULT_IVF_CONTENT = [
  "Avaliação inicial e início da preparação hormonal. Anamnese, ultrassonografia transvaginal basal e exames laboratoriais indicados. Definir o protocolo individual.",
  "Monitoramento da estimulação e do bloqueio ovulatório. Ultrassonografia para contagem e crescimento folicular e exames hormonais conforme o protocolo.",
  "Gatilho e punção folicular. Avaliação dos folículos, coleta dos óvulos, fertilização em laboratório e acompanhamento embrionário inicial.",
  "Preparo uterino e transferência embrionária, quando indicada. Avaliação do endométrio, orientações pós-procedimento e suporte conforme prescrição.",
  "Avaliação posterior e exame de sangue β-hCG. Registrar o resultado e orientar o acompanhamento, sem presumir resultado positivo.",
] as const;

export function defaultPlanningContent(kind: PlanningKind, index: number) {
  return (kind === "in_vitro" ? DEFAULT_IVF_CONTENT : DEFAULT_GESTATIONAL_CONTENT)[index] || "";
}
