import type { IntelligentExamModel } from "../types";

export const img_rm_colunaModel: IntelligentExamModel = {
  "id": "img_rm_coluna",
  "nome": "Ressonância Magnética de Coluna",
  "descricao": "Avaliação detalhada da coluna vertebral, discos intervertebrais e medula",
  "categoria": "imagem",
  "icone": "fa-x-ray",
  "campos": [
    {
      "id": "segmento",
      "tipo": "select",
      "label": "Segmento Avaliado",
      "opcoes": [
        {
          "valor": "cervical",
          "label": "Cervical"
        },
        {
          "valor": "toracica",
          "label": "Torácica"
        },
        {
          "valor": "lombar",
          "label": "Lombar"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "discos",
      "tipo": "select",
      "label": "Discos Intervertebrais",
      "opcoes": [
        {
          "valor": "preservados",
          "label": "Preservados"
        },
        {
          "valor": "protusao",
          "label": "Protusão discal"
        },
        {
          "valor": "hernia",
          "label": "Hérnia discal"
        }
      ],
      "referencia": "Preservados"
    },
    {
      "id": "canal_medular",
      "tipo": "select",
      "label": "Canal Medular",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "estenose",
          "label": "Estenose do canal"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "compressao_neural",
      "tipo": "select",
      "label": "Compressão Neural",
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
          "label": "Sem alterações relevantes"
        },
        {
          "valor": "degenerativa",
          "label": "Doença degenerativa da coluna"
        },
        {
          "valor": "compressiva",
          "label": "Compressão neural"
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
    "title": "Ressonância Magnética de Coluna",
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
      "id": "segmento",
      "label": "Segmento Avaliado",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Segmento Avaliado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "discos",
      "label": "Discos Intervertebrais",
      "unidade": null,
      "referencia": "Preservados",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Discos Intervertebrais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "canal_medular",
      "label": "Canal Medular",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Canal Medular conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "compressao_neural",
      "label": "Compressão Neural",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Compressão Neural conforme referência, contexto clínico e método utilizado."
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
