import type { IntelligentExamModel } from "../types";

export const img_tc_colunaModel: IntelligentExamModel = {
  "id": "img_tc_coluna",
  "nome": "Tomografia Computadorizada de Coluna",
  "descricao": "Avaliação tomográfica da coluna vertebral",
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
      "id": "fraturas",
      "tipo": "select",
      "label": "Fraturas",
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
          "label": "Estenose"
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
          "valor": "degenerativa",
          "label": "Alterações degenerativas"
        },
        {
          "valor": "traumatica",
          "label": "Achados traumáticos"
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
      "resultSummary": "Tomografia Computadorizada de Coluna com Segmento Avaliado: Conforme segmento selecionado; Fraturas: Ausentes; Canal Medular: Normal.",
      "interpretation": "Os parâmetros mensurados — Segmento Avaliado: Conforme segmento selecionado; Fraturas: Ausentes; Canal Medular: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Tomografia Computadorizada de Coluna com parâmetros compatíveis com o padrão esperado, incluindo Segmento Avaliado: Conforme segmento selecionado; Fraturas: Ausentes.",
      "results": {
        "segmento": "Conforme segmento selecionado",
        "fraturas": "Ausentes",
        "canal_medular": "Normal",
        "impressao": "Ausência de fratura aguda ou estenose significativa no segmento avaliado"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Tomografia Computadorizada de Coluna: Fraturas: Fratura compressiva discreta de corpo vertebral, sem retropulsão significativa; Canal Medular: Calibre preservado.",
      "interpretation": "Os resultados principais (Fraturas: Fratura compressiva discreta de corpo vertebral, sem retropulsão significativa; Canal Medular: Calibre preservado) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Tomografia Computadorizada de Coluna com padrão alterado, documentado por Fraturas: Fratura compressiva discreta de corpo vertebral, sem retropulsão significativa; Canal Medular: Calibre preservado.",
      "results": {
        "segmento": "Conforme segmento selecionado",
        "fraturas": "Fratura compressiva discreta de corpo vertebral, sem retropulsão significativa",
        "canal_medular": "Calibre preservado",
        "impressao": "Fratura compressiva vertebral sem comprometimento significativo do canal"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Tomografia Computadorizada de Coluna: Canal Medular: Discreto estreitamento degenerativo em um nível.",
      "interpretation": "Os principais resultados (Canal Medular: Discreto estreitamento degenerativo em um nível) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Tomografia Computadorizada de Coluna com resultado limítrofe/inespecífico, destacando-se Canal Medular: Discreto estreitamento degenerativo em um nível.",
      "results": {
        "segmento": "Conforme segmento selecionado",
        "fraturas": "Ausentes",
        "canal_medular": "Discreto estreitamento degenerativo em um nível",
        "impressao": "Alteração degenerativa discreta sem fratura aguda"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Tomografia Computadorizada de Coluna: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "segmento": "Conforme segmento selecionado",
        "fraturas": "Ausentes",
        "canal_medular": "Normal",
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
    "title": "Tomografia Computadorizada de Coluna",
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
  "technique": "Tomografia Computadorizada de Coluna realizada por aquisição tomográfica volumétrica da região selecionada, com reconstruções multiplanares e documentação das estruturas avaliadas.",
  "method": "Tomografia computadorizada multislice com reconstruções nos planos adequados; meio de contraste iodado utilizado apenas quando indicado pelo protocolo clínico.",
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
      "id": "fraturas",
      "label": "Fraturas",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fraturas conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Tomografia Computadorizada de Coluna compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Tomografia Computadorizada de Coluna com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Tomografia Computadorizada de Coluna com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Tomografia Computadorizada de Coluna sem alterações significativas nos parâmetros avaliados.",
    "altered": "Tomografia Computadorizada de Coluna alterado conforme resultados objetivos descritos.",
    "undefined": "Tomografia Computadorizada de Coluna com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
