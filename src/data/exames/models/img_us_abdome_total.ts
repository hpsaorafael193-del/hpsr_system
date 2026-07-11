import type { IntelligentExamModel } from "../types";

export const img_us_abdome_totalModel: IntelligentExamModel = {
  "id": "img_us_abdome_total",
  "nome": "Ultrassonografia de Abdome Total",
  "descricao": "Avaliação ultrassonográfica completa dos órgãos abdominais",
  "categoria": "imagem",
  "icone": "fa-wave-square",
  "campos": [
    {
      "id": "figado",
      "tipo": "select",
      "label": "Fígado",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "esteatose",
          "label": "Esteatose hepática"
        },
        {
          "valor": "hepatopatia",
          "label": "Hepatopatia difusa"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "vesicula_biliar",
      "tipo": "select",
      "label": "Vesícula Biliar",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "litíase",
          "label": "Litíase"
        },
        {
          "valor": "lamina",
          "label": "Lama biliar"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "vias_biliares",
      "tipo": "select",
      "label": "Vias Biliares",
      "opcoes": [
        {
          "valor": "nao_dilatadas",
          "label": "Não dilatadas"
        },
        {
          "valor": "dilatadas",
          "label": "Dilatadas"
        }
      ],
      "referencia": "Não dilatadas"
    },
    {
      "id": "rins",
      "tipo": "select",
      "label": "Rins",
      "opcoes": [
        {
          "valor": "normais",
          "label": "Normais"
        },
        {
          "valor": "litíase",
          "label": "Litíase renal"
        },
        {
          "valor": "hidronefrose",
          "label": "Hidronefrose"
        }
      ],
      "referencia": "Normais"
    },
    {
      "id": "baço",
      "tipo": "select",
      "label": "Baço",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "esplenomegalia",
          "label": "Esplenomegalia"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Ultrassonográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem alterações significativas"
        },
        {
          "valor": "hepatica",
          "label": "Alterações hepáticas"
        },
        {
          "valor": "biliar",
          "label": "Alterações biliares"
        },
        {
          "valor": "renal",
          "label": "Alterações renais"
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
    "id": "tipo_ultrassom",
    "label": "Tipo de ultrassonografia",
    "kind": "type",
    "enabled": true,
    "options": [
      "Abdome Total",
      "Abdome Superior",
      "Abdome Inferior",
      "Obstétrica",
      "Obstétrica 3D",
      "Transvaginal",
      "Tireoide",
      "Mamas",
      "Próstata",
      "Bolsa Escrotal",
      "Rins",
      "Vias Urinárias",
      "Doppler",
      "Personalizado"
    ],
    "description": "O exame permanece único; o tipo selecionado define o modelo específico do laudo."
  },
  "clinicalContexts": [
    "Rotina",
    "Trauma",
    "Dor",
    "Controle pós-operatório",
    "Oncológico",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Sem alterações significativas no método.",
      "resultSummary": "Exame de imagem sem alterações relevantes.",
      "interpretation": "Estruturas avaliadas sem alterações significativas para o método e região examinada.",
      "conclusion": "Estudo sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Exame de imagem com alteração.",
      "interpretation": "Achado deve ser descrito com localização, extensão, medidas e relação anatômica quando aplicável.",
      "conclusion": "Estudo com alteração a correlacionar clinicamente."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Exame de imagem com achado inespecífico.",
      "interpretation": "Achado não permite definição diagnóstica isolada e pode demandar comparação, seguimento ou outro método.",
      "conclusion": "Achado inespecífico, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame de imagem personalizado.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
    }
  ],
  "variables": [
    {
      "id": "idade_gestacional",
      "label": "Idade gestacional",
      "tipo": "text"
    },
    {
      "id": "numero_fetos",
      "label": "Número de fetos",
      "tipo": "number"
    },
    {
      "id": "fiv",
      "label": "Gestação por FIV",
      "tipo": "select",
      "options": [
        "Sim",
        "Não",
        "Não informado"
      ]
    },
    {
      "id": "risco",
      "label": "Gestação de risco",
      "tipo": "select",
      "options": [
        "Sim",
        "Não",
        "Não informado"
      ]
    }
  ],
  "editorModel": {
    "title": "Ultrassonografia de Abdome Total",
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
        "id": "achados",
        "title": "2. Achados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "medidas",
        "title": "3. Medidas",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": false,
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
      "achados",
      "medidas",
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
      "achados",
      "medidas",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "imagem",
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
        "id": "achados",
        "title": "2. Achados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "medidas",
        "title": "3. Medidas",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": false,
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
  "technique": "Exame realizado conforme protocolo técnico do método, com documentação das estruturas avaliadas e limitações quando presentes.",
  "method": "Aquisição de imagens conforme protocolo da região/tipo selecionado, com análise descritiva dos achados.",
  "parameters": [
    {
      "id": "figado",
      "label": "Fígado",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fígado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "vesicula_biliar",
      "label": "Vesícula Biliar",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Vesícula Biliar conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "vias_biliares",
      "label": "Vias Biliares",
      "unidade": null,
      "referencia": "Não dilatadas",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Vias Biliares conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "rins",
      "label": "Rins",
      "unidade": null,
      "referencia": "Normais",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Rins conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "baço",
      "label": "Baço",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Baço conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Ultrassonográfica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Ultrassonográfica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [
    {
      "id": "medidas",
      "title": "Medidas",
      "headers": [
        "Estrutura / Medida",
        "Resultado",
        "Referência / Observação"
      ],
      "rowsFromParameters": false
    }
  ],
  "interpretation": {
    "normal": "Sem achados relevantes no método e região avaliados.",
    "altered": "Achado de imagem relevante, devendo ser caracterizado e correlacionado clinicamente.",
    "undefined": "Achado inespecífico, podendo exigir comparação, seguimento ou complementação."
  },
  "conclusion": {
    "normal": "Estudo sem alterações significativas.",
    "altered": "Estudo com alteração a correlacionar clinicamente.",
    "undefined": "Achado inespecífico, recomendando correlação clínica."
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
