import type { IntelligentExamModel } from "../types";

export const img_rm_cranioModel: IntelligentExamModel = {
  "id": "img_rm_cranio",
  "nome": "Ressonância Magnética de Crânio",
  "descricao": "Avaliação detalhada do encéfalo, substância branca, cinzenta e estruturas associadas",
  "categoria": "imagem",
  "icone": "fa-brain",
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
      "id": "lesoes_focais",
      "tipo": "select",
      "label": "Lesões Focais",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "presentes",
          "label": "Presentes"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "isquemia",
      "tipo": "select",
      "label": "Sinais de Isquemia",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "aguda",
          "label": "Isquemia aguda"
        },
        {
          "valor": "cronica",
          "label": "Isquemia crônica"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "hemorragia",
      "tipo": "select",
      "label": "Hemorragia",
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
      "id": "substancia_branca",
      "tipo": "select",
      "label": "Substância Branca",
      "opcoes": [
        {
          "valor": "preservada",
          "label": "Preservada"
        },
        {
          "valor": "desmielinizacao",
          "label": "Alterações desmielinizantes"
        }
      ],
      "referencia": "Preservada"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão por RM",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem alterações significativas"
        },
        {
          "valor": "avc",
          "label": "Achados compatíveis com AVC"
        },
        {
          "valor": "desmielinizante",
          "label": "Doença desmielinizante"
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
      "Coluna",
      "Joelho",
      "Ombro",
      "Abdome",
      "Pelve",
      "Mamas",
      "Articulações",
      "Personalizado"
    ],
    "secondaryOptions": [
      "Sem contraste",
      "Com contraste"
    ],
    "description": "A combinação entre região e contraste orienta o modelo de RM sem dividir o exame no catálogo."
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
    "title": "Ressonância Magnética de Crânio",
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
      "id": "lesoes_focais",
      "label": "Lesões Focais",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Lesões Focais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "isquemia",
      "label": "Sinais de Isquemia",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sinais de Isquemia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemorragia",
      "label": "Hemorragia",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemorragia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "substancia_branca",
      "label": "Substância Branca",
      "unidade": null,
      "referencia": "Preservada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Substância Branca conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão por RM",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão por RM conforme referência, contexto clínico e método utilizado."
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
