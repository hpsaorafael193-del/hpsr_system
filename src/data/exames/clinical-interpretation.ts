import type { AdaptiveResolvedExam } from "./adaptive-engine";
import { clearReportLanguage, uniqueReportParagraphs } from "./report-language";

const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const plain = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Presentation only: quote the current resolved rows, never cached sample values.
 * Explain findings and limits without generating diagnoses from profile labels. */
export function developClinicalInterpretation(resolved: AdaptiveResolvedExam, rows: string[][], base: string, focusRows: string[][] = rows): string {
  if (resolved.profile.status === "personalizado" || resolved.profile.id === "personalizado") return base;
  const id = resolved.model.id;
  const find = (pattern: RegExp) => rows.find(row => pattern.test(normalized(row[0] || "")));
  const value = (pattern: RegExp) => plain(find(pattern)?.[1] || "");
  const observed = (patterns: RegExp[]) => patterns.map(pattern => find(pattern)).filter((row): row is string[] => Boolean(row && row[1]));
  const describeRow = (row: string[]) => {
    const label = plain(row[0]), result = plain(row[1]).replace(/[.;]+$/, ""), reference = plain(row[2] || "");
    const range = [...reference.matchAll(/(-?\d[\d.,]*)\s*[–—-]\s*(-?\d[\d.,]*)/g)];
    const first = result.match(/^(-?\d[\d.,]*)(.*)$/);
    const referenceNumbers = reference.match(/-?\d[\d.,]*/g) || [];
    const number = (value: string) => Number(value.replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
    // Only one unambiguous interval; examples, multiple physiologic ranges and
    // compound measurements must not be turned into an automatic judgement.
    if (first && !/\d/.test(first[2]) && range.length === 1 && referenceNumbers.length === 2
        && !/ex:|fase|folicular|lutea|gesta|menopausa|homens|mulheres/i.test(normalized(reference))) {
      const value = number(first[1]), lower = number(range[0][1]), upper = number(range[0][2]);
      if (Number.isFinite(value) && lower <= upper) {
        const meaning = value < lower ? "abaixo" : value > upper ? "acima" : "dentro";
        return `${label}: ${result}, ${meaning} da faixa de referência informada`;
      }
    }
    return `${label}: ${result}`;
  };
  const describe = (items: string[][], maximum = 3) => items.slice(0, maximum).map(describeRow).join("; ");
  const out: string[] = [];

  if (id === "lab_hemograma_completo") {
    const red = observed([/^hemoglobina/, /^hematocrito/, /^vcm|volume corpuscular medio/]);
    const defenses = observed([/^leucocitos|leucocitos totais/, /^neutrofilos/, /^plaquetas/]);
    if (red.length) out.push(`Na série vermelha, o exame registra ${describe(red)}. A leitura conjunta desses indicadores ajuda a avaliar a quantidade e o tamanho das hemácias, diferenciando mudanças no transporte de oxigênio de variações no volume das células.`);
    if (defenses.length) out.push(`Na avaliação das células de defesa e da coagulação, foram registrados ${describe(defenses)}. A contagem total de leucócitos deve ser lida junto à distribuição dos seus tipos; um número isolado não define a causa de uma possível alteração. As plaquetas complementam a avaliação da formação do coágulo, sem medir sozinhas toda a função de coagulação.`);
    out.push(base);
  } else if (id === "hormonal_painel_hormonal_completo") {
    const reproductive = observed([/^fsh$/, /^lh$/, /estradiol/]);
    if (reproductive.length) out.push(`O eixo reprodutivo apresenta ${describe(reproductive)}. Esses hormônios atuam em conjunto no desenvolvimento dos folículos; por isso, a relação entre eles é mais informativa do que considerar cada medida separadamente.`);
    const other = observed([/^progesterona/, /^prolactina/, /^tsh$/]);
    if (other.length) out.push(`Os demais marcadores incluem ${describe(other)}. Progesterona, prolactina e função tireoidiana ajudam a contextualizar a atividade hormonal, mas uma coleta isolada não confirma ovulação nem determina, por si só, a chance de gestação.`);
    out.push(base);
  } else if (id === "lab_sorologia") {
    const screening = rows.filter(row => /hiv|sifilis|hbsag|anti.hcv/.test(normalized(row[0] || "")));
    const negative = screening.filter(row => /nao reagente|nao detectado|negativ/.test(normalized(row[1] || "")));
    const reactive = screening.filter(row => !negative.includes(row) && /reagente|detectad|positiv/.test(normalized(row[1] || "")));
    if (negative.length) out.push(`Os testes para ${negative.map(row => plain(row[0])).join(", ")} foram não reagentes na amostra analisada. Isso significa que os respectivos marcadores não foram identificados pelo método nessa coleta; exposições recentes podem exigir consideração da janela de detecção.`);
    if (reactive.length) out.push(`Há resultado reagente em ${describe(reactive)}. A interpretação depende do marcador pesquisado e da etapa de confirmação aplicável; reatividade em um teste de rastreamento não deve ser tomada, isoladamente, como diagnóstico definitivo.`);
    for (const [label, match] of [["toxoplasmose", /toxoplasmose/], ["rubéola", /rubeola/], ["citomegalovírus", /citomegalovirus/]] as Array<[string, RegExp]>) {
      const group = rows.filter(row => match.test(normalized(row[0] || "")));
      const g = group.find(row => /igg/.test(normalized(row[0])));
      const m = group.find(row => /igm/.test(normalized(row[0])));
      if (!g || !m) continue;
      const nonreactive = (text: string) => /nao reagente|nao detectad|negativ/.test(normalized(text));
      const positive = (text: string) => !nonreactive(text) && /reagente|positiv/.test(normalized(text));
      if (positive(g[1]) && nonreactive(m[1])) out.push(label === "rubéola"
        ? "Para rubéola, IgG reagente com IgM não reagente é compatível com imunidade sorológica, sem resposta IgM detectável nesta amostra. O IgG isolado não diferencia vacinação de infecção anterior."
        : `Para ${label}, IgG reagente com IgM não reagente indica contato prévio, sem marcador IgM detectável nesta coleta; esse padrão não permite datar com precisão a exposição.`);
      else if (nonreactive(g[1]) && nonreactive(m[1])) out.push(`Para ${label}, IgG e IgM não reagentes não demonstram anticorpos detectáveis nesta amostra. Esse resultado não equivale a comprovação de imunidade e deve ser considerado junto ao histórico de exposição.`);
      else if (positive(m[1])) out.push(`Para ${label}, a reatividade de IgM precisa ser avaliada junto ao IgG, à evolução e aos testes complementares pertinentes. IgM isolado não estabelece a data da infecção.`);
    }
    if (out.length) return uniqueReportParagraphs(clearReportLanguage(out.join("\n")));
  } else if (id === "gineco_usg_monitorizacao_folicular") {
    const dominant = value(/foliculo dominante/);
    const endometrium = value(/^endometrio|espessura endometrial/);
    const ovulation = value(/sinais.*ovulacao|ruptura folicular/);
    const focus = String(resolved.variables.foco_monitorizacao ?? resolved.variables.papel_no_protocolo ?? "");
    const day = String(resolved.variables[/endometr/i.test(focus) ? "dia_preparo_endometrial" : "dia_estimulacao"] ?? "").trim();
    if (resolved.profile.status === "normal" && /^0+(?:[.,]0+)?$/.test(day)) {
      const findings = observed([/foliculos.*direito|foliculos.*od/, /foliculos.*esquerdo|foliculos.*oe/, /^espessura endometrial/]);
      if (findings.length) out.push(`Nesta avaliação inicial foram registrados ${describe(findings)}. Esses valores documentam o ponto de partida do acompanhamento e não demonstram, por si só, efeito de medicação ou prontidão para a etapa seguinte.`);
      out.push(base);
      return uniqueReportParagraphs(clearReportLanguage(out.filter(Boolean).join("\n")));
    }
    if (dominant) out.push(`A avaliação registra ${dominant.replace(/[.]+$/, "")}. A presença de um folículo dominante caracteriza o desenvolvimento folicular observado, mas sua dimensão isolada não confirma liberação do óvulo nem define, sozinha, o momento de uma intervenção.`);
    if (endometrium) out.push(`Quanto ao endométrio, o exame descreve ${endometrium.replace(/[.]+$/, "")}. Espessura e padrão endometrial devem ser analisados em conjunto com a evolução dos folículos ou com o preparo endometrial, conforme o objetivo informado do acompanhamento.`);
    if (ovulation) out.push(`Sobre ovulação, o achado registrado é: ${ovulation.replace(/[.]+$/, "")}. A comparação com imagens anteriores e posteriores ajuda a distinguir crescimento folicular de mudanças após a ruptura; a ausência de um sinal em uma única avaliação não resume toda a evolução do ciclo.`);
    out.push(base);
  }

  if (out.length) return uniqueReportParagraphs(clearReportLanguage(out.filter(Boolean).join("\n")));

  // A short evidence paragraph anchors every other explanation to actual rows.
  const usable = focusRows.filter(row => row[0] && row[1]
    && !/impressao|conclusao|interpretacao|finalidade|fase do ciclo|idade|passaporte/.test(normalized(row[0]))
    && !/^(?:a definir|nao informado|a informar|personalizado|-)$/i.test(plain(row[1])));
  const selected = usable.slice(0, 3);
  if (selected.length) {
    const findings = selected.map(row => {
      const content = plain(row[1]);
      // Do not turn a long imaging finding into a second copy of the entire table.
      return content.length > 220 ? `${plain(row[0])}: ${content.slice(0, 217).replace(/\s+\S*$/, "")}…` : describeRow(row);
    }).join("; ");
    out.push(`Na avaliação de ${resolved.model.nome}, os achados incluem ${findings}. A leitura considera a combinação desses resultados, preservando as diferenças entre as estruturas ou os marcadores avaliados.`);
  }
  out.push(base);
  if (/^img_/.test(id)) out.push("A localização e a extensão descritas nas imagens ajudam a relacionar os achados à região examinada. A avaliação se limita às estruturas visíveis e às condições técnicas registradas; alterações funcionais podem não aparecer nesse método.");
  else if (/^obst_/.test(id)) out.push("Os achados representam o momento do exame. A comparação entre as medidas e avaliações anteriores ajuda a acompanhar a evolução, sem transformar uma observação isolada em previsão de toda a gestação.");
  else if (/^neuro_|^func_potenciais/.test(id)) out.push("O registro descreve as respostas obtidas durante o exame. A distribuição e a qualidade dessas respostas ajudam a interpretar sua relevância; episódios fora do período observado podem não ser documentados.");
  else if (/^cardio_/.test(id)) out.push("A relação entre as medidas e o período registrado ajuda a avaliar a repercussão dos achados. Um resultado observado em repouso ou durante um intervalo específico não representa necessariamente todas as situações do dia a dia.");
  else if (id === "geral_exame_toxicologico") out.push("A detecção se refere às substâncias pesquisadas, à amostra e aos limites do método. Um resultado não detectado não exclui exposição fora da janela de detecção; um resultado detectado não mede, sozinho, comprometimento funcional.");
  else if (id === "psiquiatria_psicotecnico") out.push("A interpretação reúne desempenho nas tarefas, observação durante a avaliação e achados físicos registrados. A aptidão se refere à finalidade avaliada e às condições observadas, sem prever de forma absoluta o comportamento em situações futuras.");
  else if (id === "genetico_sexagem_fetal") out.push("O resultado se refere aos marcadores presentes na amostra e à validade dos controles. A leitura deve respeitar as limitações descritas para gestação única ou gemelar, sem acrescentar uma identificação individual que o método não forneça.");
  else if (id === "lab_teste_dna") out.push("A interpretação combina a concordância dos marcadores com os critérios do método e os participantes informados. A conclusão deve permanecer vinculada à relação genética investigada, sem estender o resultado a vínculos que não foram analisados.");
  else if (selected.length) out.push("Resultados próximos aos limites de referência, discordantes entre si ou diferentes de exames anteriores podem ter significados distintos. A interpretação deve considerar essas relações e as condições registradas para a coleta ou avaliação, sem atribuir uma causa que os dados não demonstram.");
  return uniqueReportParagraphs(clearReportLanguage(out.filter(Boolean).join("\n")));
}
