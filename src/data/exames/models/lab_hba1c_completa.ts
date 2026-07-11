import type { IntelligentExamModel } from "../types";

export const lab_hba1c_completaModel: IntelligentExamModel = {
  "id": "lab_hba1c_completa",
  "nome": "Hemoglobina Glicada (HbA1c)",
  "descricao": "Avaliação do controle glicêmico médio dos últimos 2 a 3 meses",
  "categoria": "laboratorio",
  "icone": "fa-chart-line",
  "campos": [
    {
      "id": "hba1c",
      "tipo": "number",
      "label": "HbA1c",
      "unidade": "%",
      "referencia": "< 5.7"
    },
    {
      "id": "glicemia_media_estimada",
      "tipo": "number",
      "label": "Glicemia Média Estimada (eAG)",
      "unidade": "mg/dL",
      "referencia": "—"
    },
    {
      "id": "controle_glicemico",
      "tipo": "select",
      "label": "Controle Glicêmico",
      "opcoes": [
        {
          "valor": "adequado",
          "label": "Adequado"
        },
        {
          "valor": "parcial",
          "label": "Parcialmente controlado"
        },
        {
          "valor": "inadequado",
          "label": "Inadequado"
        }
      ],
      "referencia": "Adequado"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Controle glicêmico normal"
        },
        {
          "valor": "prediabetes",
          "label": "Compatível com pré-diabetes"
        },
        {
          "valor": "diabetes_controlado",
          "label": "Diabetes controlado"
        },
        {
          "valor": "diabetes_descompensado",
          "label": "Diabetes descompensado"
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
    "Controle",
    "Rastreamento",
    "Suspeita clínica",
    "Acompanhamento",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "HbA1c dentro do padrão esperado.",
      "resultSummary": "Hemoglobina glicada dentro da faixa de referência.",
      "interpretation": "HbA1c dentro do padrão esperado, sem evidência laboratorial de alteração glicêmica crônica pelo parâmetro avaliado.",
      "conclusion": "HbA1c sem alteração laboratorial relevante."
    },
    {
      "id": "pre_diabetes",
      "name": "Pré-diabetes / limítrofe",
      "status": "indefinido",
      "description": "HbA1c em faixa intermediária.",
      "resultSummary": "HbA1c em faixa limítrofe/intermediária.",
      "interpretation": "Resultado em faixa intermediária, devendo ser correlacionado com glicemia, risco metabólico e critérios clínicos.",
      "conclusion": "Alteração glicêmica crônica limítrofe/intermediária."
    },
    {
      "id": "diabetes",
      "name": "Alterado / compatível com diabetes",
      "status": "alterado",
      "description": "HbA1c elevada.",
      "resultSummary": "HbA1c elevada.",
      "interpretation": "HbA1c acima da faixa usual, compatível com alteração glicêmica crônica. Resultado deve ser interpretado conforme critérios clínicos e laboratoriais.",
      "conclusion": "HbA1c elevada, compatível com alteração glicêmica crônica."
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
  "variables": [],
  "editorModel": {
    "title": "Hemoglobina Glicada (HbA1c)",
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
        "id": "resultados",
        "title": "2. Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabela técnica",
        "required": false,
        "visibleByDefault": true
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
      "resultados",
      "tabelas",
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
      "resultados",
      "tabelas",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "laboratorio",
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
        "id": "resultados",
        "title": "2. Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabela técnica",
        "required": false,
        "visibleByDefault": true
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
  "technique": "Amostra processada conforme método laboratorial validado, com controles internos e referências aplicáveis ao exame.",
  "method": "Método laboratorial compatível com o parâmetro analisado, conforme validação interna do serviço.",
  "parameters": [
    {
      "id": "hba1c",
      "label": "HbA1c",
      "unidade": "%",
      "referencia": "< 5.7",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar HbA1c conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "glicemia_media_estimada",
      "label": "Glicemia Média Estimada (eAG)",
      "unidade": "mg/dL",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Glicemia Média Estimada (eAG) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "controle_glicemico",
      "label": "Controle Glicêmico",
      "unidade": null,
      "referencia": "Adequado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Controle Glicêmico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Clínica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Clínica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [
    {
      "id": "tabela_tecnica",
      "title": "Tabela técnica laboratorial",
      "headers": [
        "Parâmetro",
        "Resultado",
        "Valores de referência"
      ],
      "rowsFromParameters": true
    }
  ],
  "interpretation": {
    "normal": "Parâmetros dentro dos valores de referência disponíveis.",
    "altered": "Um ou mais parâmetros fora da referência, com significado dependente do contexto clínico.",
    "undefined": "Alteração discreta, limítrofe ou inconclusiva, sem definição diagnóstica isolada."
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
