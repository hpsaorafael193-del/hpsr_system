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

export type AdaptivePatientContext = {
  age?: string;
  bloodType?: string;
};

export type AdaptiveResolvedExam = {
  model: IntelligentExamModel;
  adapterLabel: string;
  adapterValue: string;
  clinicalContext: string;
  profile: IntelligentExamProfile;
  dynamicFields: AdaptiveDynamicField[];
  variables: Record<string, string | boolean>;
  parameters: IntelligentExamParameter[];
  automaticBlocks: string[];
  supportsFutureAttachments: boolean;
  supportsFutureSmartPagination: boolean;
  supportsFutureRenderEngine: boolean;
  generationSeed: number;
  patientContext: AdaptivePatientContext;
};

function firstOption(options?: string[]) {
  return options?.find(Boolean) || "";
}

function defaultClinicalContext(model: IntelligentExamModel) {
  const contexts = model.clinicalContexts || [];
  return contexts.find((item) => normalizedFieldKey(item) === "rotina")
    || firstOption(contexts);
}

export function createInitialAdaptiveConfiguration(model: IntelligentExamModel): AdaptiveExamConfiguration {
  const defaultProfile = model.profiles.find((profile) => profile.id === model.editorModel.defaultProfileId)
    || model.profiles.find((profile) => profile.id === "normal")
    || model.profiles[0];

  return {
    examId: model.id,
    adapterValue: model.adapter.enabled && model.adapter.kind !== "clinical-context" ? firstOption(model.adapter.options) : "",
    clinicalContext: defaultClinicalContext(model),
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
  if (!model.adapter.enabled || model.adapter.kind === "clinical-context") return null;
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
    ...Object.values(configuration.variables || {}).map((value) => String(value ?? "")),
  ].map((value) => value.toLowerCase());
  return variable.appliesTo.some((item) => selected.includes(item.toLowerCase()));
}

function normalizedFieldKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function usefulTechnicalVariable(model: IntelligentExamModel, variable: IntelligentClinicalVariable) {
  const variableId = normalizedFieldKey(variable.id);
  const adapterKey = normalizedFieldKey(`${model.adapter.id} ${model.adapter.label}`);

  // Dados demográficos que já vêm do cadastro não voltam a ser digitados.
  // Idade gestacional é uma informação clínica própria do exame e deve aparecer.
  if (new Set(["idade", "idade_paciente", "patient_age", "sexo", "genero", "patient_sex"]).has(variableId)) return false;
  const modelSemantic = normalizedFieldKey(`${model.id} ${model.nome} ${model.categoria}`);
  const gestationalOnly = new Set(["idade_gestacional", "numero_fetos", "fiv", "risco"]);
  if (gestationalOnly.has(variableId) && !/obst|monitorizacao_folicular/.test(modelSemantic)) return false;
  if (variableId === "idade_gestacional_referida" && model.id !== "lab_beta_hcg_completo") return false;
  if (variableId === normalizedFieldKey(model.adapter.id)) return false;
  if (variableId === "contraste") return false;
  if (adapterKey && normalizedFieldKey(variable.label) === normalizedFieldKey(model.adapter.label)) return false;

  const parameterIds = new Set(model.parameters.map((parameter) => normalizedFieldKey(parameter.id)));
  const supportOnly = new Set([
    "contexto_clinico",
    "participantes",
    "mae_presente",
    "papel_no_protocolo",
    "foco_monitorizacao",
    "dia_estimulacao",
    "dia_preparo_endometrial",
    "idade_gestacional",
    "idade_gestacional_referida",
    "numero_fetos",
    "fiv",
    "risco",
    "incidencias",
    "finalidade_avaliacao",
    "segmento",
    "articulacao",
  ]);
  return parameterIds.has(variableId) || supportOnly.has(variableId);
}

function defaultVariableValue(variable: IntelligentClinicalVariable, configuration: AdaptiveExamConfiguration) {
  const current = configuration.variables[variable.id];
  if (current !== undefined && current !== null && String(current).trim() !== "") return current;
  if (variable.id === "foco_monitorizacao") {
    const legacyFocus = normalizedFieldKey(String(configuration.variables.papel_no_protocolo ?? ""));
    if (legacyFocus.includes("receptora") || legacyFocus.includes("gestante") || legacyFocus.includes("endometr")) return "Endométrio";
    if (legacyFocus.includes("doadora") || legacyFocus.includes("folicul")) return "Folículos";
  }
  if (variable.tipo === "boolean") return false;
  if (variable.tipo === "select") {
    const adapterMatch = variable.options?.find((option) => normalizedFieldKey(option) === normalizedFieldKey(configuration.adapterValue));
    return adapterMatch || firstOption(variable.options);
  }
  return "";
}

function clinicalVariableFields(model: IntelligentExamModel, configuration: AdaptiveExamConfiguration): AdaptiveDynamicField[] {
  const workingVariables: Record<string, string | boolean> = { ...configuration.variables };
  const fields: AdaptiveDynamicField[] = [];

  model.variables.forEach((variable) => {
    const workingConfiguration: AdaptiveExamConfiguration = { ...configuration, variables: workingVariables };
    if (!appliesToSelection(variable, workingConfiguration) || !usefulTechnicalVariable(model, variable)) return;

    const value = defaultVariableValue(variable, workingConfiguration);
    if (workingVariables[variable.id] === undefined || String(workingVariables[variable.id]).trim() === "") {
      workingVariables[variable.id] = value;
    }
    fields.push({ ...variable, source: "variable" as const, value });
  });

  const hasContextDetail = model.variables.some((variable) => normalizedFieldKey(variable.id) === "contexto_clinico");
  const contextKey = normalizedFieldKey(configuration.clinicalContext || "");
  const specialContextOwner = model.adapter.kind === "bond-type"
    || model.variables.some((variable) => variable.id === "finalidade_avaliacao")
    || model.id === "gineco_usg_monitorizacao_folicular";
  if (!hasContextDetail && !specialContextOwner && contextKey && contextKey !== "rotina") {
    fields.push({
      id: "contexto_clinico",
      label: "Detalhe do contexto",
      tipo: "text",
      required: false,
      value: configuration.variables.contexto_clinico ?? "",
      source: "variable",
    });
  }

  return fields;
}

function contextualParameters(model: IntelligentExamModel, variables: Record<string, string | boolean>, profileId?: string) {
  if (model.id === "gineco_usg_monitorizacao_folicular") {
    const focus = normalizedFieldKey(String(variables.foco_monitorizacao ?? variables.papel_no_protocolo ?? ""));
    const ids = focus.includes("folicul") || focus.includes("doadora")
      ? new Set(["ovario_direito", "foliculos_od", "ovario_esquerdo", "foliculos_oe", "foliculo_dominante", "sinais_ovulacao", "liquido_fundo_saco", "impressao"])
      : focus.includes("endometr") || focus.includes("receptora") || focus.includes("gestante")
        ? new Set(["utero", "endometrio", "espessura_endometrial", "liquido_fundo_saco", "impressao"])
        : null;
    return ids ? model.parameters.filter((parameter) => ids.has(parameter.id)) : model.parameters;
  }

  if (model.id === "lab_beta_hcg_completo" && profileId === "negativo") {
    return model.parameters.filter((parameter) => parameter.id !== "idade_gestacional_referida");
  }

  return model.parameters;
}

function resolvedClinicalContext(model: IntelligentExamModel, configuration: AdaptiveExamConfiguration, variables: Record<string, string | boolean>) {
  const explicitPurpose = String(variables.finalidade_avaliacao ?? "").trim();
  if (explicitPurpose) return explicitPurpose;

  const focus = model.id === "gineco_usg_monitorizacao_folicular"
    ? String(variables.foco_monitorizacao ?? variables.papel_no_protocolo ?? "").trim()
    : "";
  if (focus) return focus;

  const role = String(variables.papel_no_protocolo ?? "").trim();
  if (role && normalizedFieldKey(role) !== "avaliacao_geral_fora_de_fiv") return role;

  const configured = String(configuration.clinicalContext || "").trim();
  if (configured) {
    const available = model.clinicalContexts || [];
    if (!available.length || available.some((item) => normalizedFieldKey(item) === normalizedFieldKey(configured))) {
      return configured;
    }
  }

  if (model.adapter.kind === "clinical-context" || model.adapter.kind === "bond-type") {
    const adapter = String(configuration.adapterValue || "").trim();
    if (adapter) return adapter;
  }

  return defaultClinicalContext(model);
}

function profileForClinicalContext(model: IntelligentExamModel, configuration: AdaptiveExamConfiguration, clinicalContext: string) {
  const selected = model.profiles.find((item) => item.id === configuration.profileId);
  const defaultId = model.editorModel.defaultProfileId;
  if (selected && selected.id !== defaultId && selected.id !== "normal") return selected;

  const contextKey = normalizedFieldKey(clinicalContext);
  const contextual = model.profiles.find((item) =>
    item.status === "contextual"
    && (normalizedFieldKey(item.id) === contextKey || normalizedFieldKey(item.name) === contextKey),
  );
  return contextual
    || selected
    || model.profiles.find((item) => item.id === defaultId)
    || model.profiles.find((item) => item.id === "normal")
    || model.profiles[0];
}

export function resolveAdaptiveExam(
  model: IntelligentExamModel,
  configuration: AdaptiveExamConfiguration,
  patientContext: AdaptivePatientContext = {},
): AdaptiveResolvedExam {
  const safeConfiguration = configuration.examId === model.id ? configuration : createInitialAdaptiveConfiguration(model);
  const technicalVariables = clinicalVariableFields(model, safeConfiguration);
  const resolvedVariables: Record<string, string | boolean> = { ...safeConfiguration.variables };
  technicalVariables.forEach((field) => {
    if (resolvedVariables[field.id] === undefined || String(resolvedVariables[field.id]).trim() === "") {
      resolvedVariables[field.id] = field.value;
    }
  });
  const clinicalContext = resolvedClinicalContext(model, safeConfiguration, resolvedVariables);
  const profile = profileForClinicalContext(model, safeConfiguration, clinicalContext);
  const dynamicFields = [
    adapterField(model, safeConfiguration),
    profileField(model, { ...safeConfiguration, profileId: profile?.id || safeConfiguration.profileId }),
    secondaryAdapterField(model, safeConfiguration),
    ...technicalVariables,
  ].filter(Boolean) as AdaptiveDynamicField[];

  return {
    model,
    adapterLabel: model.adapter.label,
    adapterValue: safeConfiguration.adapterValue,
    clinicalContext,
    profile,
    dynamicFields,
    variables: resolvedVariables,
    parameters: contextualParameters(model, resolvedVariables, profile?.id),
    automaticBlocks: model.editorModel.sections.filter((section) => section.visibleByDefault).map((section) => section.id),
    supportsFutureAttachments: model.attachments.mode === "future",
    supportsFutureSmartPagination: true,
    supportsFutureRenderEngine: true,
    generationSeed: mixAdaptiveGenerationSeed(Number(safeConfiguration.generationSeed || 0)),
    patientContext,
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

function mixAdaptiveGenerationSeed(seed: number) {
  const normalized = Number.isFinite(seed) ? seed >>> 0 : 0;
  if (normalized === 0) return 0;

  // O contador da interface continua simples (1, 2, 3...), mas o motor usa
  // uma versão bem misturada dele. Isso evita a forte correlação do FNV-1a
  // quando apenas o último dígito do seed muda.
  let mixed = (normalized + 0x9e3779b9) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x21f0aaad);
  mixed = Math.imul(mixed ^ (mixed >>> 15), 0x735a2d97);
  mixed ^= mixed >>> 15;
  return mixed >>> 0;
}

export function nextAdaptiveGenerationSeed(currentSeed = 0) {
  const normalized = Number.isFinite(Number(currentSeed)) ? Math.max(0, Math.trunc(Number(currentSeed))) : 0;
  return normalized >= 0xffffffff ? 1 : normalized + 1;
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
  // Fluxo legado mantido para os modelos que já utilizavam variação própria.
  return varyNumericText(value, parameter, 0.04, seed);
}

function constrainRefreshedNumberToReferenceSegment(
  original: number,
  candidate: number,
  parameter: IntelligentExamParameter,
  displayStep: number,
) {
  const reference = parameter.referencia || "";
  const numbers = Array.from(new Set(extractReferenceNumbers(reference))).sort((a, b) => a - b);
  if (!numbers.length) return candidate;

  const safeStep = Math.max(displayStep, Number.EPSILON);
  const simpleRange = numbers.length === 2 && /[–-]|\b(?:a|entre)\b/i.test(reference) && !/[|/]/.test(reference);

  if (simpleRange) {
    const lower = numbers[0];
    const upper = numbers[1];
    if (original >= lower && original <= upper) return Math.min(upper, Math.max(lower, candidate));
    if (original < lower) return Math.min(candidate, lower - safeStep);
    return Math.max(candidate, upper + safeStep);
  }

  if (numbers.length === 1) {
    const limit = numbers[0];
    if (/(?:<|≤|até|ate)/i.test(reference)) {
      return original <= limit ? Math.min(candidate, limit - safeStep) : Math.max(candidate, limit + safeStep);
    }
    if (/(?:>|≥)/.test(reference)) {
      return original >= limit ? Math.max(candidate, limit + safeStep) : Math.min(candidate, limit - safeStep);
    }
    return candidate;
  }

  // Referências com várias faixas (ex.: AMH) mantêm a nova amostra dentro
  // do mesmo segmento numérico do valor-base, evitando trocar o perfil clínico.
  const lowerThreshold = [...numbers].reverse().find((value) => value < original);
  const upperThreshold = numbers.find((value) => value > original);
  const lower = lowerThreshold === undefined ? Number.NEGATIVE_INFINITY : lowerThreshold + safeStep;
  const upper = upperThreshold === undefined ? Number.POSITIVE_INFINITY : upperThreshold - safeStep;
  return Math.min(upper, Math.max(lower, candidate));
}

function numericTokenDecimalPlaces(token: string) {
  const unsigned = token.trim().replace(/^[+-]/, "");
  if (unsigned.includes(",")) return unsigned.split(",")[1]?.length || 0;
  if (unsigned.includes(".")) {
    const parsed = parsePtNumber(unsigned);
    const asThousands = /^\d{1,3}(?:\.\d{3})+$/.test(unsigned) && parsed >= 1000;
    if (!asThousands) return unsigned.split(".")[1]?.length || 0;
  }
  return 0;
}

function formatRefreshedNumber(value: number, originalToken: string, parameter: IntelligentExamParameter) {
  const tokenDecimals = numericTokenDecimalPlaces(originalToken);
  const decimals = tokenDecimals > 0
    ? tokenDecimals
    : referenceDecimalPlaces(parameter.referencia || originalToken, parameter.unidade);
  const rounded = Number(value.toFixed(decimals));
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded);
}

function refreshExplicitNumericResult(value: string, parameter: IntelligentExamParameter, seed: string) {
  const match = value.match(/[-+]?(?:\d{1,3}(?:\.\d{3})+|\d+(?:[,.]\d+)?)/);
  if (!match) return value;

  const originalToken = match[0];
  const original = parsePtNumber(originalToken);
  // Zero pode ter significado clínico próprio (ex.: probabilidade de exclusão)
  // e não deve virar um valor artificial apenas por atualizar os achados.
  if (!Number.isFinite(original) || original === 0) return value;

  const tokenDecimals = numericTokenDecimalPlaces(originalToken);
  const decimals = tokenDecimals > 0
    ? tokenDecimals
    : referenceDecimalPlaces(parameter.referencia || originalToken, parameter.unidade);
  const displayStep = 10 ** -decimals;
  const factor = deterministicBetween(`${seed}:refresh`, 0.94, 1.06);
  let candidate = constrainRefreshedNumberToReferenceSegment(original, original * factor, parameter, displayStep);
  let formatted = formatRefreshedNumber(candidate, originalToken, parameter);

  // Em valores pequenos ou próximos do limite, uma variação real pode sumir no
  // arredondamento. Se isso ocorrer, tenta um passo visível sem sair da mesma
  // faixa de referência do valor-base.
  if (formatted === originalToken) {
    const preferUp = seedFraction(`${seed}:direction`) >= 0.5;
    const directions = preferUp ? [1, -1] : [-1, 1];
    const preferredStep = 1 + Math.floor(seedFraction(`${seed}:step`) * 3);
    const magnitudes = [preferredStep, 1, 2, 3].filter((step, index, values) => values.indexOf(step) === index);

    outer: for (const magnitude of magnitudes) {
      for (const direction of directions) {
        candidate = constrainRefreshedNumberToReferenceSegment(
          original,
          original + direction * displayStep * magnitude,
          parameter,
          displayStep,
        );
        formatted = formatRefreshedNumber(candidate, originalToken, parameter);
        if (formatted !== originalToken) break outer;
      }
    }
  }

  return value.replace(originalToken, formatted);
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
  variables?: Record<string, string | boolean>;
  generationSeed?: number;
};

type BetaHcgGestationalRange = {
  min: number;
  max: number;
  startWeek: number;
  endWeek: number;
};

const BETA_HCG_EARLY_GESTATIONAL_RANGES: BetaHcgGestationalRange[] = [
  { min: 5, max: 50, startWeek: 3, endWeek: 3 },
  { min: 5, max: 426, startWeek: 4, endWeek: 4 },
  { min: 18, max: 7340, startWeek: 5, endWeek: 5 },
  { min: 1080, max: 56500, startWeek: 6, endWeek: 6 },
  { min: 7650, max: 229000, startWeek: 7, endWeek: 8 },
  { min: 25700, max: 288000, startWeek: 9, endWeek: 12 },
];

function betaHcgNumber(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return Number.NaN;
  const token = raw.match(/[0-9][0-9.,]*/)?.[0] || "";
  return token ? parsePtNumber(token) : Number.NaN;
}

function betaHcgGeneratedValue(profileId: string, referredWeeks: unknown, generationSeed: number) {
  if (profileId === "negativo") {
    return Number(deterministicBetween(`beta:negative:${generationSeed}`, 0.4, 4.6).toFixed(1));
  }

  const weeks = betaHcgNumber(referredWeeks);
  const compatible = Number.isFinite(weeks) && weeks > 0
    ? BETA_HCG_EARLY_GESTATIONAL_RANGES.filter((range) => weeks >= range.startWeek && weeks <= range.endWeek)
    : [];
  const min = compatible.length ? Math.max(25, Math.min(...compatible.map((range) => range.min))) : 25;
  const max = compatible.length ? Math.max(min + 1, Math.max(...compatible.map((range) => range.max))) : 120000;
  const fraction = deterministicBetween(`beta:positive:${weeks || "unknown"}:${generationSeed}`, 0.18, 0.82);
  const value = Math.exp(Math.log(min) + fraction * (Math.log(max) - Math.log(min)));
  return Math.max(25, Math.round(value));
}

function betaHcgGestationalEstimate(value: unknown) {
  const numeric = betaHcgNumber(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "Informe o valor quantitativo do β-hCG para calcular a estimativa gestacional.";
  }
  if (numeric < 25) {
    return "Valor baixo/limítrofe para estimativa gestacional isolada; correlacionar clinicamente e considerar controle seriado.";
  }

  const compatible = BETA_HCG_EARLY_GESTATIONAL_RANGES.filter((range) => numeric >= range.min && numeric <= range.max);
  if (!compatible.length) {
    if (numeric > 288000) {
      return "Valor acima da faixa usada pelo motor para estimativa inicial; confirmar idade gestacional por DUM e/ou ultrassonografia.";
    }
    return "Sem correspondência gestacional segura pelo valor isolado informado.";
  }

  const startWeek = Math.min(...compatible.map((range) => range.startWeek));
  const endWeek = Math.max(...compatible.map((range) => range.endWeek));
  const weekText = startWeek === endWeek ? `${startWeek} semanas` : `${startWeek}–${endWeek} semanas`;
  return `Compatível aproximadamente com ${weekText}; estimativa laboratorial com faixas sobrepostas, confirmar por DUM e/ou ultrassonografia.`;
}

function betaHcgGestationalCompatibility(value: unknown, referredWeeks: unknown) {
  const numeric = betaHcgNumber(value);
  const weeks = betaHcgNumber(referredWeeks);
  if (!Number.isFinite(weeks) || weeks <= 0) return betaHcgGestationalEstimate(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return `Idade gestacional referida: ${weeks} semanas; informe o valor quantitativo para correlação.`;

  const ranges = BETA_HCG_EARLY_GESTATIONAL_RANGES.filter((range) => weeks >= range.startWeek && weeks <= range.endWeek);
  if (!ranges.length) {
    return `Idade gestacional referida: ${weeks} semanas. O β-hCG isolado não é adequado para datar com precisão essa etapa; correlacionar com DUM e ultrassonografia.`;
  }

  const min = Math.min(...ranges.map((range) => range.min));
  const max = Math.max(...ranges.map((range) => range.max));
  if (numeric >= min && numeric <= max) {
    return `Valor compatível com a faixa ampla esperada para aproximadamente ${weeks} semanas; confirmar evolução por DUM e/ou ultrassonografia.`;
  }
  return `Valor fora da faixa ampla usada pelo motor para ${weeks} semanas informadas; revisar idade gestacional, contexto de FIV e evolução seriada antes de concluir.`;
}

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
  const runtimeVariables = runtime?.variables || {};
  const protocolRole = model.id === "gineco_usg_monitorizacao_folicular"
    ? String(runtimeVariables.foco_monitorizacao ?? runtimeVariables.papel_no_protocolo ?? "").trim()
    : String(runtimeVariables.papel_no_protocolo ?? "").trim();
  const protocolRoleKey = normalizedFieldKey(protocolRole);
  const stimulationDay = String(runtimeVariables.dia_estimulacao ?? "").trim();
  const endometrialPrepDay = String(runtimeVariables.dia_preparo_endometrial ?? "").trim();
  const directVariable = runtimeVariables[parameter.id];

  if (model.id === "hormonal_painel_hormonal_completo" && parameter.id === "fase_ciclo" && protocolRoleKey) {
    if (protocolRoleKey.includes("doadora")) {
      return stimulationDay ? `FIV — estimulação ovariana (dia ${stimulationDay})` : "FIV — estimulação ovariana";
    }
    if (protocolRoleKey.includes("receptora") || protocolRoleKey.includes("gestante")) {
      return endometrialPrepDay ? `FIV — preparo endometrial (dia ${endometrialPrepDay})` : "FIV — preparo endometrial";
    }
  }

  if (directVariable !== undefined && directVariable !== null && String(directVariable).trim() !== "") {
    return String(directVariable);
  }
  if (parameter.id === "incidencia" && runtimeVariables.incidencias) return String(runtimeVariables.incidencias);
  if (parameter.id === "uso_contraste" && runtimeVariables.contraste) return String(runtimeVariables.contraste);

  if (clinicalContext && hasAny(parameterText, ["contexto clínico", "contexto clinico", "indicação clínica", "indicacao clinica", "correlação clínica", "correlacao clinica"])) {
    return clinicalContext;
  }
  if (hasAny(parameterText, ["impressão", "impressao", "classificação", "classificacao"])) {
    if (model.id === "gineco_usg_monitorizacao_folicular") {
      if (protocolRoleKey.includes("folicul") || protocolRoleKey.includes("doadora")) {
        return profile.status === "normal" || profile.id === "normal"
          ? "Desenvolvimento folicular em acompanhamento, com resposta ovariana compatível com a etapa avaliada"
          : profile.results?.[parameter.id]?.trim() || "Desenvolvimento folicular a correlacionar com a evolução seriada";
      }
      if (protocolRoleKey.includes("endometr") || protocolRoleKey.includes("receptora") || protocolRoleKey.includes("gestante")) {
        return profile.status === "normal" || profile.id === "normal"
          ? "Endométrio em acompanhamento, com padrão e espessura compatíveis com a etapa avaliada"
          : profile.results?.[parameter.id]?.trim() || "Endométrio a correlacionar com a evolução seriada";
      }
    }

    if (model.id === "hormonal_painel_hormonal_completo" && protocolRoleKey) {
      if (protocolRoleKey.includes("doadora")) {
        return profile.status === "normal" || profile.id === "normal"
          ? "Perfil hormonal em acompanhamento de estimulação ovariana para FIV"
          : profile.results?.[parameter.id]?.trim() || "Perfil hormonal a correlacionar com a resposta ao estímulo ovariano";
      }
      if (protocolRoleKey.includes("receptora") || protocolRoleKey.includes("gestante")) {
        return profile.status === "normal" || profile.id === "normal"
          ? "Perfil hormonal em acompanhamento de preparo endometrial para transferência embrionária"
          : profile.results?.[parameter.id]?.trim() || "Perfil hormonal a correlacionar com o preparo endometrial";
      }
    }

    // Raio-X e Psicotécnico permanecem exatamente no fluxo legado. Nos demais
    // modelos, a impressão/classificação curada do perfil tem prioridade sobre
    // o resumo genérico, evitando frases soltas no lugar do resultado técnico.
    if (model.id !== "img_raio_x_unico" && model.id !== "psiquiatria_psicotecnico") {
      const explicitImpression = profile.results?.[parameter.id]?.trim();
      if (explicitImpression && !isGenericResult(explicitImpression)) return explicitImpression;
    }
    return profile.resultSummary.replace(/[.]$/, "");
  }

  // O adaptador é uma informação clínica selecionada pelo profissional e deve
  // prevalecer sobre qualquer texto genérico sugerido pelo motor.
  if (adapterValue && model.adapter.enabled && model.adapter.kind !== "clinical-context") {
    if (
      parameter.id === model.adapter.id
      || hasAny(parameterText, [
        "local examinado",
        "região examinada",
        "regiao examinada",
        "região / tipo",
        "regiao / tipo",
        "tipo de ultrassonografia",
        "articulação avaliada",
        "articulacao avaliada",
      ])
    ) {
      return adapterValue;
    }
  }

  if (model.id === "lab_teste_dna" && parameter.id === "finalidade" && adapterValue) {
    return adapterValue;
  }

  if (model.id === "lab_beta_hcg_completo") {
    const referredWeeks = String(runtimeVariables.idade_gestacional_referida ?? "").trim();

    if (profile.id === "negativo" || profile.id === "positivo") {
      const isPositive = profile.id === "positivo";
      const generatedBeta = betaHcgGeneratedValue(profile.id, referredWeeks, generationSeed);
      const generatedBetaText = isPositive
        ? `${formatPtNumber(generatedBeta, "0", "mUI/mL")} mUI/mL`
        : `${formatPtNumber(generatedBeta, "0.0", "mUI/mL")} mUI/mL`;
      if (parameter.id === "tipo_exame") return "Quantitativo";
      if (parameter.id === "resultado_qualitativo") return isPositive ? "Positivo" : "Negativo";
      if (parameter.id === "beta_hcg_quantitativo") return generatedBetaText;
      if (parameter.id === "idade_gestacional_referida") return isPositive ? (referredWeeks ? `${referredWeeks} semanas` : "Não informada") : null;
      if (parameter.id === "correspondencia_gestacional") {
        if (!isPositive) return "Sem estimativa gestacional para resultado negativo.";
        return referredWeeks
          ? betaHcgGestationalCompatibility(generatedBeta, referredWeeks)
          : betaHcgGestationalEstimate(generatedBeta);
      }
      if (parameter.id === "evolucao_seriada") {
        return isPositive
          ? "Avaliar tendência apenas quando houver dosagens seriadas e indicação clínica"
          : "Sem curva seriada definida neste resultado isolado";
      }
      if (parameter.id === "impressao") return isPositive ? "β-hCG positivo" : "β-hCG negativo";
      return null;
    }

    // Compatibilidade com rascunhos/configurações anteriores do Beta-hCG.
    const legacyValues: Record<string, Record<string, string>> = {
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
    return legacyValues[profile.id]?.[parameter.id] || null;
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
  const context = String(resolved.variables.finalidade_avaliacao || "Rotina").toLowerCase();
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
    // Os valores curados continuam sendo a base do perfil. Ao atualizar os
    // achados, porém, parâmetros numéricos precisam gerar uma nova amostragem
    // coerente em vez de repetir indefinidamente o mesmo valor. O seed 0
    // preserva exatamente o valor-base do modelo; seeds seguintes aplicam uma
    // variação pequena e determinística somente a resultados mensuráveis.
    const sourceField = model.campos.find((field) => normalizedFieldKey(field.id) === normalizedFieldKey(parameter.id));
    const hasNumericReference = extractReferenceNumbers(parameter.referencia || "").length > 0;
    const isMeasuredNumeric = /\d/.test(explicitResult)
      && (Boolean(parameter.unidade) || (sourceField?.tipo === "number" && hasNumericReference));
    const isLegacyVariableModel = model.id === "img_raio_x_unico";
    const shouldRefreshMeasuredValue = generationSeed > 0
      && profile.status !== "personalizado"
      && isMeasuredNumeric;
    const result = isLegacyVariableModel
      ? adaptiveExplicitResult(explicitResult, parameter, generationKey)
      : shouldRefreshMeasuredValue
        ? refreshExplicitNumericResult(explicitResult, parameter, generationKey)
        : explicitResult;
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
  return `<table class="hpsr-exam-table"><thead><tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${htmlEscape(cell || "-")}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function contextualReference(resolved: AdaptiveResolvedExam, parameter: IntelligentExamParameter) {
  const fallback = parameter.referencia || "Conforme método / contexto clínico";
  if (resolved.model.id !== "hormonal_painel_hormonal_completo") return fallback;

  const role = normalizedFieldKey(String(resolved.variables.papel_no_protocolo ?? ""));
  if (!role.includes("doadora") && !role.includes("receptora") && !role.includes("gestante")) return fallback;

  if (parameter.id === "fase_ciclo") return "Contexto do protocolo de reprodução assistida";
  if (role.includes("doadora")) {
    if (parameter.id === "fsh") return "Interpretar conforme protocolo de estimulação ovariana";
    if (parameter.id === "lh") return "Avaliação seriada conforme resposta ao estímulo";
    if (parameter.id === "estradiol") return "Evolução seriada conforme resposta folicular";
    if (parameter.id === "progesterona") return "Interpretar conforme etapa do estímulo e programação do gatilho";
  }
  if (role.includes("receptora") || role.includes("gestante")) {
    if (parameter.id === "fsh" || parameter.id === "lh") return "Interpretar conforme protocolo de preparo endometrial";
    if (parameter.id === "estradiol") return "Interpretar conforme esquema e etapa do preparo endometrial";
    if (parameter.id === "progesterona") return "Interpretar conforme fase do preparo e início do suporte progestagênico";
  }
  return fallback;
}

function parameterRows(resolved: AdaptiveResolvedExam) {
  return orderParametersByContext(resolved, resolved.parameters).map((parameter) => [
    parameter.label,
    resultForParameter(resolved.model, parameter, resolved.profile, resolved),
    contextualReference(resolved, parameter),
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

function simplifyClinicalNarrative(value: string) {
  return value
    .replace(/\bresultados? objetivos?\b/gi, "resultados")
    .replace(/\bachados objetivos?\b/gi, "achados")
    .replace(/correlacionar com o quadro clínico/gi, "correlacionar com a clínica")
    .replace(/correlacionar com o contexto clínico/gi, "correlacionar com a clínica")
    .replace(/conforme avaliação técnica do método/gi, "conforme o método")
    .replace(/de significado inespecífico isoladamente/gi, "de significado inespecífico isolado")
    .replace(/mantendo coerência com os limites e padrões técnicos informados/gi, "mantendo coerência com os padrões informados")
    .replace(/Os achados devem ser interpretados em conjunto com os dados clínicos, ocupacionais e administrativos disponíveis\./gi, "A interpretação deve considerar os dados clínicos e administrativos disponíveis.")
    .replace(/Este exame não determina, isoladamente, o grau de comprometimento funcional, o momento exato do uso ou a frequência de exposição à substância pesquisada\./gi, "Este exame não define, sozinho, o grau de comprometimento funcional nem o momento exato da exposição.")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function clinicalDetail(resolved: AdaptiveResolvedExam) {
  const detail = String(resolved.variables.contexto_clinico ?? "").trim();
  return detail;
}

function patientAgeDescription(resolved: AdaptiveResolvedExam) {
  const age = String(resolved.patientContext.age || "").trim();
  if (!age) return "";
  const number = Number(age.replace(/[^0-9.,]/g, "").replace(",", "."));
  if (!Number.isFinite(number)) return `faixa etária informada: ${age}`;
  if (number < 1) return `paciente com idade inferior a 1 ano`;
  if (number < 12) return `paciente pediátrico de ${age} ${Number(age) === 1 ? "ano" : "anos"}`;
  if (number < 18) return `paciente adolescente de ${age} anos`;
  if (number >= 60) return `paciente de ${age} anos, em faixa etária idosa`;
  return `paciente de ${age} anos`;
}

function isRoutineContext(value: string) {
  const key = normalizedFieldKey(value);
  return !key || key === "rotina" || key === "monitorizacao_convencional" || key === "avaliacao_geral_fora_de_fiv";
}

function contextKeywords(resolved: AdaptiveResolvedExam) {
  const context = normalizedFieldKey(resolved.clinicalContext);
  const model = normalizedFieldKey(`${resolved.model.id} ${resolved.model.nome} ${resolved.model.categoria}`);
  const detail = normalizedFieldKey(clinicalDetail(resolved));
  const keywords = new Set<string>();
  const add = (...values: string[]) => values.forEach((value) => keywords.add(normalizedFieldKey(value)));

  if (/trauma/.test(context)) add("fratura", "alinhamento", "continuidade", "lesao", "edema", "hemorragia", "partes moles");
  if (/dor/.test(context)) add("inflamacao", "edema", "lesao", "articulacao", "obstrucao", "massa", "cisto", "compressao");
  if (/pos_operatorio|controle_pos_operatorio/.test(context)) add("alinhamento", "material", "colecao", "cicatrizacao", "complicacao", "edema");
  if (/oncolog/.test(context)) add("massa", "nodulo", "lesao", "linfonodo", "infiltracao", "metastase", "volume");
  if (/rastreamento/.test(context)) add("triagem", "alteracao", "marcador", "risco");
  if (/controle|acompanhamento|seguimento/.test(context)) add("evolucao", "controle", "comparacao", "tendencia");
  if (/suspeita_clinica/.test(context)) add("alteracao", "marcador", "inflamacao", "infeccao");
  if (/porte_de_arma/.test(context)) add("atencao", "impulsividade", "controle emocional", "decisao", "julgamento");
  if (/pilotagem/.test(context)) add("atencao", "tempo de reacao", "coordenacao", "equilibrio", "decisao");
  if (/primeiro_trimestre/.test(context)) add("idade gestacional", "batimentos", "embriao", "feto", "biometria");
  if (/segundo_trimestre/.test(context)) add("biometria", "placenta", "liquido amniotico", "crescimento", "batimentos");
  if (/terceiro_trimestre/.test(context)) add("biometria", "crescimento", "placenta", "liquido amniotico", "apresentacao", "batimentos");
  if (/gemelar/.test(context)) add("feto", "fetos", "batimentos", "biometria", "placenta", "liquido amniotico");
  if (/gestacao_de_risco/.test(context)) add("crescimento", "doppler", "placenta", "liquido amniotico", "batimentos", "biometria");
  if (/infertilidade/.test(context)) add("fsh", "lh", "estradiol", "progesterona", "prolactina", "tsh", "amh");
  if (/sop/.test(context)) add("lh", "fsh", "androgen", "testosterona", "estradiol");
  if (/menopausa/.test(context)) add("fsh", "lh", "estradiol");
  if (/masculino/.test(context)) add("testosterona", "fsh", "lh", "prolactina", "tsh");
  if (/pediatr/.test(context) || /pediatria|neonatal/.test(model)) add("idade", "desenvolvimento", "crescimento", "saturacao", "frequencia");
  if (/fiv|doadora|receptora|gestante/.test(context)) add("estradiol", "progesterona", "lh", "foliculo", "endometrio", "espessura");

  detail.split("_").filter((token) => token.length >= 4 && !new Set(["para", "com", "sem", "uma", "pela", "pelo", "clinico", "clinica"]).has(token)).forEach((token) => keywords.add(token));
  if (/infecc|bacter|febre/.test(detail)) add("leucocito", "neutrofilo", "linfocito", "bacteria", "nitrito", "cultura", "microorganismo");
  if (/anemia|cansaco|palidez/.test(detail)) add("hemoglobina", "hematocrito", "vcm", "hcm", "ferritina", "ferro", "reticulocito");
  if (/renal|rim|creatin|ureia/.test(detail)) add("creatinina", "ureia", "filtracao", "egfr", "proteinuria");
  if (/hepatic|figado|icter|transamin/.test(detail)) add("ast", "alt", "tgo", "tgp", "ggt", "bilirrubina", "fosfatase");
  if (/glic|diabet|hiperglic|hipoglic/.test(detail)) add("glicose", "glicemia", "hba1c", "hemoglobina glicada");
  if (/alerg|urtic|prurido/.test(detail)) add("ige", "eosinofilo", "alergeno", "sensibilidade");
  if (/urin|disuria|cistite/.test(detail)) add("leucocito", "nitrito", "bacteria", "cultura", "hemacia");
  if (/tireo/.test(detail)) add("tsh", "t4", "t3", "tireoide");
  if (/palpit|tontura|sincope/.test(detail)) add("ritmo", "frequencia", "intervalo", "pressao", "arritmia");
  if (/dispne|falta_de_ar|respirat/.test(detail)) add("saturacao", "frequencia respiratoria", "volume", "capacidade", "fluxo");
  return [...keywords].filter(Boolean);
}

function parameterContextScore(resolved: AdaptiveResolvedExam, parameter: IntelligentExamParameter, index: number) {
  if (isRoutineContext(resolved.clinicalContext) && !clinicalDetail(resolved)) return -index / 1000;
  const text = normalizedFieldKey(`${parameter.id} ${parameter.label} ${parameter.interpretationHint || ""}`);
  const score = contextKeywords(resolved).reduce((total, keyword) => total + (text.includes(keyword) ? 5 : 0), 0);
  const id = normalizedFieldKey(parameter.id);
  if (/impressao|conclusao/.test(id)) return -1000 - index;
  return score - index / 1000;
}

function orderParametersByContext(resolved: AdaptiveResolvedExam, parameters: IntelligentExamParameter[]) {
  // O psicotécnico monta tabelas por grupos fixos e depende da ordem original.
  if (resolved.model.id === "psiquiatria_psicotecnico") return parameters;
  if (isRoutineContext(resolved.clinicalContext) && !clinicalDetail(resolved)) return parameters;
  return parameters
    .map((parameter, index) => ({ parameter, index, score: parameterContextScore(resolved, parameter, index) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.parameter);
}

function contextualMethodFocus(resolved: AdaptiveResolvedExam) {
  const context = resolved.clinicalContext.trim();
  const key = normalizedFieldKey(context);
  const detail = clinicalDetail(resolved);
  const age = patientAgeDescription(resolved);
  const modelText = normalizedFieldKey(`${resolved.model.id} ${resolved.model.categoria}`);
  const parts: string[] = [];

  const dedicatedPurposeNarrative = resolved.model.id === "psiquiatria_psicotecnico" || resolved.model.id === "gineco_usg_monitorizacao_folicular";
  if (detail) parts.push(`avaliação direcionada para ${detail}`);
  else if (!dedicatedPurposeNarrative && !isRoutineContext(context) && key !== "personalizado") parts.push(`avaliação direcionada ao contexto de ${context.toLowerCase()}`);

  if (/controle|acompanhamento|seguimento/.test(key)) parts.push("com atenção à evolução e à comparação com resultados anteriores quando disponíveis");
  else if (/rastreamento/.test(key)) parts.push("com foco em rastreamento e identificação de alterações relevantes");
  else if (/suspeita_clinica/.test(key)) parts.push("com foco nos achados relacionados à hipótese clínica informada");
  else if (/trauma/.test(key)) parts.push("priorizando integridade estrutural, alinhamento e sinais de lesão traumática");
  else if (/dor/.test(key)) parts.push("priorizando alterações que possam explicar o sintoma informado na região avaliada");
  else if (/pos_operatorio/.test(key)) parts.push("priorizando o aspecto do sítio tratado, alinhamento e sinais de complicação");
  else if (/oncolog/.test(key)) parts.push("priorizando lesões focais, massas e sinais de progressão ou resposta ao acompanhamento");
  else if (/ocupacional|administrativo|porte_de_arma|pilotagem|treinamento_de_combate/.test(key) && resolved.model.id === "geral_exame_toxicologico") parts.push("com finalidade documental compatível com a atividade informada");

  if (/obstetricia|gineco|pediatria|neonatal|hormonal/.test(modelText) && age) parts.push(`considerando ${age}`);
  if ((resolved.model.id === "lab_teste_coombs" || resolved.model.id === "lab_anticorpos_irregulares") && resolved.patientContext.bloodType) {
    parts.push(`considerando o tipo sanguíneo informado (${resolved.patientContext.bloodType})`);
  }

  const gestationalAge = String(resolved.variables.idade_gestacional ?? resolved.variables.idade_gestacional_referida ?? "").trim();
  const fetuses = String(resolved.variables.numero_fetos ?? "").trim();
  const fiv = String(resolved.variables.fiv ?? "").trim();
  const risk = String(resolved.variables.risco ?? "").trim();
  if (gestationalAge) parts.push(`considerando idade gestacional informada de ${gestationalAge}${/sem/i.test(gestationalAge) ? "" : " semanas"}`);
  if (fetuses && Number(fetuses) > 1) parts.push(`com avaliação de gestação múltipla (${fetuses} fetos informados)`);
  if (/^sim$/i.test(fiv)) parts.push("no contexto de gestação por fertilização in vitro");
  if (/^sim$/i.test(risk)) parts.push("com atenção adicional ao contexto de gestação de risco informado");

  if (resolved.model.id === "lab_teste_dna") {
    const participants = String(resolved.variables.participantes ?? "").trim();
    const motherPresent = String(resolved.variables.mae_presente ?? "").trim();
    if (participants) parts.push(`considerando ${participants} participantes informados`);
    if (motherPresent && normalizedFieldKey(motherPresent) !== "nao_se_aplica") parts.push(`presença materna informada: ${motherPresent.toLowerCase()}`);
  }

  return parts.join(", ");
}

function generalContextNarrative(resolved: AdaptiveResolvedExam, kind: "interpretation" | "conclusion") {
  const context = resolved.clinicalContext.trim();
  const key = normalizedFieldKey(context);
  const detail = clinicalDetail(resolved);
  if (resolved.model.id === "psiquiatria_psicotecnico") return "";
  if (resolved.model.id === "gineco_usg_monitorizacao_folicular") return "";
  if (resolved.model.id === "hormonal_painel_hormonal_completo") {
    const role = normalizedFieldKey(String(resolved.variables.papel_no_protocolo ?? ""));
    if (role.includes("doadora") || role.includes("receptora") || role.includes("gestante")) return "";
  }

  if (resolved.model.id === "lab_beta_hcg_completo") {
    const referred = String(resolved.variables.idade_gestacional_referida ?? "").trim();
    if (resolved.profile.id === "positivo" && referred) {
      return kind === "interpretation"
        ? `A leitura do β-hCG considera a idade gestacional informada de ${referred} semanas, usando o valor quantitativo como dado complementar e não como datação isolada.`
        : `β-hCG positivo interpretado no contexto de aproximadamente ${referred} semanas informadas; a evolução gestacional deve ser integrada à DUM, FIV quando aplicável e ultrassonografia.`;
    }
  }

  if (resolved.model.id === "lab_beta_hcg_completo" && /gestacao|fiv|abortamento|seguimento/.test(key)) {
    const target = key.includes("fiv") ? "fertilização in vitro"
      : key.includes("abortamento") ? "acompanhamento após suspeita/evento gestacional"
        : key.includes("seguimento") ? "seguimento gestacional"
          : "avaliação gestacional";
    return kind === "interpretation"
      ? `O β-hCG é interpretado no contexto de ${target}, valorizando o valor quantitativo, a idade gestacional informada e a tendência seriada quando houver dosagens anteriores.`
      : `Conclusão do β-hCG contextualizada para ${target}; a leitura isolada do valor não substitui a correlação com DUM, ultrassonografia e evolução clínica.`;
  }

  if (resolved.model.id === "lab_teste_dna" && resolved.adapterValue) {
    const bond = resolved.adapterValue.replace(/^Investigação\s+de\s+/i, "").trim();
    return kind === "interpretation"
      ? `A análise genética foi estruturada para ${bond.toLowerCase()}, considerando o conjunto de marcadores e os participantes informados no motor.`
      : `Conclusão genética emitida especificamente para ${bond.toLowerCase()}, conforme a compatibilidade dos marcadores analisados.`;
  }

  if (resolved.model.id === "hormonal_painel_hormonal_completo" && /infertilidade|sop|menopausa|masculino|pediatr/.test(key)) {
    const focus = key.includes("infertilidade") ? "eixo reprodutivo e fatores hormonais relacionados à fertilidade"
      : key.includes("sop") ? "padrão ovulatório e equilíbrio entre gonadotrofinas e hormônios ovarianos"
        : key.includes("menopausa") ? "padrão hormonal compatível com transição menopausal"
          : key.includes("masculino") ? "eixo gonadal masculino e hormônios reguladores"
            : "interpretação hormonal compatível com a faixa etária pediátrica informada";
    return kind === "interpretation"
      ? `O painel foi organizado para o contexto de ${context.toLowerCase()}, com foco em ${focus}.`
      : `Conclusão hormonal contextualizada para ${context.toLowerCase()}, considerando os parâmetros mais relevantes para ${focus}.`;
  }

  if (/primeiro_trimestre|segundo_trimestre|terceiro_trimestre|gemelar|gestacao_de_risco/.test(key)) {
    const gestationalAge = String(resolved.variables.idade_gestacional ?? "").trim();
    const fetuses = String(resolved.variables.numero_fetos ?? "").trim();
    const contextBits = [context, gestationalAge ? `${gestationalAge}${/sem/i.test(gestationalAge) ? "" : " semanas"}` : "", fetuses && Number(fetuses) > 1 ? `${fetuses} fetos` : ""].filter(Boolean).join(" · ");
    return kind === "interpretation"
      ? `A leitura obstétrica foi organizada para ${contextBits}, priorizando vitalidade, crescimento, biometria, placenta e líquido amniótico conforme a etapa informada.`
      : `Conclusão obstétrica contextualizada para ${contextBits}, com síntese dos achados mais relevantes para a etapa gestacional informada.`;
  }

  if (/controle|acompanhamento|seguimento/.test(key)) {
    return kind === "interpretation"
      ? `Os resultados são apresentados como exame de ${context.toLowerCase()}, priorizando tendência e evolução; quando houver exames anteriores, a comparação seriada é mais informativa que um valor isolado.`
      : `Resultado de ${context.toLowerCase()} sintetizado conforme o padrão atual, devendo a evolução ser comparada com registros prévios quando disponíveis.`;
  }
  if (/rastreamento/.test(key)) {
    return kind === "interpretation"
      ? "A leitura foi direcionada para rastreamento, destacando alterações que mereçam investigação sem transformar achados isolados em diagnóstico definitivo."
      : "Exame de rastreamento concluído conforme os achados descritos; alterações relevantes devem ser confirmadas ou acompanhadas conforme o contexto assistencial.";
  }
  if (/suspeita_clinica/.test(key) || detail) {
    const target = detail || "a suspeita clínica informada";
    return kind === "interpretation"
      ? `A leitura foi direcionada para ${target}, dando maior peso aos parâmetros relacionados a essa hipótese sem ignorar os demais achados do exame.`
      : `Conclusão organizada para responder a ${target}, conforme os resultados objetivos descritos.`;
  }
  if (/trauma|dor|pos_operatorio|oncolog/.test(key)) {
    const target = key.includes("trauma") ? "trauma"
      : key.includes("dor") ? "dor"
        : key.includes("pos_operatorio") ? "controle pós-operatório"
          : "acompanhamento oncológico";
    return kind === "interpretation"
      ? `A leitura foi direcionada ao contexto de ${target}, priorizando os achados com maior relação com essa finalidade.`
      : `Conclusão estruturada para o contexto de ${target}, destacando os achados diretamente relevantes para a finalidade do exame.`;
  }
  if (/ocupacional|administrativo|porte_de_arma|pilotagem|treinamento_de_combate/.test(key) && resolved.model.id === "geral_exame_toxicologico") {
    return kind === "interpretation"
      ? `O resultado toxicológico é interpretado para finalidade ${context.toLowerCase()}, preservando a distinção entre detecção laboratorial e avaliação funcional.`
      : `Resultado toxicológico emitido para finalidade ${context.toLowerCase()}, conforme as substâncias pesquisadas e a qualidade da amostra.`;
  }

  return "";
}

function technicalMethodNarrative(resolved: AdaptiveResolvedExam) {
  const { model } = resolved;
  const protocolRole = normalizedFieldKey(String(
    model.id === "gineco_usg_monitorizacao_folicular"
      ? (resolved.variables.foco_monitorizacao ?? resolved.variables.papel_no_protocolo ?? "")
      : (resolved.variables.papel_no_protocolo ?? "")
  ));
  let primary = cleanTechnicalSentence(model.technique || model.method);

  if (model.id === "gineco_usg_monitorizacao_folicular") {
    if (protocolRole.includes("folicul") || protocolRole.includes("doadora")) {
      primary = "Ultrassonografia transvaginal seriada com foco no desenvolvimento folicular, incluindo avaliação dos ovários, mensuração dos folículos e pesquisa de sinais de maturação/ovulação";
    } else if (protocolRole.includes("endometr") || protocolRole.includes("receptora") || protocolRole.includes("gestante")) {
      primary = "Ultrassonografia transvaginal seriada com foco endometrial, incluindo avaliação uterina, padrão e espessura do endométrio";
    }
  }

  if (model.id === "psiquiatria_psicotecnico") {
    const purpose = normalizedFieldKey(resolved.clinicalContext);
    if (purpose.includes("porte_de_arma")) {
      primary = "Avaliação presencial estruturada voltada à aptidão para porte de arma, com entrevista dirigida, observação comportamental e tarefas de atenção, controle de impulsos, julgamento, tomada de decisão e resposta psicomotora";
    } else if (purpose.includes("pilotagem")) {
      primary = "Avaliação presencial estruturada voltada à pilotagem aérea, com entrevista dirigida e tarefas de atenção sustentada, tempo de reação, coordenação, autorregulação sob pressão e tomada de decisão";
    }
  }

  const scope = resolved.adapterValue && model.adapter.enabled
    ? `${model.adapter.label}: ${resolved.adapterValue}`
    : "";
  const focusRaw = contextualMethodFocus(resolved);
  const focus = focusRaw ? focusRaw.charAt(0).toUpperCase() + focusRaw.slice(1) : "";
  const parts = [primary, scope, focus].filter(Boolean);
  return simplifyClinicalNarrative(parts.join(". ") + ".");
}

function parameterFindingSentence(label: string, result: string, reference: string) {
  const cleanLabel = cleanTechnicalSentence(label);
  const cleanResult = cleanTechnicalSentence(result);
  const cleanReference = cleanTechnicalSentence(reference);
  const numeric = /\d/.test(cleanResult);
  const qualitative = /ausente|presente|preservad|regular|reduzid|aumentad|positivo|negativo|limítrofe|estenose|edema|cístic|focal|calcifica/i.test(cleanResult);

  if (numeric) return `${cleanLabel}: ${cleanResult} (referência: ${cleanReference}).`;
  if (qualitative) return `${cleanLabel}: ${cleanResult}.`;
  return `${cleanLabel}: ${cleanResult.toLowerCase()}.`;
}

function legacyTechnicalInterpretation(resolved: AdaptiveResolvedExam, rows: string[][]) {
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

function legacyTechnicalConclusion(resolved: AdaptiveResolvedExam, rows: string[][]) {
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

function firstNumericResult(value?: string | null) {
  const token = String(value || "").match(/(?:\d{1,3}(?:\.\d{3})+|\d+(?:[,.]\d+)?)/)?.[0];
  if (!token) return Number.NaN;
  return parsePtNumber(token);
}

function outsideNumericReference(parameter: IntelligentExamParameter, value?: string | null) {
  const reference = parameter.referencia || "";
  const current = firstNumericResult(value);
  const numbers = extractReferenceNumbers(reference);
  if (!Number.isFinite(current) || !numbers.length) return null;

  if (numbers.length >= 2 && /[–-]|\b(?:a|entre)\b/i.test(reference) && !/\//.test(reference)) {
    const lower = Math.min(numbers[0], numbers[1]);
    const upper = Math.max(numbers[0], numbers[1]);
    return current < lower || current > upper;
  }
  if (/(?:<|≤|até|ate)/i.test(reference)) return current > numbers[0];
  if (/(?:>|≥)/.test(reference)) return current < numbers[0];
  return null;
}

function profileChangedRows(resolved: AdaptiveResolvedExam, rows: string[][]) {
  const { model, profile } = resolved;
  const normalProfile = model.profiles.find((item) => item.status === "normal") || model.profiles.find((item) => item.id === "normal");
  if (!normalProfile || normalProfile.id === profile.id) return [];

  const ranked: Array<{ row: string[]; rank: number; index: number }> = [];
  rows.forEach((row, index) => {
    const parameter = model.parameters.find((item) => item.label === row[0]);
    if (!parameter || /impressão|impressao|conclusão|conclusao/i.test(parameter.label || "")) return;
    const current = profile.results?.[parameter.id];
    const normal = normalProfile.results?.[parameter.id];
    if (current == null || normal == null || String(current).trim() === String(normal).trim()) return;

    const outside = outsideNumericReference(parameter, current);
    const normalOutside = outsideNumericReference(parameter, normal);
    if (outside === false && normalOutside === false) return;

    const reference = parameter.referencia || "";
    const hasQualitativeReference = !!reference && reference !== "—" && !/\d/.test(reference);
    const rank = outside === true ? 0 : hasQualitativeReference ? 1 : 2;
    ranked.push({ row, rank, index });
  });

  return ranked.sort((a, b) => a.rank - b.rank || a.index - b.index).map((item) => item.row);
}

function reportEvidenceRows(resolved: AdaptiveResolvedExam, rows: string[][]) {
  const { profile } = resolved;
  const withoutImpression = rows.filter((row) => !/impressão|impressao|conclusão|conclusao/i.test(row[0] || ""));
  if (profile.status === "normal" || profile.id === "normal") return withoutImpression.slice(0, 4);

  const changed = profileChangedRows(resolved, rows);
  return (changed.length ? changed : withoutImpression).slice(0, 4);
}

function narrativeForSelection(resolved: AdaptiveResolvedExam, value?: string | null) {
  let text = String(value || "").trim();
  if (!text) return text;

  if (resolved.model.id === "lab_teste_coombs") {
    const selected = resolved.adapterValue.trim().toLowerCase() === "direto" ? "Coombs direto" : "Coombs indireto";
    text = text.replace(/Coombs\s+(?:direto|indireto)/gi, selected);
  }

  if (resolved.model.id === "lab_teste_dna" && resolved.adapterValue) {
    const relationship = resolved.adapterValue.replace(/^Investigação\s+de\s+/i, "").trim();
    if (relationship) text = text.replace(/paternidade/gi, relationship.toLowerCase());
  }

  return text;
}

function genericNarrativeForProfile(
  resolved: AdaptiveResolvedExam,
  kind: "interpretation" | "conclusion",
) {
  const source = kind === "interpretation" ? resolved.model.interpretation : resolved.model.conclusion;
  if (resolved.profile.status === "normal" || resolved.profile.id === "normal") return source.normal;
  if (resolved.profile.status === "indefinido" || /lim|indef|inconclus/i.test(`${resolved.profile.id} ${resolved.profile.name}`)) {
    return source.undefined;
  }
  return source.altered;
}

function refreshedNarrative(
  resolved: AdaptiveResolvedExam,
  value: string | null | undefined,
  kind: "interpretation" | "conclusion",
) {
  const selected = narrativeForSelection(resolved, value);
  if (!resolved.generationSeed || resolved.profile.status === "personalizado" || !/\d/.test(selected)) return selected;

  // Quando os valores são reamostrados, uma narrativa curada que contém os
  // números antigos ficaria contraditória com a tabela recém-atualizada. Nesse
  // caso usamos a interpretação/conclusão genérica do mesmo perfil clínico e
  // mantemos os valores novos na evidência objetiva logo abaixo.
  return narrativeForSelection(resolved, genericNarrativeForProfile(resolved, kind));
}

function contextualProtocolNarrative(resolved: AdaptiveResolvedExam, kind: "interpretation" | "conclusion") {
  const role = normalizedFieldKey(String(
    resolved.model.id === "gineco_usg_monitorizacao_folicular"
      ? (resolved.variables.foco_monitorizacao ?? resolved.variables.papel_no_protocolo ?? "")
      : (resolved.variables.papel_no_protocolo ?? "")
  ));
  if (!role) return "";

  const stimulationDay = String(resolved.variables.dia_estimulacao ?? "").trim();
  const prepDay = String(resolved.variables.dia_preparo_endometrial ?? "").trim();

  if (resolved.model.id === "gineco_usg_monitorizacao_folicular") {
    if (role.includes("folicul") || role.includes("doadora")) {
      const stage = stimulationDay ? ` no dia ${stimulationDay} informado de estimulação` : "";
      return kind === "interpretation"
        ? `Avaliação seriada com foco nos folículos${stage}, priorizando resposta ovariana, quantidade, dimensões e sinais de maturação/ovulação.`
        : `Monitorização com foco folicular${stage}; a conclusão deve ser correlacionada com a evolução seriada e o objetivo do acompanhamento.`;
    }
    if (role.includes("endometr") || role.includes("receptora") || role.includes("gestante")) {
      const stage = prepDay ? ` no dia ${prepDay} informado de preparo` : "";
      return kind === "interpretation"
        ? `Avaliação seriada com foco no endométrio${stage}, priorizando padrão e espessura endometrial e os achados uterinos relacionados.`
        : `Monitorização com foco endometrial${stage}; a conclusão deve ser correlacionada com a evolução seriada e o objetivo do acompanhamento.`;
    }
  }

  if (resolved.model.id === "hormonal_painel_hormonal_completo") {
    if (role.includes("doadora")) {
      const stage = stimulationDay ? ` no dia ${stimulationDay} de estimulação` : " durante a estimulação ovariana";
      return kind === "interpretation"
        ? `Painel interpretado no contexto de doação de óvulos/FIV${stage}, priorizando a correlação de estradiol, LH e progesterona com a resposta folicular e a monitorização ultrassonográfica.`
        : `Perfil hormonal de acompanhamento da doadora em protocolo de FIV${stage}; a conduta deve ser integrada à evolução folicular e ao protocolo de estimulação.`;
    }
    if (role.includes("receptora") || role.includes("gestante")) {
      const stage = prepDay ? ` no dia ${prepDay} do preparo endometrial` : " durante o preparo endometrial";
      return kind === "interpretation"
        ? `Painel interpretado no contexto de receptora/gestante em FIV${stage}, com ênfase na adequação hormonal ao preparo endometrial e à programação da transferência embrionária.`
        : `Perfil hormonal de acompanhamento do preparo endometrial${stage}, devendo ser integrado à avaliação ultrassonográfica e ao protocolo de transferência.`;
    }
  }

  return "";
}

function technicalInterpretation(resolved: AdaptiveResolvedExam, rows: string[][]) {
  // Exceção expressa do projeto: não alterar o comportamento do Raio-X.
  if (resolved.model.id === "img_raio_x_unico") return legacyTechnicalInterpretation(resolved, rows);

  const evidence = reportEvidenceRows(resolved, rows)
    .map((row) => `${row[0]}: ${row[1]}`)
    .join("; ");
  const protocolContext = contextualProtocolNarrative(resolved, "interpretation");
  const generalContext = generalContextNarrative(resolved, "interpretation");
  const contextual = [protocolContext, generalContext].filter(Boolean).join("\n");
  const narrative = refreshedNarrative(resolved, resolved.profile.interpretation, "interpretation");
  const fallback = refreshedNarrative(resolved, resolved.profile.resultSummary, "interpretation");
  const contextOwnsNarrative = resolved.model.id === "gineco_usg_monitorizacao_folicular" && Boolean(protocolContext);
  const base = contextOwnsNarrative ? protocolContext : [contextual, narrative || fallback].filter(Boolean).join("\n");
  if (!evidence) return simplifyClinicalNarrative(base);

  const noun = isImagingReportModel(resolved.model) ? "Principais achados" : "Principais resultados";
  return simplifyClinicalNarrative(`${base}\n${noun}: ${evidence}.`);
}

function technicalConclusion(resolved: AdaptiveResolvedExam, rows: string[][]) {
  // Exceção expressa do projeto: não alterar o comportamento do Raio-X.
  if (resolved.model.id === "img_raio_x_unico") return legacyTechnicalConclusion(resolved, rows);

  const evidence = reportEvidenceRows(resolved, rows)
    .slice(0, 2)
    .map((row) => `${row[0]}: ${row[1]}`)
    .join("; ");
  const protocolContext = contextualProtocolNarrative(resolved, "conclusion");
  const generalContext = generalContextNarrative(resolved, "conclusion");
  const contextual = [protocolContext, generalContext].filter(Boolean).join("\n");
  const conclusion = refreshedNarrative(resolved, resolved.profile.conclusion, "conclusion")
    || refreshedNarrative(resolved, resolved.profile.resultSummary, "conclusion");
  const contextOwnsNarrative = resolved.model.id === "gineco_usg_monitorizacao_folicular" && Boolean(protocolContext);
  const base = contextOwnsNarrative ? protocolContext : [contextual, conclusion].filter(Boolean).join("\n");
  if (!evidence || /personalizado/i.test(resolved.profile.id)) return simplifyClinicalNarrative(base);
  return simplifyClinicalNarrative(`${base}\nResumo principal: ${evidence}.`);
}

function resultSummaryFromRows(resolved: AdaptiveResolvedExam, rows: string[][]) {
  const { model, profile } = resolved;
  const informative = rows.filter((row) => row[0] && row[1] && !isGenericResult(row[1]));
  if (!informative.length) return profile.resultSummary;

  if (profile.status === "normal" || profile.id === "normal") {
    const highlighted = informative.slice(0, 5).map((row) => `${row[0]}: ${row[1]}`);
    return simplifyClinicalNarrative(`${model.nome}: ${highlighted.join("; ")}.`);
  }

  const changed = profileChangedRows(resolved, rows);
  const highlighted = (changed.length ? changed : informative)
    .slice(0, 4)
    .map((row) => `${row[0]}: ${row[1]}`);

  if (!highlighted.length) {
    return simplifyClinicalNarrative(resolved.generationSeed % 2
      ? `${model.nome}: resultados compatíveis com o perfil ${profile.name.toLowerCase()}, conforme os parâmetros descritos.`
      : `${model.nome}: resultado compatível com o perfil ${profile.name.toLowerCase()}, conforme os parâmetros descritos.`);
  }
  return simplifyClinicalNarrative(resolved.generationSeed % 2
    ? `${model.nome}: resultados principais — ${highlighted.join("; ")}.`
    : `${model.nome}: ${highlighted.join("; ")}.`);
}

function legacyFindingsFromRows(resolved: AdaptiveResolvedExam, rows: string[][]) {
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
  const context = "";

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

const legacyNonImagingModels = new Set([
  "func_espirometria",
  "func_oximetria",
  "func_potenciais_evocados",
  "func_tilt_test",
]);

function isImagingReportModel(model: IntelligentExamModel) {
  return model.structure.standard === "imagem" && !legacyNonImagingModels.has(model.id);
}

function curatedParameterFindingSentence(label: string, result: string) {
  const cleanLabel = cleanTechnicalSentence(label);
  const cleanResult = cleanTechnicalSentence(result);
  if (!cleanLabel || !cleanResult) return "";
  return `${cleanLabel}: ${cleanResult}.`;
}

function findingsFromRows(resolved: AdaptiveResolvedExam, rows: string[][]) {
  if (resolved.model.id === "img_raio_x_unico") return legacyFindingsFromRows(resolved, rows);

  const { model, profile } = resolved;
  const informative = rows.filter((row) => row[0] && row[1] && !isGenericResult(row[1]) && !/impressão|impressao|conclusão|conclusao/i.test(row[0]));
  const changed = profileChangedRows(resolved, rows).filter((row) => informative.includes(row));
  const changedSet = new Set(changed);
  const stable = informative.filter((row) => !changedSet.has(row));
  const opening = resolved.adapterValue
    ? `${model.nome}. Área avaliada: ${resolved.adapterValue}.`
    : `${model.nome}.`;
  const context = "";

  if (!informative.length) return simplifyClinicalNarrative(`${opening}${context} ${profile.resultSummary}`);

  const lines: string[] = [opening + context];
  const primary = (profile.status === "normal" || profile.id === "normal" ? informative : (changed.length ? changed : informative)).slice(0, 7);
  primary.forEach((row) => lines.push(curatedParameterFindingSentence(row[0], row[1])));

  if (profile.status !== "normal" && profile.id !== "normal") {
    stable.slice(0, 3).forEach((row) => lines.push(curatedParameterFindingSentence(row[0], row[1])));
  }

  return simplifyClinicalNarrative(lines.filter(Boolean).join("\n"));
}

function renderVariableInMethod(resolved: AdaptiveResolvedExam, field: AdaptiveDynamicField) {
  const id = normalizedFieldKey(field.id);
  const parameterIds = new Set(resolved.parameters.map((parameter) => normalizedFieldKey(parameter.id)));
  if (parameterIds.has(id)) return false;
  if (new Set([
    "contexto_clinico",
    "finalidade_avaliacao",
    "papel_no_protocolo",
    "foco_monitorizacao",
    "dia_estimulacao",
    "dia_preparo_endometrial",
    "idade_gestacional",
    "idade_gestacional_referida",
    "numero_fetos",
    "fiv",
    "risco",
    "participantes",
    "mae_presente",
  ]).has(id)) return false;
  return true;
}

export function renderAdaptiveExamReport(resolved: AdaptiveResolvedExam) {
  const { model, profile } = resolved;
  const rows = parameterRows(resolved);
  const displayRows = rows.filter((row) => !/impressão|impressao|conclusão|conclusao/i.test(row[0] || ""));
  const isLaboratory = model.structure.standard === "laboratorio";
  const isImage = isImagingReportModel(model);
  const adapterText = "";
  // O contexto já participa da construção do método, da ordem dos achados e
  // da interpretação. Evitamos reduzi-lo novamente a uma linha isolada.
  const contextText = "";
  const contrastField = resolved.dynamicFields.find((field) => field.id === "contraste");
  const contrastText = contrastField?.value ? `<p><strong>Contraste:</strong> ${htmlEscape(String(contrastField.value))}</p>` : "";
  const technicalVariableText = resolved.dynamicFields
    .filter((field) => field.source === "variable" && String(field.value ?? "").trim() !== "" && renderVariableInMethod(resolved, field))
    .map((field) => `<p><strong>${htmlEscape(field.label)}:</strong> ${htmlEscape(String(field.value))}</p>`)
    .join("");
  const technique = paragraphs(technicalMethodNarrative(resolved));
  const table = isLaboratory && displayRows.length ? tableHtml(["Parâmetro", "Resultado", "Valores de referência"], displayRows) : "";
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
      section("tecnica", "1. Método", technique + technicalVariableText + contextText),
      section("resultados", "2. Resultados", tableHtml(["Domínio avaliado", "Resultado", "Referência técnica"], psychologicalRows)),
      section("impressao_psicologica", "3. Impressão psicológica", paragraphs(impressionText)),
      section("avaliacao_fisica", "4. Avaliação física", tableHtml(["Parâmetro", "Resultado", "Referência"], physicalRows)),
      section("avaliacao_cardiaca", "5. Avaliação cardíaca", tableHtml(["Parâmetro", "Resultado", "Referência"], cardiacRows)),
      section("avaliacao_respiratoria", "6. Avaliação respiratória", tableHtml(["Parâmetro", "Resultado", "Referência"], respiratoryRows)),
      section("interpretacao", "7. Leitura clínica", paragraphs(simplifyClinicalNarrative(`${psychotechnicalContextNarrative(resolved, "interpretation")}
${profile.interpretation}`))),
      section("conclusao", "8. Conclusão", paragraphs(simplifyClinicalNarrative(`${psychotechnicalContextNarrative(resolved, "conclusion")}
${profile.conclusion}`))),
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
    const method = paragraphs(technicalMethodNarrative(resolved)) + technicalVariableText + contextText;
    return [
      section("finalidade", "1. Finalidade do Exame", purpose),
      section("material_biologico", "2. Material Biológico", biologicalMaterial),
      section("tecnica_metodo", "3. Método utilizado", method),
      section("substancias_pesquisadas", "4. Substâncias Pesquisadas", tableHtml(["Substância ou classe", "Resultado", "Valor de corte"], substanceRows)),
      section("controle_qualidade", "5. Controle de Qualidade da Amostra", tableHtml(["Parâmetro", "Resultado", "Referência"], qualityRows)),
      section("resultado_laboratorial", "6. Resultado Laboratorial", paragraphs(resultSummaryFromRows(resolved, [...substanceRows, ...qualityRows]))),
      section("interpretacao", "7. Leitura clínica", paragraphs(simplifyClinicalNarrative(profile.interpretation))),
      section("conclusao", "8. Conclusão", paragraphs(simplifyClinicalNarrative(`Perfil do resultado: ${profile.name}.\n${profile.conclusion}\nOs achados devem ser interpretados em conjunto com os dados clínicos, ocupacionais e administrativos disponíveis. Este exame não determina, isoladamente, o grau de comprometimento funcional, o momento exato do uso ou a frequência de exposição à substância pesquisada.`))),
    ].join("");
  }

  if (isImage) {
    const findingsTable = displayRows.length
      ? tableHtml(["Estrutura / parâmetro", "Achado", "Referência"], displayRows)
      : paragraphs(findingsFromRows(resolved, rows));
    return [
      section("tecnica", "1. Método", technique + adapterText + contrastText + technicalVariableText + contextText),
      section("achados", "2. Achados", findingsTable),
      section("interpretacao", "3. Leitura clínica", paragraphs(technicalInterpretation(resolved, rows))),
      section("conclusao", "4. Conclusão", paragraphs(technicalConclusion(resolved, rows))),
    ].join("");
  }

  const structuredResults = displayRows.length
    ? tableHtml(
        isLaboratory ? ["Parâmetro", "Resultado", "Valores de referência"] : ["Parâmetro avaliado", "Resultado", "Referência"],
        displayRows,
      )
    : paragraphs(isLaboratory ? resultSummaryFromRows(resolved, rows) : findingsFromRows(resolved, rows));

  return [
    section("tecnica", "1. Método", technique + adapterText + contrastText + technicalVariableText + contextText),
    section(isLaboratory ? "resultados" : "achados", isLaboratory ? "2. Resultados" : "2. Achados", structuredResults),
    section("interpretacao", "3. Leitura clínica", paragraphs(technicalInterpretation(resolved, rows))),
    section("conclusao", "4. Conclusão", paragraphs(technicalConclusion(resolved, rows))),
  ].join("");
}

export function serializeAdaptiveConfiguration(configuration: AdaptiveExamConfiguration) {
  return JSON.stringify(configuration);
}
