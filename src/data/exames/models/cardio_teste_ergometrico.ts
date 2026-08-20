import type { IntelligentExamModel } from "../types";

export const cardio_teste_ergometricoModel: IntelligentExamModel = {
  "id": "cardio_teste_ergometrico",
  "nome": "Teste Ergométrico",
  "descricao": "Avaliação da resposta cardiovascular ao esforço físico",
  "categoria": "cardiologia",
  "icone": "fa-running",
  "campos": [
    {
      "id": "capacidade_funcional",
      "tipo": "select",
      "label": "Capacidade Funcional",
      "opcoes": [
        {
          "valor": "boa",
          "label": "Boa"
        },
        {
          "valor": "reduzida",
          "label": "Reduzida"
        }
      ],
      "referencia": "Boa"
    },
    {
      "id": "fc_maxima_atingida",
      "tipo": "number",
      "label": "FC Máxima Atingida",
      "unidade": "bpm",
      "referencia": "—"
    },
    {
      "id": "resposta_pressorica",
      "tipo": "select",
      "label": "Resposta Pressórica",
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
      "id": "isquemia",
      "tipo": "select",
      "label": "Sinais de Isquemia",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "presentes",
          "label": "Presentes"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão do Teste",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo para isquemia"
        },
        {
          "valor": "positivo",
          "label": "Positivo para isquemia"
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
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Parâmetros dentro das referências disponíveis.",
      "resultSummary": "Teste Ergométrico com Capacidade Funcional: Boa, 11,2 METs; FC Máxima Atingida: 168; Resposta Pressórica: Adequada.",
      "interpretation": "Os parâmetros mensurados — Capacidade Funcional: Boa, 11,2 METs; FC Máxima Atingida: 168 bpm; Resposta Pressórica: Adequada; Sinais de Isquemia: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste Ergométrico com parâmetros compatíveis com o padrão esperado, incluindo Capacidade Funcional: Boa, 11,2 METs; FC Máxima Atingida: 168 bpm.",
      "results": {
        "capacidade_funcional": "Boa, 11,2 METs",
        "fc_maxima_atingida": "168",
        "resposta_pressorica": "Adequada",
        "isquemia": "Ausentes",
        "impressao": "Teste negativo para isquemia miocárdica induzível"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Teste Ergométrico: Capacidade Funcional: Regular, 7,4 METs; FC Máxima Atingida: 162; Resposta Pressórica: Resposta hipertensiva ao esforço; Sinais de Isquemia: Infradesnivelamento horizontal de ST de 1,5 mm no pico do esforço.",
      "interpretation": "Os resultados principais (Capacidade Funcional: Regular, 7,4 METs; FC Máxima Atingida: 162 bpm; Resposta Pressórica: Resposta hipertensiva ao esforço; Sinais de Isquemia: Infradesnivelamento horizontal de ST de 1,5 mm no pico do esforço) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste Ergométrico com padrão alterado, documentado por Capacidade Funcional: Regular, 7,4 METs; FC Máxima Atingida: 162 bpm.",
      "results": {
        "capacidade_funcional": "Regular, 7,4 METs",
        "fc_maxima_atingida": "162",
        "resposta_pressorica": "Resposta hipertensiva ao esforço",
        "isquemia": "Infradesnivelamento horizontal de ST de 1,5 mm no pico do esforço",
        "impressao": "Teste positivo para isquemia miocárdica induzível pelo esforço"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Teste Ergométrico: Capacidade Funcional: Regular, 8,6 METs; Resposta Pressórica: Resposta pressórica limítrofe; Sinais de Isquemia: Alterações inespecíficas de ST-T sem critério diagnóstico de isquemia.",
      "interpretation": "Os principais resultados (Capacidade Funcional: Regular, 8,6 METs; Resposta Pressórica: Resposta pressórica limítrofe; Sinais de Isquemia: Alterações inespecíficas de ST-T sem critério diagnóstico de isquemia) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste Ergométrico com resultado limítrofe/inespecífico, destacando-se Capacidade Funcional: Regular, 8,6 METs; Resposta Pressórica: Resposta pressórica limítrofe.",
      "results": {
        "capacidade_funcional": "Regular, 8,6 METs",
        "fc_maxima_atingida": "168",
        "resposta_pressorica": "Resposta pressórica limítrofe",
        "isquemia": "Alterações inespecíficas de ST-T sem critério diagnóstico de isquemia",
        "impressao": "Teste inconclusivo para isquemia por alterações inespecíficas"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste Ergométrico: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "capacidade_funcional": "Boa, 11,2 METs",
        "fc_maxima_atingida": "168",
        "resposta_pressorica": "Adequada",
        "isquemia": "Ausentes",
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
    "title": "Teste Ergométrico",
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
  "technique": "Teste ergométrico realizado sob esforço progressivo, com monitorização eletrocardiográfica, frequência cardíaca, pressão arterial, sintomas e capacidade funcional durante o protocolo.",
  "method": "Protocolo de exercício graduado em esteira ou cicloergômetro, com registro eletrocardiográfico seriado e avaliação das respostas cronotrópica, pressórica e de repolarização.",
  "parameters": [
    {
      "id": "capacidade_funcional",
      "label": "Capacidade Funcional",
      "unidade": null,
      "referencia": "Boa",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Capacidade Funcional conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "fc_maxima_atingida",
      "label": "FC Máxima Atingida",
      "unidade": "bpm",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar FC Máxima Atingida conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resposta_pressorica",
      "label": "Resposta Pressórica",
      "unidade": null,
      "referencia": "Adequada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta Pressórica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "isquemia",
      "label": "Sinais de Isquemia",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sinais de Isquemia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão do Teste",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão do Teste conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Teste Ergométrico compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste Ergométrico com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste Ergométrico com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste Ergométrico sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste Ergométrico alterado conforme resultados objetivos descritos.",
    "undefined": "Teste Ergométrico com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
