import type { IntelligentExamModel } from "../types";

export const oftalmo_acuidade_visualModel: IntelligentExamModel = {
  "id": "oftalmo_acuidade_visual",
  "nome": "Acuidade Visual",
  "descricao": "Avaliação da acuidade visual utilizando escala de Snellen.",
  "categoria": "oftalmologia",
  "icone": "fa-eye",
  "campos": [
    {
      "id": "condicao_avaliacao",
      "tipo": "select",
      "label": "Condição da avaliação",
      "opcoes": [
        {
          "valor": "sem_correcao",
          "label": "Sem correção óptica"
        },
        {
          "valor": "com_correcao",
          "label": "Com correção óptica"
        }
      ],
      "referencia": "Uso de óculos/lentes"
    },
    {
      "id": "acuidade_od",
      "tipo": "text",
      "label": "Acuidade visual – Olho Direito (OD)",
      "placeholder": "Ex: 20/20, 20/40, CD, MM, PL, NPL"
    },
    {
      "id": "acuidade_oe",
      "tipo": "text",
      "label": "Acuidade visual – Olho Esquerdo (OE)",
      "placeholder": "Ex: 20/20, 20/40, CD, MM, PL, NPL"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Oftalmológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Acuidade visual dentro dos padrões de normalidade"
        },
        {
          "valor": "reduzida",
          "label": "Redução da acuidade visual"
        },
        {
          "valor": "baixa_visao",
          "label": "Baixa visão"
        },
        {
          "valor": "cegueira_funcional",
          "label": "Cegueira funcional"
        }
      ],
      "referencia": "Classificação funcional"
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
    "title": "Acuidade Visual",
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
      "id": "condicao_avaliacao",
      "label": "Condição da avaliação",
      "unidade": null,
      "referencia": "Uso de óculos/lentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Condição da avaliação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "acuidade_od",
      "label": "Acuidade visual – Olho Direito (OD)",
      "unidade": null,
      "referencia": "Ex: 20/20, 20/40, CD, MM, PL, NPL",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Acuidade visual – Olho Direito (OD) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "acuidade_oe",
      "label": "Acuidade visual – Olho Esquerdo (OE)",
      "unidade": null,
      "referencia": "Ex: 20/20, 20/40, CD, MM, PL, NPL",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Acuidade visual – Olho Esquerdo (OE) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Oftalmológica",
      "unidade": null,
      "referencia": "Classificação funcional",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Oftalmológica conforme referência, contexto clínico e método utilizado."
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
