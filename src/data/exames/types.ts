export type IntelligentExamCategoryKey =
  | "laboratorio"
  | "imagem"
  | "cardiologia"
  | "neurologia"
  | "ginecologia"
  | "obstetricia"
  | "pediatria"
  | "neonatal"
  | "oftalmologia"
  | "dermatologia"
  | "hormonal"
  | "genetico"
  | "genetica"
  | "funcional"
  | "geral";

export type IntelligentExamFieldOption = {
  valor: string;
  label?: string | null;
};

export type IntelligentExamField = {
  [key: string]: unknown;
  id: string;
  tipo: string;
  label?: string | null;
  unidade?: string | null;
  referencia?: string | null;
  placeholder?: string | null;
  opcoes?: IntelligentExamFieldOption[];
};

export type IntelligentExamAdapter = {
  id: string;
  label: string;
  kind:
    | "none"
    | "region"
    | "type"
    | "region-contrast"
    | "bond-type"
    | "clinical-context";
  enabled: boolean;
  options: string[];
  secondaryOptions?: string[];
  description: string;
};

export type IntelligentClinicalVariable = {
  id: string;
  label: string;
  tipo: "text" | "number" | "select" | "date" | "boolean";
  required?: boolean;
  options?: string[];
  appliesTo?: string[];
};

export type IntelligentExamParameter = {
  id: string;
  label: string;
  unidade?: string | null;
  referencia?: string | null;
  resultPlaceholder: string;
  interpretationHint: string;
};

export type IntelligentExamProfile = {
  id: string;
  name: string;
  status: "normal" | "alterado" | "indefinido" | "contextual" | "personalizado";
  description: string;
  resultSummary: string;
  /** Valores sugeridos por parâmetro para o perfil. A unidade, quando existir, deve estar junto do resultado. */
  results?: Record<string, string>;
  interpretation: string;
  conclusion: string;
};

export type IntelligentExamTable = {
  id: string;
  title: string;
  headers: string[];
  rowsFromParameters?: boolean;
};

export type IntelligentExamSection = {
  id: "titulo" | "tecnica" | "achados" | "resultados" | "tabelas" | "medidas" | "interpretacao" | "conclusao" | "assinatura";
  title: string;
  required: boolean;
  visibleByDefault: boolean;
};

export type IntelligentExamModel = {
  id: string;
  nome: string;
  descricao: string;
  categoria: IntelligentExamCategoryKey | string;
  icone?: string;
  campos: IntelligentExamField[];
  adapter: IntelligentExamAdapter;
  clinicalContexts: string[];
  profiles: IntelligentExamProfile[];
  variables: IntelligentClinicalVariable[];
  editorModel: {
    title: string;
    sections: IntelligentExamSection[];
    defaultProfileId: string;
  };
  pdfModel: {
    template: "institutional-a4";
    sections: string[];
  };
  previewModel: {
    template: "institutional-a4-preview";
    sections: string[];
  };
  structure: {
    standard: "laboratorio" | "imagem" | "procedimento" | "genetica";
    sections: IntelligentExamSection[];
  };
  technique: string;
  method: string;
  parameters: IntelligentExamParameter[];
  tables: IntelligentExamTable[];
  interpretation: {
    normal: string;
    altered: string;
    undefined: string;
  };
  conclusion: {
    normal: string;
    altered: string;
    undefined: string;
  };
  attachments: {
    enabled: boolean;
    mode: "future";
    acceptedTypes: string[];
  };
};
