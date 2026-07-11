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
      "resultSummary": "Exame sem alterações relevantes.",
      "interpretation": "Resultados dentro do esperado para método, referência e contexto clínico informado.",
      "conclusion": "Exame sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Exame com alterações nos parâmetros avaliados.",
      "interpretation": "Alterações devem ser correlacionadas com quadro clínico, medicamentos, evolução e exames complementares.",
      "conclusion": "Exame alterado, recomendando correlação clínica."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Exame com achado limítrofe ou inespecífico.",
      "interpretation": "Resultado isolado não define diagnóstico e pode requerer repetição/seguimento conforme avaliação médica.",
      "conclusion": "Achado indefinido ou limítrofe, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame personalizado.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
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
  "technique": "Amostra processada conforme método laboratorial validado, com controles internos e referências aplicáveis ao exame.",
  "method": "Método laboratorial compatível com o parâmetro analisado, conforme validação interna do serviço.",
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
    "normal": "Parâmetros dentro dos valores de referência disponíveis.",
    "altered": "Um ou mais parâmetros fora da referência, com significado dependente do contexto clínico.",
    "undefined": "Alteração discreta, limítrofe ou inconclusiva, sem definição diagnóstica isolada."
  },
  "conclusion": {
    "normal": "Exame sem alterações significativas.",
    "altered": "Exame alterado, recomendando correlação clínica.",
    "undefined": "Achado indefinido ou limítrofe, recomendando correlação clínica."
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
