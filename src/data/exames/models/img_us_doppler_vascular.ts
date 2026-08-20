import type { IntelligentExamModel } from "../types";

export const img_us_doppler_vascularModel: IntelligentExamModel = {
  "id": "img_us_doppler_vascular",
  "nome": "Ultrassonografia Doppler Vascular",
  "descricao": "Avaliação do fluxo sanguíneo arterial ou venoso",
  "categoria": "imagem",
  "icone": "fa-wave-square",
  "campos": [
    {
      "id": "territorio",
      "tipo": "select",
      "label": "Território Avaliado",
      "opcoes": [
        {
          "valor": "arterial",
          "label": "Arterial"
        },
        {
          "valor": "venoso",
          "label": "Venoso"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "fluxo",
      "tipo": "select",
      "label": "Fluxo",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "reduzido",
          "label": "Reduzido"
        },
        {
          "valor": "ausente",
          "label": "Ausente"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "trombose",
      "tipo": "select",
      "label": "Trombose",
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
      "label": "Impressão Doppler",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Fluxo preservado"
        },
        {
          "valor": "alterado",
          "label": "Alteração hemodinâmica"
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
      "resultSummary": "Ultrassonografia Doppler Vascular com Território Avaliado: Conforme território vascular selecionado; Fluxo: Normal; Trombose: Ausente.",
      "interpretation": "Os parâmetros mensurados — Território Avaliado: Conforme território vascular selecionado; Fluxo: Normal; Trombose: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ultrassonografia Doppler Vascular com parâmetros compatíveis com o padrão esperado, incluindo Território Avaliado: Conforme território vascular selecionado; Fluxo: Normal.",
      "results": {
        "territorio": "Conforme território vascular selecionado",
        "fluxo": "Normal",
        "trombose": "Ausente",
        "impressao": "Fluxo preservado, sem evidências de trombose no território examinado"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Ultrassonografia Doppler Vascular: Território Avaliado: Membro inferior direito; Fluxo: Ausência de fluxo compressível em segmento venoso profundo; Trombose: Trombo intraluminal com ausência de compressibilidade.",
      "interpretation": "Os resultados principais (Território Avaliado: Membro inferior direito; Fluxo: Ausência de fluxo compressível em segmento venoso profundo; Trombose: Trombo intraluminal com ausência de compressibilidade) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ultrassonografia Doppler Vascular com padrão alterado, documentado por Território Avaliado: Membro inferior direito; Fluxo: Ausência de fluxo compressível em segmento venoso profundo.",
      "results": {
        "territorio": "Membro inferior direito",
        "fluxo": "Ausência de fluxo compressível em segmento venoso profundo",
        "trombose": "Trombo intraluminal com ausência de compressibilidade",
        "impressao": "Achados compatíveis com trombose venosa profunda no território avaliado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Ultrassonografia Doppler Vascular: Território Avaliado: Conforme território selecionado; Fluxo: Fluxo preservado com discreta redução de velocidade focal.",
      "interpretation": "Os principais resultados (Território Avaliado: Conforme território selecionado; Fluxo: Fluxo preservado com discreta redução de velocidade focal) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ultrassonografia Doppler Vascular com resultado limítrofe/inespecífico, destacando-se Território Avaliado: Conforme território selecionado; Fluxo: Fluxo preservado com discreta redução de velocidade focal.",
      "results": {
        "territorio": "Conforme território selecionado",
        "fluxo": "Fluxo preservado com discreta redução de velocidade focal",
        "trombose": "Ausente",
        "impressao": "Variação hemodinâmica discreta, sem trombose demonstrável"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia Doppler Vascular: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "territorio": "Conforme território vascular selecionado",
        "fluxo": "Normal",
        "trombose": "Ausente",
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
    "title": "Ultrassonografia Doppler Vascular",
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
  "technique": "Ultrassonografia Doppler Vascular realizada por ultrassonografia com avaliação sistematizada das estruturas previstas para a região selecionada e medidas pertinentes.",
  "method": "Aquisição ultrassonográfica em modo bidimensional, complementada por Doppler colorido/espectral quando indicado pelo tipo de exame e contexto clínico.",
  "parameters": [
    {
      "id": "territorio",
      "label": "Território Avaliado",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Território Avaliado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "fluxo",
      "label": "Fluxo",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fluxo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "trombose",
      "label": "Trombose",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Trombose conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Doppler",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Doppler conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Ultrassonografia Doppler Vascular compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ultrassonografia Doppler Vascular com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ultrassonografia Doppler Vascular com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ultrassonografia Doppler Vascular sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ultrassonografia Doppler Vascular alterado conforme resultados objetivos descritos.",
    "undefined": "Ultrassonografia Doppler Vascular com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
