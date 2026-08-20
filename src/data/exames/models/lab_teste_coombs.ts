import type { IntelligentExamModel } from "../types";

export const lab_teste_coombsModel: IntelligentExamModel = {
  "id": "lab_teste_coombs",
  "nome": "Teste de Coombs",
  "descricao": "Pesquisa de anticorpos irregulares associados a hemólise",
  "categoria": "laboratorio",
  "icone": "fa-droplet",
  "campos": [
    {
      "id": "tipo_coombs",
      "tipo": "select",
      "label": "Tipo de Coombs",
      "opcoes": [
        {
          "valor": "direto",
          "label": "Coombs Direto"
        },
        {
          "valor": "indireto",
          "label": "Coombs Indireto"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "resultado",
      "tipo": "select",
      "label": "Resultado",
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
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Laboratorial",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem evidência de hemólise imunológica"
        },
        {
          "valor": "hemolise",
          "label": "Hemólise imunomediada"
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
    "id": "tipo_coombs",
    "label": "Tipo de Coombs",
    "kind": "type",
    "enabled": true,
    "options": [
      "Direto",
      "Indireto"
    ],
    "description": "O tipo selecionado direciona os achados e a interpretação inicial do exame."
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
      "resultSummary": "Teste de Coombs com Tipo de Coombs: Coombs indireto; Resultado: Negativo.",
      "interpretation": "Os parâmetros mensurados — Tipo de Coombs: Coombs indireto; Resultado: Negativo — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste de Coombs com parâmetros compatíveis com o padrão esperado, incluindo Tipo de Coombs: Coombs indireto; Resultado: Negativo.",
      "results": {
        "tipo_coombs": "Coombs indireto",
        "resultado": "Negativo",
        "impressao": "Teste de antiglobulina sem reatividade detectável"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Teste de Coombs: Tipo de Coombs: Coombs direto; Resultado: Positivo 2+.",
      "interpretation": "Os resultados principais (Tipo de Coombs: Coombs direto; Resultado: Positivo 2+) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste de Coombs com padrão alterado, documentado por Tipo de Coombs: Coombs direto; Resultado: Positivo 2+.",
      "results": {
        "tipo_coombs": "Coombs direto",
        "resultado": "Positivo 2+",
        "impressao": "Teste de antiglobulina direto positivo"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Teste de Coombs: Resultado: Reação fraca 1+, necessitando confirmação.",
      "interpretation": "Os principais resultados (Resultado: Reação fraca 1+, necessitando confirmação) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste de Coombs com resultado limítrofe/inespecífico, destacando-se Resultado: Reação fraca 1+, necessitando confirmação.",
      "results": {
        "tipo_coombs": "Coombs indireto",
        "resultado": "Reação fraca 1+, necessitando confirmação",
        "impressao": "Reatividade fraca/inconclusiva no teste de antiglobulina"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste de Coombs: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "tipo_coombs": "Coombs indireto",
        "resultado": "Negativo",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Teste de Coombs",
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
  "technique": "Amostra sanguínea processada para teste de antiglobulina, direto ou indireto conforme a finalidade clínica informada.",
  "method": "Técnica de antiglobulina humana para detecção de imunoglobulinas/complemento ligados às hemácias ou anticorpos séricos contra antígenos eritrocitários.",
  "parameters": [
    {
      "id": "tipo_coombs",
      "label": "Tipo de Coombs",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Coombs conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resultado",
      "label": "Resultado",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Laboratorial",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Laboratorial conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Teste de Coombs compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste de Coombs com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste de Coombs com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste de Coombs sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste de Coombs alterado conforme resultados objetivos descritos.",
    "undefined": "Teste de Coombs com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
