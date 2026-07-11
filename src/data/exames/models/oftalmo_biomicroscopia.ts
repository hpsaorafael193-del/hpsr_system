import type { IntelligentExamModel } from "../types";

export const oftalmo_biomicroscopiaModel: IntelligentExamModel = {
  "id": "oftalmo_biomicroscopia",
  "nome": "Biomicroscopia",
  "descricao": "Avaliação do segmento anterior do olho",
  "categoria": "oftalmologia",
  "icone": "fa-search",
  "campos": [
    {
      "id": "palpebras_conjuntiva",
      "tipo": "select",
      "label": "Pálpebras e Conjuntiva",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normais"
        },
        {
          "valor": "hiperemia",
          "label": "Hiperemia"
        },
        {
          "valor": "blefarite",
          "label": "Blefarite"
        }
      ],
      "referencia": "Normais"
    },
    {
      "id": "cornea",
      "tipo": "select",
      "label": "Córnea",
      "opcoes": [
        {
          "valor": "transparente",
          "label": "Transparente"
        },
        {
          "valor": "opacidade",
          "label": "Opacidade"
        },
        {
          "valor": "ceratite",
          "label": "Ceratite"
        }
      ],
      "referencia": "Transparente"
    },
    {
      "id": "camara_anterior",
      "tipo": "select",
      "label": "Câmara Anterior",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "rasa",
          "label": "Rasa"
        },
        {
          "valor": "inflamacao",
          "label": "Sinais inflamatórios"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "cristalino",
      "tipo": "select",
      "label": "Cristalino",
      "opcoes": [
        {
          "valor": "transparente",
          "label": "Transparente"
        },
        {
          "valor": "catarata",
          "label": "Opacidades (Catarata)"
        }
      ],
      "referencia": "Transparente"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Biomicroscópica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Segmento anterior sem alterações"
        },
        {
          "valor": "alterado",
          "label": "Alterações no segmento anterior"
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
    "title": "Biomicroscopia",
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
      "id": "palpebras_conjuntiva",
      "label": "Pálpebras e Conjuntiva",
      "unidade": null,
      "referencia": "Normais",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Pálpebras e Conjuntiva conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "cornea",
      "label": "Córnea",
      "unidade": null,
      "referencia": "Transparente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Córnea conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "camara_anterior",
      "label": "Câmara Anterior",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Câmara Anterior conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "cristalino",
      "label": "Cristalino",
      "unidade": null,
      "referencia": "Transparente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cristalino conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Biomicroscópica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Biomicroscópica conforme referência, contexto clínico e método utilizado."
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
