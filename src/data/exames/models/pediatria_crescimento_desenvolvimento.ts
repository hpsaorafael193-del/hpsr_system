import type { IntelligentExamModel } from "../types";

export const pediatria_crescimento_desenvolvimentoModel: IntelligentExamModel = {
  "id": "pediatria_crescimento_desenvolvimento",
  "nome": "Avaliação de Crescimento e Desenvolvimento",
  "descricao": "Monitoramento antropométrico e desenvolvimento neuropsicomotor",
  "categoria": "pediatria",
  "icone": "fa-chart-line",
  "campos": [
    {
      "id": "peso",
      "tipo": "number",
      "label": "Peso",
      "unidade": "kg",
      "referencia": "Percentis OMS"
    },
    {
      "id": "estatura",
      "tipo": "number",
      "label": "Estatura",
      "unidade": "cm",
      "referencia": "Percentis OMS"
    },
    {
      "id": "desenvolvimento",
      "tipo": "select",
      "label": "Desenvolvimento Neuropsicomotor",
      "opcoes": [
        {
          "valor": "adequado",
          "label": "Adequado para a idade"
        },
        {
          "valor": "atraso",
          "label": "Atraso no desenvolvimento"
        }
      ],
      "referencia": "Adequado"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Pediátrica",
      "opcoes": [
        {
          "valor": "adequado",
          "label": "Crescimento adequado"
        },
        {
          "valor": "alerta",
          "label": "Necessita acompanhamento"
        }
      ],
      "referencia": "Adequado"
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
    "title": "Avaliação de Crescimento e Desenvolvimento",
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
      "id": "peso",
      "label": "Peso",
      "unidade": "kg",
      "referencia": "Percentis OMS",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Peso conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "estatura",
      "label": "Estatura",
      "unidade": "cm",
      "referencia": "Percentis OMS",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estatura conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "desenvolvimento",
      "label": "Desenvolvimento Neuropsicomotor",
      "unidade": null,
      "referencia": "Adequado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Desenvolvimento Neuropsicomotor conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Pediátrica",
      "unidade": null,
      "referencia": "Adequado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Pediátrica conforme referência, contexto clínico e método utilizado."
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
