import type { IntelligentExamModel } from "../types";

export const func_tilt_testModel: IntelligentExamModel = {
  "id": "func_tilt_test",
  "nome": "Teste de Inclinação (Tilt Test)",
  "descricao": "Avaliação de síncope e disautonomia",
  "categoria": "funcional",
  "icone": "fa-sync",
  "campos": [
    {
      "id": "resposta_pressorica",
      "tipo": "select",
      "label": "Resposta Pressórica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "queda_pa",
          "label": "Queda de pressão"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "frequencia_cardiaca",
      "tipo": "select",
      "label": "Resposta da Frequência Cardíaca",
      "opcoes": [
        {
          "valor": "adequada",
          "label": "Adequada"
        },
        {
          "valor": "inadequada",
          "label": "Inadequada"
        }
      ],
      "referencia": "Adequada"
    },
    {
      "id": "sintomas",
      "tipo": "select",
      "label": "Sintomas Durante o Teste",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "sincope",
          "label": "Síncope"
        },
        {
          "valor": "pre_sincope",
          "label": "Pré-síncope"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Funcional",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Teste negativo"
        },
        {
          "valor": "vasovagal",
          "label": "Resposta vasovagal"
        },
        {
          "valor": "disautonomia",
          "label": "Disautonomia"
        }
      ],
      "referencia": "Negativo"
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
    "Trauma",
    "Dor",
    "Controle pós-operatório",
    "Oncológico",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Sem alterações significativas no método.",
      "resultSummary": "Teste de Inclinação (Tilt Test) com Resposta Pressórica: Normal; Resposta da Frequência Cardíaca: Adequada; Sintomas Durante o Teste: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Resposta Pressórica: Normal; Resposta da Frequência Cardíaca: Adequada; Sintomas Durante o Teste: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste de Inclinação (Tilt Test) com parâmetros compatíveis com o padrão esperado, incluindo Resposta Pressórica: Normal; Resposta da Frequência Cardíaca: Adequada.",
      "results": {
        "resposta_pressorica": "Normal",
        "frequencia_cardiaca": "Adequada",
        "sintomas": "Ausentes",
        "impressao": "Negativo"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Teste de Inclinação (Tilt Test): Resposta Pressórica: Queda sustentada da pressão arterial após ortostatismo; Resposta da Frequência Cardíaca: Elevação inicial seguida de resposta inadequada; Sintomas Durante o Teste: Tontura, náusea e pré-síncope reproduzidas.",
      "interpretation": "Os resultados principais (Resposta Pressórica: Queda sustentada da pressão arterial após ortostatismo; Resposta da Frequência Cardíaca: Elevação inicial seguida de resposta inadequada; Sintomas Durante o Teste: Tontura, náusea e pré-síncope reproduzidas) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste de Inclinação (Tilt Test) com padrão alterado, documentado por Resposta Pressórica: Queda sustentada da pressão arterial após ortostatismo; Resposta da Frequência Cardíaca: Elevação inicial seguida de resposta inadequada.",
      "results": {
        "resposta_pressorica": "Queda sustentada da pressão arterial após ortostatismo",
        "frequencia_cardiaca": "Elevação inicial seguida de resposta inadequada",
        "sintomas": "Tontura, náusea e pré-síncope reproduzidas",
        "impressao": "Teste positivo para resposta vasovagal"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Teste de Inclinação (Tilt Test): Resposta Pressórica: Queda discreta da pressão sem atingir critério diagnóstico; Resposta da Frequência Cardíaca: Resposta compensatória presente; Sintomas Durante o Teste: Tontura leve sem síncope.",
      "interpretation": "Os principais resultados (Resposta Pressórica: Queda discreta da pressão sem atingir critério diagnóstico; Resposta da Frequência Cardíaca: Resposta compensatória presente; Sintomas Durante o Teste: Tontura leve sem síncope) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste de Inclinação (Tilt Test) com resultado limítrofe/inespecífico, destacando-se Resposta Pressórica: Queda discreta da pressão sem atingir critério diagnóstico; Resposta da Frequência Cardíaca: Resposta compensatória presente.",
      "results": {
        "resposta_pressorica": "Queda discreta da pressão sem atingir critério diagnóstico",
        "frequencia_cardiaca": "Resposta compensatória presente",
        "sintomas": "Tontura leve sem síncope",
        "impressao": "Resposta ortostática limítrofe/inconclusiva"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste de Inclinação (Tilt Test): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "resposta_pressorica": "Normal",
        "frequencia_cardiaca": "Adequada",
        "sintomas": "Ausentes",
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
    "title": "Teste de Inclinação (Tilt Test)",
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
        "title": "2. Achados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "medidas",
        "title": "3. Medidas",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": false,
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
      "medidas",
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
      "medidas",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "imagem",
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
        "title": "2. Achados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "medidas",
        "title": "3. Medidas",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": false,
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
  "technique": "Teste de inclinação ortostática realizado com monitorização contínua da frequência cardíaca e medidas seriadas da pressão arterial durante mudança controlada de posição.",
  "method": "Protocolo de inclinação passiva em mesa basculante, com avaliação das respostas hemodinâmicas e dos sintomas durante as fases do teste.",
  "parameters": [
    {
      "id": "resposta_pressorica",
      "label": "Resposta Pressórica",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta Pressórica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "frequencia_cardiaca",
      "label": "Resposta da Frequência Cardíaca",
      "unidade": null,
      "referencia": "Adequada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta da Frequência Cardíaca conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sintomas",
      "label": "Sintomas Durante o Teste",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sintomas Durante o Teste conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Funcional",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Funcional conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [
    {
      "id": "medidas",
      "title": "Medidas",
      "headers": [
        "Estrutura / Medida",
        "Resultado",
        "Referência / Observação"
      ],
      "rowsFromParameters": false
    }
  ],
  "interpretation": {
    "normal": "Resultados de Teste de Inclinação (Tilt Test) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste de Inclinação (Tilt Test) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste de Inclinação (Tilt Test) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste de Inclinação (Tilt Test) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste de Inclinação (Tilt Test) alterado conforme resultados objetivos descritos.",
    "undefined": "Teste de Inclinação (Tilt Test) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
