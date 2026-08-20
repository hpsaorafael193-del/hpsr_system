import type { IntelligentExamModel } from "../types";

export const img_rm_cranioModel: IntelligentExamModel = {
  "id": "img_rm_cranio",
  "nome": "Ressonância Magnética de Crânio",
  "descricao": "Avaliação detalhada do encéfalo, substância branca, cinzenta e estruturas associadas",
  "categoria": "imagem",
  "icone": "fa-brain",
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
      "id": "lesoes_focais",
      "tipo": "select",
      "label": "Lesões Focais",
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
      "id": "isquemia",
      "tipo": "select",
      "label": "Sinais de Isquemia",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "aguda",
          "label": "Isquemia aguda"
        },
        {
          "valor": "cronica",
          "label": "Isquemia crônica"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "hemorragia",
      "tipo": "select",
      "label": "Hemorragia",
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
      "id": "substancia_branca",
      "tipo": "select",
      "label": "Substância Branca",
      "opcoes": [
        {
          "valor": "preservada",
          "label": "Preservada"
        },
        {
          "valor": "desmielinizacao",
          "label": "Alterações desmielinizantes"
        }
      ],
      "referencia": "Preservada"
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
          "valor": "avc",
          "label": "Achados compatíveis com AVC"
        },
        {
          "valor": "desmielinizante",
          "label": "Doença desmielinizante"
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
      "resultSummary": "Ressonância Magnética de Crânio com Uso de Contraste: Sem contraste; Lesões Focais: Ausentes; Sinais de Isquemia: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Uso de Contraste: Sem contraste; Lesões Focais: Ausentes; Sinais de Isquemia: Ausentes; Hemorragia: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ressonância Magnética de Crânio com parâmetros compatíveis com o padrão esperado, incluindo Uso de Contraste: Sem contraste; Lesões Focais: Ausentes.",
      "results": {
        "uso_contraste": "Sem contraste",
        "lesoes_focais": "Ausentes",
        "isquemia": "Ausentes",
        "hemorragia": "Ausente",
        "substancia_branca": "Preservada",
        "impressao": "Ressonância Magnética de Crânio com parâmetros compatíveis com o padrão esperado, incluindo Uso de Contraste: Sem contraste; Lesões Focais: Ausentes"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Ressonância Magnética de Crânio: Lesões Focais: Pequena área de hipersinal em substância branca, inespecífica; Sinais de Isquemia: Sem restrição à difusão sugestiva de isquemia aguda; Substância Branca: Foco inespecífico de alteração de sinal.",
      "interpretation": "Os resultados principais (Lesões Focais: Pequena área de hipersinal em substância branca, inespecífica; Sinais de Isquemia: Sem restrição à difusão sugestiva de isquemia aguda; Substância Branca: Foco inespecífico de alteração de sinal) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ressonância Magnética de Crânio com padrão alterado, documentado por Lesões Focais: Pequena área de hipersinal em substância branca, inespecífica; Sinais de Isquemia: Sem restrição à difusão sugestiva de isquemia aguda.",
      "results": {
        "uso_contraste": "Sem contraste",
        "lesoes_focais": "Pequena área de hipersinal em substância branca, inespecífica",
        "isquemia": "Sem restrição à difusão sugestiva de isquemia aguda",
        "hemorragia": "Ausente",
        "substancia_branca": "Foco inespecífico de alteração de sinal",
        "impressao": "Foco inespecífico de alteração de sinal em substância branca, sem evento agudo"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Ressonância Magnética de Crânio: Lesões Focais: Ponto único de hipersinal inespecífico em substância branca; Sinais de Isquemia: Ausente; Substância Branca: Foco isolado inespecífico.",
      "interpretation": "Os principais resultados (Lesões Focais: Ponto único de hipersinal inespecífico em substância branca; Sinais de Isquemia: Ausente; Substância Branca: Foco isolado inespecífico) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ressonância Magnética de Crânio com resultado limítrofe/inespecífico, destacando-se Lesões Focais: Ponto único de hipersinal inespecífico em substância branca; Sinais de Isquemia: Ausente.",
      "results": {
        "uso_contraste": "Sem contraste",
        "lesoes_focais": "Ponto único de hipersinal inespecífico em substância branca",
        "isquemia": "Ausente",
        "hemorragia": "Ausente",
        "substancia_branca": "Foco isolado inespecífico",
        "impressao": "Foco puntiforme inespecífico em substância branca, sem sinais de evento agudo"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ressonância Magnética de Crânio: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "uso_contraste": "Sem contraste",
        "lesoes_focais": "Ausentes",
        "isquemia": "Ausentes",
        "hemorragia": "Ausente",
        "substancia_branca": "Preservada",
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
    "title": "Ressonância Magnética de Crânio",
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
  "technique": "Ressonância Magnética de Crânio realizada com aquisição multiplanar de sequências de ressonância magnética adequadas à região selecionada, incluindo sequências adicionais quando clinicamente indicadas.",
  "method": "Aquisição por ressonância magnética com sequências ponderadas e planos anatômicos apropriados ao protocolo, com contraste paramagnético somente quando indicado.",
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
      "id": "lesoes_focais",
      "label": "Lesões Focais",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Lesões Focais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "isquemia",
      "label": "Sinais de Isquemia",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sinais de Isquemia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemorragia",
      "label": "Hemorragia",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemorragia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "substancia_branca",
      "label": "Substância Branca",
      "unidade": null,
      "referencia": "Preservada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Substância Branca conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Ressonância Magnética de Crânio compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ressonância Magnética de Crânio com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ressonância Magnética de Crânio com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ressonância Magnética de Crânio sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ressonância Magnética de Crânio alterado conforme resultados objetivos descritos.",
    "undefined": "Ressonância Magnética de Crânio com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
