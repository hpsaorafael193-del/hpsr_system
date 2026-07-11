import type { IntelligentExamModel } from "../types";

export const derm_exame_clinicoModel: IntelligentExamModel = {
  "id": "derm_exame_clinico",
  "nome": "Exame Dermatológico Clínico",
  "descricao": "Avaliação morfológica das lesões cutâneas",
  "categoria": "dermatologia",
  "icone": "fa-skin",
  "campos": [
    {
      "id": "tipo_lesao",
      "tipo": "select",
      "label": "Tipo de Lesão",
      "opcoes": [
        {
          "valor": "macula",
          "label": "Mácula"
        },
        {
          "valor": "papula",
          "label": "Pápula"
        },
        {
          "valor": "nodulo",
          "label": "Nódulo"
        },
        {
          "valor": "vesicula",
          "label": "Vesícula"
        },
        {
          "valor": "placa",
          "label": "Placa"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "distribuicao",
      "tipo": "select",
      "label": "Distribuição",
      "opcoes": [
        {
          "valor": "localizada",
          "label": "Localizada"
        },
        {
          "valor": "difusa",
          "label": "Difusa"
        }
      ],
      "referencia": "Localizada"
    },
    {
      "id": "sinais_inflamatorios",
      "tipo": "select",
      "label": "Sinais Inflamatórios",
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
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Dermatológica",
      "opcoes": [
        {
          "valor": "benigna",
          "label": "Lesão de aspecto benigno"
        },
        {
          "valor": "inflamatoria",
          "label": "Dermatose inflamatória"
        },
        {
          "valor": "suspeita",
          "label": "Lesão suspeita"
        }
      ],
      "referencia": "—"
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
    "title": "Exame Dermatológico Clínico",
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
      "id": "tipo_lesao",
      "label": "Tipo de Lesão",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Lesão conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "distribuicao",
      "label": "Distribuição",
      "unidade": null,
      "referencia": "Localizada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Distribuição conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sinais_inflamatorios",
      "label": "Sinais Inflamatórios",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sinais Inflamatórios conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Dermatológica",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Dermatológica conforme referência, contexto clínico e método utilizado."
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
