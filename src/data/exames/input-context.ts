import type { AdaptiveResolvedExam } from "./adaptive-engine";

const key = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const text = (s: unknown) => String(s ?? "").replace(/<[^>]*>/g, "").trim();
export function hasManualFindings(resolved: AdaptiveResolvedExam) {
  return resolved.parameters.some(parameter => text(resolved.variables[parameter.id]) !== "");
}

/** Context changes the question being answered, never manufactures an abnormal
 * observation from symptoms alone. Only active inputs participate in generation. */
export function inputContextInterpretation(resolved: AdaptiveResolvedExam, _rows: string[][]): string {
  // Indication and protocol inputs are already documented in Method. Add only
  // an exam-specific interpretive consequence, not a second list of those inputs.
  const purpose = text(resolved.clinicalContext);
  const parts: string[] = [];
  if (resolved.model.id === "obst_cardiotocografia") {
    if (/trabalho de parto/.test(key(purpose))) parts.push("Durante o trabalho de parto, a interpretação do traçado deve relacionar frequência basal, variabilidade e desacelerações à dinâmica das contrações e à evolução obstétrica; reatividade isolada não resume toda a avaliação intraparto.");
    else if (/movimentos/.test(key(purpose))) parts.push("Na queixa de redução de movimentos fetais, o traçado registra o período observado e não substitui a avaliação obstétrica da persistência da queixa.");
    else if (/anteparto/.test(key(purpose))) parts.push("Na vigilância anteparto, a reatividade deve considerar idade gestacional, duração e qualidade do registro; um período não reativo pode exigir observação complementar.");
  }
  return parts.join("\n");
}
