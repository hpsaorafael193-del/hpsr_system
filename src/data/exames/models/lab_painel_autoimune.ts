import type { IntelligentExamModel } from "../types";

export const lab_painel_autoimuneModel: IntelligentExamModel = {
  "id": "lab_painel_autoimune",
  "nome": "Painel Autoimune",
  "descricao": "Painel sorológico para investigação de doenças autoimunes sistêmicas, incluindo Lúpus Eritematoso Sistêmico",
  "categoria": "laboratorio",
  "icone": "fa-vials",
  "campos": [
    {
      "id": "fan",
      "tipo": "select",
      "label": "FAN (ANA)",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "anti_dna",
      "tipo": "select",
      "label": "Anti-DNA dupla hélice",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "anti_sm",
      "tipo": "select",
      "label": "Anti-Sm",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "c3",
      "tipo": "number",
      "label": "Complemento C3",
      "unidade": "mg/dL",
      "referencia": "90 – 180"
    },
    {
      "id": "c4",
      "tipo": "number",
      "label": "Complemento C4",
      "unidade": "mg/dL",
      "referencia": "10 – 40"
    },
    {
      "id": "anticardiolipina",
      "tipo": "select",
      "label": "Anticardiolipina",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "lupus_anticoagulante",
      "tipo": "select",
      "label": "Anticoagulante Lúpico",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "presente",
          "label": "Presente"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Autoimune",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Painel autoimune sem alterações significativas"
        },
        {
          "valor": "suspeita_autoimune",
          "label": "Achados sugestivos de doença autoimune"
        },
        {
          "valor": "sugestivo_les",
          "label": "Perfil compatível com Lúpus Eritematoso Sistêmico"
        }
      ],
      "referencia": "Normal / Alterado"
    },
    {
      "id": "interpretacao",
      "tipo": "textarea",
      "label": "Interpretação"
    },
    {
      "id": "conclusao",
      "tipo": "textarea",
      "label": "Conclusão"
    }
  ],
  "adapter": {
    "id": "padrao",
    "label": "Sem adaptador obrigatório",
    "kind": "none",
    "enabled": false,
    "options": [
      "Padrão"
    ],
    "description": "Modelo direto, configurável por perfil e variáveis clínicas relevantes."
  },
  "clinicalContexts": [
    "Rotina",
    "Controle",
    "Rastreamento",
    "Suspeita clínica",
    "Acompanhamento",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Parâmetros dentro das referências disponíveis.",
      "resultSummary": "Painel Autoimune com FAN (ANA): Negativo; Anti-DNA dupla hélice: Negativo; Anti-Sm: Negativo.",
      "interpretation": "Os parâmetros mensurados — FAN (ANA): Negativo; Anti-DNA dupla hélice: Negativo; Anti-Sm: Negativo; Complemento C3: 128 mg/dL — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Painel Autoimune com parâmetros compatíveis com o padrão esperado, incluindo FAN (ANA): Negativo; Anti-DNA dupla hélice: Negativo.",
      "results": {
        "fan": "Negativo",
        "anti_dna": "Negativo",
        "anti_sm": "Negativo",
        "c3": "128",
        "c4": "24",
        "anticardiolipina": "Negativo",
        "lupus_anticoagulante": "Ausente",
        "impressao": "Painel autoimune sem autoanticorpos específicos detectáveis"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Painel Autoimune: FAN (ANA): Reagente 1:320, padrão nuclear homogêneo; Anti-DNA dupla hélice: Reagente; Anti-Sm: Reagente; Complemento C3: 72.",
      "interpretation": "Os resultados principais (FAN (ANA): Reagente 1:320, padrão nuclear homogêneo; Anti-DNA dupla hélice: Reagente; Anti-Sm: Reagente; Complemento C3: 72 mg/dL) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Painel Autoimune com padrão alterado, documentado por FAN (ANA): Reagente 1:320, padrão nuclear homogêneo; Anti-DNA dupla hélice: Reagente.",
      "results": {
        "fan": "Reagente 1:320, padrão nuclear homogêneo",
        "anti_dna": "Reagente",
        "anti_sm": "Reagente",
        "c3": "72",
        "c4": "7",
        "anticardiolipina": "Negativo",
        "lupus_anticoagulante": "Ausente",
        "impressao": "Autoanticorpos positivos com consumo de complemento, padrão sugestivo de atividade autoimune no contexto clínico"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Painel Autoimune: FAN (ANA): Reagente 1:80, padrão pontilhado fino; Complemento C3: 92; Complemento C4: 11.",
      "interpretation": "Os principais resultados (FAN (ANA): Reagente 1:80, padrão pontilhado fino; Complemento C3: 92 mg/dL; Complemento C4: 11 mg/dL) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Painel Autoimune com resultado limítrofe/inespecífico, destacando-se FAN (ANA): Reagente 1:80, padrão pontilhado fino; Complemento C3: 92 mg/dL.",
      "results": {
        "fan": "Reagente 1:80, padrão pontilhado fino",
        "anti_dna": "Negativo",
        "anti_sm": "Negativo",
        "c3": "92",
        "c4": "11",
        "anticardiolipina": "Negativo",
        "lupus_anticoagulante": "Ausente",
        "impressao": "FAN em baixo título, achado isolado de baixa especificidade"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Painel Autoimune: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "fan": "Negativo",
        "anti_dna": "Negativo",
        "anti_sm": "Negativo",
        "c3": "128",
        "c4": "24",
        "anticardiolipina": "Negativo",
        "lupus_anticoagulante": "Ausente",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Painel Autoimune",
    "sections": [
      {
        "id": "titulo",
        "title": "Título",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tecnica",
        "title": "1. Técnica / Método",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "resultados",
        "title": "2. Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabela técnica",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "conclusao",
        "title": "5. Conclusão",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "assinatura",
        "title": "Assinatura",
        "required": true,
        "visibleByDefault": true
      }
    ],
    "defaultProfileId": "normal"
  },
  "pdfModel": {
    "template": "institutional-a4",
    "sections": [
      "titulo",
      "tecnica",
      "resultados",
      "tabelas",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "previewModel": {
    "template": "institutional-a4-preview",
    "sections": [
      "titulo",
      "tecnica",
      "resultados",
      "tabelas",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "laboratorio",
    "sections": [
      {
        "id": "titulo",
        "title": "Título",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tecnica",
        "title": "1. Técnica / Método",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "resultados",
        "title": "2. Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabela técnica",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "conclusao",
        "title": "5. Conclusão",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "assinatura",
        "title": "Assinatura",
        "required": true,
        "visibleByDefault": true
      }
    ]
  },
  "technique": "Amostra sérica processada para pesquisa de autoanticorpos incluídos no painel, com interpretação integrada do padrão de reatividade.",
  "method": "Pesquisa de autoanticorpos por imunofluorescência indireta e/ou imunoensaios específicos, conforme o marcador e protocolo laboratorial.",
  "parameters": [
    {
      "id": "fan",
      "label": "FAN (ANA)",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar FAN (ANA) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "anti_dna",
      "label": "Anti-DNA dupla hélice",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Anti-DNA dupla hélice conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "anti_sm",
      "label": "Anti-Sm",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Anti-Sm conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "c3",
      "label": "Complemento C3",
      "unidade": "mg/dL",
      "referencia": "90 – 180",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Complemento C3 conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "c4",
      "label": "Complemento C4",
      "unidade": "mg/dL",
      "referencia": "10 – 40",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Complemento C4 conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "anticardiolipina",
      "label": "Anticardiolipina",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Anticardiolipina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "lupus_anticoagulante",
      "label": "Anticoagulante Lúpico",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Anticoagulante Lúpico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Autoimune",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Autoimune conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [
    {
      "id": "tabela_tecnica",
      "title": "Tabela técnica laboratorial",
      "headers": [
        "Parâmetro",
        "Resultado",
        "Valores de referência"
      ],
      "rowsFromParameters": true
    }
  ],
  "interpretation": {
    "normal": "Resultados de Painel Autoimune compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Painel Autoimune com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Painel Autoimune com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Painel Autoimune sem alterações significativas nos parâmetros avaliados.",
    "altered": "Painel Autoimune alterado conforme resultados objetivos descritos.",
    "undefined": "Painel Autoimune com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
  },
  "attachments": {
    "enabled": false,
    "mode": "future",
    "acceptedTypes": [
      "image/png",
      "image/jpeg",
      "application/pdf"
    ]
  }
};
