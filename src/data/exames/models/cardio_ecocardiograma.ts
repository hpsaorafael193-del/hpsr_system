import type { IntelligentExamModel } from "../types";

export const cardio_ecocardiogramaModel: IntelligentExamModel = {
  "id": "cardio_ecocardiograma",
  "nome": "Ecocardiograma Transtorácico",
  "descricao": "Avaliação anatômica e funcional do coração",
  "categoria": "cardiologia",
  "icone": "fa-heart",
  "campos": [
    {
      "id": "fracao_ejecao",
      "tipo": "number",
      "label": "Fração de Ejeção (FEVE)",
      "unidade": "%",
      "referencia": "≥ 55"
    },
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
      "id": "funcao_diastolica",
      "tipo": "select",
      "label": "Função Diastólica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "grau_1",
          "label": "Disfunção grau I"
        },
        {
          "valor": "grau_2",
          "label": "Disfunção grau II"
        },
        {
          "valor": "grau_3",
          "label": "Disfunção grau III"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "valvulas",
      "tipo": "select",
      "label": "Valvas Cardíacas",
      "opcoes": [
        {
          "valor": "normais",
          "label": "Normais"
        },
        {
          "valor": "estenose",
          "label": "Estenose"
        },
        {
          "valor": "insuficiencia",
          "label": "Insuficiência"
        }
      ],
      "referencia": "Normais"
    },
    {
      "id": "pressao_pulmonar",
      "tipo": "number",
      "label": "Pressão Sistólica da Artéria Pulmonar",
      "unidade": "mmHg",
      "referencia": "< 35"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Ecocardiográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Ecocardiograma normal"
        },
        {
          "valor": "miocardiopatia",
          "label": "Miocardiopatia"
        },
        {
          "valor": "valvar",
          "label": "Doença valvar"
        },
        {
          "valor": "ic",
          "label": "Insuficiência cardíaca"
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
    "title": "Ecocardiograma Transtorácico",
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
      "id": "fracao_ejecao",
      "label": "Fração de Ejeção (FEVE)",
      "unidade": "%",
      "referencia": "≥ 55",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fração de Ejeção (FEVE) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "funcao_sistolica",
      "label": "Função Sistólica",
      "unidade": null,
      "referencia": "Preservada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Função Sistólica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "funcao_diastolica",
      "label": "Função Diastólica",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Função Diastólica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "valvulas",
      "label": "Valvas Cardíacas",
      "unidade": null,
      "referencia": "Normais",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Valvas Cardíacas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "pressao_pulmonar",
      "label": "Pressão Sistólica da Artéria Pulmonar",
      "unidade": "mmHg",
      "referencia": "< 35",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Pressão Sistólica da Artéria Pulmonar conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Ecocardiográfica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Ecocardiográfica conforme referência, contexto clínico e método utilizado."
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
