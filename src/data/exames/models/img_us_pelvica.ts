import type { IntelligentExamModel } from "../types";

export const img_us_pelvicaModel: IntelligentExamModel = {
  "id": "img_us_pelvica",
  "nome": "Ultrassonografia Pélvica",
  "descricao": "Avaliação ultrassonográfica dos órgãos pélvicos",
  "categoria": "imagem",
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
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "endometrio",
      "tipo": "number",
      "label": "Espessura Endometrial",
      "unidade": "mm",
      "referencia": "< 12"
    },
    {
      "id": "ovarios",
      "tipo": "select",
      "label": "Ovários",
      "opcoes": [
        {
          "valor": "normais",
          "label": "Normais"
        },
        {
          "valor": "cistos",
          "label": "Cistos ovarianos"
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
      "label": "Impressão Ultrassonográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Exame dentro da normalidade"
        },
        {
          "valor": "ginecologica",
          "label": "Alterações ginecológicas"
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
      "resultSummary": "Ultrassonografia Pélvica com Útero: Normal; Espessura Endometrial: 8,6; Ovários: Normais.",
      "interpretation": "Os parâmetros mensurados — Útero: Normal; Espessura Endometrial: 8,6 mm; Ovários: Normais; Líquido Livre: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ultrassonografia Pélvica com parâmetros compatíveis com o padrão esperado, incluindo Útero: Normal; Espessura Endometrial: 8,6 mm.",
      "results": {
        "utero": "Normal",
        "endometrio": "8,6",
        "ovarios": "Normais",
        "liquido_livre": "Ausente",
        "impressao": "Ultrassonografia Pélvica com parâmetros compatíveis com o padrão esperado, incluindo Útero: Normal; Espessura Endometrial: 8,6 mm"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Ultrassonografia Pélvica: Útero: Útero com mioma intramural de 2,5 cm; Espessura Endometrial: 13,4; Ovários: Cisto simples de 3,2 cm no ovário direito; esquerdo preservado; Líquido Livre: Pequena lâmina em fundo de saco.",
      "interpretation": "Os resultados principais (Útero: Útero com mioma intramural de 2,5 cm; Espessura Endometrial: 13,4 mm; Ovários: Cisto simples de 3,2 cm no ovário direito; esquerdo preservado; Líquido Livre: Pequena lâmina em fundo de saco) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ultrassonografia Pélvica com padrão alterado, documentado por Útero: Útero com mioma intramural de 2,5 cm; Espessura Endometrial: 13,4 mm.",
      "results": {
        "utero": "Útero com mioma intramural de 2,5 cm",
        "endometrio": "13,4",
        "ovarios": "Cisto simples de 3,2 cm no ovário direito; esquerdo preservado",
        "liquido_livre": "Pequena lâmina em fundo de saco",
        "impressao": "Mioma uterino e cisto ovariano simples à direita"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Ultrassonografia Pélvica: Ovários: Cisto funcional simples de 2,6 cm à direita; Líquido Livre: Mínima lâmina em fundo de saco.",
      "interpretation": "Os principais resultados (Ovários: Cisto funcional simples de 2,6 cm à direita; Líquido Livre: Mínima lâmina em fundo de saco) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ultrassonografia Pélvica com resultado limítrofe/inespecífico, destacando-se Ovários: Cisto funcional simples de 2,6 cm à direita; Líquido Livre: Mínima lâmina em fundo de saco.",
      "results": {
        "utero": "Normal",
        "endometrio": "8,6",
        "ovarios": "Cisto funcional simples de 2,6 cm à direita",
        "liquido_livre": "Mínima lâmina em fundo de saco",
        "endométrio": "12,1",
        "impressao": "Alterações funcionais discretas, sem massa complexa"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia Pélvica: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "utero": "Normal",
        "endometrio": "8,6",
        "ovarios": "Normais",
        "liquido_livre": "Ausente",
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
    "title": "Ultrassonografia Pélvica",
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
  "technique": "Ultrassonografia Pélvica realizada por ultrassonografia com avaliação sistematizada das estruturas previstas para a região selecionada e medidas pertinentes.",
  "method": "Aquisição ultrassonográfica em modo bidimensional, complementada por Doppler colorido/espectral quando indicado pelo tipo de exame e contexto clínico.",
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
      "id": "endometrio",
      "label": "Espessura Endometrial",
      "unidade": "mm",
      "referencia": "< 12",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Espessura Endometrial conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ovarios",
      "label": "Ovários",
      "unidade": null,
      "referencia": "Normais",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ovários conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Ultrassonografia Pélvica compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ultrassonografia Pélvica com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ultrassonografia Pélvica com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ultrassonografia Pélvica sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ultrassonografia Pélvica alterado conforme resultados objetivos descritos.",
    "undefined": "Ultrassonografia Pélvica com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
