import type { IntelligentExamModel } from "../types";

export const img_rm_colunaModel: IntelligentExamModel = {
  "id": "img_rm_coluna",
  "nome": "Ressonância Magnética de Coluna",
  "descricao": "Avaliação detalhada da coluna vertebral, discos intervertebrais e medula",
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
      "id": "discos",
      "tipo": "select",
      "label": "Discos Intervertebrais",
      "opcoes": [
        {
          "valor": "preservados",
          "label": "Preservados"
        },
        {
          "valor": "protusao",
          "label": "Protusão discal"
        },
        {
          "valor": "hernia",
          "label": "Hérnia discal"
        }
      ],
      "referencia": "Preservados"
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
          "label": "Estenose do canal"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "compressao_neural",
      "tipo": "select",
      "label": "Compressão Neural",
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
          "label": "Sem alterações relevantes"
        },
        {
          "valor": "degenerativa",
          "label": "Doença degenerativa da coluna"
        },
        {
          "valor": "compressiva",
          "label": "Compressão neural"
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
      "resultSummary": "Ressonância Magnética de Coluna com Segmento Avaliado: Conforme segmento selecionado; Discos Intervertebrais: Preservados; Canal Medular: Normal.",
      "interpretation": "Os parâmetros mensurados — Segmento Avaliado: Conforme segmento selecionado; Discos Intervertebrais: Preservados; Canal Medular: Normal; Compressão Neural: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ressonância Magnética de Coluna com parâmetros compatíveis com o padrão esperado, incluindo Segmento Avaliado: Conforme segmento selecionado; Discos Intervertebrais: Preservados.",
      "results": {
        "segmento": "Conforme segmento selecionado",
        "discos": "Preservados",
        "canal_medular": "Normal",
        "compressao_neural": "Ausente",
        "impressao": "Alinhamento e estruturas neurais preservados no segmento avaliado"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Ressonância Magnética de Coluna: Discos Intervertebrais: Desidratação discal com protrusão posterior em nível inferior; Canal Medular: Estreitamento leve do canal no nível da protrusão; Compressão Neural: Contato com raiz adjacente, sem compressão severa.",
      "interpretation": "Os resultados principais (Discos Intervertebrais: Desidratação discal com protrusão posterior em nível inferior; Canal Medular: Estreitamento leve do canal no nível da protrusão; Compressão Neural: Contato com raiz adjacente, sem compressão severa) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ressonância Magnética de Coluna com padrão alterado, documentado por Discos Intervertebrais: Desidratação discal com protrusão posterior em nível inferior; Canal Medular: Estreitamento leve do canal no nível da protrusão.",
      "results": {
        "segmento": "Conforme segmento selecionado",
        "discos": "Desidratação discal com protrusão posterior em nível inferior",
        "canal_medular": "Estreitamento leve do canal no nível da protrusão",
        "compressao_neural": "Contato com raiz adjacente, sem compressão severa",
        "impressao": "Doença degenerativa discal com protrusão posterior e conflito radicular leve"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Ressonância Magnética de Coluna: Discos Intervertebrais: Desidratação discal discreta; Canal Medular: Calibre preservado; Compressão Neural: Sem compressão; contato discreto com saco dural.",
      "interpretation": "Os principais resultados (Discos Intervertebrais: Desidratação discal discreta; Canal Medular: Calibre preservado; Compressão Neural: Sem compressão; contato discreto com saco dural) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ressonância Magnética de Coluna com resultado limítrofe/inespecífico, destacando-se Discos Intervertebrais: Desidratação discal discreta; Canal Medular: Calibre preservado.",
      "results": {
        "segmento": "Conforme segmento selecionado",
        "discos": "Desidratação discal discreta",
        "canal_medular": "Calibre preservado",
        "compressao_neural": "Sem compressão; contato discreto com saco dural",
        "impressao": "Alterações degenerativas leves sem compressão neural definida"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ressonância Magnética de Coluna: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "segmento": "Conforme segmento selecionado",
        "discos": "Preservados",
        "canal_medular": "Normal",
        "compressao_neural": "Ausente",
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
    "title": "Ressonância Magnética de Coluna",
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
  "technique": "Ressonância Magnética de Coluna realizada com aquisição multiplanar de sequências de ressonância magnética adequadas à região selecionada, incluindo sequências adicionais quando clinicamente indicadas.",
  "method": "Aquisição por ressonância magnética com sequências ponderadas e planos anatômicos apropriados ao protocolo, com contraste paramagnético somente quando indicado.",
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
      "id": "discos",
      "label": "Discos Intervertebrais",
      "unidade": null,
      "referencia": "Preservados",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Discos Intervertebrais conforme referência, contexto clínico e método utilizado."
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
      "id": "compressao_neural",
      "label": "Compressão Neural",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Compressão Neural conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Ressonância Magnética de Coluna compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ressonância Magnética de Coluna com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ressonância Magnética de Coluna com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ressonância Magnética de Coluna sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ressonância Magnética de Coluna alterado conforme resultados objetivos descritos.",
    "undefined": "Ressonância Magnética de Coluna com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
