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
      "resultSummary": "Tomografia Computadorizada de Tórax com Uso de Contraste: Sem contraste; Padrão Pulmonar: Normal; Derrame Pleural: Ausente.",
      "interpretation": "Os parâmetros mensurados — Uso de Contraste: Sem contraste; Padrão Pulmonar: Normal; Derrame Pleural: Ausente; Mediastino: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Tomografia Computadorizada de Tórax com parâmetros compatíveis com o padrão esperado, incluindo Uso de Contraste: Sem contraste; Padrão Pulmonar: Normal.",
      "results": {
        "uso_contraste": "Sem contraste",
        "padrao_pulmonar": "Normal",
        "derrame_pleural": "Ausente",
        "mediastino": "Normal",
        "impressao": "Tomografia Computadorizada de Tórax com parâmetros compatíveis com o padrão esperado, incluindo Uso de Contraste: Sem contraste; Padrão Pulmonar: Normal"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Tomografia Computadorizada de Tórax: Padrão Pulmonar: Opacidades em vidro fosco multifocais de predomínio periférico; Mediastino: Sem linfonodomegalias significativas.",
      "interpretation": "Os resultados principais (Padrão Pulmonar: Opacidades em vidro fosco multifocais de predomínio periférico; Mediastino: Sem linfonodomegalias significativas) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Tomografia Computadorizada de Tórax com padrão alterado, documentado por Padrão Pulmonar: Opacidades em vidro fosco multifocais de predomínio periférico; Mediastino: Sem linfonodomegalias significativas.",
      "results": {
        "uso_contraste": "Sem contraste",
        "padrao_pulmonar": "Opacidades em vidro fosco multifocais de predomínio periférico",
        "derrame_pleural": "Ausente",
        "mediastino": "Sem linfonodomegalias significativas",
        "impressao": "Opacidades pulmonares em vidro fosco multifocais, de padrão inflamatório/infeccioso no contexto adequado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Tomografia Computadorizada de Tórax: Padrão Pulmonar: Pequenas atelectasias laminares bibasais; Mediastino: Sem alterações significativas.",
      "interpretation": "Os principais resultados (Padrão Pulmonar: Pequenas atelectasias laminares bibasais; Mediastino: Sem alterações significativas) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Tomografia Computadorizada de Tórax com resultado limítrofe/inespecífico, destacando-se Padrão Pulmonar: Pequenas atelectasias laminares bibasais; Mediastino: Sem alterações significativas.",
      "results": {
        "uso_contraste": "Sem contraste",
        "padrao_pulmonar": "Pequenas atelectasias laminares bibasais",
        "derrame_pleural": "Ausente",
        "mediastino": "Sem alterações significativas",
        "impressao": "Atelectasias laminares discretas, sem consolidação focal"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Tomografia Computadorizada de Tórax: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "uso_contraste": "Sem contraste",
        "padrao_pulmonar": "Normal",
        "derrame_pleural": "Ausente",
        "mediastino": "Normal",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
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
  "technique": "Tomografia Computadorizada de Tórax realizada por aquisição tomográfica volumétrica da região selecionada, com reconstruções multiplanares e documentação das estruturas avaliadas.",
  "method": "Tomografia computadorizada multislice com reconstruções nos planos adequados; meio de contraste iodado utilizado apenas quando indicado pelo protocolo clínico.",
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
    "normal": "Resultados de Tomografia Computadorizada de Tórax compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Tomografia Computadorizada de Tórax com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Tomografia Computadorizada de Tórax com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Tomografia Computadorizada de Tórax sem alterações significativas nos parâmetros avaliados.",
    "altered": "Tomografia Computadorizada de Tórax alterado conforme resultados objetivos descritos.",
    "undefined": "Tomografia Computadorizada de Tórax com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
