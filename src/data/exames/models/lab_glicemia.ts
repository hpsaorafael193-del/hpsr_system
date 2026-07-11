import type { IntelligentExamModel } from "../types";

export const lab_glicemiaModel: IntelligentExamModel = {
  "id": "lab_glicemia",
  "nome": "Glicemia",
  "descricao": "Avaliação detalhada da glicose plasmática para diagnóstico e acompanhamento de distúrbios glicêmicos",
  "categoria": "laboratorio",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "tipo_coleta",
      "tipo": "select",
      "label": "Tipo de Coleta",
      "opcoes": [
        {
          "valor": "jejum",
          "label": "Jejum"
        },
        {
          "valor": "casual",
          "label": "Casual"
        },
        {
          "valor": "pos_prandial",
          "label": "Pós-prandial"
        }
      ],
      "referencia": "Jejum / Casual / Pós-prandial"
    },
    {
      "id": "glicose",
      "tipo": "number",
      "label": "Glicose Plasmática",
      "unidade": "mg/dL",
      "referencia": "Jejum < 100 | PP < 140"
    },
    {
      "id": "sintomas",
      "tipo": "select",
      "label": "Sintomas Associados",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "poliuria",
          "label": "Poliúria"
        },
        {
          "valor": "polidipsia",
          "label": "Polidipsia"
        },
        {
          "valor": "polifagia",
          "label": "Polifagia"
        },
        {
          "valor": "perda_peso",
          "label": "Perda de peso"
        },
        {
          "valor": "astenia",
          "label": "Astenia"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "condicao_coleta",
      "tipo": "select",
      "label": "Condição da Coleta",
      "opcoes": [
        {
          "valor": "adequada",
          "label": "Coleta adequada"
        },
        {
          "valor": "jejum_inadequado",
          "label": "Jejum inadequado"
        },
        {
          "valor": "uso_medicacao",
          "label": "Uso de medicação hiperglicemiante"
        },
        {
          "valor": "estresse_agudo",
          "label": "Estresse agudo / intercorrência"
        }
      ],
      "referencia": "Adequada"
    },
    {
      "id": "classificacao_glicemica",
      "tipo": "select",
      "label": "Classificação Glicêmica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normoglicemia"
        },
        {
          "valor": "hipoglicemia",
          "label": "Hipoglicemia"
        },
        {
          "valor": "intolerancia",
          "label": "Intolerância à glicose"
        },
        {
          "valor": "prediabetes",
          "label": "Pré-diabetes"
        },
        {
          "valor": "diabetes",
          "label": "Diabetes mellitus"
        }
      ],
      "referencia": "Normal / Alterado"
    },
    {
      "id": "risco_metabolico",
      "tipo": "select",
      "label": "Risco Metabólico",
      "opcoes": [
        {
          "valor": "baixo",
          "label": "Baixo risco"
        },
        {
          "valor": "moderado",
          "label": "Risco moderado"
        },
        {
          "valor": "alto",
          "label": "Alto risco metabólico"
        }
      ],
      "referencia": "Baixo"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Glicemia dentro da normalidade"
        },
        {
          "valor": "alterada_isolada",
          "label": "Alteração glicêmica isolada"
        },
        {
          "valor": "suspeita_diabetes",
          "label": "Achados sugestivos de diabetes"
        },
        {
          "valor": "descompensacao",
          "label": "Descompensação glicêmica"
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
      "description": "Glicemia dentro da referência conforme condição da coleta.",
      "resultSummary": "Glicemia dentro dos valores de referência.",
      "interpretation": "Resultado glicêmico dentro do esperado para a condição de coleta informada.",
      "conclusion": "Exame sem alteração glicêmica laboratorial relevante."
    },
    {
      "id": "hiperglicemia",
      "name": "Hiperglicemia",
      "status": "alterado",
      "description": "Glicemia acima do valor de referência.",
      "resultSummary": "Glicemia elevada.",
      "interpretation": "Glicemia acima dos valores de referência, compatível com hiperglicemia laboratorial. Recomenda-se correlação com jejum, sintomas e critérios clínicos.",
      "conclusion": "Hiperglicemia laboratorial."
    },
    {
      "id": "hipoglicemia",
      "name": "Hipoglicemia",
      "status": "alterado",
      "description": "Glicemia abaixo do esperado.",
      "resultSummary": "Glicemia reduzida.",
      "interpretation": "Glicemia abaixo dos valores usuais, devendo ser correlacionada com sintomas, medicações e contexto clínico.",
      "conclusion": "Hipoglicemia laboratorial."
    },
    {
      "id": "limítrofe",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Glicemia discretamente alterada, sem definição isolada.",
      "resultSummary": "Glicemia em faixa limítrofe.",
      "interpretation": "Glicemia discretamente acima do valor de referência, sem definição diagnóstica isolada.",
      "conclusion": "Alteração glicêmica limítrofe. Recomenda-se correlação clínica."
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
    "title": "Glicemia",
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
  "method": "Dosagem bioquímica da glicose em amostra informada, interpretada conforme condição de coleta e referência laboratorial.",
  "parameters": [
    {
      "id": "tipo_coleta",
      "label": "Tipo de Coleta",
      "unidade": null,
      "referencia": "Jejum / Casual / Pós-prandial",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Coleta conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "glicose",
      "label": "Glicose Plasmática",
      "unidade": "mg/dL",
      "referencia": "Jejum < 100 | PP < 140",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Glicose Plasmática conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sintomas",
      "label": "Sintomas Associados",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sintomas Associados conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "condicao_coleta",
      "label": "Condição da Coleta",
      "unidade": null,
      "referencia": "Adequada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Condição da Coleta conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "classificacao_glicemica",
      "label": "Classificação Glicêmica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Classificação Glicêmica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "risco_metabolico",
      "label": "Risco Metabólico",
      "unidade": null,
      "referencia": "Baixo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Risco Metabólico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Clínica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Clínica conforme referência, contexto clínico e método utilizado."
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
