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
  generationSeed?: number;
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
  generationSeed: number;
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
    generationSeed: 0,
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
    generationSeed: Number(safeConfiguration.generationSeed || 0),
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
  if (!normalizedUnit || !/\d/.test(normalizedValue)) return normalizedValue;
  return normalizedValue.includes(normalizedUnit) ? normalizedValue : `${normalizedValue} ${normalizedUnit}`;
}

function parsePtNumber(value: string) {
  const clean = value.trim();
  if (!clean) return Number.NaN;
  if (clean.includes(",")) return Number(clean.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}\.\d{3}$/.test(clean)) {
    const [integerPart, decimalPart] = clean.split(".");
    // Em referências brasileiras, 4.000/150.000 representam milhares;
    // já 1.005/1.030 representam densidade e devem permanecer decimais.
    if (Number(integerPart) <= 2 && decimalPart !== "000") return Number(clean);
    return Number(clean.replace(/\./g, ""));
  }
  if (/^\d{1,3}(?:\.\d{3}){2,}$/.test(clean)) return Number(clean.replace(/\./g, ""));
  return Number(clean);
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

function referenceDecimalPlaces(reference: string, unit?: string | null) {
  const tokens = reference.match(/(?:\d{1,3}(?:\.\d{3})+|\d+(?:[,.]\d+)?)/g) || [];
  for (const token of tokens) {
    if (token.includes(",")) return token.split(",")[1]?.length || 0;
    if (token.includes(".")) {
      const parsed = parsePtNumber(token);
      const asThousands = /^\d{1,3}(?:\.\d{3})+$/.test(token) && parsed >= 1000;
      if (!asThousands) return token.split(".")[1]?.length || 0;
    }
  }
  if (/milh/i.test(unit || "") || /g\/dL|fL|pg/i.test(unit || "")) return 1;
  return 0;
}

function formatPtNumber(value: number, reference: string, unit?: string | null) {
  const decimals = referenceDecimalPlaces(reference, unit);
  const rounded = Number(value.toFixed(decimals));
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded);
}

function seedFraction(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function deterministicBetween(seed: string, min: number, max: number) {
  return min + seedFraction(seed) * (max - min);
}

function randomNormalResultFromReference(parameter: IntelligentExamParameter, seed = parameter.id) {
  const reference = parameter.referencia || "";
  const numbers = extractReferenceNumbers(reference);
  const parameterText = lowerText(parameter.id, parameter.label);

  if (hasAny(parameterText, ["saturação", "saturacao", "spo2", "sp o2"]) && /%|≥\s*9|>\s*9/.test(reference)) return "98";
  if (/ausente/i.test(reference)) return "Ausente";
  if (/negativo/i.test(reference)) return "Negativo";
  if (/não\s+aplic[aá]vel/i.test(reference)) return contextualQualitativeResult(parameter, { id: "normal", name: "Normal", description: "Padrão esperado", status: "normal", resultSummary: "", interpretation: "", conclusion: "" }, "normal");
  if (/normal/i.test(reference)) {
    return contextualQualitativeResult(parameter, {
      id: "normal",
      name: "Normal",
      description: "Padrão esperado",
      status: "normal",
      resultSummary: "",
      interpretation: "",
      conclusion: "",
    }, "normal");
  }

  if (numbers.length >= 2) {
    const lower = Math.min(numbers[0], numbers[1]);
    const upper = Math.max(numbers[0], numbers[1]);
    const margin = (upper - lower) * 0.18;
    const value = deterministicBetween(`${seed}:normal-range`, lower + margin, upper - margin);
    return formatPtNumber(value, reference, parameter.unidade);
  }

  if (/(<|≤|ate|até)/i.test(reference) && numbers.length >= 1) {
    const limit = numbers[0];
    const floor = limit > 10 ? limit * 0.18 : 0;
    const ceiling = limit * 0.75;
    return formatPtNumber(deterministicBetween(`${seed}:normal-upper`, floor, Math.max(floor, ceiling)), reference, parameter.unidade);
  }

  if (/(>|≥)/.test(reference) && numbers.length >= 1) {
    const base = numbers[0];
    return formatPtNumber(base * deterministicBetween(`${seed}:normal-lower`, 1.05, 1.25), reference, parameter.unidade);
  }

  return contextualQualitativeResult(parameter, {
    id: "normal",
    name: "Normal",
    description: "Padrão esperado",
    status: "normal",
    resultSummary: "",
    interpretation: "",
    conclusion: "",
  }, "normal");
}


function lowerText(...values: Array<string | undefined | null>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function varyNumericText(value: string, parameter: IntelligentExamParameter, variation = 0.06, seed = `${parameter.id}:${value}`) {
  if (!/\d/.test(value)) return value;
  if (/^(positivo|negativo|ausente|presente|normal|alterado|limítrofe|indeterminado)$/i.test(value.trim())) return value;

  const match = value.match(/(?:\d{1,3}(?:\.\d{3})+|\d+(?:[,.]\d+)?)/);
  if (!match) return value;

  const original = match[0];
  const numeric = parsePtNumber(original);
  if (!Number.isFinite(numeric) || numeric <= 0) return value;

  const factor = deterministicBetween(`${seed}:variation`, 1 - variation, 1 + variation);
  const varied = numeric * factor;
  const formatted = formatPtNumber(varied, parameter.referencia || original, parameter.unidade);
  return value.replace(original, formatted);
}

function formatResult(value: string, parameter: IntelligentExamParameter, _seed = `${parameter.id}:${value}`) {
  // O valor já foi calculado pelo perfil ou pela referência. Não aplicar uma
  // segunda variação aqui, pois isso poderia empurrar um resultado normal
  // para fora da própria faixa de referência.
  return withUnit(value, parameter.unidade);
}

function adaptiveExplicitResult(value: string, parameter: IntelligentExamParameter, seed: string) {
  // Valores definidos pelo perfil servem como base clínica curada.
  // Cada atualização gera pequena variação coerente, mantendo o mesmo perfil.
  return varyNumericText(value, parameter, 0.04, seed);
}

function alteredNumericFromReference(parameter: IntelligentExamParameter, profile: IntelligentExamProfile, directionHint?: "low" | "high", generationSeed = 0) {
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
      ? lower - span * deterministicBetween(`${parameter.id}:${profile.id}:${generationSeed}:alter-low`, 0.12, 0.35)
      : upper + span * deterministicBetween(`${parameter.id}:${profile.id}:${generationSeed}:alter-high`, 0.12, 0.45);
    return formatPtNumber(Math.max(0, value), reference, parameter.unidade);
  }

  if (/(<|≤|ate|até)/i.test(reference) && numbers.length >= 1) {
    const limit = numbers[0];
    return formatPtNumber(limit * deterministicBetween(`${parameter.id}:${profile.id}:${generationSeed}:upper-alter`, 1.15, 1.8), reference, parameter.unidade);
  }

  if (/(>|≥)/.test(reference) && numbers.length >= 1) {
    const base = numbers[0];
    return formatPtNumber(base * deterministicBetween(`${parameter.id}:${profile.id}:${generationSeed}:lower-alter`, 0.45, 0.9), reference, parameter.unidade);
  }

  return contextualQualitativeResult(parameter, profile, "alterado");
}

function borderlineNumericFromReference(parameter: IntelligentExamParameter, profile: IntelligentExamProfile, generationSeed = 0) {
  const reference = parameter.referencia || "";
  const numbers = extractReferenceNumbers(reference);
  const semantic = lowerText(parameter.id, parameter.label, profile.id, profile.name, profile.description);
  const preferLow = hasAny(semantic, ["baixo", "reduz", "deficiencia", "deficiência", "anemia", "hipo"]);

  if (numbers.length >= 2) {
    const lower = Math.min(numbers[0], numbers[1]);
    const upper = Math.max(numbers[0], numbers[1]);
    const span = Math.max(upper - lower, Math.abs(upper) * 0.1, 1);
    const value = preferLow
      ? lower - span * deterministicBetween(`${parameter.id}:${profile.id}:${generationSeed}:border-low`, 0.01, 0.05)
      : upper + span * deterministicBetween(`${parameter.id}:${profile.id}:${generationSeed}:border-high`, 0.01, 0.06);
    return formatPtNumber(Math.max(0, value), reference, parameter.unidade);
  }

  if (/(<|≤|ate|até)/i.test(reference) && numbers.length >= 1) {
    const limit = numbers[0];
    return formatPtNumber(limit * deterministicBetween(`${parameter.id}:${profile.id}:${generationSeed}:border-upper`, 1.02, 1.1), reference, parameter.unidade);
  }

  if (/(>|≥)/.test(reference) && numbers.length >= 1) {
    const base = numbers[0];
    return formatPtNumber(base * deterministicBetween(`${parameter.id}:${profile.id}:${generationSeed}:border-lower`, 0.9, 0.98), reference, parameter.unidade);
  }

  return contextualQualitativeResult(parameter, profile, "limítrofe");
}

function qualitativeResultFromReference(parameter: IntelligentExamParameter, profile: IntelligentExamProfile) {
  const reference = lowerText(parameter.referencia, parameter.resultPlaceholder);
  const semantic = lowerText(parameter.id, parameter.label, profile.id, profile.name, profile.description);
  const isNormal = profile.status === "normal" || profile.id === "normal" || /negativo|normal/i.test(profile.name);
  const isBorderline = profile.status === "indefinido" || /lim|indef|inconclus/i.test(profile.id + profile.name);

  if (isNormal) {
    if (reference.includes("ausente")) return "Ausente";
    if (reference.includes("negativo")) return "Negativo";
    if (reference.includes("normal")) return contextualQualitativeResult(parameter, profile, "normal");
    if (reference.includes("não aplicável")) return contextualQualitativeResult(parameter, profile, "normal");
  }

  if (isBorderline) {
    if (hasAny(reference, ["ausente", "negativo"])) return hasAny(semantic, ["prote", "glicose", "cetona"]) ? "Traços" : "Indeterminado";
    return "Limítrofe";
  }

  if (reference.includes("ausente")) return "Presente";
  if (reference.includes("negativo")) return "Positivo";
  if (reference.includes("normal")) return contextualQualitativeResult(parameter, profile, "alterado");
  return null;
}


function grammaticalForm(parameter: IntelligentExamParameter, masculine: string, feminine: string, pluralMasculine?: string, pluralFeminine?: string) {
  const label = lowerText(parameter.label, parameter.id);
  const isPlural = /s$/.test(label.trim()) || hasAny(label, ["hemácias", "células", "estruturas", "paredes", "vias", "artérias", "veias"]);
  const isFeminine = hasAny(label, ["função", "resposta", "qualidade", "estrutura", "medida", "imagem", "pressão", "frequência", "espessura", "densidade", "atividade", "mobilidade", "morfologia", "vascularização", "perfusão", "saturação", "amplitude"]);
  if (isPlural && isFeminine) return pluralFeminine || feminine;
  if (isPlural) return pluralMasculine || masculine;
  return isFeminine ? feminine : masculine;
}

function contextualQualitativeResult(
  parameter: IntelligentExamParameter,
  profile: IntelligentExamProfile,
  state: "normal" | "alterado" | "limítrofe",
) {
  const text = lowerText(parameter.id, parameter.label, parameter.resultPlaceholder, parameter.referencia);
  const profileText = lowerText(profile.id, profile.name, profile.description);

  if (state === "normal") {
    const rawReference = (parameter.referencia || "").trim();
    const normalizedReference = rawReference.replace(/^valor de refer[eê]ncia:\s*/i, "").trim();
    if (normalizedReference && !/\d/.test(normalizedReference) && !/conforme|selecionar|contexto|m[eé]todo|normal\s*\/\s*alterado|alterado\s*\/\s*normal|—|^-$/i.test(normalizedReference)) {
      const firstExpected = normalizedReference.split(/\s*\/\s*|\s*;\s*/)[0]?.trim();
      if (firstExpected && firstExpected.length <= 90) return firstExpected;
    }
    if (hasAny(text, ["hemorrag", "lesão", "lesao", "massa", "nódulo", "nodulo", "cisto", "estenose", "trombo", "derrame", "edema", "calcifica", "vegetação", "vegetacao", "isquemia", "parasita", "bactér", "bacter", "fungo", "secreção", "secrecao"])) return "Ausente";
    if (hasAny(text, ["fluxo", "perfusão", "permeabilidade", "mobilidade", "função", "funcao", "contratilidade", "vitalidade", "resposta", "reflexo", "acuidade"])) return grammaticalForm(parameter, "Preservado", "Preservada", "Preservados", "Preservadas");
    if (hasAny(text, ["contorno", "morfologia", "arquitetura", "estrutura", "parede", "superfície", "superficie", "aspecto", "posição", "posicao", "implantação", "implantacao"])) return grammaticalForm(parameter, "Regular", "Regular", "Regulares", "Regulares");
    if (hasAny(text, ["qualidade", "adequação", "adequacao", "janela", "amostra"])) return "Amostra tecnicamente adequada, sem interferentes identificáveis";
    if (hasAny(text, ["ritmo", "frequência", "frequencia"])) return "Ritmo regular, sem irregularidades detectáveis no registro";
    if (hasAny(text, ["força", "forca", "tônus", "tonus"])) return "Força e tônus mantidos, sem assimetrias detectáveis";
    if (hasAny(text, ["atenção", "atencao", "concentração", "concentracao"])) return "Atenção sustentada e concentração mantidas durante a avaliação";
    if (hasAny(text, ["memória", "memoria"])) return "Evocação imediata e tardia mantidas no protocolo aplicado";
    if (hasAny(text, ["orientação", "orientacao"])) return "Orientação temporal, espacial e pessoal mantida";
    if (hasAny(text, ["coordenação", "coordenacao", "equilíbrio", "equilibrio"])) return "Coordenação e equilíbrio sem desvios observáveis nas manobras executadas";
    return "Sem alteração objetiva detectável no parâmetro avaliado";
  }

  if (state === "limítrofe") {
    if (hasAny(text, ["medida", "espessura", "volume", "diâmetro", "diametro", "índice", "indice", "velocidade", "pressão", "pressao", "frequência", "frequencia"])) return "Desvio discreto em relação ao limite técnico mais próximo";
    if (hasAny(text, ["fluxo", "perfusão", "mobilidade", "função", "funcao", "resposta", "acuidade"])) return grammaticalForm(parameter, "Discretamente reduzido", "Discretamente reduzida", "Discretamente reduzidos", "Discretamente reduzidas");
    if (hasAny(text, ["atenção", "atencao", "concentração", "concentracao"])) return "Oscilação discreta de atenção, com duas perdas de foco durante o protocolo";
    if (hasAny(text, ["memória", "memoria"])) return "Evocação tardia discretamente reduzida, com recuperação parcial mediante pista";
    if (hasAny(text, ["coordenação", "coordenacao", "equilíbrio", "equilibrio"])) return "Instabilidade discreta em manobra dinâmica, sem queda ou interrupção do teste";
    return "Heterogeneidade discreta do padrão avaliado, sem repercussão funcional definida";
  }

  if (hasAny(text, ["hemorrag"])) return "Pequeno foco hemorrágico identificado";
  if (hasAny(text, ["estenose"])) return "Estenose moderada";
  if (hasAny(text, ["nódulo", "nodulo", "massa", "lesão", "lesao"])) return "Formação focal de contornos definidos, medindo cerca de 1,2 cm";
  if (hasAny(text, ["cisto"])) return "Imagem cística simples, medindo cerca de 1,1 cm";
  if (hasAny(text, ["derrame", "líquido", "liquido"])) return "Pequena quantidade de líquido livre";
  if (hasAny(text, ["edema"])) return "Edema de grau leve a moderado";
  if (hasAny(text, ["calcifica"])) return "Calcificações puntiformes esparsas";
  if (hasAny(text, ["fluxo", "perfusão"])) return grammaticalForm(parameter, "Reduzido", "Reduzida", "Reduzidos", "Reduzidas");
  if (hasAny(text, ["função", "funcao", "contratilidade", "mobilidade", "resposta", "reflexo", "acuidade"])) return grammaticalForm(parameter, "Reduzido", "Reduzida", "Reduzidos", "Reduzidas");
  if (hasAny(text, ["espessura", "volume", "diâmetro", "diametro", "medida", "índice", "indice"])) return hasAny(profileText, ["reduz", "hipo", "atrofia"]) ? "Reduzido em relação à referência" : "Aumentado em relação à referência";
  if (hasAny(text, ["bactér", "bacter", "fungo", "parasita"])) return "Presente na amostra analisada";
  if (hasAny(text, ["qualidade", "adequação", "adequacao", "amostra"])) return "Adequada para análise, com alteração técnica descrita";
  if (hasAny(text, ["atenção", "atencao", "concentração", "concentracao"])) return "Quatro perdas de foco e aumento do tempo de resposta durante o protocolo";
  if (hasAny(text, ["memória", "memoria"])) return "Evocação tardia reduzida, com recuperação incompleta mesmo após pistas";
  if (hasAny(text, ["orientação", "orientacao"])) return "Desorientação temporal parcial, com orientação pessoal e espacial mantidas";
  if (hasAny(text, ["coordenação", "coordenacao", "equilíbrio", "equilibrio"])) return "Instabilidade em manobra dinâmica, com correção postural tardia";
  if (hasAny(text, ["respirat", "ventila", "expansão", "expansao"])) return "Expansibilidade torácica reduzida bilateralmente, sem uso de musculatura acessória";
  if (hasAny(text, ["cardíac", "cardiac", "ritmo", "pulso"])) return "Ritmo irregular detectado durante o registro, com variação intermitente dos intervalos";
  return `Padrão objetivo alterado em ${parameter.label.toLowerCase()}, com intensidade moderada no protocolo aplicado`;
}

function isGenericResult(value: string) {
  const normalized = value.trim();
  if (/^(a preencher|não aplicável|não se aplica|não informado)(?:\b|\s)/i.test(normalized)) return true;
  return /^(alterado|alterada|alterados|alteradas|achado|achados|resultado alterado|exame alterado|normal|dentro da refer[eê]ncia|dentro dos limites|sem altera[cç][aã]o|preservado|preservada|adequado|adequada|lim[ií]trofe|indeterminado)$/i.test(normalized);
}

function profileMatchesParameter(parameter: IntelligentExamParameter, profile: IntelligentExamProfile) {
  const parameterText = lowerText(parameter.id, parameter.label);
  const profileTerms = lowerText(profile.id, profile.name, profile.description)
    .replace(/[^a-zà-ÿ0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 5 && !hasAny(term, ["exame", "alterado", "alteração", "resultado", "parâmetro", "perfil", "clínico", "clinico"]));
  return profileTerms.some((term) => parameterText.includes(term.slice(0, Math.min(term.length, 7))));
}

function shouldUseAlteredResult(model: IntelligentExamModel, parameter: IntelligentExamParameter, profile: IntelligentExamProfile) {
  if (profile.status === "normal" || profile.id === "normal") return false;
  if (profile.status === "indefinido") return true;
  if (profileMatchesParameter(parameter, profile)) return true;
  const meaningful = model.parameters.filter((item) => !hasAny(lowerText(item.id, item.label), ["impressão", "impressao", "interpretação", "interpretacao", "conclusão", "conclusao", "observação", "observacao"]));
  const index = meaningful.findIndex((item) => item.id === parameter.id);
  return index >= 0 && index < Math.max(1, Math.ceil(meaningful.length * 0.28));
}

function laboratoryPatternResult(model: IntelligentExamModel, parameter: IntelligentExamParameter, profile: IntelligentExamProfile, generationSeed = 0) {
  const generationKey = `${model.id}:${profile.id}:${parameter.id}:${generationSeed}`;
  const preset = (value: string, variation = 0.035) => formatResult(varyNumericText(value, parameter, variation, `${generationKey}:preset`), parameter);
  const text = lowerText(model.id, model.nome, parameter.id, parameter.label, profile.id, profile.name);
  const profileText = lowerText(profile.id, profile.name, profile.description);

  const qualitative = qualitativeResultFromReference(parameter, profile);
  if (qualitative) return formatResult(qualitative, parameter);

  if (model.id === "lab_urina_analise") {
    if (hasAny(profileText, ["itu", "infec"])) {
      if (text.includes("nitrito")) return "Positivo";
      if (text.includes("leucoc")) return preset("25");
      if (text.includes("bacter")) return "Presentes";
      if (text.includes("aspecto")) return "Turvo";
      if (text.includes("prote")) return "Traços";
    }
    if (profileText.includes("protein")) {
      if (text.includes("prote")) return "Presente";
      if (text.includes("cilind")) return "Hialinos";
    }
    if (profileText.includes("hemat")) {
      if (text.includes("hemac")) return preset("18");
      if (text.includes("cor")) return "Amarelo escuro";
    }
    if (profileText.includes("lit")) {
      if (text.includes("hemac")) return preset("12");
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
      if (text.includes("antibiograma")) return "Não realizado por ausência de isolamento bacteriano significativo";
      if (text.includes("antibióticos") || text.includes("antibioticos")) return "Sem painel de sensibilidade liberado por ausência de isolado significativo";
    }
  }

  if (model.id === "lab_metabolismo_ferro") {
    if (hasAny(profileText, ["deficiencia", "deficiência"])) {
      if (text.includes("ferro_serico") || text.includes("ferro sérico")) return preset("32");
      if (text.includes("ferritina")) return preset("8");
      if (text.includes("tibc") || text.includes("capacidade")) return preset("480");
      if (text.includes("saturacao") || text.includes("saturação")) return preset("8");
    }
    if (hasAny(profileText, ["sobrecarga", "alto", "elevado"])) {
      if (text.includes("ferro_serico") || text.includes("ferro sérico")) return preset("210");
      if (text.includes("ferritina")) return preset("420");
      if (text.includes("tibc") || text.includes("capacidade")) return preset("235");
      if (text.includes("saturacao") || text.includes("saturação")) return preset("68");
    }
  }

  if (model.id === "lab_glicemia" || model.id === "pediatria_glicemia_capilar") {
    if (hasAny(profileText, ["hipoglic"])) return preset("58");
    if (hasAny(profileText, ["hiperglic", "alterado", "diabetes"])) return preset("148");
    if (hasAny(profileText, ["lim", "indef", "pré", "pre"])) return preset("108", 0.02);
  }

  if (model.id === "lab_hba1c_completa") {
    if (hasAny(profileText, ["diabetes", "alterado", "elev"])) return preset("7,2", 0.02);
    if (hasAny(profileText, ["pré", "pre", "lim", "indef"])) return preset("5,9", 0.015);
  }

  if (model.id === "lab_funcao_renal_completa") {
    if (hasAny(profileText, ["renal", "azot", "alterado", "insuf"])) {
      if (text.includes("creatin")) return preset("1,8");
      if (text.includes("ureia") || text.includes("uréia")) return preset("68");
      if (text.includes("filtra") || text.includes("tfg")) return preset("48");
    }
  }

  if (model.id === "lab_funcao_hepatica_completa") {
    if (hasAny(profileText, ["hepatocelular", "misto", "alterado"])) {
      if (hasAny(text, ["tgo", "ast", "tgp", "alt"])) return preset("125");
    }
    if (hasAny(profileText, ["colest", "misto", "alterado"])) {
      if (hasAny(text, ["gama", "ggt", "fosfatase", "bilirrubina"])) return formatResult(alteredNumericFromReference(parameter, profile, "high", generationSeed), parameter);
    }
  }

  if (model.id === "lab_eletrolitos_completos") {
    if (profileText.includes("hiponat")) return text.includes("sodio") || text.includes("na") ? preset("128", 0.01) : formatResult(randomNormalResultFromReference(parameter, generationKey), parameter);
    if (profileText.includes("hipernat")) return text.includes("sodio") || text.includes("na") ? preset("151", 0.008) : formatResult(randomNormalResultFromReference(parameter, generationKey), parameter);
    if (profileText.includes("hipocalem")) return text.includes("potass") || text.includes("k") ? preset("3,0", 0.02) : formatResult(randomNormalResultFromReference(parameter, generationKey), parameter);
    if (profileText.includes("hipercalem")) return text.includes("potass") || text.includes("k") ? preset("5,8", 0.015) : formatResult(randomNormalResultFromReference(parameter, generationKey), parameter);
    if (profileText.includes("hipocalc")) return text.includes("calcio") || text.includes("cálcio") ? preset("7,8", 0.02) : formatResult(randomNormalResultFromReference(parameter, generationKey), parameter);
    if (profileText.includes("hipomagnes")) return text.includes("magnes") ? preset("1,3", 0.02) : formatResult(randomNormalResultFromReference(parameter, generationKey), parameter);
  }

  if (profile.status === "normal" || profile.id === "normal") return formatResult(randomNormalResultFromReference(parameter, generationKey), parameter);
  if (profile.status === "indefinido" || /lim|indef|inconclus/i.test(profile.id + profile.name)) return formatResult(borderlineNumericFromReference(parameter, profile, generationSeed), parameter);
  if (profile.status === "personalizado") return contextualQualitativeResult(parameter, profile, "normal");

  return formatResult(alteredNumericFromReference(parameter, profile, undefined, generationSeed), parameter);
}



type GuidedRuntimeContext = {
  adapterValue?: string;
  clinicalContext?: string;
  generationSeed?: number;
};

function guidedRuntimeOverride(
  model: IntelligentExamModel,
  parameter: IntelligentExamParameter,
  profile: IntelligentExamProfile,
  runtime?: GuidedRuntimeContext,
) {
  const parameterText = lowerText(parameter.id, parameter.label);
  const profileText = lowerText(profile.id, profile.name, profile.description);
  const adapterValue = runtime?.adapterValue?.trim() || "";
  const clinicalContext = runtime?.clinicalContext?.trim() || "";
  const generationSeed = Number(runtime?.generationSeed || 0);

  if (clinicalContext && hasAny(parameterText, ["contexto clínico", "contexto clinico", "indicação clínica", "indicacao clinica", "correlação clínica", "correlacao clinica"])) {
    return clinicalContext;
  }
  if (hasAny(parameterText, ["impressão", "impressao", "classificação", "classificacao"])) {
    return profile.resultSummary.replace(/[.]$/, "");
  }

  // O adaptador é uma informação clínica selecionada pelo profissional e deve
  // prevalecer sobre qualquer texto genérico sugerido pelo motor.
  if (adapterValue && model.adapter.enabled) {
    if (parameter.id === model.adapter.id || hasAny(parameterText, ["local examinado", "região examinada", "regiao examinada"])) {
      return adapterValue;
    }
  }

  if (model.id === "lab_beta_hcg_completo") {
    const values: Record<string, Record<string, string>> = {
      negativo: {
        tipo_exame: "Quantitativo",
        resultado_qualitativo: "Negativo",
        beta_hcg_quantitativo: `${formatPtNumber(deterministicBetween(`beta:negativo:${generationSeed}`, 0.6, 4.4), "0,0", "mUI/mL")} mUI/mL`,
        correspondencia_gestacional: "Faixa de não gestante",
        evolucao_seriada: "Sem indicação de curva seriada neste resultado isolado",
        impressao: "β-hCG negativo",
      },
      positivo: {
        tipo_exame: "Quantitativo",
        resultado_qualitativo: "Positivo",
        beta_hcg_quantitativo: `${formatPtNumber(deterministicBetween(`beta:positivo:${generationSeed}`, 650, 4200), "0", "mUI/mL")} mUI/mL`,
        correspondencia_gestacional: "Compatível com gestação inicial; correlacionar com idade gestacional",
        evolucao_seriada: "Controle seriado somente quando clinicamente indicado",
        impressao: "β-hCG positivo",
      },
      indeterminado: {
        tipo_exame: "Quantitativo",
        resultado_qualitativo: "Indeterminado",
        beta_hcg_quantitativo: `${formatPtNumber(deterministicBetween(`beta:indeterminado:${generationSeed}`, 6, 24), "0", "mUI/mL")} mUI/mL`,
        correspondencia_gestacional: "Faixa limítrofe, sem definição isolada",
        evolucao_seriada: "Repetir em 48–72 horas conforme avaliação clínica",
        impressao: "β-hCG em faixa indeterminada",
      },
      seguimento: {
        tipo_exame: "Quantitativo",
        resultado_qualitativo: "Detectável",
        beta_hcg_quantitativo: `${formatPtNumber(deterministicBetween(`beta:seguimento:${generationSeed}`, 70, 480), "0", "mUI/mL")} mUI/mL`,
        correspondencia_gestacional: "Compatível com gestação muito inicial; interpretar pela tendência",
        evolucao_seriada: "Comparar com dosagem anterior em 48–72 horas",
        impressao: "β-hCG em seguimento seriado",
      },
    };
    return values[profile.id]?.[parameter.id] || null;
  }

  if (model.id === "lab_urocultura") {
    const values: Record<string, Record<string, string>> = {
      negativa: {
        crescimento_bacteriano: "Negativo",
        microorganismo: "Não isolado",
        contagem_colonias: `${formatPtNumber(deterministicBetween(`uro:negativa:${generationSeed}`, 120, 850), "0", "UFC/mL")} UFC/mL`,
        antibiograma: "Não realizado por ausência de isolamento bacteriano significativo",
        antibioticos_testados: "Sem painel de sensibilidade liberado",
        impressao: "Ausência de crescimento bacteriano significativo",
      },
      positiva: {
        crescimento_bacteriano: "Positivo",
        microorganismo: "Escherichia coli",
        contagem_colonias: `${formatPtNumber(deterministicBetween(`uro:positiva:${generationSeed}`, 120000, 280000), "0", "UFC/mL")} UFC/mL`,
        antibiograma: "Sensibilidade antimicrobiana liberada para o isolado",
        antibioticos_testados: "Nitrofurantoína: sensível; Ciprofloxacino: sensível; Amoxicilina-clavulanato: resistente",
        impressao: "Crescimento bacteriano significativo",
      },
      contaminacao: {
        crescimento_bacteriano: "Crescimento misto",
        microorganismo: "Flora bacteriana mista",
        contagem_colonias: `${formatPtNumber(deterministicBetween(`uro:contaminacao:${generationSeed}`, 12000, 48000), "0", "UFC/mL")} UFC/mL, flora mista`,
        antibiograma: "Não liberado devido a crescimento misto",
        antibioticos_testados: "Painel de sensibilidade não liberado para flora mista",
        impressao: "Padrão sugestivo de contaminação da amostra",
      },
    };
    return values[profile.id]?.[parameter.id] || null;
  }

  if (model.id === "img_raio_x_unico") {
    if (parameter.id === "local_examinado" && adapterValue) return adapterValue;
    if (parameter.id === "incidencia") {
      if (/tórax/i.test(adapterValue)) return "PA e perfil";
      if (/coluna|crânio/i.test(adapterValue)) return "AP e perfil";
      return "AP e perfil";
    }
    if (parameter.id === "lateralidade") {
      if (/tórax|coluna|crânio/i.test(adapterValue)) return "Exame sem lateralidade específica";
      return "Lateralidade a confirmar conforme segmento examinado";
    }
    if (profileText.includes("fratura com desvio") && parameter.id === "impressao") return "Fratura com desvio";
  }

  if (model.id === "hormonal_amh") {
    if (parameter.id === "amh") {
      if (profile.status === "normal" || profile.id === "normal") return "2,2 ng/mL";
      if (profile.status === "indefinido") return "0,9 ng/mL";
      if (hasAny(profileText, ["alto", "elev"])) return "4,6 ng/mL";
      return "0,4 ng/mL";
    }
  }

  if (model.id === "lab_teste_coombs") {
    if (parameter.id === "tipo_coombs") return adapterValue || "Coombs direto";
    if (hasAny(parameterText, ["anticorpo", "reação", "reacao"]) && (profile.status === "normal" || profile.id === "normal")) return "Não reagente";
  }

  if (model.id === "lab_sorologia" && (profile.status === "normal" || profile.id === "normal")) {
    if (/igm/.test(parameterText)) return "Não reagente";
    if (/rub[eé]ola.*igg/.test(parameterText)) return "Reagente — padrão compatível com imunidade sorológica";
    if (/citomegalov[ií]rus.*igg/.test(parameterText)) return "Reagente — contato prévio, sem marcador IgM de fase aguda";
    if (/toxoplasmose.*igg/.test(parameterText)) return "Não reagente";
  }

  if (model.id === "geral_exame_toxicologico" && profile.id === "amostra_inadequada") {
    const substanceIds = new Set(["canabinoides", "cocaina", "anfetaminas", "metanfetaminas", "opiaceos", "benzodiazepinicos", "barbituricos", "metadona", "fenciclidina", "outras_substancias"]);
    if (substanceIds.has(parameter.id)) return "Resultado não liberado — amostra inadequada";
  }

  return null;
}

function psychotechnicalContextNarrative(resolved: AdaptiveResolvedExam, kind: "interpretation" | "conclusion") {
  const context = resolved.clinicalContext.toLowerCase();
  const profile = resolved.profile;
  const aptitude = profile.id === "apto_com_ressalvas" ? "apto com ressalvas" : profile.id === "nao_apto" ? "não apto" : profile.id === "inconclusivo" ? "inconclusivo" : "apto";
  const positive = profile.id === "apto" || profile.id === "apto_com_ressalvas";

  if (context.includes("porte de arma")) {
    return kind === "interpretation"
      ? `${positive ? "O desempenho observado mostrou" : "Foram observadas limitações em"} atenção sustentada, controle de impulsos, regulação emocional, julgamento e tomada de decisão, domínios relevantes para manejo responsável de arma de fogo. O resultado deve ser considerado em conjunto com o protocolo efetivamente aplicado.`
      : `No contexto de porte de arma, o resultado psicotécnico é ${aptitude}.`;
  }
  if (context.includes("pilotagem")) {
    return kind === "interpretation"
      ? `${positive ? "O desempenho observado mostrou" : "Foram observadas limitações em"} atenção sustentada, tempo de reação, autorregulação sob pressão, coordenação e tomada de decisão, domínios funcionais relevantes para atividade de pilotagem aérea. O resultado deve ser considerado em conjunto com o protocolo efetivamente aplicado.`
      : `No contexto de pilotagem aérea, o resultado psicotécnico é ${aptitude}.`;
  }
  return kind === "interpretation"
    ? `${positive ? "O desempenho global permaneceu" : "O desempenho global mostrou-se"} compatível com a avaliação psicotécnica de rotina nos domínios cognitivos, emocionais, comportamentais e funcionais examinados, conforme os achados descritos.`
    : `No contexto clínico de rotina, o resultado psicotécnico é ${aptitude}.`;
}

function resultForParameter(model: IntelligentExamModel, parameter: IntelligentExamParameter, profile: IntelligentExamProfile, runtime?: GuidedRuntimeContext) {
  const generationSeed = Number(runtime?.generationSeed || 0);
  const generationKey = `${model.id}:${profile.id}:${parameter.id}:${generationSeed}`;
  const guidedOverride = guidedRuntimeOverride(model, parameter, profile, runtime);
  if (guidedOverride) return formatResult(guidedOverride, parameter, `${generationKey}:guided`);

  const explicitResult = profile.results?.[parameter.id];

  if (explicitResult) {
    const result = adaptiveExplicitResult(explicitResult, parameter, generationKey);
    if (!isGenericResult(result)) return formatResult(result, parameter);
  }

  // Um perfil alterado não torna todos os parâmetros artificialmente anormais.
  // Apenas os parâmetros coerentes com o perfil (ou um pequeno grupo principal)
  // recebem valores alterados; os demais permanecem dentro da referência.
  if (!shouldUseAlteredResult(model, parameter, profile)) {
    const normalProfile = model.profiles.find((item) => item.id === "normal") || { ...profile, id: "normal", status: "normal" as const, name: "Normal" };
    return laboratoryPatternResult(model, parameter, normalProfile, generationSeed);
  }

  const result = laboratoryPatternResult(model, parameter, profile, generationSeed);
  if (isGenericResult(result)) {
    const state = profile.status === "indefinido" ? "limítrofe" : "alterado";
    return formatResult(contextualQualitativeResult(parameter, profile, state), parameter);
  }
  return result;
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
    resultForParameter(resolved.model, parameter, resolved.profile, resolved),
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



function cleanTechnicalSentence(value: string) {
  return value.trim().replace(/[.;:,]+$/g, "");
}

function technicalMethodNarrative(resolved: AdaptiveResolvedExam) {
  const { model } = resolved;
  const primary = cleanTechnicalSentence(model.technique || model.method);
  const secondary = model.method && cleanTechnicalSentence(model.method) !== primary
    ? cleanTechnicalSentence(model.method)
    : "";
  const scope = resolved.adapterValue ? `Abrangência: ${resolved.adapterValue}` : "";
  const parts = [primary, secondary, scope].filter(Boolean);
  return parts.slice(0, 3).join(". ") + ".";
}

function parameterFindingSentence(label: string, result: string, reference: string) {
  const cleanLabel = cleanTechnicalSentence(label);
  const cleanResult = cleanTechnicalSentence(result);
  const cleanReference = cleanTechnicalSentence(reference);
  const numeric = /\d/.test(cleanResult);
  const qualitative = /ausente|presente|preservad|regular|reduzid|aumentad|positivo|negativo|limítrofe|estenose|edema|cístic|focal|calcifica/i.test(cleanResult);

  if (numeric) return `${cleanLabel} mensurado em ${cleanResult}, com referência técnica de ${cleanReference}.`;
  if (qualitative) return `${cleanLabel}: ${cleanResult}.`;
  return `${cleanLabel} apresentou ${cleanResult.toLowerCase()}, conforme avaliação técnica do método.`;
}

function technicalInterpretation(resolved: AdaptiveResolvedExam, rows: string[][]) {
  const { model, profile } = resolved;
  const altered = rows.filter((row) => {
    const parameter = model.parameters.find((item) => item.label === row[0]);
    return parameter ? shouldUseAlteredResult(model, parameter, profile) : false;
  });

  if (profile.status === "normal" || profile.id === "normal") {
    const samples = rows.slice(0, 4).map((row) => `${row[0]}: ${row[1]}`).join("; ");
    if (!samples) return `Não foi possível compor a interpretação sem resultados objetivos preenchidos.`;
    const variant = resolved.generationSeed % 3;
    if (variant === 1) return `Na atualização dos achados, os parâmetros objetivos permaneceram compatíveis com as referências: ${samples}.`;
    if (variant === 2) return `A nova composição dos achados demonstra ${samples}, mantendo coerência com os limites e padrões técnicos informados.`;
    return `Os resultados objetivos demonstram ${samples}. Não foram identificadas discordâncias entre esses parâmetros e as referências informadas.`;
  }

  if (profile.status === "indefinido") {
    const names = altered.slice(0, 3).map((row) => row[0]).join(", ");
    return `Variações discretas${names ? ` em ${names}` : ""}, sem especificidade isolada. Correlacionar com o quadro clínico e considerar controle conforme avaliação médica.`;
  }

  const names = altered.slice(0, 4).map((row) => row[0]).join(", ");
  return `Alteração objetiva${names ? ` envolvendo ${names}` : " nos parâmetros principais"}. Correlacionar com o quadro clínico e exames anteriores.`;
}

function technicalConclusion(resolved: AdaptiveResolvedExam, rows: string[][]) {
  const { model, profile } = resolved;
  const altered = rows.filter((row) => {
    const parameter = model.parameters.find((item) => item.label === row[0]);
    return parameter ? shouldUseAlteredResult(model, parameter, profile) : false;
  });

  if (profile.status === "normal" || profile.id === "normal") {
    const summary = rows.slice(0, 3).map((row) => `${row[0]} (${row[1]})`).join("; ");
    const variant = resolved.generationSeed % 3;
    if (variant === 1) return `${model.nome} com nova amostragem de achados dentro do padrão esperado${summary ? `: ${summary}` : ""}.`;
    if (variant === 2) return `${model.nome} com achados atualizados e coerentes com as referências do perfil normal${summary ? `: ${summary}` : ""}.`;
    return `${model.nome} com resultados objetivos compatíveis com o perfil selecionado${summary ? `: ${summary}` : ""}.`;
  }
  if (profile.status === "indefinido") {
    return resolved.generationSeed % 2
      ? `${model.nome} com atualização de achados ainda em faixa limítrofe, sem definição isolada. Considerar acompanhamento conforme avaliação médica.`
      : `${model.nome} com achados discretos ou limítrofes, de significado inespecífico isoladamente. Considerar acompanhamento conforme avaliação médica.`;
  }
  const summary = altered.slice(0, 3).map((row) => `${row[0]} (${row[1]})`).join("; ");
  return resolved.generationSeed % 2
    ? `${model.nome} com achados atualizados mantendo o padrão alterado selecionado${summary ? `: ${summary}` : ""}. Correlacionar com o contexto clínico para definição de conduta.`
    : `${model.nome} com alterações tecnicamente demonstradas${summary ? `: ${summary}` : ""}. Correlacionar com o contexto clínico para definição de conduta.`;
}

function resultSummaryFromRows(resolved: AdaptiveResolvedExam, rows: string[][]) {
  const { model, profile } = resolved;
  const informative = rows.filter((row) => row[0] && row[1] && !isGenericResult(row[1]));
  if (!informative.length) return profile.resultSummary;

  if (profile.status === "normal" || profile.id === "normal") {
    const highlighted = informative.slice(0, 5).map((row) => `${row[0]}: ${row[1]}`);
    return `${model.nome}: ${highlighted.join("; ")}.`;
  }

  const highlighted = informative
    .filter((row) => {
      const parameter = model.parameters.find((item) => item.label === row[0]);
      return parameter ? shouldUseAlteredResult(model, parameter, profile) : false;
    })
    .slice(0, 4)
    .map((row) => `${row[0]}: ${row[1]}`);

  if (!highlighted.length) {
    return resolved.generationSeed % 2
      ? `${model.nome}: achados atualizados permanecem compatíveis com o perfil ${profile.name.toLowerCase()}, conforme parâmetros descritos.`
      : `${model.nome}: resultado compatível com o perfil ${profile.name.toLowerCase()}, conforme parâmetros descritos.`;
  }
  return resolved.generationSeed % 2
    ? `${model.nome}: atualização dos achados — ${highlighted.join("; ")}.`
    : `${model.nome}: ${highlighted.join("; ")}.`;
}

function findingsFromRows(resolved: AdaptiveResolvedExam, rows: string[][]) {
  const { model, profile } = resolved;
  const informative = rows.filter((row) => row[0] && row[1] && !isGenericResult(row[1]));
  const altered = informative.filter((row) => {
    const parameter = model.parameters.find((item) => item.label === row[0]);
    return parameter ? shouldUseAlteredResult(model, parameter, profile) : false;
  });
  const normal = informative.filter((row) => !altered.includes(row));
  const opening = resolved.adapterValue
    ? `${model.nome} direcionado para ${resolved.adapterValue.toLowerCase()}.`
    : `${model.nome} realizado conforme protocolo institucional.`;
  const context = resolved.clinicalContext ? ` Indicação: ${resolved.clinicalContext}.` : "";

  if (!informative.length) return `${opening}${context} ${profile.resultSummary}`;

  const lines: string[] = [opening + context];
  const detailedRows = profile.status === "normal" || profile.id === "normal"
    ? informative.slice(0, Math.min(informative.length, 6))
    : altered.slice(0, Math.min(altered.length, 6));
  detailedRows.forEach((row) => lines.push(parameterFindingSentence(row[0], row[1], row[2] || "conforme método")));

  if (profile.status === "normal" || profile.id === "normal") {
    const remaining = informative.slice(detailedRows.length, detailedRows.length + 4);
    remaining.forEach((row) => lines.push(parameterFindingSentence(row[0], row[1], row[2] || "conforme método")));
  } else if (normal.length) {
    normal.slice(0, 4).forEach((row) => lines.push(parameterFindingSentence(row[0], row[1], row[2] || "conforme método")));
  }

  return lines.join("\n");
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
  const technique = paragraphs(technicalMethodNarrative(resolved));
  const table = isLaboratory && rows.length ? tableHtml(["Parâmetro", "Resultado", "Valores de referência"], rows) : "";
  if (model.id === "psiquiatria_psicotecnico") {
    const rowById = new Map(model.parameters.map((parameter, index) => [parameter.id, rows[index]]));
    const selectRows = (ids: string[]) => ids.map((id) => rowById.get(id)).filter(Boolean) as string[][];
    const psychologicalRows = selectRows(["estado_mental", "nivel_atencao", "tempo_reacao", "controle_emocional", "impulsividade", "capacidade_decisao", "perfil_comportamental"]);
    const physicalRows = selectRows(["condicao_fisica_geral", "coordenacao_equilibrio", "forca_mobilidade"]);
    const cardiacRows = selectRows(["frequencia_cardiaca", "pressao_arterial_sistolica", "pressao_arterial_diastolica", "ritmo_cardiaco"]);
    const respiratoryRows = selectRows(["frequencia_respiratoria", "saturacao_oxigenio", "ausculta_respiratoria", "expansibilidade_toracica"]);
    const impressionRow = rowById.get("impressao");
    const aptitudeRow = rowById.get("aptidao");
    const psychologicalSummary = psychologicalRows.slice(0, 5).map((row) => `${row[0]}: ${row[1]}`).join("; ");
    const impressionText = impressionRow?.[1] && !isGenericResult(impressionRow[1])
      ? impressionRow[1]
      : `Durante o protocolo, observou-se ${psychologicalSummary.toLowerCase()}. O comportamento apresentado foi considerado em conjunto com o desempenho atencional, emocional e psicomotor.`;
    const integratedRows = [...psychologicalRows, ...physicalRows, ...cardiacRows, ...respiratoryRows];
    const aptitude = aptitudeRow?.[1] || profile.name;
    return [
      section("tecnica", "1. Técnica / Método", technique + contextText),
      section("resultados", "2. Resultados", tableHtml(["Domínio avaliado", "Resultado", "Referência técnica"], psychologicalRows)),
      section("impressao_psicologica", "3. Impressão psicológica", paragraphs(impressionText)),
      section("avaliacao_fisica", "4. Avaliação física", tableHtml(["Parâmetro", "Resultado", "Referência"], physicalRows)),
      section("avaliacao_cardiaca", "5. Avaliação cardíaca", tableHtml(["Parâmetro", "Resultado", "Referência"], cardiacRows)),
      section("avaliacao_respiratoria", "6. Avaliação respiratória", tableHtml(["Parâmetro", "Resultado", "Referência"], respiratoryRows)),
      section("interpretacao", "7. Interpretação", paragraphs(`${psychotechnicalContextNarrative(resolved, "interpretation")}
${profile.interpretation}`)),
      section("conclusao", "8. Conclusão", paragraphs(`${psychotechnicalContextNarrative(resolved, "conclusion")}
${profile.conclusion}`)),
    ].join("");
  }
  if (model.id === "geral_exame_toxicologico") {
    const substanceIds = new Set(["canabinoides", "cocaina", "anfetaminas", "metanfetaminas", "opiaceos", "benzodiazepinicos", "barbituricos", "metadona", "fenciclidina", "outras_substancias"]);
    const substanceRows = resolved.parameters.filter((parameter) => substanceIds.has(parameter.id)).map((parameter) => [
      parameter.label,
      resultForParameter(model, parameter, profile, resolved),
      (parameter.referencia || "Conforme método").replace(/^Valor de corte:\s*/i, ""),
    ]);
    const qualityRows = resolved.parameters.filter((parameter) => !substanceIds.has(parameter.id)).map((parameter) => [
      parameter.label,
      resultForParameter(model, parameter, profile, resolved),
      parameter.referencia || "Conforme método",
    ]);
    const material = resolved.adapterValue || "A informar";
    const purpose = paragraphs(model.technique);
    const biologicalMaterial = `<p><strong>Amostra analisada:</strong> ${htmlEscape(material)}</p><p><strong>Data da coleta:</strong> DD/MM/AAAA</p><p><strong>Hora da coleta:</strong> HH:MM</p><p><strong>Condições da amostra:</strong> A informar</p><p><strong>Número de identificação da amostra:</strong> A informar</p>`;
    const method = paragraphs(model.method) + contextText;
    return [
      section("finalidade", "1. Finalidade do Exame", purpose),
      section("material_biologico", "2. Material Biológico", biologicalMaterial),
      section("tecnica_metodo", "3. Técnica e Método Utilizado", method),
      section("substancias_pesquisadas", "4. Substâncias Pesquisadas", tableHtml(["Substância ou classe", "Resultado", "Valor de corte"], substanceRows)),
      section("controle_qualidade", "5. Controle de Qualidade da Amostra", tableHtml(["Parâmetro", "Resultado", "Referência"], qualityRows)),
      section("resultado_laboratorial", "6. Resultado Laboratorial", paragraphs(resultSummaryFromRows(resolved, [...substanceRows, ...qualityRows]))),
      section("interpretacao", "7. Interpretação", paragraphs(profile.interpretation)),
      section("conclusao", "8. Conclusão", paragraphs(`Perfil do resultado: ${profile.name}.\n${profile.conclusion}\nOs achados devem ser interpretados em conjunto com os dados clínicos, ocupacionais e administrativos disponíveis. Este exame não determina, isoladamente, o grau de comprometimento funcional, o momento exato do uso ou a frequência de exposição à substância pesquisada.`)),
    ].join("");
  }

  if (isImage) {
    return [
      section("tecnica", "1. Técnica / Método", technique + adapterText + contrastText + contextText),
      section("achados", "2. Achados", paragraphs(findingsFromRows(resolved, rows))),
      section("interpretacao", "3. Interpretação", paragraphs(technicalInterpretation(resolved, rows))),
      section("conclusao", "4. Conclusão", paragraphs(technicalConclusion(resolved, rows))),
    ].join("");
  }

  return [
    section("tecnica", "1. Técnica / Método", technique + adapterText + contrastText + contextText),
    section(isLaboratory ? "resultados" : "achados", "2. Resultados", isLaboratory ? (table || paragraphs(resultSummaryFromRows(resolved, rows))) : paragraphs(findingsFromRows(resolved, rows))),
    section("interpretacao", "3. Interpretação", paragraphs(technicalInterpretation(resolved, rows))),
    section("conclusao", "4. Conclusão", paragraphs(technicalConclusion(resolved, rows))),
  ].join("");
}

export function serializeAdaptiveConfiguration(configuration: AdaptiveExamConfiguration) {
  return JSON.stringify(configuration);
}
