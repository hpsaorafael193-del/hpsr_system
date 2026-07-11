import type { IntelligentExamModel } from "../types";

export const img_rm_articulacaoModel: IntelligentExamModel = {
  "id": "img_rm_articulacao",
  "nome": "Ressonância Magnética de Articulação",
  "descricao": "Avaliação detalhada das estruturas articulares, cartilagens, ligamentos e tendões",
  "categoria": "imagem",
  "icone": "fa-x-ray",
  "campos": [
    {
      "id": "articulacao",
      "tipo": "select",
      "label": "Articulação Avaliada",
      "opcoes": [
        {
          "valor": "joelho",
          "label": "Joelho"
        },
        {
          "valor": "ombro",
          "label": "Ombro"
        },
        {
          "valor": "quadril",
          "label": "Quadril"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "ligamentos",
      "tipo": "select",
      "label": "Ligamentos",
      "opcoes": [
        {
          "valor": "integros",
          "label": "Íntegros"
        },
        {
          "valor": "lesao_parcial",
          "label": "Lesão parcial"
        },
        {
          "valor": "lesao_completa",
          "label": "Lesão completa"
        }
      ],
      "referencia": "Íntegros"
    },
    {
      "id": "meniscos_tendao",
      "tipo": "select",
      "label": "Meniscos / Tendões",
      "opcoes": [
        {
          "valor": "preservados",
          "label": "Preservados"
        },
        {
          "valor": "lesionados",
          "label": "Lesionados"
        }
      ],
      "referencia": "Preservados"
    },
    {
      "id": "derrame_articular",
      "tipo": "select",
      "label": "Derrame Articular",
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
      "label": "Impressão por RM",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem alterações significativas"
        },
        {
          "valor": "lesao_ligamentar",
          "label": "Lesão ligamentar"
        },
        {
          "valor": "lesao_meniscal",
          "label": "Lesão meniscal/tendínea"
        },
        {
          "valor": "degenerativa",
          "label": "Alterações degenerativas"
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
    "title": "Ressonância Magnética de Articulação",
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
      "id": "articulacao",
      "label": "Articulação Avaliada",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Articulação Avaliada conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ligamentos",
      "label": "Ligamentos",
      "unidade": null,
      "referencia": "Íntegros",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ligamentos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "meniscos_tendao",
      "label": "Meniscos / Tendões",
      "unidade": null,
      "referencia": "Preservados",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Meniscos / Tendões conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "derrame_articular",
      "label": "Derrame Articular",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Derrame Articular conforme referência, contexto clínico e método utilizado."
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
