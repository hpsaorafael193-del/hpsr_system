import type { IntelligentExamModel } from "../types";

export const neuro_liquorModel: IntelligentExamModel = {
  "id": "neuro_liquor",
  "nome": "Análise do Líquor (LCR)",
  "descricao": "Avaliação do líquido cefalorraquidiano",
  "categoria": "neurologia",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "aspecto",
      "tipo": "select",
      "label": "Aspecto",
      "opcoes": [
        {
          "valor": "claro",
          "label": "Claro"
        },
        {
          "valor": "turvo",
          "label": "Turvo"
        }
      ],
      "referencia": "Claro"
    },
    {
      "id": "celulas",
      "tipo": "number",
      "label": "Células",
      "unidade": "cél/mm³",
      "referencia": "< 5"
    },
    {
      "id": "proteinas",
      "tipo": "number",
      "label": "Proteínas",
      "unidade": "mg/dL",
      "referencia": "15 – 45"
    },
    {
      "id": "glicose",
      "tipo": "number",
      "label": "Glicose",
      "unidade": "mg/dL",
      "referencia": "≥ 2/3 da glicemia"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Neurológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "LCR normal"
        },
        {
          "valor": "meningite",
          "label": "Sugestivo de meningite"
        },
        {
          "valor": "inflamatoria",
          "label": "Processo inflamatório do SNC"
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
    "title": "Análise do Líquor (LCR)",
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
      "id": "aspecto",
      "label": "Aspecto",
      "unidade": null,
      "referencia": "Claro",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Aspecto conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "celulas",
      "label": "Células",
      "unidade": "cél/mm³",
      "referencia": "< 5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Células conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "proteinas",
      "label": "Proteínas",
      "unidade": "mg/dL",
      "referencia": "15 – 45",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Proteínas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "glicose",
      "label": "Glicose",
      "unidade": "mg/dL",
      "referencia": "≥ 2/3 da glicemia",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Glicose conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Neurológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Neurológica conforme referência, contexto clínico e método utilizado."
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
