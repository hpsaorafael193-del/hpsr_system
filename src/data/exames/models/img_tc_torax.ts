import type { IntelligentExamModel } from "../types";

export const img_tc_toraxModel: IntelligentExamModel = {
  "id": "img_tc_torax",
  "nome": "Tomografia Computadorizada de Tórax",
  "descricao": "Avaliação detalhada do parênquima pulmonar, mediastino e pleura",
  "categoria": "imagem",
  "icone": "fa-lungs",
  "campos": [
    {
      "id": "uso_contraste",
      "tipo": "select",
      "label": "Uso de Contraste",
      "opcoes": [
        {
          "valor": "sem",
          "label": "Sem contraste"
        },
        {
          "valor": "com",
          "label": "Com contraste"
        }
      ],
      "referencia": "Sem contraste"
    },
    {
      "id": "padrao_pulmonar",
      "tipo": "select",
      "label": "Padrão Pulmonar",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "vidro_fosco",
          "label": "Vidro fosco"
        },
        {
          "valor": "consolidacao",
          "label": "Consolidação"
        },
        {
          "valor": "fibrose",
          "label": "Fibrose"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "derrame_pleural",
      "tipo": "select",
      "label": "Derrame Pleural",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "unilateral",
          "label": "Unilateral"
        },
        {
          "valor": "bilateral",
          "label": "Bilateral"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "mediastino",
      "tipo": "select",
      "label": "Mediastino",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "linfonodomegalia",
          "label": "Linfonodomegalia"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Tomográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem alterações significativas"
        },
        {
          "valor": "infecciosa",
          "label": "Processo infeccioso"
        },
        {
          "valor": "intersticial",
          "label": "Doença intersticial pulmonar"
        },
        {
          "valor": "neoplasica",
          "label": "Suspeita de neoplasia"
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
    "id": "regiao_contraste",
    "label": "Região e contraste",
    "kind": "region-contrast",
    "enabled": true,
    "options": [
      "Crânio",
      "Tórax",
      "Abdome",
      "Pelve",
      "Coluna",
      "Seios da face",
      "Extremidades",
      "Angiotomografia",
      "Personalizado"
    ],
    "secondaryOptions": [
      "Sem contraste",
      "Com contraste"
    ],
    "description": "A combinação entre região e uso de contraste define técnica, achados e conclusão sugerida."
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
      "id": "contraste",
      "label": "Contraste",
      "tipo": "select",
      "options": [
        "Sem contraste",
        "Com contraste"
      ]
    },
    {
      "id": "regiao",
      "label": "Região examinada",
      "tipo": "select",
      "options": [
        "Crânio",
        "Tórax",
        "Abdome",
        "Pelve",
        "Coluna",
        "Extremidades",
        "Personalizado"
      ]
    }
  ],
  "editorModel": {
    "title": "Tomografia Computadorizada de Tórax",
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
      "id": "uso_contraste",
      "label": "Uso de Contraste",
      "unidade": null,
      "referencia": "Sem contraste",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Uso de Contraste conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "padrao_pulmonar",
      "label": "Padrão Pulmonar",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão Pulmonar conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "derrame_pleural",
      "label": "Derrame Pleural",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Derrame Pleural conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "mediastino",
      "label": "Mediastino",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Mediastino conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Tomográfica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Tomográfica conforme referência, contexto clínico e método utilizado."
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
