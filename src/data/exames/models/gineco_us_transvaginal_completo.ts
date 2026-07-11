import type { IntelligentExamModel } from "../types";

export const gineco_us_transvaginal_completoModel: IntelligentExamModel = {
  "id": "gineco_us_transvaginal_completo",
  "nome": "Ultrassonografia Transvaginal",
  "descricao": "Avaliação detalhada do útero, endométrio, ovários e anexos",
  "categoria": "ginecologia",
  "icone": "fa-wave-square",
  "campos": [
    {
      "id": "utero",
      "tipo": "select",
      "label": "Útero",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "miomatose",
          "label": "Miomatose"
        },
        {
          "valor": "adenomiose",
          "label": "Adenomiose"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "endométrio_mm",
      "tipo": "number",
      "label": "Espessura Endometrial",
      "unidade": "mm",
      "referencia": "< 12"
    },
    {
      "id": "ovario_direito",
      "tipo": "select",
      "label": "Ovário Direito",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "cisto_simples",
          "label": "Cisto simples"
        },
        {
          "valor": "cisto_complexo",
          "label": "Cisto complexo"
        },
        {
          "valor": "policistico",
          "label": "Aspecto policístico"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "ovario_esquerdo",
      "tipo": "select",
      "label": "Ovário Esquerdo",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "cisto_simples",
          "label": "Cisto simples"
        },
        {
          "valor": "cisto_complexo",
          "label": "Cisto complexo"
        },
        {
          "valor": "policistico",
          "label": "Aspecto policístico"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "liquido_livre",
      "tipo": "select",
      "label": "Líquido Livre em Fundo de Saco",
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
      "label": "Impressão Ultrassonográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Exame dentro da normalidade"
        },
        {
          "valor": "alteracoes_uterinas",
          "label": "Alterações uterinas"
        },
        {
          "valor": "alteracoes_ovarinas",
          "label": "Alterações ovarianas"
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
    "title": "Ultrassonografia Transvaginal",
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
      "id": "utero",
      "label": "Útero",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Útero conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "endométrio_mm",
      "label": "Espessura Endometrial",
      "unidade": "mm",
      "referencia": "< 12",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Espessura Endometrial conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ovario_direito",
      "label": "Ovário Direito",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ovário Direito conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ovario_esquerdo",
      "label": "Ovário Esquerdo",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ovário Esquerdo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "liquido_livre",
      "label": "Líquido Livre em Fundo de Saco",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Líquido Livre em Fundo de Saco conforme referência, contexto clínico e método utilizado."
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
