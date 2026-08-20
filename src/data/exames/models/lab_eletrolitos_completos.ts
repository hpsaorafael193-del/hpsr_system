import type { IntelligentExamModel } from "../types";

export const lab_eletrolitos_completosModel: IntelligentExamModel = {
  "id": "lab_eletrolitos_completos",
  "nome": "Eletrólitos Séricos",
  "descricao": "Avaliação do equilíbrio hidroeletrolítico e metabólico",
  "categoria": "laboratorio",
  "icone": "fa-bolt",
  "campos": [
    {
      "id": "sodio",
      "tipo": "number",
      "label": "Sódio (Na⁺)",
      "unidade": "mEq/L",
      "referencia": "135 – 145"
    },
    {
      "id": "potassio",
      "tipo": "number",
      "label": "Potássio (K⁺)",
      "unidade": "mEq/L",
      "referencia": "3.5 – 5.1"
    },
    {
      "id": "calcio_total",
      "tipo": "number",
      "label": "Cálcio Total",
      "unidade": "mg/dL",
      "referencia": "8.6 – 10.2"
    },
    {
      "id": "magnesio",
      "tipo": "number",
      "label": "Magnésio (Mg²⁺)",
      "unidade": "mg/dL",
      "referencia": "1.7 – 2.4"
    },
    {
      "id": "padrao_eletrolitico",
      "tipo": "select",
      "label": "Padrão Eletrolítico",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Equilíbrio eletrolítico preservado"
        },
        {
          "valor": "hiponatremia",
          "label": "Hiponatremia"
        },
        {
          "valor": "hipernatremia",
          "label": "Hipernatremia"
        },
        {
          "valor": "hipocalemia",
          "label": "Hipocalemia"
        },
        {
          "valor": "hipercalemia",
          "label": "Hipercalemia"
        },
        {
          "valor": "hipocalcemia",
          "label": "Hipocalcemia"
        },
        {
          "valor": "hipomagnesemia",
          "label": "Hipomagnesemia"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "correlacao_clinica",
      "tipo": "select",
      "label": "Correlação Clínica",
      "opcoes": [
        {
          "valor": "assintomatico",
          "label": "Assintomático"
        },
        {
          "valor": "neurologica",
          "label": "Sintomas neurológicos"
        },
        {
          "valor": "cardiaca",
          "label": "Sintomas cardíacos"
        },
        {
          "valor": "muscular",
          "label": "Sintomas musculares"
        }
      ],
      "referencia": "Assintomático"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Eletrólitos dentro da normalidade"
        },
        {
          "valor": "disturbio_leve",
          "label": "Distúrbio eletrolítico leve"
        },
        {
          "valor": "disturbio_moderado",
          "label": "Distúrbio eletrolítico moderado"
        },
        {
          "valor": "disturbio_grave",
          "label": "Distúrbio eletrolítico grave"
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
      "description": "Eletrólitos dentro da faixa de referência.",
      "resultSummary": "Eletrólitos séricos sem alterações relevantes.",
      "interpretation": "Sódio, potássio, cálcio e magnésio dentro dos intervalos de referência.",
      "conclusion": "Equilíbrio eletrolítico preservado.",
      "results": {
        "sodio": "140",
        "potassio": "4,2",
        "calcio_total": "9,4",
        "magnesio": "2,0",
        "padrao_eletrolitico": "Sem distúrbios eletrolíticos",
        "correlacao_clinica": "Assintomático",
        "impressao": "Eletrólitos séricos dentro das faixas de referência"
      }
    },
    {
      "id": "hiponatremia",
      "name": "Hiponatremia",
      "status": "alterado",
      "description": "Sódio reduzido.",
      "resultSummary": "Sódio sérico reduzido.",
      "interpretation": "Redução de sódio sérico compatível com hiponatremia laboratorial, devendo ser correlacionada ao estado clínico e osmolaridade quando indicado.",
      "conclusion": "Hiponatremia laboratorial.",
      "results": {
        "sodio": "128",
        "potassio": "4,1",
        "calcio_total": "9,2",
        "magnesio": "2,0",
        "padrao_eletrolitico": "Hiponatremia moderada",
        "correlacao_clinica": "Correlacionar com volemia, medicações e sintomas",
        "impressao": "Hiponatremia laboratorial"
      }
    },
    {
      "id": "hipernatremia",
      "name": "Hipernatremia",
      "status": "alterado",
      "description": "Sódio elevado.",
      "resultSummary": "Sódio sérico elevado.",
      "interpretation": "Elevação de sódio sérico compatível com hipernatremia laboratorial.",
      "conclusion": "Hipernatremia laboratorial.",
      "results": {
        "sodio": "151",
        "potassio": "4,1",
        "calcio_total": "9,3",
        "magnesio": "2,0",
        "padrao_eletrolitico": "Hipernatremia",
        "correlacao_clinica": "Correlacionar com estado de hidratação e perdas",
        "impressao": "Hipernatremia laboratorial"
      }
    },
    {
      "id": "hipocalemia",
      "name": "Hipocalemia",
      "status": "alterado",
      "description": "Potássio reduzido.",
      "resultSummary": "Potássio sérico reduzido.",
      "interpretation": "Redução de potássio sérico compatível com hipocalemia laboratorial.",
      "conclusion": "Hipocalemia laboratorial.",
      "results": {
        "sodio": "139",
        "potassio": "3,0",
        "calcio_total": "9,2",
        "magnesio": "1,9",
        "padrao_eletrolitico": "Hipocalemia",
        "correlacao_clinica": "Correlacionar com perdas gastrointestinais/renais e medicações",
        "impressao": "Hipocalemia laboratorial"
      }
    },
    {
      "id": "hipercalemia",
      "name": "Hipercalemia",
      "status": "alterado",
      "description": "Potássio elevado.",
      "resultSummary": "Potássio sérico elevado.",
      "interpretation": "Elevação de potássio sérico compatível com hipercalemia laboratorial.",
      "conclusion": "Hipercalemia laboratorial.",
      "results": {
        "sodio": "138",
        "potassio": "5,8",
        "calcio_total": "9,3",
        "magnesio": "2,0",
        "padrao_eletrolitico": "Hipercalemia",
        "correlacao_clinica": "Recomenda-se excluir hemólise e correlacionar com função renal",
        "impressao": "Hipercalemia laboratorial"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Variação discreta sem definição isolada.",
      "resultSummary": "Eletrólitos com alteração discreta ou limítrofe.",
      "interpretation": "Alterações discretas devem ser interpretadas com hidratação, medicações e quadro clínico.",
      "conclusion": "Distúrbio eletrolítico limítrofe/inespecífico.",
      "results": {
        "sodio": "134",
        "potassio": "3,5",
        "calcio_total": "8,6",
        "magnesio": "1,7",
        "padrao_eletrolitico": "Valores limítrofes em mais de um eletrólito",
        "correlacao_clinica": "Sem repercussão definida isoladamente",
        "impressao": "Painel eletrolítico limítrofe"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Eletrólitos Séricos: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "sodio": "140",
        "potassio": "4,2",
        "calcio_total": "9,4",
        "magnesio": "2,0",
        "padrao_eletrolitico": "Sem distúrbios eletrolíticos",
        "correlacao_clinica": "Assintomático",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Eletrólitos Séricos",
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
  "technique": "Amostra sérica processada para determinação dos eletrólitos incluídos no painel, com controles internos e verificação de consistência analítica.",
  "method": "Sódio e potássio determinados por eletrodo íon-seletivo; cálcio e magnésio por metodologia química automatizada compatível com o analisador do serviço.",
  "parameters": [
    {
      "id": "sodio",
      "label": "Sódio (Na⁺)",
      "unidade": "mEq/L",
      "referencia": "135 – 145",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sódio (Na⁺) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "potassio",
      "label": "Potássio (K⁺)",
      "unidade": "mEq/L",
      "referencia": "3.5 – 5.1",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Potássio (K⁺) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "calcio_total",
      "label": "Cálcio Total",
      "unidade": "mg/dL",
      "referencia": "8.6 – 10.2",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cálcio Total conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "magnesio",
      "label": "Magnésio (Mg²⁺)",
      "unidade": "mg/dL",
      "referencia": "1.7 – 2.4",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Magnésio (Mg²⁺) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "padrao_eletrolitico",
      "label": "Padrão Eletrolítico",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão Eletrolítico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "correlacao_clinica",
      "label": "Correlação Clínica",
      "unidade": null,
      "referencia": "Assintomático",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Correlação Clínica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Eletrólitos Séricos compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Eletrólitos Séricos com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Eletrólitos Séricos com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Eletrólitos Séricos sem alterações significativas nos parâmetros avaliados.",
    "altered": "Eletrólitos Séricos alterado conforme resultados objetivos descritos.",
    "undefined": "Eletrólitos Séricos com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
