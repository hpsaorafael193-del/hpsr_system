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
      "resultSummary": "Exame sem alterações relevantes.",
      "interpretation": "Resultados dentro do esperado para método, referência e contexto clínico informado.",
      "conclusion": "Exame sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Exame com alterações nos parâmetros avaliados.",
      "interpretation": "Alterações devem ser correlacionadas com quadro clínico, medicamentos, evolução e exames complementares.",
      "conclusion": "Exame alterado, recomendando correlação clínica."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Exame com achado limítrofe ou inespecífico.",
      "interpretation": "Resultado isolado não define diagnóstico e pode requerer repetição/seguimento conforme avaliação médica.",
      "conclusion": "Achado indefinido ou limítrofe, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame personalizado.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
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
  "technique": "Exame realizado conforme protocolo institucional e indicação clínica informada.",
  "method": "Método técnico definido conforme exame solicitado.",
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
    "normal": "Sem alterações relevantes.",
    "altered": "Alterações a correlacionar clinicamente.",
    "undefined": "Achado indefinido, sem conclusão diagnóstica isolada."
  },
  "conclusion": {
    "normal": "Exame sem alterações significativas.",
    "altered": "Exame alterado, recomendando correlação clínica.",
    "undefined": "Achado indefinido ou limítrofe, recomendando correlação clínica."
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
