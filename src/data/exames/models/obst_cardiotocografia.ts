import type { IntelligentExamModel } from "../types";

export const obst_cardiotocografiaModel: IntelligentExamModel = {
  "id": "obst_cardiotocografia",
  "nome": "Cardiotocografia (CTG)",
  "descricao": "Avaliação do bem-estar fetal por frequência cardíaca fetal e contrações uterinas",
  "categoria": "obstetricia",
  "icone": "fa-heartbeat",
  "campos": [
    {
      "id": "fcf_basal",
      "tipo": "number",
      "label": "FCF Basal",
      "unidade": "bpm",
      "referencia": "110 – 160"
    },
    {
      "id": "variabilidade",
      "tipo": "select",
      "label": "Variabilidade",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "diminuida",
          "label": "Diminuída"
        },
        {
          "valor": "aumentada",
          "label": "Aumentada"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "aceleracoes",
      "tipo": "select",
      "label": "Acelerações",
      "opcoes": [
        {
          "valor": "presentes",
          "label": "Presentes"
        },
        {
          "valor": "ausentes",
          "label": "Ausentes"
        }
      ],
      "referencia": "Presentes"
    },
    {
      "id": "desaceleracoes",
      "tipo": "select",
      "label": "Desacelerações",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "precoces",
          "label": "Precoces"
        },
        {
          "valor": "tardias",
          "label": "Tardias"
        },
        {
          "valor": "variaveis",
          "label": "Variáveis"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Obstétrica",
      "opcoes": [
        {
          "valor": "reativa",
          "label": "CTG reativa"
        },
        {
          "valor": "nao_reativa",
          "label": "CTG não reativa"
        },
        {
          "valor": "suspeita",
          "label": "CTG suspeita"
        }
      ],
      "referencia": "Reativa"
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
    "id": "padrao",
    "label": "Sem adaptador obrigatório",
    "kind": "none",
    "enabled": false,
    "options": [
      "Padrão"
    ],
    "description": "Modelo direto, configurável por perfil e variáveis clínicas relevantes."
  },
  "clinicalContexts": [
    "Rotina",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Parâmetros dentro das referências disponíveis.",
      "resultSummary": "Cardiotocografia (CTG) com FCF Basal: 134; Variabilidade: Normal; Acelerações: Presentes.",
      "interpretation": "Os parâmetros mensurados — FCF Basal: 134 bpm; Variabilidade: Normal; Acelerações: Presentes; Desacelerações: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Cardiotocografia (CTG) com parâmetros compatíveis com o padrão esperado, incluindo FCF Basal: 134 bpm; Variabilidade: Normal.",
      "results": {
        "fcf_basal": "134",
        "variabilidade": "Normal",
        "aceleracoes": "Presentes",
        "desaceleracoes": "Ausentes",
        "impressao": "Reativa"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Cardiotocografia (CTG): FCF Basal: 170; Variabilidade: Reduzida; Acelerações: Ausentes no período observado; Desacelerações: Desacelerações tardias recorrentes.",
      "interpretation": "Os resultados principais (FCF Basal: 170 bpm; Variabilidade: Reduzida; Acelerações: Ausentes no período observado; Desacelerações: Desacelerações tardias recorrentes) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Cardiotocografia (CTG) com padrão alterado, documentado por FCF Basal: 170 bpm; Variabilidade: Reduzida.",
      "results": {
        "fcf_basal": "170",
        "variabilidade": "Reduzida",
        "aceleracoes": "Ausentes no período observado",
        "desaceleracoes": "Desacelerações tardias recorrentes",
        "impressao": "Traçado não tranquilizador, requer avaliação obstétrica imediata"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Cardiotocografia (CTG): FCF Basal: 160; Variabilidade: Limítrofe/reduzida por período curto; Acelerações: Presentes, porém escassas; Desacelerações: Variáveis isoladas.",
      "interpretation": "Os principais resultados (FCF Basal: 160 bpm; Variabilidade: Limítrofe/reduzida por período curto; Acelerações: Presentes, porém escassas; Desacelerações: Variáveis isoladas) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Cardiotocografia (CTG) com resultado limítrofe/inespecífico, destacando-se FCF Basal: 160 bpm; Variabilidade: Limítrofe/reduzida por período curto.",
      "results": {
        "fcf_basal": "160",
        "variabilidade": "Limítrofe/reduzida por período curto",
        "aceleracoes": "Presentes, porém escassas",
        "desaceleracoes": "Variáveis isoladas",
        "impressao": "Traçado limítrofe, recomendando prolongar observação e correlacionar clinicamente"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Cardiotocografia (CTG): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "fcf_basal": "134",
        "variabilidade": "Normal",
        "aceleracoes": "Presentes",
        "desaceleracoes": "Ausentes",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [
    {
      "id": "contexto_clinico",
      "label": "Contexto clínico",
      "tipo": "text"
    }
  ],
  "editorModel": {
    "title": "Cardiotocografia (CTG)",
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
        "title": "2. Achados / Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabelas técnicas",
        "required": false,
        "visibleByDefault": false
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": true,
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
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "procedimento",
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
        "title": "2. Achados / Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabelas técnicas",
        "required": false,
        "visibleByDefault": false
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": true,
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
  "technique": "Cardiotocografia realizada com registro simultâneo da frequência cardíaca fetal e atividade uterina durante período adequado de observação.",
  "method": "Monitorização eletrônica externa com transdutor ultrassônico para frequência cardíaca fetal e tocodinamômetro para atividade uterina, analisando linha de base, variabilidade, acelerações e desacelerações.",
  "parameters": [
    {
      "id": "fcf_basal",
      "label": "FCF Basal",
      "unidade": "bpm",
      "referencia": "110 – 160",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar FCF Basal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "variabilidade",
      "label": "Variabilidade",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Variabilidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "aceleracoes",
      "label": "Acelerações",
      "unidade": null,
      "referencia": "Presentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Acelerações conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "desaceleracoes",
      "label": "Desacelerações",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Desacelerações conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Obstétrica",
      "unidade": null,
      "referencia": "Reativa",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Obstétrica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Cardiotocografia (CTG) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Cardiotocografia (CTG) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Cardiotocografia (CTG) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Cardiotocografia (CTG) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Cardiotocografia (CTG) alterado conforme resultados objetivos descritos.",
    "undefined": "Cardiotocografia (CTG) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
