import type { IntelligentExamModel } from "../types";

export const lab_dtpaModel: IntelligentExamModel = {
  "id": "lab_dtpa",
  "nome": "dTpa (Difteria, Tétano e Coqueluche)",
  "descricao": "Registro e avaliação de imunização dTpa",
  "categoria": "laboratorio",
  "icone": "fa-syringe",
  "campos": [
    {
      "id": "situacao_vacinal",
      "tipo": "select",
      "label": "Situação Vacinal",
      "opcoes": [
        {
          "valor": "em_dia",
          "label": "Em dia"
        },
        {
          "valor": "atrasada",
          "label": "Atrasada"
        },
        {
          "valor": "nao_vacinado",
          "label": "Não vacinado"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "dose",
      "tipo": "select",
      "label": "Dose Avaliada",
      "opcoes": [
        {
          "valor": "primeira",
          "label": "1ª dose"
        },
        {
          "valor": "reforco",
          "label": "Reforço"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "indicacao",
      "tipo": "select",
      "label": "Indicação Clínica",
      "opcoes": [
        {
          "valor": "gestante",
          "label": "Gestante"
        },
        {
          "valor": "adulto",
          "label": "Adulto"
        },
        {
          "valor": "profissional_saude",
          "label": "Profissional de saúde"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Vacinal",
      "opcoes": [
        {
          "valor": "adequada",
          "label": "Imunização adequada"
        },
        {
          "valor": "necessita_dose",
          "label": "Necessita atualização vacinal"
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
  "variables": [],
  "editorModel": {
    "title": "dTpa (Difteria, Tétano e Coqueluche)",
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
      "id": "situacao_vacinal",
      "label": "Situação Vacinal",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Situação Vacinal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "dose",
      "label": "Dose Avaliada",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Dose Avaliada conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "indicacao",
      "label": "Indicação Clínica",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Indicação Clínica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Vacinal",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Vacinal conforme referência, contexto clínico e método utilizado."
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
