import type { IntelligentExamModel } from "../types";

export const img_tc_abdome_pelveModel: IntelligentExamModel = {
  "id": "img_tc_abdome_pelve",
  "nome": "Tomografia Computadorizada de Abdome e Pelve",
  "descricao": "Avaliação tomográfica dos órgãos abdominais e pélvicos",
  "categoria": "imagem",
  "icone": "fa-x-ray",
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
      "referencia": "Com contraste"
    },
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
          "valor": "lesoes",
          "label": "Lesões focais"
        },
        {
          "valor": "esteatose",
          "label": "Esteatose"
        }
      ],
      "referencia": "Normal"
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
          "label": "Litíase"
        },
        {
          "valor": "hidronefrose",
          "label": "Hidronefrose"
        }
      ],
      "referencia": "Normais"
    },
    {
      "id": "liquido_livre",
      "tipo": "select",
      "label": "Líquido Livre",
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
      "label": "Impressão Tomográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem alterações significativas"
        },
        {
          "valor": "inflamatoria",
          "label": "Processo inflamatório"
        },
        {
          "valor": "obstrutiva",
          "label": "Processo obstrutivo"
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
      "resultSummary": "Tomografia Computadorizada de Abdome e Pelve com Uso de Contraste: Com contraste; Fígado: Normal; Rins: Normais.",
      "interpretation": "Os parâmetros mensurados — Uso de Contraste: Com contraste; Fígado: Normal; Rins: Normais; Líquido Livre: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Tomografia Computadorizada de Abdome e Pelve com parâmetros compatíveis com o padrão esperado, incluindo Uso de Contraste: Com contraste; Fígado: Normal.",
      "results": {
        "uso_contraste": "Com contraste",
        "figado": "Normal",
        "rins": "Normais",
        "liquido_livre": "Ausente",
        "impressao": "Tomografia Computadorizada de Abdome e Pelve com parâmetros compatíveis com o padrão esperado, incluindo Uso de Contraste: Com contraste; Fígado: Normal"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Tomografia Computadorizada de Abdome e Pelve: Uso de Contraste: Com contraste intravenoso; Fígado: Esteatose hepática difusa, sem lesão focal suspeita; Rins: Cálculo não obstrutivo de 4 mm no rim direito.",
      "interpretation": "Os resultados principais (Uso de Contraste: Com contraste intravenoso; Fígado: Esteatose hepática difusa, sem lesão focal suspeita; Rins: Cálculo não obstrutivo de 4 mm no rim direito) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Tomografia Computadorizada de Abdome e Pelve com padrão alterado, documentado por Uso de Contraste: Com contraste intravenoso; Fígado: Esteatose hepática difusa, sem lesão focal suspeita.",
      "results": {
        "uso_contraste": "Com contraste intravenoso",
        "figado": "Esteatose hepática difusa, sem lesão focal suspeita",
        "rins": "Cálculo não obstrutivo de 4 mm no rim direito",
        "liquido_livre": "Ausente",
        "impressao": "Esteatose hepática e nefrolitíase direita não obstrutiva"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Tomografia Computadorizada de Abdome e Pelve: Fígado: Discreta redução difusa da atenuação, possível esteatose leve; Rins: Sem dilatação; microlitíase puntiforme à direita.",
      "interpretation": "Os principais resultados (Fígado: Discreta redução difusa da atenuação, possível esteatose leve; Rins: Sem dilatação; microlitíase puntiforme à direita) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Tomografia Computadorizada de Abdome e Pelve com resultado limítrofe/inespecífico, destacando-se Fígado: Discreta redução difusa da atenuação, possível esteatose leve; Rins: Sem dilatação; microlitíase puntiforme à direita.",
      "results": {
        "uso_contraste": "Com contraste",
        "figado": "Discreta redução difusa da atenuação, possível esteatose leve",
        "rins": "Sem dilatação; microlitíase puntiforme à direita",
        "liquido_livre": "Ausente",
        "impressao": "Alterações discretas, com possível esteatose leve e microlitíase não obstrutiva"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Tomografia Computadorizada de Abdome e Pelve: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "uso_contraste": "Com contraste",
        "figado": "Normal",
        "rins": "Normais",
        "liquido_livre": "Ausente",
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
    "title": "Tomografia Computadorizada de Abdome e Pelve",
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
  "technique": "Tomografia Computadorizada de Abdome e Pelve realizada por aquisição tomográfica volumétrica da região selecionada, com reconstruções multiplanares e documentação das estruturas avaliadas.",
  "method": "Tomografia computadorizada multislice com reconstruções nos planos adequados; meio de contraste iodado utilizado apenas quando indicado pelo protocolo clínico.",
  "parameters": [
    {
      "id": "uso_contraste",
      "label": "Uso de Contraste",
      "unidade": null,
      "referencia": "Com contraste",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Uso de Contraste conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "figado",
      "label": "Fígado",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fígado conforme referência, contexto clínico e método utilizado."
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
      "id": "liquido_livre",
      "label": "Líquido Livre",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Líquido Livre conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Tomografia Computadorizada de Abdome e Pelve compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Tomografia Computadorizada de Abdome e Pelve com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Tomografia Computadorizada de Abdome e Pelve com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Tomografia Computadorizada de Abdome e Pelve sem alterações significativas nos parâmetros avaliados.",
    "altered": "Tomografia Computadorizada de Abdome e Pelve alterado conforme resultados objetivos descritos.",
    "undefined": "Tomografia Computadorizada de Abdome e Pelve com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
