import type { IntelligentExamModel } from "../types";

export const img_rm_cardiacaModel: IntelligentExamModel = {
  "id": "img_rm_cardiaca",
  "nome": "Ressonância Magnética Cardíaca",
  "descricao": "Avaliação da anatomia e função cardíaca por ressonância magnética",
  "categoria": "imagem",
  "icone": "fa-heartbeat",
  "campos": [
    {
      "id": "funcao_sistolica",
      "tipo": "select",
      "label": "Função Sistólica",
      "opcoes": [
        {
          "valor": "preservada",
          "label": "Preservada"
        },
        {
          "valor": "reduzida",
          "label": "Reduzida"
        }
      ],
      "referencia": "Preservada"
    },
    {
      "id": "fracao_ejecao",
      "tipo": "number",
      "label": "Fração de Ejeção",
      "unidade": "%",
      "referencia": "≥ 55"
    },
    {
      "id": "realce_tardio",
      "tipo": "select",
      "label": "Realce Tardio",
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
          "label": "Função cardíaca preservada"
        },
        {
          "valor": "miocardiopatia",
          "label": "Miocardiopatia"
        },
        {
          "valor": "isquemica",
          "label": "Doença isquêmica"
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
      "resultSummary": "Ressonância Magnética Cardíaca com Função Sistólica: Preservada; Fração de Ejeção: 59,4; Realce Tardio: Ausente.",
      "interpretation": "Os parâmetros mensurados — Função Sistólica: Preservada; Fração de Ejeção: 59,4 %; Realce Tardio: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ressonância Magnética Cardíaca com parâmetros compatíveis com o padrão esperado, incluindo Função Sistólica: Preservada; Fração de Ejeção: 59,4 %.",
      "results": {
        "funcao_sistolica": "Preservada",
        "fracao_ejecao": "59,4",
        "realce_tardio": "Ausente",
        "impressao": "Ressonância Magnética Cardíaca com parâmetros compatíveis com o padrão esperado, incluindo Função Sistólica: Preservada; Fração de Ejeção: 59,4 %"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Ressonância Magnética Cardíaca: Função Sistólica: Disfunção sistólica moderada; Fração de Ejeção: 43; Realce Tardio: Foco subepicárdico de realce tardio em parede inferolateral.",
      "interpretation": "Os resultados principais (Função Sistólica: Disfunção sistólica moderada; Fração de Ejeção: 43 %; Realce Tardio: Foco subepicárdico de realce tardio em parede inferolateral) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ressonância Magnética Cardíaca com padrão alterado, documentado por Função Sistólica: Disfunção sistólica moderada; Fração de Ejeção: 43 %.",
      "results": {
        "funcao_sistolica": "Disfunção sistólica moderada",
        "fracao_ejecao": "43",
        "realce_tardio": "Foco subepicárdico de realce tardio em parede inferolateral",
        "impressao": "Disfunção sistólica com área focal de fibrose/lesão miocárdica pelo padrão de realce"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Ressonância Magnética Cardíaca: Função Sistólica: Função sistólica global limítrofe; Fração de Ejeção: 53; Realce Tardio: Ausência de realce tardio típico; pequena área duvidosa por artefato.",
      "interpretation": "Os principais resultados (Função Sistólica: Função sistólica global limítrofe; Fração de Ejeção: 53 %; Realce Tardio: Ausência de realce tardio típico; pequena área duvidosa por artefato) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ressonância Magnética Cardíaca com resultado limítrofe/inespecífico, destacando-se Função Sistólica: Função sistólica global limítrofe; Fração de Ejeção: 53 %.",
      "results": {
        "funcao_sistolica": "Função sistólica global limítrofe",
        "fracao_ejecao": "53",
        "realce_tardio": "Ausência de realce tardio típico; pequena área duvidosa por artefato",
        "impressao": "Função ventricular limítrofe, sem fibrose miocárdica definida"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ressonância Magnética Cardíaca: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "funcao_sistolica": "Preservada",
        "fracao_ejecao": "59,4",
        "realce_tardio": "Ausente",
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
    "title": "Ressonância Magnética Cardíaca",
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
  "technique": "Ressonância Magnética Cardíaca realizada com aquisição multiplanar de sequências de ressonância magnética adequadas à região selecionada, incluindo sequências adicionais quando clinicamente indicadas.",
  "method": "Aquisição por ressonância magnética com sequências ponderadas e planos anatômicos apropriados ao protocolo, com contraste paramagnético somente quando indicado.",
  "parameters": [
    {
      "id": "funcao_sistolica",
      "label": "Função Sistólica",
      "unidade": null,
      "referencia": "Preservada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Função Sistólica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "fracao_ejecao",
      "label": "Fração de Ejeção",
      "unidade": "%",
      "referencia": "≥ 55",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fração de Ejeção conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "realce_tardio",
      "label": "Realce Tardio",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Realce Tardio conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Ressonância Magnética Cardíaca compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ressonância Magnética Cardíaca com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ressonância Magnética Cardíaca com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ressonância Magnética Cardíaca sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ressonância Magnética Cardíaca alterado conforme resultados objetivos descritos.",
    "undefined": "Ressonância Magnética Cardíaca com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
