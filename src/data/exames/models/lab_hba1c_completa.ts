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
      "resultSummary": "HbA1c de 5,4%, com glicemia média estimada de aproximadamente 108 mg/dL.",
      "interpretation": "HbA1c de 5,4%, abaixo de 5,7%, dentro da faixa não diabética. A glicemia média estimada correspondente é de aproximadamente 108 mg/dL.",
      "conclusion": "Hemoglobina glicada dentro da faixa de normalidade laboratorial.",
      "results": {
        "hba1c": "5,4",
        "glicemia_media_estimada": "108",
        "controle_glicemico": "Dentro da faixa não diabética",
        "impressao": "HbA1c dentro da faixa de normalidade"
      }
    },
    {
      "id": "pre_diabetes",
      "name": "Pré-diabetes / limítrofe",
      "status": "indefinido",
      "description": "HbA1c em faixa intermediária.",
      "resultSummary": "HbA1c de 5,9%, com glicemia média estimada de aproximadamente 123 mg/dL.",
      "interpretation": "HbA1c de 5,9%, situada na faixa de 5,7% a 6,4%, compatível com pré-diabetes pelos critérios laboratoriais usuais. Glicemia média estimada de aproximadamente 123 mg/dL.",
      "conclusion": "Hemoglobina glicada em faixa compatível com pré-diabetes.",
      "results": {
        "hba1c": "5,9",
        "glicemia_media_estimada": "123",
        "controle_glicemico": "Faixa de risco glicêmico aumentado",
        "impressao": "HbA1c em faixa compatível com pré-diabetes"
      }
    },
    {
      "id": "diabetes",
      "name": "Alterado / compatível com diabetes",
      "status": "alterado",
      "description": "HbA1c elevada.",
      "resultSummary": "HbA1c de 7,2%, com glicemia média estimada de aproximadamente 160 mg/dL.",
      "interpretation": "HbA1c de 7,2%, acima do ponto de corte laboratorial de 6,5% utilizado para diabetes. Glicemia média estimada de aproximadamente 160 mg/dL; interpretar conforme contexto clínico e critérios diagnósticos aplicáveis.",
      "conclusion": "Hemoglobina glicada elevada, em faixa laboratorial compatível com diabetes.",
      "results": {
        "hba1c": "7,2",
        "glicemia_media_estimada": "160",
        "controle_glicemico": "Acima da faixa diagnóstica de normalidade",
        "impressao": "HbA1c em faixa compatível com diabetes"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Hemoglobina Glicada (HbA1c): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "hba1c": "5,4",
        "glicemia_media_estimada": "108",
        "controle_glicemico": "Dentro da faixa não diabética",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
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
  "technique": "Amostra de sangue total processada para quantificação da hemoglobina glicada, refletindo a exposição glicêmica média aproximada dos últimos dois a três meses.",
  "method": "Quantificação de HbA1c por metodologia padronizada/rastreável, com cálculo da glicemia média estimada a partir do percentual de HbA1c.",
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
    "normal": "Resultados de Hemoglobina Glicada (HbA1c) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Hemoglobina Glicada (HbA1c) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Hemoglobina Glicada (HbA1c) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Hemoglobina Glicada (HbA1c) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Hemoglobina Glicada (HbA1c) alterado conforme resultados objetivos descritos.",
    "undefined": "Hemoglobina Glicada (HbA1c) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
