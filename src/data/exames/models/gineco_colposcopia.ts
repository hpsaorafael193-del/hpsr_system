import type { IntelligentExamModel } from "../types";

export const gineco_colposcopiaModel: IntelligentExamModel = {
  "id": "gineco_colposcopia",
  "nome": "Colposcopia",
  "descricao": "Avaliação do colo uterino e vagina com magnificação e testes com reagentes",
  "categoria": "ginecologia",
  "icone": "fa-search",
  "campos": [
    {
      "id": "juncao_escamocolunar",
      "tipo": "select",
      "label": "Junção Escamocolunar (JEC)",
      "opcoes": [
        {
          "valor": "visivel",
          "label": "Visível"
        },
        {
          "valor": "nao_visivel",
          "label": "Não visível"
        }
      ],
      "referencia": "Visível"
    },
    {
      "id": "teste_acido_acetico",
      "tipo": "select",
      "label": "Teste com Ácido Acético",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "acetobranco",
          "label": "Acetobranco"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "teste_lugol",
      "tipo": "select",
      "label": "Teste de Lugol",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo (captação)"
        },
        {
          "valor": "negativo",
          "label": "Negativo (iodo-negativo)"
        }
      ],
      "referencia": "Positivo"
    },
    {
      "id": "achado_suspeito",
      "tipo": "select",
      "label": "Achado Suspeito",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "presente",
          "label": "Presente"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "conduta_sugerida",
      "tipo": "select",
      "label": "Conduta Sugerida",
      "opcoes": [
        {
          "valor": "rotina",
          "label": "Rotina"
        },
        {
          "valor": "biopsia",
          "label": "Biópsia dirigida"
        },
        {
          "valor": "seguimento",
          "label": "Seguimento"
        }
      ],
      "referencia": "Rotina"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Colposcópica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Exame colposcópico normal"
        },
        {
          "valor": "alterado",
          "label": "Achados colposcópicos alterados"
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
      "resultSummary": "Colposcopia com Junção Escamocolunar (JEC): Visível; Teste com Ácido Acético: Negativo; Teste de Lugol: Positivo.",
      "interpretation": "Os parâmetros mensurados — Junção Escamocolunar (JEC): Visível; Teste com Ácido Acético: Negativo; Teste de Lugol: Positivo; Achado Suspeito: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Colposcopia com parâmetros compatíveis com o padrão esperado, incluindo Junção Escamocolunar (JEC): Visível; Teste com Ácido Acético: Negativo.",
      "results": {
        "juncao_escamocolunar": "Visível",
        "teste_acido_acetico": "Negativo",
        "teste_lugol": "Positivo",
        "achado_suspeito": "Ausente",
        "conduta_sugerida": "Rotina",
        "impressao": "Colposcopia com parâmetros compatíveis com o padrão esperado, incluindo Junção Escamocolunar (JEC): Visível; Teste com Ácido Acético: Negativo"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Colposcopia: Junção Escamocolunar (JEC): Visível em sua maior extensão; Teste com Ácido Acético: Área acetobranca densa no quadrante anterior; Teste de Lugol: Iodo-negativo na área acetobranca; Achado Suspeito: Epitélio acetobranco denso com pontilhado fino.",
      "interpretation": "Os resultados principais (Junção Escamocolunar (JEC): Visível em sua maior extensão; Teste com Ácido Acético: Área acetobranca densa no quadrante anterior; Teste de Lugol: Iodo-negativo na área acetobranca; Achado Suspeito: Epitélio acetobranco denso com pontilhado fino) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Colposcopia com padrão alterado, documentado por Junção Escamocolunar (JEC): Visível em sua maior extensão; Teste com Ácido Acético: Área acetobranca densa no quadrante anterior.",
      "results": {
        "juncao_escamocolunar": "Visível em sua maior extensão",
        "teste_acido_acetico": "Área acetobranca densa no quadrante anterior",
        "teste_lugol": "Iodo-negativo na área acetobranca",
        "achado_suspeito": "Epitélio acetobranco denso com pontilhado fino",
        "conduta_sugerida": "Biópsia dirigida da área alterada",
        "impressao": "Achado colposcópico anormal, grau maior a esclarecer histologicamente"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Colposcopia: Teste com Ácido Acético: Área acetobranca tênue; Teste de Lugol: Captação irregular discreta; Achado Suspeito: Alteração de baixo grau, sem vasos atípicos; Conduta Sugerida: Seguimento/citologia conforme contexto.",
      "interpretation": "Os principais resultados (Teste com Ácido Acético: Área acetobranca tênue; Teste de Lugol: Captação irregular discreta; Achado Suspeito: Alteração de baixo grau, sem vasos atípicos; Conduta Sugerida: Seguimento/citologia conforme contexto) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Colposcopia com resultado limítrofe/inespecífico, destacando-se Teste com Ácido Acético: Área acetobranca tênue; Teste de Lugol: Captação irregular discreta.",
      "results": {
        "juncao_escamocolunar": "Visível",
        "teste_acido_acetico": "Área acetobranca tênue",
        "teste_lugol": "Captação irregular discreta",
        "achado_suspeito": "Alteração de baixo grau, sem vasos atípicos",
        "conduta_sugerida": "Seguimento/citologia conforme contexto",
        "impressao": "Alteração colposcópica menor, sem critérios de alto grau"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Colposcopia: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "juncao_escamocolunar": "Visível",
        "teste_acido_acetico": "Negativo",
        "teste_lugol": "Positivo",
        "achado_suspeito": "Ausente",
        "conduta_sugerida": "Rotina",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
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
    "title": "Colposcopia",
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
  "technique": "Exame colposcópico do colo uterino, vagina e vulva, com inspeção ampliada antes e após aplicação de reagentes apropriados.",
  "method": "Avaliação sob magnificação com solução de ácido acético e, quando indicada, solução iodada, descrevendo zona de transformação, epitélio, vascularização e áreas suspeitas.",
  "parameters": [
    {
      "id": "juncao_escamocolunar",
      "label": "Junção Escamocolunar (JEC)",
      "unidade": null,
      "referencia": "Visível",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Junção Escamocolunar (JEC) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "teste_acido_acetico",
      "label": "Teste com Ácido Acético",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Teste com Ácido Acético conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "teste_lugol",
      "label": "Teste de Lugol",
      "unidade": null,
      "referencia": "Positivo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Teste de Lugol conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "achado_suspeito",
      "label": "Achado Suspeito",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Achado Suspeito conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "conduta_sugerida",
      "label": "Conduta Sugerida",
      "unidade": null,
      "referencia": "Rotina",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Conduta Sugerida conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Colposcópica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Colposcópica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Colposcopia compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Colposcopia com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Colposcopia com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Colposcopia sem alterações significativas nos parâmetros avaliados.",
    "altered": "Colposcopia alterado conforme resultados objetivos descritos.",
    "undefined": "Colposcopia com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
