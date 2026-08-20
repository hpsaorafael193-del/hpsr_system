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
      "resultSummary": "Ultrassonografia de Abdome Total com Fígado: Normal; Vesícula Biliar: Normal; Vias Biliares: Não dilatadas.",
      "interpretation": "Os parâmetros mensurados — Fígado: Normal; Vesícula Biliar: Normal; Vias Biliares: Não dilatadas; Rins: Normais — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ultrassonografia de Abdome Total com parâmetros compatíveis com o padrão esperado, incluindo Fígado: Normal; Vesícula Biliar: Normal.",
      "results": {
        "figado": "Normal",
        "vesicula_biliar": "Normal",
        "vias_biliares": "Não dilatadas",
        "rins": "Normais",
        "baço": "Normal",
        "impressao": "Ultrassonografia de Abdome Total com parâmetros compatíveis com o padrão esperado, incluindo Fígado: Normal; Vesícula Biliar: Normal"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Ultrassonografia de Abdome Total: Fígado: Aumento difuso da ecogenicidade hepática, compatível com esteatose; Vesícula Biliar: Cálculo móvel de 8 mm, sem espessamento parietal; Rins: Sem hidronefrose; pequeno cisto cortical simples à esquerda; Baço: Dimensões preservadas.",
      "interpretation": "Os resultados principais (Fígado: Aumento difuso da ecogenicidade hepática, compatível com esteatose; Vesícula Biliar: Cálculo móvel de 8 mm, sem espessamento parietal; Rins: Sem hidronefrose; pequeno cisto cortical simples à esquerda; Baço: Dimensões preservadas) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ultrassonografia de Abdome Total com padrão alterado, documentado por Fígado: Aumento difuso da ecogenicidade hepática, compatível com esteatose; Vesícula Biliar: Cálculo móvel de 8 mm, sem espessamento parietal.",
      "results": {
        "figado": "Aumento difuso da ecogenicidade hepática, compatível com esteatose",
        "vesicula_biliar": "Cálculo móvel de 8 mm, sem espessamento parietal",
        "vias_biliares": "Não dilatadas",
        "rins": "Sem hidronefrose; pequeno cisto cortical simples à esquerda",
        "baço": "Dimensões preservadas",
        "impressao": "Esteatose hepática e colelitíase, sem sinais ultrassonográficos de colecistite"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Ultrassonografia de Abdome Total: Fígado: Discreto aumento difuso da ecogenicidade; Vesícula Biliar: Sem cálculos; pequena dobra de parede sem espessamento; Rins: Pequeno cisto cortical simples.",
      "interpretation": "Os principais resultados (Fígado: Discreto aumento difuso da ecogenicidade; Vesícula Biliar: Sem cálculos; pequena dobra de parede sem espessamento; Rins: Pequeno cisto cortical simples) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ultrassonografia de Abdome Total com resultado limítrofe/inespecífico, destacando-se Fígado: Discreto aumento difuso da ecogenicidade; Vesícula Biliar: Sem cálculos; pequena dobra de parede sem espessamento.",
      "results": {
        "figado": "Discreto aumento difuso da ecogenicidade",
        "vesicula_biliar": "Sem cálculos; pequena dobra de parede sem espessamento",
        "vias_biliares": "Não dilatadas",
        "rins": "Pequeno cisto cortical simples",
        "baço": "Normal",
        "impressao": "Esteatose hepática leve e pequeno cisto renal simples"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia de Abdome Total: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "figado": "Normal",
        "vesicula_biliar": "Normal",
        "vias_biliares": "Não dilatadas",
        "rins": "Normais",
        "baço": "Normal",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
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
  "technique": "Ultrassonografia de Abdome Total realizada por ultrassonografia com avaliação sistematizada das estruturas previstas para a região selecionada e medidas pertinentes.",
  "method": "Aquisição ultrassonográfica em modo bidimensional, complementada por Doppler colorido/espectral quando indicado pelo tipo de exame e contexto clínico.",
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
    "normal": "Resultados de Ultrassonografia de Abdome Total compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ultrassonografia de Abdome Total com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ultrassonografia de Abdome Total com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ultrassonografia de Abdome Total sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ultrassonografia de Abdome Total alterado conforme resultados objetivos descritos.",
    "undefined": "Ultrassonografia de Abdome Total com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
