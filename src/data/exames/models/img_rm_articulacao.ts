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
      "resultSummary": "Ressonância Magnética de Articulação com Articulação Avaliada: Conforme articulação selecionada; Ligamentos: Íntegros; Meniscos / Tendões: Preservados.",
      "interpretation": "Os parâmetros mensurados — Articulação Avaliada: Conforme articulação selecionada; Ligamentos: Íntegros; Meniscos / Tendões: Preservados; Derrame Articular: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ressonância Magnética de Articulação com parâmetros compatíveis com o padrão esperado, incluindo Articulação Avaliada: Conforme articulação selecionada; Ligamentos: Íntegros.",
      "results": {
        "articulacao": "Conforme articulação selecionada",
        "ligamentos": "Íntegros",
        "meniscos_tendao": "Preservados",
        "derrame_articular": "Ausente",
        "impressao": "Estruturas osteoarticulares sem alterações relevantes por RM"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Ressonância Magnética de Articulação: Ligamentos: Espessamento e hipersinal de fibras ligamentares, sem ruptura completa; Meniscos / Tendões: Sinal degenerativo/lesão parcial na estrutura avaliada; Derrame Articular: Pequeno derrame articular.",
      "interpretation": "Os resultados principais (Ligamentos: Espessamento e hipersinal de fibras ligamentares, sem ruptura completa; Meniscos / Tendões: Sinal degenerativo/lesão parcial na estrutura avaliada; Derrame Articular: Pequeno derrame articular) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ressonância Magnética de Articulação com padrão alterado, documentado por Ligamentos: Espessamento e hipersinal de fibras ligamentares, sem ruptura completa; Meniscos / Tendões: Sinal degenerativo/lesão parcial na estrutura avaliada.",
      "results": {
        "articulacao": "Conforme articulação selecionada",
        "ligamentos": "Espessamento e hipersinal de fibras ligamentares, sem ruptura completa",
        "meniscos_tendao": "Sinal degenerativo/lesão parcial na estrutura avaliada",
        "derrame_articular": "Pequeno derrame articular",
        "impressao": "Alterações ligamentares e pequeno derrame articular"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Ressonância Magnética de Articulação: Ligamentos: Discreto espessamento sem descontinuidade; Meniscos / Tendões: Sinal intrassubstancial degenerativo sem ruptura definida; Derrame Articular: Mínimo derrame.",
      "interpretation": "Os principais resultados (Ligamentos: Discreto espessamento sem descontinuidade; Meniscos / Tendões: Sinal intrassubstancial degenerativo sem ruptura definida; Derrame Articular: Mínimo derrame) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ressonância Magnética de Articulação com resultado limítrofe/inespecífico, destacando-se Ligamentos: Discreto espessamento sem descontinuidade; Meniscos / Tendões: Sinal intrassubstancial degenerativo sem ruptura definida.",
      "results": {
        "articulacao": "Conforme articulação selecionada",
        "ligamentos": "Discreto espessamento sem descontinuidade",
        "meniscos_tendao": "Sinal intrassubstancial degenerativo sem ruptura definida",
        "derrame_articular": "Mínimo derrame",
        "impressao": "Alterações degenerativas discretas, sem lesão estrutural maior"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ressonância Magnética de Articulação: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "articulacao": "Conforme articulação selecionada",
        "ligamentos": "Íntegros",
        "meniscos_tendao": "Preservados",
        "derrame_articular": "Ausente",
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
  "technique": "Ressonância Magnética de Articulação realizada com aquisição multiplanar de sequências de ressonância magnética adequadas à região selecionada, incluindo sequências adicionais quando clinicamente indicadas.",
  "method": "Aquisição por ressonância magnética com sequências ponderadas e planos anatômicos apropriados ao protocolo, com contraste paramagnético somente quando indicado.",
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
    "normal": "Resultados de Ressonância Magnética de Articulação compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ressonância Magnética de Articulação com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ressonância Magnética de Articulação com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ressonância Magnética de Articulação sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ressonância Magnética de Articulação alterado conforme resultados objetivos descritos.",
    "undefined": "Ressonância Magnética de Articulação com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
