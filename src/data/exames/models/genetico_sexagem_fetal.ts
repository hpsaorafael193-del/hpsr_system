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
          "valor": "feminino",
          "label": "Sexagem feminina"
        },
        {
          "valor": "masculino",
          "label": "Sexagem masculina"
        },
        {
          "valor": "inconclusivo",
          "label": "Inconclusivo · sexo não identificado"
        },
        {
          "valor": "gemelar_masculino_feminino",
          "label": "Gêmeos · masculino e feminino"
        },
        {
          "valor": "gemelar_feminino_masculino",
          "label": "Gêmeos · feminino e masculino"
        },
        {
          "valor": "gemelar_masculino_masculino",
          "label": "Gêmeos · masculino e masculino"
        },
        {
          "valor": "gemelar_feminino_feminino",
          "label": "Gêmeos · feminino e feminino"
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
          "valor": "feminino",
          "label": "Sexagem feminina"
        },
        {
          "valor": "masculino",
          "label": "Sexagem masculina"
        },
        {
          "valor": "inconclusivo",
          "label": "Inconclusivo · sexo não identificado"
        },
        {
          "valor": "gemelar_masculino_feminino",
          "label": "Gêmeos · masculino e feminino"
        },
        {
          "valor": "gemelar_feminino_masculino",
          "label": "Gêmeos · feminino e masculino"
        },
        {
          "valor": "gemelar_masculino_masculino",
          "label": "Gêmeos · masculino e masculino"
        },
        {
          "valor": "gemelar_feminino_feminino",
          "label": "Gêmeos · feminino e feminino"
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
      "id": "feminino",
      "name": "Sexagem feminina",
      "status": "contextual",
      "description": "Sexo fetal feminino",
      "resultSummary": "Sequências do cromossomo Y não detectadas",
      "results": {
        "metodo": "PCR em tempo real para sequências do cromossomo Y",
        "idade_gestacional": "A informar",
        "tipo_gestacao": "Gestação única",
        "corionicidade": "Não aplicável em gestação única",
        "vitalidade_fetal": "Não avaliada por este exame",
        "confiabilidade": "Amostra adequada, controles analíticos válidos",
        "resultado": "Sequências do cromossomo Y não detectadas",
        "impressao": "Sexo fetal feminino"
      },
      "interpretation": "O resultado molecular é compatível com sexo fetal feminino, considerando adequação da amostra e validade dos controles analíticos.",
      "conclusion": "Sexo fetal feminino."
    },
    {
      "id": "masculino",
      "name": "Sexagem masculina",
      "status": "contextual",
      "description": "Sexo fetal masculino",
      "resultSummary": "Sequências do cromossomo Y detectadas",
      "results": {
        "metodo": "PCR em tempo real para sequências do cromossomo Y",
        "idade_gestacional": "A informar",
        "tipo_gestacao": "Gestação única",
        "corionicidade": "Não aplicável em gestação única",
        "vitalidade_fetal": "Não avaliada por este exame",
        "confiabilidade": "Amostra adequada, controles analíticos válidos",
        "resultado": "Sequências do cromossomo Y detectadas",
        "impressao": "Sexo fetal masculino"
      },
      "interpretation": "O resultado molecular é compatível com sexo fetal masculino, considerando adequação da amostra e validade dos controles analíticos.",
      "conclusion": "Sexo fetal masculino."
    },
    {
      "id": "inconclusivo",
      "name": "Inconclusivo · sexo não identificado",
      "status": "indefinido",
      "description": "Sexo fetal não identificado",
      "resultSummary": "Não foi possível determinar a presença ou ausência de sequências do cromossomo Y",
      "results": {
        "metodo": "PCR em tempo real para sequências do cromossomo Y",
        "idade_gestacional": "A informar",
        "tipo_gestacao": "Gestação única",
        "corionicidade": "Não aplicável em gestação única",
        "vitalidade_fetal": "Não avaliada por este exame",
        "confiabilidade": "Limitação técnica ou fração fetal insuficiente para conclusão",
        "resultado": "Não foi possível determinar a presença ou ausência de sequências do cromossomo Y",
        "impressao": "Sexo fetal não identificado"
      },
      "interpretation": "A análise não permitiu determinar o sexo fetal. Recomenda-se nova avaliação conforme adequação da amostra e protocolo analítico.",
      "conclusion": "Sexo fetal não identificado."
    },
    {
      "id": "gemelar_masculino_feminino",
      "name": "Gêmeos · masculino e feminino",
      "status": "contextual",
      "description": "Feto 1 masculino; feto 2 feminino",
      "resultSummary": "Masculino e feminino",
      "results": {
        "metodo": "Registro de sexagem gemelar no contexto do RP",
        "idade_gestacional": "A informar",
        "tipo_gestacao": "Gestação gemelar",
        "corionicidade": "A informar conforme avaliação obstétrica",
        "vitalidade_fetal": "Não avaliada por este exame",
        "confiabilidade": "Amostra adequada, controles analíticos válidos",
        "resultado": "Masculino e feminino",
        "impressao": "Feto 1 masculino; feto 2 feminino"
      },
      "interpretation": "Combinação de sexos selecionada para o cenário de RP. A pesquisa isolada de cromossomo Y em sangue materno não distingue masculino/masculino de masculino/feminino nem atribui sexo a cada feto.",
      "conclusion": "Feto 1 masculino; feto 2 feminino. Combinação registrada no contexto do RP."
    },
    {
      "id": "gemelar_feminino_masculino",
      "name": "Gêmeos · feminino e masculino",
      "status": "contextual",
      "description": "Feto 1 feminino; feto 2 masculino",
      "resultSummary": "Feminino e masculino",
      "results": {
        "metodo": "Registro de sexagem gemelar no contexto do RP",
        "idade_gestacional": "A informar",
        "tipo_gestacao": "Gestação gemelar",
        "corionicidade": "A informar conforme avaliação obstétrica",
        "vitalidade_fetal": "Não avaliada por este exame",
        "confiabilidade": "Amostra adequada, controles analíticos válidos",
        "resultado": "Feminino e masculino",
        "impressao": "Feto 1 feminino; feto 2 masculino"
      },
      "interpretation": "Combinação de sexos selecionada para o cenário de RP. A pesquisa isolada de cromossomo Y em sangue materno não distingue masculino/masculino de masculino/feminino nem atribui sexo a cada feto.",
      "conclusion": "Feto 1 feminino; feto 2 masculino. Combinação registrada no contexto do RP."
    },
    {
      "id": "gemelar_masculino_masculino",
      "name": "Gêmeos · masculino e masculino",
      "status": "contextual",
      "description": "Ambos os fetos masculinos",
      "resultSummary": "Masculino e masculino",
      "results": {
        "metodo": "Registro de sexagem gemelar no contexto do RP",
        "idade_gestacional": "A informar",
        "tipo_gestacao": "Gestação gemelar",
        "corionicidade": "A informar conforme avaliação obstétrica",
        "vitalidade_fetal": "Não avaliada por este exame",
        "confiabilidade": "Amostra adequada, controles analíticos válidos",
        "resultado": "Masculino e masculino",
        "impressao": "Ambos os fetos masculinos"
      },
      "interpretation": "Combinação de sexos selecionada para o cenário de RP. A pesquisa isolada de cromossomo Y em sangue materno não distingue masculino/masculino de masculino/feminino nem atribui sexo a cada feto.",
      "conclusion": "Ambos os fetos masculinos. Combinação registrada no contexto do RP."
    },
    {
      "id": "gemelar_feminino_feminino",
      "name": "Gêmeos · feminino e feminino",
      "status": "contextual",
      "description": "Ambos os fetos femininos",
      "resultSummary": "Feminino e feminino",
      "results": {
        "metodo": "Registro de sexagem gemelar no contexto do RP",
        "idade_gestacional": "A informar",
        "tipo_gestacao": "Gestação gemelar",
        "corionicidade": "A informar conforme avaliação obstétrica",
        "vitalidade_fetal": "Não avaliada por este exame",
        "confiabilidade": "Amostra adequada, controles analíticos válidos",
        "resultado": "Feminino e feminino",
        "impressao": "Ambos os fetos femininos"
      },
      "interpretation": "Combinação de sexos selecionada para o cenário de RP. A pesquisa isolada de cromossomo Y em sangue materno não distingue masculino/masculino de masculino/feminino nem atribui sexo a cada feto.",
      "conclusion": "Ambos os fetos femininos. Combinação registrada no contexto do RP."
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
    "defaultProfileId": "feminino"
  },
  "documentModel": {
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
  "technique": "Análise molecular de DNA fetal livre circulante em amostra materna para pesquisa de sequências específicas do cromossomo Y, considerando idade gestacional e adequação da amostra.",
  "method": "Extração de DNA circulante e amplificação por PCR em tempo real de alvos específicos, com controles internos de qualidade e interpretação conforme o protocolo analítico.",
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
    "normal": "O resultado molecular é compatível com sexo fetal feminino, considerando adequação da amostra e validade dos controles analíticos.",
    "altered": "O resultado molecular é compatível com sexo fetal masculino, considerando adequação da amostra e validade dos controles analíticos.",
    "undefined": "A análise não permitiu determinar o sexo fetal. Recomenda-se nova avaliação conforme adequação da amostra e protocolo analítico."
  },
  "conclusion": {
    "normal": "Sexo fetal feminino.",
    "altered": "Sexo fetal masculino.",
    "undefined": "Sexo fetal não identificado."
  },
  "attachments": {
    "enabled": false,
    "mode": "future",
    "acceptedTypes": [
      "image/png",
      "image/jpeg"
    ]
  }
};
