import type { IntelligentExamModel } from "../types";

export const lab_painel_alergiaModel: IntelligentExamModel = {
  "id": "lab_painel_alergia",
  "nome": "Painel de Alergia",
  "descricao": "Investigação de sensibilização alérgica por IgE total e específica",
  "categoria": "laboratorio",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "ige_total",
      "tipo": "number",
      "label": "IgE Total",
      "unidade": "UI/mL",
      "referencia": "< 100"
    },
    {
      "id": "alergenos_respiratorios",
      "tipo": "select",
      "label": "Alergenos Respiratórios",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "alergenos_alimentares",
      "tipo": "select",
      "label": "Alergenos Alimentares",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "alergenos_medicamentos",
      "tipo": "select",
      "label": "Alergenos Medicamentosos",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "tipo_reacao",
      "tipo": "select",
      "label": "Tipo de Reação",
      "opcoes": [
        {
          "valor": "cutanea",
          "label": "Cutânea"
        },
        {
          "valor": "respiratoria",
          "label": "Respiratória"
        },
        {
          "valor": "gastrointestinal",
          "label": "Gastrointestinal"
        },
        {
          "valor": "sistemica",
          "label": "Sistêmica"
        },
        {
          "valor": "nao_identificada",
          "label": "Não identificada"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "gravidade",
      "tipo": "select",
      "label": "Gravidade",
      "opcoes": [
        {
          "valor": "leve",
          "label": "Leve"
        },
        {
          "valor": "moderada",
          "label": "Moderada"
        },
        {
          "valor": "grave",
          "label": "Grave"
        }
      ],
      "referencia": "Leve"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem evidências laboratoriais de alergia"
        },
        {
          "valor": "sensibilizacao",
          "label": "Sensibilização alérgica identificada"
        },
        {
          "valor": "alergia_confirmada",
          "label": "Perfil compatível com doença alérgica"
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
    "title": "Painel de Alergia",
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
      "id": "ige_total",
      "label": "IgE Total",
      "unidade": "UI/mL",
      "referencia": "< 100",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar IgE Total conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "alergenos_respiratorios",
      "label": "Alergenos Respiratórios",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Alergenos Respiratórios conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "alergenos_alimentares",
      "label": "Alergenos Alimentares",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Alergenos Alimentares conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "alergenos_medicamentos",
      "label": "Alergenos Medicamentosos",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Alergenos Medicamentosos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tipo_reacao",
      "label": "Tipo de Reação",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Reação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "gravidade",
      "label": "Gravidade",
      "unidade": null,
      "referencia": "Leve",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Gravidade conforme referência, contexto clínico e método utilizado."
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
