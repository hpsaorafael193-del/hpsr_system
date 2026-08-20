import type { IntelligentExamModel } from "../types";

export const lab_sorologiaModel: IntelligentExamModel = {
  "id": "lab_sorologia",
  "nome": "Sorologia",
  "descricao": "Pesquisa sorológica para investigação de doenças infecciosas",
  "categoria": "laboratorio",
  "icone": "fa-vials",
  "campos": [
    {
      "id": "hiv",
      "tipo": "select",
      "label": "HIV",
      "opcoes": [
        {
          "valor": "reagente",
          "label": "Reagente"
        },
        {
          "valor": "nao_reagente",
          "label": "Não reagente"
        }
      ],
      "referencia": "Não reagente"
    },
    {
      "id": "sifilis",
      "tipo": "select",
      "label": "Sífilis",
      "opcoes": [
        {
          "valor": "reagente",
          "label": "Reagente"
        },
        {
          "valor": "nao_reagente",
          "label": "Não reagente"
        }
      ],
      "referencia": "Não reagente"
    },
    {
      "id": "hepatite_b",
      "tipo": "select",
      "label": "Hepatite B (HBsAg)",
      "opcoes": [
        {
          "valor": "reagente",
          "label": "Reagente"
        },
        {
          "valor": "nao_reagente",
          "label": "Não reagente"
        }
      ],
      "referencia": "Não reagente"
    },
    {
      "id": "hepatite_c",
      "tipo": "select",
      "label": "Hepatite C (Anti-HCV)",
      "opcoes": [
        {
          "valor": "reagente",
          "label": "Reagente"
        },
        {
          "valor": "nao_reagente",
          "label": "Não reagente"
        }
      ],
      "referencia": "Não reagente"
    },
    {
      "id": "toxoplasmose_igg",
      "tipo": "select",
      "label": "Toxoplasmose IgG",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo"
        },
        {
          "valor": "negativo",
          "label": "Negativo"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "toxoplasmose_igm",
      "tipo": "select",
      "label": "Toxoplasmose IgM",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo"
        },
        {
          "valor": "negativo",
          "label": "Negativo"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "rubeola_igg",
      "tipo": "select",
      "label": "Rubéola IgG",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo"
        },
        {
          "valor": "negativo",
          "label": "Negativo"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "rubeola_igm",
      "tipo": "select",
      "label": "Rubéola IgM",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo"
        },
        {
          "valor": "negativo",
          "label": "Negativo"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "citomegalovirus_igg",
      "tipo": "select",
      "label": "Citomegalovírus IgG",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo"
        },
        {
          "valor": "negativo",
          "label": "Negativo"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "citomegalovirus_igm",
      "tipo": "select",
      "label": "Citomegalovírus IgM",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo"
        },
        {
          "valor": "negativo",
          "label": "Negativo"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Sorológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sorologia sem alterações significativas"
        },
        {
          "valor": "imunidade_previa",
          "label": "Evidência de imunidade Inata ou Adaptativa"
        },
        {
          "valor": "infeccao_previa",
          "label": "Evidência de infecção prévia,"
        },
        {
          "valor": "infeccao_ativa",
          "label": "Achados sugestivos de infecção ativa"
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
      "resultSummary": "Sorologia com HIV: Não reagente; Sífilis: Não reagente; Hepatite B (HBsAg): Não reagente.",
      "interpretation": "Os parâmetros mensurados — HIV: Não reagente; Sífilis: Não reagente; Hepatite B (HBsAg): Não reagente; Hepatite C (Anti-HCV): Não reagente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Sorologia com parâmetros compatíveis com o padrão esperado, incluindo HIV: Não reagente; Sífilis: Não reagente.",
      "results": {
        "hiv": "Não reagente",
        "sifilis": "Não reagente",
        "hepatite_b": "Não reagente",
        "hepatite_c": "Não reagente",
        "toxoplasmose_igg": "Não reagente",
        "toxoplasmose_igm": "Não reagente",
        "rubeola_igg": "Reagente",
        "rubeola_igm": "Não reagente",
        "citomegalovirus_igg": "Reagente",
        "citomegalovirus_igm": "Não reagente",
        "impressao": "Painel sorológico sem evidências de infecção aguda nos marcadores pesquisados"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Sorologia: Sífilis: Reagente em teste de triagem; confirmar conforme algoritmo; Toxoplasmose IgG: Reagente; Toxoplasmose IgM: Reagente.",
      "interpretation": "Os resultados principais (Sífilis: Reagente em teste de triagem; confirmar conforme algoritmo; Toxoplasmose IgG: Reagente; Toxoplasmose IgM: Reagente) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Sorologia com padrão alterado, documentado por Sífilis: Reagente em teste de triagem; confirmar conforme algoritmo; Toxoplasmose IgG: Reagente.",
      "results": {
        "hiv": "Não reagente",
        "sifilis": "Reagente em teste de triagem; confirmar conforme algoritmo",
        "hepatite_b": "Não reagente",
        "hepatite_c": "Não reagente",
        "toxoplasmose_igg": "Reagente",
        "toxoplasmose_igm": "Reagente",
        "rubeola_igg": "Reagente",
        "rubeola_igm": "Não reagente",
        "citomegalovirus_igg": "Reagente",
        "citomegalovirus_igm": "Não reagente",
        "impressao": "Painel com marcadores reagentes que requerem correlação e confirmação específica conforme o teste"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Sorologia: Toxoplasmose IgG: Reagente; Toxoplasmose IgM: Indeterminado.",
      "interpretation": "Os principais resultados (Toxoplasmose IgG: Reagente; Toxoplasmose IgM: Indeterminado) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Sorologia com resultado limítrofe/inespecífico, destacando-se Toxoplasmose IgG: Reagente; Toxoplasmose IgM: Indeterminado.",
      "results": {
        "hiv": "Não reagente",
        "sifilis": "Não reagente",
        "hepatite_b": "Não reagente",
        "hepatite_c": "Não reagente",
        "toxoplasmose_igg": "Reagente",
        "toxoplasmose_igm": "Indeterminado",
        "rubeola_igg": "Reagente",
        "rubeola_igm": "Não reagente",
        "citomegalovirus_igg": "Reagente",
        "citomegalovirus_igm": "Não reagente",
        "impressao": "IgM para toxoplasmose em faixa indeterminada, recomendando confirmação conforme método"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Sorologia: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "hiv": "Não reagente",
        "sifilis": "Não reagente",
        "hepatite_b": "Não reagente",
        "hepatite_c": "Não reagente",
        "toxoplasmose_igg": "Não reagente",
        "toxoplasmose_igm": "Não reagente",
        "rubeola_igg": "Reagente",
        "rubeola_igm": "Não reagente",
        "citomegalovirus_igg": "Reagente",
        "citomegalovirus_igm": "Não reagente",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Sorologia",
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
  "technique": "Amostra sérica processada para pesquisa de anticorpos e/ou antígenos dos agentes incluídos no painel sorológico.",
  "method": "Imunoensaios qualitativos ou quantitativos específicos para cada marcador, com liberação como reagente, não reagente ou indeterminado conforme os valores de corte do método.",
  "parameters": [
    {
      "id": "hiv",
      "label": "HIV",
      "unidade": null,
      "referencia": "Não reagente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar HIV conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sifilis",
      "label": "Sífilis",
      "unidade": null,
      "referencia": "Não reagente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sífilis conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hepatite_b",
      "label": "Hepatite B (HBsAg)",
      "unidade": null,
      "referencia": "Não reagente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hepatite B (HBsAg) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hepatite_c",
      "label": "Hepatite C (Anti-HCV)",
      "unidade": null,
      "referencia": "Não reagente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hepatite C (Anti-HCV) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "toxoplasmose_igg",
      "label": "Toxoplasmose IgG",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Toxoplasmose IgG conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "toxoplasmose_igm",
      "label": "Toxoplasmose IgM",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Toxoplasmose IgM conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "rubeola_igg",
      "label": "Rubéola IgG",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Rubéola IgG conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "rubeola_igm",
      "label": "Rubéola IgM",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Rubéola IgM conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "citomegalovirus_igg",
      "label": "Citomegalovírus IgG",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Citomegalovírus IgG conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "citomegalovirus_igm",
      "label": "Citomegalovírus IgM",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Citomegalovírus IgM conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Sorológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Sorológica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Sorologia compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Sorologia com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Sorologia com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Sorologia sem alterações significativas nos parâmetros avaliados.",
    "altered": "Sorologia alterado conforme resultados objetivos descritos.",
    "undefined": "Sorologia com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
