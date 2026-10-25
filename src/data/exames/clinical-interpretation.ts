import { hasManualFindings } from "./input-context";
import type { AdaptiveResolvedExam } from "./adaptive-engine";
import { clearReportLanguage, uniqueReportParagraphs } from "./report-language";

const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const plain = (value: string) => value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Presentation only: quote the current resolved rows, never cached sample values.
 * Explain findings and limits without generating diagnoses from profile labels. */
export function developClinicalInterpretation(resolved: AdaptiveResolvedExam, rows: string[][], base: string, focusRows: string[][] = rows): string {
  if (hasManualFindings(resolved) || resolved.profile.status === "personalizado" || resolved.profile.id === "personalizado") return base;
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
    if (observed([/^hemoglobina/, /^hematocrito/, /^vcm|volume corpuscular medio/]).length) out.push(resolved.profile.id === "anemia"
      ? "A redução de hemoglobina caracteriza menor capacidade de transporte de oxigênio pelo sangue. O VCM e os demais índices das hemácias ajudam a distinguir os padrões de anemia, sem definir sua causa apenas pela concentração de hemoglobina."
      : "A hemoglobina e o hematócrito refletem a capacidade de transporte de oxigênio; o VCM caracteriza o tamanho das hemácias e ajuda a distinguir os padrões de anemia.");
    if (observed([/^leucocitos|leucocitos totais/, /^plaquetas/]).length) out.push("A distribuição dos leucócitos caracteriza a resposta de defesa, enquanto a contagem de plaquetas avalia a disponibilidade dessas células para a formação do coágulo.");
  } else if (id === "hormonal_painel_hormonal_completo") {
    return uniqueReportParagraphs(clearReportLanguage(base));
  } else if (id === "lab_sorologia") {
    const screening = rows.filter(row => /hiv|sifilis|hbsag|anti.hcv/.test(normalized(row[0] || "")));
    const negative = screening.filter(row => /nao reagente|nao detectado|negativ/.test(normalized(row[1] || "")));
    const reactive = screening.filter(row => !negative.includes(row) && /reagente|detectad|positiv/.test(normalized(row[1] || "")));
    if (negative.length) out.push(`Os testes para ${negative.map(row => plain(row[0])).join(", ")} foram não reagentes na amostra analisada. Isso significa que os respectivos marcadores não foram identificados pelo método nessa coleta; exposições recentes podem exigir consideração da janela de detecção.`);
    if (reactive.length) out.push(`Há reatividade nos testes para ${reactive.map(row => plain(row[0])).join(", ")}. Reatividade no rastreamento requer confirmação específica antes de definir infecção ativa.`);
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
      else if (nonreactive(g[1]) && nonreactive(m[1])) out.push(`Para ${label}, IgG e IgM não reagentes não demonstram anticorpos detectáveis nesta amostra. Não há comprovação sorológica de imunidade.`);
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
      out.push(base);
      return uniqueReportParagraphs(clearReportLanguage(out.filter(Boolean).join("\n")));
    }
    if (dominant) out.push("O aspecto e o tamanho do folículo dominante caracterizam o desenvolvimento folicular observado; sua presença não confirma, por si só, liberação do óvulo.");
    if (endometrium) out.push("A espessura e o padrão do endométrio documentam sua resposta ao preparo ou às mudanças do ciclo.");
    if (ovulation) out.push(`Sinais de ovulação: ${ovulation.replace(/[.]+$/, "")}.`);
  }

  if (out.length) return uniqueReportParagraphs(clearReportLanguage(out.filter(Boolean).join("\n")));

  // Measurements belong to the table, not to an additional repeated paragraph.
  const narrative = uniqueReportParagraphs(clearReportLanguage(base));
  if (narrative) return narrative;
  const usable = focusRows.filter(row => row[0] && row[1]
    && !/impressao|conclusao|interpretacao|finalidade|fase do ciclo|idade|passaporte/.test(normalized(row[0]))
    && !/^(?:a definir|nao informado|a informar|personalizado|-)$/i.test(plain(row[1])));
  return usable.length ? `${describe(usable, 2)}.` : "";
}
