import type { AdaptiveResolvedExam } from "./adaptive-engine";

const key = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const text = (s: unknown) => String(s ?? "").replace(/<[^>]*>/g, "").trim();
export function hasManualFindings(resolved: AdaptiveResolvedExam) {
  return resolved.parameters.some(parameter => text(resolved.variables[parameter.id]) !== "");
}

/** Context changes the question being answered, never manufactures an abnormal
 * observation from symptoms alone. Only active inputs participate in generation. */
export function inputContextInterpretation(resolved: AdaptiveResolvedExam, rows: string[][]): string {
  const context = text(resolved.variables.contexto_clinico);
  const purpose = text(resolved.clinicalContext);
  const parts: string[] = [];
  const active = resolved.dynamicFields.filter(field => field.source === "variable"
    && !resolved.parameters.some(parameter => parameter.id === field.id)
    && field.id !== "contexto_clinico" && text(field.value) !== "");
  const details = active.map(field => `${field.label}: ${typeof field.value === "boolean" ? (field.value ? "sim" : "não") : text(field.value)}`);
  if (context || (purpose && !/^(rotina|personalizado)$/i.test(purpose))) {
    parts.push(`A avaliação considera ${context ? `o contexto informado: ${context}` : `a finalidade de ${purpose}`}.`);
    const semantic = key(`${context} ${purpose}`);
    if (/dor|trauma/.test(semantic)) parts.push("Os achados descritos devem ser relacionados à localização, ao início e à evolução dos sintomas; a ausência de alterações neste exame não exclui causas fora do alcance do método.");
    else if (/controle|acompanh|seguimento|tratamento/.test(semantic)) parts.push("A avaliação da evolução depende da comparação com os exames anteriores e com a etapa do tratamento; um resultado isolado não demonstra melhora ou piora.");
    else if (/rastre|rotina|prevent/.test(semantic)) parts.push("Neste contexto de rastreamento, o exame avalia os parâmetros descritos; resultado sem alterações não exclui condições que não sejam detectadas pelo método.");
    else parts.push("Os resultados respondem aos parâmetros avaliados neste exame; a hipótese ou queixa informada não confirma, por si só, um diagnóstico nem substitui os achados observados.");
  }
  if (details.length) parts.push(`Para interpretar esta avaliação foram considerados ${details.join("; ")}.`);
  const vars = resolved.variables;
  if (vars.dia_estimulacao !== undefined || vars.dia_preparo_endometrial !== undefined) {
    parts.push("O dia do protocolo situa o momento da coleta ou avaliação. A resposta ao tratamento depende dos achados medidos e da comparação seriada, sem assumir maturação ou adequação para o procedimento apenas pela passagem dos dias.");
  }
  if (text(vars.idade_gestacional)) parts.push("A idade gestacional informada orienta a leitura do desenvolvimento; a adequação depende das medidas e referências específicas para essa etapa, sem redatar a gestação apenas pelo perfil selecionado.");
  if (Number(vars.numero_fetos) > 1) parts.push("Na gestação múltipla, os achados devem identificar cada feto; um único conjunto de medidas não comprova avaliação individual de todos os fetos.");
  if (vars.fiv === true || /sim/i.test(text(vars.fiv))) parts.push("Na gestação por FIV, a cronologia deve considerar o procedimento informado e sua documentação.");
  if (vars.risco === true || /sim/i.test(text(vars.risco))) parts.push("O risco informado exige correlação obstétrica individual; um exame isolado sem alterações não elimina o risco do acompanhamento.");
  if (resolved.model.id === "obst_cardiotocografia") {
    const observed = rows.filter(row => !/impress|conclus/i.test(key(row[0])) && row[1] !== "Não informado").map(row => `${row[0]}: ${row[1]}`);
    if (hasManualFindings(resolved) && observed.length) parts.push(`O traçado informado apresenta ${observed.join("; ")}. A classificação depende da leitura conjunta dessas características e do período registrado.`);
    if (/trabalho de parto/.test(key(purpose))) parts.push("Durante o trabalho de parto, a interpretação do traçado deve relacionar frequência basal, variabilidade e desacelerações à dinâmica das contrações e à evolução obstétrica; reatividade isolada não resume toda a avaliação intraparto.");
    else if (/movimentos/.test(key(purpose))) parts.push("Na queixa de redução de movimentos fetais, o traçado registra o período observado e não substitui a avaliação obstétrica da persistência da queixa.");
    else if (/anteparto/.test(key(purpose))) parts.push("Na vigilância anteparto, a reatividade deve considerar idade gestacional, duração e qualidade do registro; um período não reativo pode exigir observação complementar.");
  }
  return parts.join("\n");
}
