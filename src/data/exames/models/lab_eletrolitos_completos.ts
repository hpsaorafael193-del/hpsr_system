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
      "conclusion": "Equilíbrio eletrolítico preservado."
    },
    {
      "id": "hiponatremia",
      "name": "Hiponatremia",
      "status": "alterado",
      "description": "Sódio reduzido.",
      "resultSummary": "Sódio sérico reduzido.",
      "interpretation": "Redução de sódio sérico compatível com hiponatremia laboratorial, devendo ser correlacionada ao estado clínico e osmolaridade quando indicado.",
      "conclusion": "Hiponatremia laboratorial."
    },
    {
      "id": "hipernatremia",
      "name": "Hipernatremia",
      "status": "alterado",
      "description": "Sódio elevado.",
      "resultSummary": "Sódio sérico elevado.",
      "interpretation": "Elevação de sódio sérico compatível com hipernatremia laboratorial.",
      "conclusion": "Hipernatremia laboratorial."
    },
    {
      "id": "hipocalemia",
      "name": "Hipocalemia",
      "status": "alterado",
      "description": "Potássio reduzido.",
      "resultSummary": "Potássio sérico reduzido.",
      "interpretation": "Redução de potássio sérico compatível com hipocalemia laboratorial.",
      "conclusion": "Hipocalemia laboratorial."
    },
    {
      "id": "hipercalemia",
      "name": "Hipercalemia",
      "status": "alterado",
      "description": "Potássio elevado.",
      "resultSummary": "Potássio sérico elevado.",
      "interpretation": "Elevação de potássio sérico compatível com hipercalemia laboratorial.",
      "conclusion": "Hipercalemia laboratorial."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Variação discreta sem definição isolada.",
      "resultSummary": "Eletrólitos com alteração discreta ou limítrofe.",
      "interpretation": "Alterações discretas devem ser interpretadas com hidratação, medicações e quadro clínico.",
      "conclusion": "Distúrbio eletrolítico limítrofe/inespecífico."
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
  "technique": "Amostra processada conforme método laboratorial validado, com controles internos e referências aplicáveis ao exame.",
  "method": "Método laboratorial compatível com o parâmetro analisado, conforme validação interna do serviço.",
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
