import type {
  IntelligentClinicalVariable,
  IntelligentExamModel,
  IntelligentExamParameter,
  IntelligentExamProfile,
} from "./types";

export type AdaptiveExamConfiguration = {
  examId: string;
  adapterValue: string;
  clinicalContext: string;
  profileId: string;
  variables: Record<string, string | boolean>;
};

export type AdaptiveDynamicField = IntelligentClinicalVariable & {
  source: "adapter" | "context" | "profile" | "variable";
  value: string | boolean;
};

export type AdaptiveResolvedExam = {
  model: IntelligentExamModel;
  adapterLabel: string;
  adapterValue: string;
  clinicalContext: string;
  profile: IntelligentExamProfile;
  dynamicFields: AdaptiveDynamicField[];
  parameters: IntelligentExamParameter[];
  automaticBlocks: string[];
  supportsFutureAttachments: boolean;
  supportsFutureSmartPagination: boolean;
  supportsFutureRenderEngine: boolean;
};

function firstOption(options?: string[]) {
  return options?.find(Boolean) || "";
}

export function createInitialAdaptiveConfiguration(model: IntelligentExamModel): AdaptiveExamConfiguration {
  const defaultProfile = model.profiles.find((profile) => profile.id === model.editorModel.defaultProfileId)
    || model.profiles.find((profile) => profile.id === "normal")
    || model.profiles[0];

  return {
    examId: model.id,
    adapterValue: model.adapter.enabled ? firstOption(model.adapter.options) : "",
    clinicalContext: firstOption(model.clinicalContexts),
    profileId: defaultProfile?.id || "",
    variables: {},
  };
}

function adapterVariableType(model: IntelligentExamModel): IntelligentClinicalVariable["tipo"] {
  if (model.adapter.kind === "none") return "text";
  return "select";
}

function adapterField(model: IntelligentExamModel, configuration: AdaptiveExamConfiguration): AdaptiveDynamicField | null {
  if (!model.adapter.enabled) return null;
  return {
    id: model.adapter.id || "adaptador_principal",
    label: model.adapter.label,
    tipo: adapterVariableType(model),
    required: true,
    options: model.adapter.options,
    value: configuration.adapterValue,
    source: "adapter",
  };
}

function contextField(model: IntelligentExamModel, configuration: AdaptiveExamConfiguration): AdaptiveDynamicField | null {
  if (!model.clinicalContexts?.length) return null;
  return {
    id: "contexto_clinico",
    label: "Contexto clínico",
    tipo: "select",
    required: false,
    options: model.clinicalContexts,
    value: configuration.clinicalContext,
    source: "context",
  };
}


function secondaryAdapterField(model: IntelligentExamModel, configuration: AdaptiveExamConfiguration): AdaptiveDynamicField | null {
  if (!model.adapter.enabled || !model.adapter.secondaryOptions?.length) return null;
  return {
    id: "contraste",
    label: "Contraste",
    tipo: "select",
    required: false,
    options: model.adapter.secondaryOptions,
    value: configuration.variables.contraste ?? firstOption(model.adapter.secondaryOptions),
    source: "adapter",
  };
}

function profileField(model: IntelligentExamModel, configuration: AdaptiveExamConfiguration): AdaptiveDynamicField | null {
  if (!model.profiles?.length) return null;
  return {
    id: "perfil_resultado",
    label: "Perfil de resultado",
    tipo: "select",
    required: true,
    options: model.profiles.map((profile) => profile.name),
    value: model.profiles.find((profile) => profile.id === configuration.profileId)?.name || "",
    source: "profile",
  };
}

function appliesToSelection(variable: IntelligentClinicalVariable, configuration: AdaptiveExamConfiguration) {
  if (!variable.appliesTo?.length) return true;
  const selected = [
    configuration.adapterValue,
    configuration.clinicalContext,
    configuration.profileId,
  ].map((value) => value.toLowerCase());
  return variable.appliesTo.some((item) => selected.includes(item.toLowerCase()));
}

function clinicalVariableFields(_model: IntelligentExamModel, _configuration: AdaptiveExamConfiguration): AdaptiveDynamicField[] {
  // Nesta etapa, as variáveis clínicas não são exibidas no painel.
  // Dados como idade/sexo vêm dos Dados do Paciente, e campos técnicos extras
  // serão reativados somente quando impactarem diretamente o modelo.
  return [];
}

export function resolveAdaptiveExam(model: IntelligentExamModel, configuration: AdaptiveExamConfiguration): AdaptiveResolvedExam {
  const safeConfiguration = configuration.examId === model.id ? configuration : createInitialAdaptiveConfiguration(model);
  const profile = model.profiles.find((item) => item.id === safeConfiguration.profileId)
    || model.profiles.find((item) => item.id === model.editorModel.defaultProfileId)
    || model.profiles[0];
  const dynamicFields = [
    adapterField(model, safeConfiguration),
    contextField(model, safeConfiguration),
    profileField(model, safeConfiguration),
    secondaryAdapterField(model, safeConfiguration),
    ...clinicalVariableFields(model, safeConfiguration),
  ].filter(Boolean) as AdaptiveDynamicField[];

  return {
    model,
    adapterLabel: model.adapter.label,
    adapterValue: safeConfiguration.adapterValue,
    clinicalContext: safeConfiguration.clinicalContext,
    profile,
    dynamicFields,
    parameters: model.parameters,
    automaticBlocks: model.editorModel.sections.filter((section) => section.visibleByDefault).map((section) => section.id),
    supportsFutureAttachments: model.attachments.mode === "future",
    supportsFutureSmartPagination: true,
    supportsFutureRenderEngine: true,
  };
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function withUnit(value: string, unit?: string | null) {
  const normalizedUnit = unit && unit !== "—" ? unit.trim() : "";
  const normalizedValue = value || "A preencher";
  if (!normalizedUnit) return normalizedValue;
  return normalizedValue.includes(normalizedUnit) ? normalizedValue : `${normalizedValue} ${normalizedUnit}`;
}

function parsePtNumber(value: string) {
  const clean = value.trim();
  if (!clean) return Number.NaN;
  if (clean.includes(",")) return Number(clean.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(?:\.\d{3})+$/.test(clean)) return Number(clean.replace(/\./g, ""));
  return Number(clean.replace(",", "."));
}

function extractReferenceNumbers(reference: string) {
  // Captura números em formatos comuns de laudos brasileiros:
  // - milhares: 4.000, 150.000
  // - decimais com vírgula: 4,0
  // - decimais com ponto em modelos legados: 4.0
  // A ordem do regex preserva milhares antes de decimais para não transformar 4.000 em 4.
  const matches = reference.match(/(?:\d{1,3}(?:\.\d{3})+|\d+(?:[,.]\d+)?)/g) || [];
  return matches.map(parsePtNumber).filter((value) => Number.isFinite(value));
}

function referenceUsesDecimal(reference: string, unit?: string | null) {
  if (/\d+,\d+/.test(reference)) return true;
  if (/milh/i.test(unit || "")) return true;
  if (/g\/dL|fL|pg/i.test(unit || "")) return true;
  return false;
}

function formatPtNumber(value: number, reference: string, unit?: string | null) {
  const rounded = referenceUsesDecimal(reference, unit)
    ? Number(value.toFixed(1))
    : Math.round(value);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: referenceUsesDecimal(reference, unit) ? 1 : 0,
    maximumFractionDigits: referenceUsesDecimal(reference, unit) ? 1 : 0,
  }).format(rounded);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomNormalResultFromReference(parameter: IntelligentExamParameter) {
  const reference = parameter.referencia || "";
  const numbers = extractReferenceNumbers(reference);

  if (/ausente/i.test(reference)) return "Ausente";
  if (/negativo/i.test(reference)) return "Negativo";
  if (/não\s+aplic[aá]vel/i.test(reference)) return "Não aplicável";
  if (/normal/i.test(reference)) return "Normal";

  if (numbers.length >= 2) {
    const lower = Math.min(numbers[0], numbers[1]);
    const upper = Math.max(numbers[0], numbers[1]);
    const margin = (upper - lower) * 0.18;
    const value = randomBetween(lower + margin, upper - margin);
    return formatPtNumber(value, reference, parameter.unidade);
  }

  if (/(<|≤|ate|até)/i.test(reference) && numbers.length >= 1) {
    const limit = numbers[0];
    const floor = limit > 10 ? limit * 0.18 : 0;
    const ceiling = limit * 0.75;
    return formatPtNumber(randomBetween(floor, Math.max(floor, ceiling)), reference, parameter.unidade);
  }

  if (/(>|≥)/.test(reference) && numbers.length >= 1) {
    const base = numbers[0];
    return formatPtNumber(base * randomBetween(1.05, 1.25), reference, parameter.unidade);
  }

  return "Dentro da referência";
}


function lowerText(...values: Array<string | undefined | null>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function varyNumericText(value: string, parameter: IntelligentExamParameter, variation = 0.06) {
  if (!/\d/.test(value)) return value;
  if (/^(positivo|negativo|ausente|presente|normal|alterado|limítrofe|indeterminado)$/i.test(value.trim())) return value;

  const match = value.match(/(?:\d{1,3}(?:\.\d{3})+|\d+(?:[,.]\d+)?)/);
  if (!match) return value;

  const original = match[0];
  const numeric = parsePtNumber(original);
  if (!Number.isFinite(numeric) || numeric <= 0) return value;

  const factor = randomBetween(1 - variation, 1 + variation);
  const varied = numeric * factor;
  const formatted = formatPtNumber(varied, parameter.referencia || original, parameter.unidade);
  return value.replace(original, formatted);
}

function formatResult(value: string, parameter: IntelligentExamParameter) {
  const varied = varyNumericText(value, parameter);
  return withUnit(varied, parameter.unidade);
}

function adaptiveExplicitResult(value: string, parameter: IntelligentExamParameter) {
  // Valores definidos pelo perfil servem como base clínica curada.
  // Cada atualização gera pequena variação coerente, mantendo o mesmo perfil.
  return varyNumericText(value, parameter, 0.08);
}

function alteredNumericFromReference(parameter: IntelligentExamParameter, profile: IntelligentExamProfile, directionHint?: "low" | "high") {
  const reference = parameter.referencia || "";
  const numbers = extractReferenceNumbers(reference);
  const semantic = lowerText(parameter.id, parameter.label, profile.id, profile.name, profile.description);
  let direction = directionHint;

  if (!direction) {
    if (hasAny(semantic, ["deficiencia", "deficiência", "anemia", "hipo", "baixo", "reduz", "leucopenia", "plaquetopenia", "insuficiencia", "insuficiência"])) direction = "low";
    if (hasAny(semantic, ["sobrecarga", "hiper", "alto", "elev", "leucocitose", "infec", "bacteriana", "colest", "hepatocelular", "inflama", "hiperglic", "positivo"])) direction = "high";
  }

  if (numbers.length >= 2) {
    const lower = Math.min(numbers[0], numbers[1]);
    const upper = Math.max(numbers[0], numbers[1]);
    const span = Math.max(upper - lower, Math.abs(upper) * 0.1, 1);
    const value = direction === "low"
      ? lower - span * randomBetween(0.12, 0.35)
      : upper + span * randomBetween(0.12, 0.45);
    return formatPtNumber(Math.max(0, value), reference, parameter.unidade);
  }

  if (/(<|≤|ate|até)/i.test(reference) && numbers.length >= 1) {
    const limit = numbers[0];
    return formatPtNumber(limit * randomBetween(1.15, 1.8), reference, parameter.unidade);
  }

  if (/(>|≥)/.test(reference) && numbers.length >= 1) {
    const base = numbers[0];
    return formatPtNumber(base * randomBetween(0.45, 0.9), reference, parameter.unidade);
  }

  return "Alterado";
}

function borderlineNumericFromReference(parameter: IntelligentExamParameter, profile: IntelligentExamProfile) {
  const reference = parameter.referencia || "";
  const numbers = extractReferenceNumbers(reference);
  const semantic = lowerText(parameter.id, parameter.label, profile.id, profile.name, profile.description);
  const preferLow = hasAny(semantic, ["baixo", "reduz", "deficiencia", "deficiência", "anemia", "hipo"]);

  if (numbers.length >= 2) {
    const lower = Math.min(numbers[0], numbers[1]);
    const upper = Math.max(numbers[0], numbers[1]);
    const span = Math.max(upper - lower, Math.abs(upper) * 0.1, 1);
    const value = preferLow
      ? lower - span * randomBetween(0.01, 0.05)
      : upper + span * randomBetween(0.01, 0.06);
    return formatPtNumber(Math.max(0, value), reference, parameter.unidade);
  }

  if (/(<|≤|ate|até)/i.test(reference) && numbers.length >= 1) {
    const limit = numbers[0];
    return formatPtNumber(limit * randomBetween(1.02, 1.1), reference, parameter.unidade);
  }

  if (/(>|≥)/.test(reference) && numbers.length >= 1) {
    const base = numbers[0];
    return formatPtNumber(base * randomBetween(0.9, 0.98), reference, parameter.unidade);
  }

  return "Limítrofe";
}

function qualitativeResultFromReference(parameter: IntelligentExamParameter, profile: IntelligentExamProfile) {
  const reference = lowerText(parameter.referencia, parameter.resultPlaceholder);
  const semantic = lowerText(parameter.id, parameter.label, profile.id, profile.name, profile.description);
  const isNormal = profile.status === "normal" || profile.id === "normal" || /negativo|normal/i.test(profile.name);
  const isBorderline = profile.status === "indefinido" || /lim|indef|inconclus/i.test(profile.id + profile.name);

  if (isNormal) {
    if (reference.includes("ausente")) return "Ausente";
    if (reference.includes("negativo")) return "Negativo";
    if (reference.includes("normal")) return "Normal";
    if (reference.includes("não aplicável")) return "Não aplicável";
  }

  if (isBorderline) {
    if (hasAny(reference, ["ausente", "negativo"])) return hasAny(semantic, ["prote", "glicose", "cetona"]) ? "Traços" : "Indeterminado";
    return "Limítrofe";
  }

  if (reference.includes("ausente")) return "Presente";
  if (reference.includes("negativo")) return "Positivo";
  if (reference.includes("normal")) return "Alterado";
  return null;
}

function laboratoryPatternResult(model: IntelligentExamModel, parameter: IntelligentExamParameter, profile: IntelligentExamProfile) {
  const text = lowerText(model.id, model.nome, parameter.id, parameter.label, profile.id, profile.name);
  const profileText = lowerText(profile.id, profile.name, profile.description);

  const qualitative = qualitativeResultFromReference(parameter, profile);
  if (qualitative) return formatResult(qualitative, parameter);

  if (model.id === "lab_urina_analise") {
    if (hasAny(profileText, ["itu", "infec"])) {
      if (text.includes("nitrito")) return "Positivo";
      if (text.includes("leucoc")) return formatResult("25", parameter);
      if (text.includes("bacter")) return "Presentes";
      if (text.includes("aspecto")) return "Turvo";
      if (text.includes("prote")) return "Traços";
    }
    if (profileText.includes("protein")) {
      if (text.includes("prote")) return "Presente";
      if (text.includes("cilind")) return "Hialinos";
    }
    if (profileText.includes("hemat")) {
      if (text.includes("hemac")) return formatResult("18", parameter);
      if (text.includes("cor")) return "Amarelo escuro";
    }
    if (profileText.includes("lit")) {
      if (text.includes("hemac")) return formatResult("12", parameter);
      if (text.includes("crist")) return "Presentes";
    }
  }


  if (model.id === "lab_feze_analise") {
    if (hasAny(profileText, ["inflamat", "infecc"])) {
      if (text.includes("muco")) return "Presente";
      if (text.includes("sangue") || text.includes("hemac")) return "Presente";
      if (text.includes("leucoc")) return "Presentes";
      if (text.includes("consist")) return "Pastosa";
    }
    if (profileText.includes("parasito")) {
      if (text.includes("parasita")) return "Presentes";
      if (text.includes("ovos") || text.includes("cistos")) return "Presentes";
    }
    if (profileText.includes("sangramento")) {
      if (text.includes("sangue") || text.includes("hemac")) return "Presente";
    }
  }

  if (model.id === "lab_urocultura") {
    if (hasAny(profileText, ["negativa", "normal"])) {
      if (text.includes("crescimento")) return "Negativo";
      if (text.includes("micro")) return "Não isolado";
      if (text.includes("colônias") || text.includes("colonias")) return "Sem crescimento significativo";
      if (text.includes("antibiograma") || text.includes("antibióticos") || text.includes("antibioticos")) return "Não aplicável";
    }
  }

  if (model.id === "lab_metabolismo_ferro") {
    if (hasAny(profileText, ["deficiencia", "deficiência"])) {
      if (text.includes("ferro_serico") || text.includes("ferro sérico")) return formatResult("32", parameter);
      if (text.includes("ferritina")) return formatResult("8", parameter);
      if (text.includes("tibc") || text.includes("capacidade")) return formatResult("480", parameter);
      if (text.includes("saturacao") || text.includes("saturação")) return formatResult("8", parameter);
    }
    if (hasAny(profileText, ["sobrecarga", "alto", "elevado"])) {
      if (text.includes("ferro_serico") || text.includes("ferro sérico")) return formatResult("210", parameter);
      if (text.includes("ferritina")) return formatResult("420", parameter);
      if (text.includes("tibc") || text.includes("capacidade")) return formatResult("235", parameter);
      if (text.includes("saturacao") || text.includes("saturação")) return formatResult("68", parameter);
    }
  }

  if (model.id === "lab_glicemia" || model.id === "pediatria_glicemia_capilar") {
    if (hasAny(profileText, ["hipoglic"])) return formatResult("58", parameter);
    if (hasAny(profileText, ["hiperglic", "alterado", "diabetes"])) return formatResult("148", parameter);
    if (hasAny(profileText, ["lim", "indef", "pré", "pre"])) return formatResult("108", parameter);
  }

  if (model.id === "lab_hba1c_completa") {
    if (hasAny(profileText, ["diabetes", "alterado", "elev"])) return formatResult("7,2", parameter);
    if (hasAny(profileText, ["pré", "pre", "lim", "indef"])) return formatResult("5,9", parameter);
  }

  if (model.id === "lab_funcao_renal_completa") {
    if (hasAny(profileText, ["renal", "azot", "alterado", "insuf"])) {
      if (text.includes("creatin")) return formatResult("1,8", parameter);
      if (text.includes("ureia") || text.includes("uréia")) return formatResult("68", parameter);
      if (text.includes("filtra") || text.includes("tfg")) return formatResult("48", parameter);
    }
  }

  if (model.id === "lab_funcao_hepatica_completa") {
    if (hasAny(profileText, ["hepatocelular", "misto", "alterado"])) {
      if (hasAny(text, ["tgo", "ast", "tgp", "alt"])) return formatResult("125", parameter);
    }
    if (hasAny(profileText, ["colest", "misto", "alterado"])) {
      if (hasAny(text, ["gama", "ggt", "fosfatase", "bilirrubina"])) return formatResult(alteredNumericFromReference(parameter, profile, "high"), parameter);
    }
  }

  if (model.id === "lab_eletrolitos_completos") {
    if (profileText.includes("hiponat")) return text.includes("sodio") || text.includes("na") ? formatResult("128", parameter) : formatResult(randomNormalResultFromReference(parameter), parameter);
    if (profileText.includes("hipernat")) return text.includes("sodio") || text.includes("na") ? formatResult("151", parameter) : formatResult(randomNormalResultFromReference(parameter), parameter);
    if (profileText.includes("hipocalem")) return text.includes("potass") || text.includes("k") ? formatResult("3,0", parameter) : formatResult(randomNormalResultFromReference(parameter), parameter);
    if (profileText.includes("hipercalem")) return text.includes("potass") || text.includes("k") ? formatResult("5,8", parameter) : formatResult(randomNormalResultFromReference(parameter), parameter);
    if (profileText.includes("hipocalc")) return text.includes("calcio") || text.includes("cálcio") ? formatResult("7,8", parameter) : formatResult(randomNormalResultFromReference(parameter), parameter);
    if (profileText.includes("hipomagnes")) return text.includes("magnes") ? formatResult("1,3", parameter) : formatResult(randomNormalResultFromReference(parameter), parameter);
  }

  if (profile.status === "normal" || profile.id === "normal") return formatResult(randomNormalResultFromReference(parameter), parameter);
  if (profile.status === "indefinido" || /lim|indef|inconclus/i.test(profile.id + profile.name)) return formatResult(borderlineNumericFromReference(parameter, profile), parameter);
  if (profile.status === "personalizado") return "A preencher";

  return formatResult(alteredNumericFromReference(parameter, profile), parameter);
}

function resultForParameter(model: IntelligentExamModel, parameter: IntelligentExamParameter, profile: IntelligentExamProfile) {
  const explicitResult = profile.results?.[parameter.id];

  if (explicitResult && profile.status !== "normal") return adaptiveExplicitResult(explicitResult, parameter);

  // Perfis normais continuam dinâmicos: ao atualizar achados, os valores numéricos
  // são recalculados dentro da faixa de referência, mantendo coerência com o perfil.
  if (profile.status === "normal" || profile.id === "normal") {
    return laboratoryPatternResult(model, parameter, profile);
  }

  if (explicitResult) return adaptiveExplicitResult(explicitResult, parameter);
  return laboratoryPatternResult(model, parameter, profile);
}

function tableHtml(headers: string[], rows: string[][]) {
  if (!rows.length) return "";
  return `<table><thead><tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${htmlEscape(cell || "-")}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function parameterRows(resolved: AdaptiveResolvedExam) {
  return resolved.parameters.map((parameter) => [
    parameter.label,
    resultForParameter(resolved.model, parameter, resolved.profile),
    parameter.referencia || "Conforme método / contexto clínico",
  ]);
}

function section(blockId: string, title: string, body: string) {
  if (!body.trim()) return "";
  return `<section data-hpsr-block="${htmlEscape(blockId)}" data-hpsr-auto-block="true"><h2>${htmlEscape(title)}</h2>${body}</section>`;
}

function paragraphs(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${htmlEscape(line)}</p>`)
    .join("");
}

export function renderAdaptiveExamReport(resolved: AdaptiveResolvedExam) {
  const { model, profile } = resolved;
  const rows = parameterRows(resolved);
  const isLaboratory = model.structure.standard === "laboratorio";
  const isImage = model.structure.standard === "imagem";
  const adapterText = resolved.adapterValue ? `<p><strong>${htmlEscape(model.adapter.label)}:</strong> ${htmlEscape(resolved.adapterValue)}</p>` : "";
  const contextText = resolved.clinicalContext ? `<p><strong>Contexto clínico:</strong> ${htmlEscape(resolved.clinicalContext)}</p>` : "";
  const contrastField = resolved.dynamicFields.find((field) => field.id === "contraste");
  const contrastText = contrastField?.value ? `<p><strong>Contraste:</strong> ${htmlEscape(String(contrastField.value))}</p>` : "";
  const technique = paragraphs([model.technique, model.method].filter(Boolean).join("\n"));
  const table = isLaboratory && rows.length ? tableHtml(["Parâmetro", "Resultado", "Valores de referência"], rows) : "";
  const measures = !isLaboratory && rows.length
    ? paragraphs(rows.map((row) => `${row[0]}: ${row[1]} (${row[2]})`).join("\n"))
    : "";

  if (isImage) {
    return [
      section("tecnica", "1. Técnica / Método", technique + adapterText + contrastText + contextText),
      section("achados", "2. Achados", paragraphs(profile.resultSummary || "Descrever achados objetivos do exame.")),
      section("medidas", "3. Medidas", measures),
      section("interpretacao", "4. Interpretação", paragraphs(profile.interpretation || model.interpretation.normal)),
      section("conclusao", "5. Conclusão", paragraphs(profile.conclusion || model.conclusion.normal)),
    ].join("");
  }

  return [
    section("tecnica", "1. Técnica / Método", technique + adapterText + contrastText + contextText),
    section(isLaboratory ? "resultados" : "achados", isLaboratory ? "2. Resultados" : "2. Achados ou Resultados", paragraphs(profile.resultSummary || "A preencher.")),
    section("tabelas", isLaboratory ? "3. Tabela Técnica" : "3. Tabelas Técnicas", table),
    section("interpretacao", "4. Interpretação", paragraphs(profile.interpretation || model.interpretation.normal)),
    section("conclusao", "5. Conclusão", paragraphs(profile.conclusion || model.conclusion.normal)),
  ].join("");
}

export function serializeAdaptiveConfiguration(configuration: AdaptiveExamConfiguration) {
  return JSON.stringify(configuration);
}
