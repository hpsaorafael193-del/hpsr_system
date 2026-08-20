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
      "resultSummary": "Ultrassonografia Transvaginal com Útero: Normal; Espessura Endometrial: 8,6; Ovário Direito: Normal.",
      "interpretation": "Os parâmetros mensurados — Útero: Normal; Espessura Endometrial: 8,6 mm; Ovário Direito: Normal; Ovário Esquerdo: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ultrassonografia Transvaginal com parâmetros compatíveis com o padrão esperado, incluindo Útero: Normal; Espessura Endometrial: 8,6 mm.",
      "results": {
        "utero": "Normal",
        "endométrio_mm": "8,6",
        "ovario_direito": "Normal",
        "ovario_esquerdo": "Normal",
        "liquido_livre": "Ausente",
        "impressao": "Ultrassonografia Transvaginal com parâmetros compatíveis com o padrão esperado, incluindo Útero: Normal; Espessura Endometrial: 8,6 mm"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Ultrassonografia Transvaginal: Útero: Útero de dimensões habituais, com mioma intramural de 2,3 cm; Espessura Endometrial: 13,6; Ovário Direito: Cisto simples de 3,1 cm; Ovário Esquerdo: Morfologia preservada.",
      "interpretation": "Os resultados principais (Útero: Útero de dimensões habituais, com mioma intramural de 2,3 cm; Espessura Endometrial: 13,6 mm; Ovário Direito: Cisto simples de 3,1 cm; Ovário Esquerdo: Morfologia preservada) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ultrassonografia Transvaginal com padrão alterado, documentado por Útero: Útero de dimensões habituais, com mioma intramural de 2,3 cm; Espessura Endometrial: 13,6 mm.",
      "results": {
        "utero": "Útero de dimensões habituais, com mioma intramural de 2,3 cm",
        "endométrio_mm": "13,6",
        "ovario_direito": "Cisto simples de 3,1 cm",
        "ovario_esquerdo": "Morfologia preservada",
        "liquido_livre": "Pequena lâmina em fundo de saco",
        "impressao": "Mioma intramural e cisto ovariano simples à direita"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Ultrassonografia Transvaginal: Espessura Endometrial: 12,2; Ovário Direito: Folículo/cisto funcional simples de 2,5 cm; Líquido Livre em Fundo de Saco: Mínima lâmina fisiológica.",
      "interpretation": "Os principais resultados (Espessura Endometrial: 12,2 mm; Ovário Direito: Folículo/cisto funcional simples de 2,5 cm; Líquido Livre em Fundo de Saco: Mínima lâmina fisiológica) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ultrassonografia Transvaginal com resultado limítrofe/inespecífico, destacando-se Espessura Endometrial: 12,2 mm; Ovário Direito: Folículo/cisto funcional simples de 2,5 cm.",
      "results": {
        "utero": "Normal",
        "endométrio_mm": "12,2",
        "ovario_direito": "Folículo/cisto funcional simples de 2,5 cm",
        "ovario_esquerdo": "Normal",
        "liquido_livre": "Mínima lâmina fisiológica",
        "impressao": "Espessura endometrial limítrofe e cisto funcional simples"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia Transvaginal: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "utero": "Normal",
        "endométrio_mm": "8,6",
        "ovario_direito": "Normal",
        "ovario_esquerdo": "Normal",
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
  "technique": "Ultrassonografia transvaginal realizada com avaliação do útero, endométrio, ovários, anexos e fundo de saco, incluindo medidas e características morfológicas relevantes.",
  "method": "Exame ultrassonográfico por transdutor endocavitário multifrequencial, com modo bidimensional e Doppler quando clinicamente indicado.",
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
    "normal": "Resultados de Ultrassonografia Transvaginal compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ultrassonografia Transvaginal com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ultrassonografia Transvaginal com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ultrassonografia Transvaginal sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ultrassonografia Transvaginal alterado conforme resultados objetivos descritos.",
    "undefined": "Ultrassonografia Transvaginal com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
