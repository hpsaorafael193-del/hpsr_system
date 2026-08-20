import type { IntelligentExamModel } from "../types";

export const lab_teste_dnaModel: IntelligentExamModel = {
  "id": "lab_teste_dna",
  "nome": "Teste de DNA",
  "descricao": "Análise genética para identificação de vínculo biológico ou investigação genética",
  "categoria": "genetico",
  "icone": "fa-dna",
  "campos": [
    {
      "id": "finalidade",
      "tipo": "select",
      "label": "Finalidade do Teste",
      "opcoes": [
        {
          "valor": "paternidade",
          "label": "Paternidade"
        },
        {
          "valor": "maternidade",
          "label": "Maternidade"
        },
        {
          "valor": "parentesco",
          "label": "Parentesco biológico"
        },
        {
          "valor": "identificacao",
          "label": "Identificação genética"
        }
      ],
      "referencia": "Paternidade / Parentesco"
    },
    {
      "id": "tipo_amostra",
      "tipo": "select",
      "label": "Tipo de Amostra",
      "opcoes": [
        {
          "valor": "swab_bucal",
          "label": "Swab bucal"
        },
        {
          "valor": "sangue",
          "label": "Sangue periférico"
        },
        {
          "valor": "outro",
          "label": "Outro"
        }
      ],
      "referencia": "Swab bucal"
    },
    {
      "id": "perfil_genetico",
      "tipo": "select",
      "label": "Perfil Genético",
      "opcoes": [
        {
          "valor": "compativel",
          "label": "Compatível"
        },
        {
          "valor": "incompativel",
          "label": "Incompatível"
        }
      ],
      "referencia": "Compatível / Incompatível"
    },
    {
      "id": "indice_probabilidade",
      "tipo": "number",
      "label": "Índice de Probabilidade",
      "unidade": "%",
      "referencia": "≥ 99.9"
    },
    {
      "id": "conclusao_tecnica",
      "tipo": "select",
      "label": "Conclusão Técnica",
      "opcoes": [
        {
          "valor": "confirmado",
          "label": "Vínculo biológico confirmado"
        },
        {
          "valor": "excluido",
          "label": "Vínculo biológico excluído"
        },
        {
          "valor": "inconclusivo",
          "label": "Resultado inconclusivo"
        }
      ],
      "referencia": "Confirmado / Excluído"
    },
    {
      "id": "validade_legal",
      "tipo": "select",
      "label": "Validade Legal",
      "opcoes": [
        {
          "valor": "sim",
          "label": "Sim"
        },
        {
          "valor": "nao",
          "label": "Não"
        }
      ],
      "referencia": "Sim / Não"
    },
    {
      "id": "observacoes_tecnicas",
      "tipo": "select",
      "label": "Observações Técnicas",
      "opcoes": [
        {
          "valor": "sem_intercorrencias",
          "label": "Sem intercorrências"
        },
        {
          "valor": "amostra_limitada",
          "label": "Amostra limitada"
        },
        {
          "valor": "necessita_recoleta",
          "label": "Necessita recoleta"
        }
      ],
      "referencia": "Sem intercorrências"
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
    "id": "tipo_vinculo",
    "label": "Tipo de vínculo",
    "kind": "bond-type",
    "enabled": true,
    "options": [
      "Investigação de Paternidade",
      "Investigação de Maternidade",
      "Irmandade",
      "Meio-Irmãos",
      "Avós",
      "Tio/Tia",
      "Identificação Humana",
      "Personalizado"
    ],
    "description": "O vínculo informado define a estrutura técnica, interpretação e conclusão do laudo genético."
  },
  "clinicalContexts": [
    "Paternidade",
    "Maternidade",
    "Irmandade",
    "Avós",
    "Identificação Humana",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "compatibilidade",
      "name": "Compatibilidade",
      "status": "normal",
      "description": "Perfil de compatibilidade genética conforme vínculo avaliado.",
      "resultSummary": "Resultado compatível com vínculo biológico avaliado.",
      "interpretation": "Marcadores analisados apresentam compatibilidade com a hipótese de vínculo, conforme metodologia e índice calculado.",
      "conclusion": "Resultado compatível com o vínculo biológico investigado.",
      "results": {
        "finalidade": "Investigação de paternidade",
        "tipo_amostra": "Swab bucal",
        "perfil_genetico": "Compatível",
        "indice_probabilidade": "99,99",
        "conclusao_tecnica": "Vínculo biológico compatível",
        "validade_legal": "Conforme cadeia de custódia documentada",
        "observacoes_tecnicas": "Perfis genéticos obtidos com qualidade analítica adequada"
      }
    },
    {
      "id": "exclusao",
      "name": "Exclusão",
      "status": "alterado",
      "description": "Perfil de exclusão do vínculo investigado.",
      "resultSummary": "Resultado não compatível com vínculo biológico avaliado.",
      "interpretation": "Incompatibilidades genéticas observadas nos marcadores analisados afastam a hipótese de vínculo, conforme critérios técnicos.",
      "conclusion": "Resultado não compatível com o vínculo biológico investigado.",
      "results": {
        "finalidade": "Investigação de paternidade",
        "tipo_amostra": "Swab bucal",
        "perfil_genetico": "Incompatível em múltiplos loci independentes",
        "indice_probabilidade": "0",
        "conclusao_tecnica": "Vínculo biológico excluído",
        "validade_legal": "Conforme cadeia de custódia documentada",
        "observacoes_tecnicas": "Perfis genéticos obtidos com qualidade analítica adequada"
      }
    },
    {
      "id": "inconclusivo",
      "name": "Inconclusivo",
      "status": "indefinido",
      "description": "Resultado insuficiente ou limítrofe.",
      "resultSummary": "Resultado inconclusivo para definição do vínculo.",
      "interpretation": "Amostra, número de participantes, ausência de genitor ou índice insuficiente podem impedir conclusão segura.",
      "conclusion": "Resultado inconclusivo, recomendando nova coleta ou complementação conforme indicação.",
      "results": {
        "finalidade": "Investigação de parentesco",
        "tipo_amostra": "Swab bucal",
        "perfil_genetico": "Informação genética insuficiente para conclusão",
        "indice_probabilidade": "Inconclusivo",
        "conclusao_tecnica": "Não conclusivo",
        "validade_legal": "Necessita complementação de amostras/participantes",
        "observacoes_tecnicas": "Recomendada ampliação do painel ou inclusão de familiar adicional"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste de DNA: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "finalidade": "Investigação de paternidade",
        "tipo_amostra": "Swab bucal",
        "perfil_genetico": "Compatível",
        "indice_probabilidade": "99,99",
        "conclusao_tecnica": "Vínculo biológico compatível",
        "validade_legal": "Conforme cadeia de custódia documentada",
        "observacoes_tecnicas": "Perfis genéticos obtidos com qualidade analítica adequada"
      }
    }
  ],
  "variables": [
    {
      "id": "participantes",
      "label": "Quantidade de participantes",
      "tipo": "number"
    },
    {
      "id": "mae_presente",
      "label": "Presença da mãe",
      "tipo": "select",
      "options": [
        "Sim",
        "Não",
        "Não se aplica"
      ]
    },
    {
      "id": "tipo_vinculo",
      "label": "Tipo de vínculo",
      "tipo": "select",
      "options": [
        "Paternidade",
        "Maternidade",
        "Irmandade",
        "Avós",
        "Tio/Tia",
        "Identificação Humana",
        "Personalizado"
      ]
    }
  ],
  "editorModel": {
    "title": "Teste de DNA",
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
    "defaultProfileId": "compatibilidade"
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
  "technique": "Análise genética realizada em amostras identificadas para comparação de perfis moleculares conforme a finalidade informada.",
  "method": "Extração de DNA, amplificação de marcadores STR por PCR e comparação estatística dos perfis genéticos, com controles de qualidade e cadeia de custódia quando requerida.",
  "parameters": [
    {
      "id": "finalidade",
      "label": "Finalidade do Teste",
      "unidade": null,
      "referencia": "Paternidade / Parentesco",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Finalidade do Teste conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tipo_amostra",
      "label": "Tipo de Amostra",
      "unidade": null,
      "referencia": "Swab bucal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Amostra conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "perfil_genetico",
      "label": "Perfil Genético",
      "unidade": null,
      "referencia": "Compatível / Incompatível",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Perfil Genético conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "indice_probabilidade",
      "label": "Índice de Probabilidade",
      "unidade": "%",
      "referencia": "≥ 99.9",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Índice de Probabilidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "conclusao_tecnica",
      "label": "Conclusão Técnica",
      "unidade": null,
      "referencia": "Confirmado / Excluído",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Conclusão Técnica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "validade_legal",
      "label": "Validade Legal",
      "unidade": null,
      "referencia": "Sim / Não",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Validade Legal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "observacoes_tecnicas",
      "label": "Observações Técnicas",
      "unidade": null,
      "referencia": "Sem intercorrências",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Observações Técnicas conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Teste de DNA compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste de DNA com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste de DNA com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste de DNA sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste de DNA alterado conforme resultados objetivos descritos.",
    "undefined": "Teste de DNA com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
