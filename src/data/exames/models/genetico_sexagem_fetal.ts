import type { IntelligentExamModel } from "../types";

export const genetico_sexagem_fetalModel: IntelligentExamModel = {
  "id": "genetico_sexagem_fetal",
  "nome": "Sexagem Fetal",
  "descricao": "Exame molecular para determinação do sexo fetal por detecção de DNA fetal livre no sangue materno.",
  "categoria": "genetico",
  "icone": "fa-dna",
  "campos": [
    {
      "id": "metodo",
      "tipo": "select",
      "label": "Método",
      "opcoes": [
        {
          "valor": "dna_fetal_materno",
          "label": "DNA fetal livre no sangue materno"
        },
        {
          "valor": "outro",
          "label": "Outro método"
        }
      ],
      "referencia": "Metodologia utilizada"
    },
    {
      "id": "idade_gestacional",
      "tipo": "text",
      "label": "Idade gestacional",
      "placeholder": "Ex: 8 semanas"
    },
    {
      "id": "tipo_gestacao",
      "tipo": "select",
      "label": "Tipo de gestação",
      "opcoes": [
        {
          "valor": "unica",
          "label": "Gestação única"
        },
        {
          "valor": "gemelar",
          "label": "Gestação gemelar"
        },
        {
          "valor": "multipla",
          "label": "Gestação múltipla (≥3 fetos)"
        }
      ],
      "referencia": "Número de fetos"
    },
    {
      "id": "corionicidade",
      "tipo": "select",
      "label": "Corionicidade / Zigosidade",
      "opcoes": [
        {
          "valor": "nao_aplicavel",
          "label": "Não aplicável (gestação única)"
        },
        {
          "valor": "univitelina",
          "label": "Univitelina (monozigótica)"
        },
        {
          "valor": "bivitelina",
          "label": "Bivitelina (dizigótica)"
        },
        {
          "valor": "indeterminado",
          "label": "Indeterminado"
        }
      ],
      "referencia": "Importante em gestações múltiplas"
    },
    {
      "id": "vitalidade_fetal",
      "tipo": "select",
      "label": "Vitalidade fetal (USG)",
      "opcoes": [
        {
          "valor": "nao_avaliado",
          "label": "Não avaliado"
        },
        {
          "valor": "presente",
          "label": "Vitalidade presente"
        },
        {
          "valor": "ausente",
          "label": "Vitalidade ausente"
        },
        {
          "valor": "indeterminado",
          "label": "Indeterminado"
        }
      ],
      "referencia": "Baseado em ultrassonografia"
    },
    {
      "id": "resultado",
      "tipo": "select",
      "label": "Resultado",
      "opcoes": [
        {
          "valor": "presenca_cromossomo_y",
          "label": "Sexo fetal masculino"
        },
        {
          "valor": "ausencia_cromossomo_y",
          "label": "Sexo fetal feminino"
        },
        {
          "valor": "presenca_y_gestacao_multipla",
          "label": "Gestação múltipla, sexo fetais feminino e masculino"
        },
        {
          "valor": "presenca_y_gestacao_multipla",
          "label": "Gestação múltipla, sexo fetais masculino"
        },
        {
          "valor": "ausencia_y_gestacao_multipla",
          "label": "Gestação múltipla, sexo fetais feminino"
        },
        {
          "valor": "inconclusivo",
          "label": "Resultado inconclusivo devido a limitações técnicas ou baixa fração fetal"
        }
      ],
      "referencia": "Detecção do cromossomo Y"
    },
    {
      "id": "confiabilidade",
      "tipo": "select",
      "label": "Confiabilidade da amostra",
      "opcoes": [
        {
          "valor": "adequada",
          "label": "Amostra adequada"
        },
        {
          "valor": "baixa_fracao_fetal",
          "label": "Baixa fração fetal"
        },
        {
          "valor": "inadequada",
          "label": "Amostra inadequada"
        }
      ],
      "referencia": "Qualidade da amostra"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão",
      "opcoes": [
        {
          "valor": "masculino",
          "label": "Sexo masculino identificado"
        },
        {
          "valor": "feminino",
          "label": "Sexo feminino identificado"
        },
        {
          "valor": "masculino_feminino_gemelar",
          "label": "Presença de ambos os sexos masculino e feminino"
        },
        {
          "valor": "provavel_feminino_gemelar",
          "label": "Provável gestação feminina (sem detecção de Y)"
        },
        {
          "valor": "provavel_masculino_gemelar",
          "label": "Provável gestação masculina (com detecção de Y)"
        },
        {
          "valor": "inconclusivo",
          "label": "Resultado inconclusivo"
        }
      ],
      "referencia": "Conclusão do exame"
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
    "title": "Sexagem Fetal",
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
    "standard": "genetica",
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
  "technique": "Análise realizada em material biológico informado, utilizando marcadores compatíveis com a finalidade do exame.",
  "method": "Comparação de marcadores genéticos conforme metodologia validada e tipo de vínculo investigado.",
  "parameters": [
    {
      "id": "metodo",
      "label": "Método",
      "unidade": null,
      "referencia": "Metodologia utilizada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Método conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "idade_gestacional",
      "label": "Idade gestacional",
      "unidade": null,
      "referencia": "Ex: 8 semanas",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Idade gestacional conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tipo_gestacao",
      "label": "Tipo de gestação",
      "unidade": null,
      "referencia": "Número de fetos",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de gestação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "corionicidade",
      "label": "Corionicidade / Zigosidade",
      "unidade": null,
      "referencia": "Importante em gestações múltiplas",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Corionicidade / Zigosidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "vitalidade_fetal",
      "label": "Vitalidade fetal (USG)",
      "unidade": null,
      "referencia": "Baseado em ultrassonografia",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Vitalidade fetal (USG) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resultado",
      "label": "Resultado",
      "unidade": null,
      "referencia": "Detecção do cromossomo Y",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "confiabilidade",
      "label": "Confiabilidade da amostra",
      "unidade": null,
      "referencia": "Qualidade da amostra",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Confiabilidade da amostra conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão",
      "unidade": null,
      "referencia": "Conclusão do exame",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultado compatível com a hipótese técnica analisada.",
    "altered": "Resultado incompatível ou alterado conforme finalidade do exame.",
    "undefined": "Resultado inconclusivo/insuficiente para definição técnica segura."
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
