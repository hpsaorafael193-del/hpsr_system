import type { IntelligentExamModel } from "../types";

export const oftalmo_fundo_olhoModel: IntelligentExamModel = {
  "id": "oftalmo_fundo_olho",
  "nome": "Fundo de Olho",
  "descricao": "Avaliação da retina, mácula e nervo óptico",
  "categoria": "oftalmologia",
  "icone": "fa-eye-low-vision",
  "campos": [
    {
      "id": "disco_optico",
      "tipo": "select",
      "label": "Disco Óptico",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "escavacao_aumentada",
          "label": "Escavação aumentada"
        },
        {
          "valor": "edema",
          "label": "Edema de papila"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "macula",
      "tipo": "select",
      "label": "Mácula",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "edema",
          "label": "Edema macular"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "retina",
      "tipo": "select",
      "label": "Retina",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "retinopatia_diabetica",
          "label": "Retinopatia diabética"
        },
        {
          "valor": "lesoes",
          "label": "Lesões retinianas"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Oftalmoscópica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Fundo de olho normal"
        },
        {
          "valor": "alterado",
          "label": "Alterações fundoscópicas"
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
    "title": "Fundo de Olho",
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
      "id": "disco_optico",
      "label": "Disco Óptico",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Disco Óptico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "macula",
      "label": "Mácula",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Mácula conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "retina",
      "label": "Retina",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Retina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Oftalmoscópica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Oftalmoscópica conforme referência, contexto clínico e método utilizado."
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
