import type { IntelligentExamModel } from "../types";

export const lab_reticulocitosModel: IntelligentExamModel = {
  "id": "lab_reticulocitos",
  "nome": "Contagem de Reticulócitos",
  "descricao": "Avaliação da atividade eritropoiética da medula óssea",
  "categoria": "laboratorio",
  "icone": "fa-tint",
  "campos": [
    {
      "id": "reticulocitos_percentual",
      "tipo": "number",
      "label": "Reticulócitos",
      "unidade": "%",
      "referencia": "0.5 – 2.5"
    },
    {
      "id": "reticulocitos_absoluto",
      "tipo": "number",
      "label": "Reticulócitos Absolutos",
      "unidade": "/mm³",
      "referencia": "25.000 – 75.000"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Hematológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Produção eritrocitária adequada"
        },
        {
          "valor": "aumentada",
          "label": "Resposta medular aumentada"
        },
        {
          "valor": "reduzida",
          "label": "Produção eritrocitária reduzida"
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
      "resultSummary": "Contagem de Reticulócitos com Reticulócitos: 1,4; Reticulócitos Absolutos: 52.000.",
      "interpretation": "Os parâmetros mensurados — Reticulócitos: 1,4 %; Reticulócitos Absolutos: 52.000 /mm³ — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Contagem de Reticulócitos com parâmetros compatíveis com o padrão esperado, incluindo Reticulócitos: 1,4 %; Reticulócitos Absolutos: 52.000 /mm³.",
      "results": {
        "reticulocitos_percentual": "1,4",
        "reticulocitos_absoluto": "52.000",
        "impressao": "Resposta reticulocitária dentro da faixa de referência"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Contagem de Reticulócitos: Reticulócitos: 4,2; Reticulócitos Absolutos: 126.000.",
      "interpretation": "Os resultados principais (Reticulócitos: 4,2 %; Reticulócitos Absolutos: 126.000 /mm³) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Contagem de Reticulócitos com padrão alterado, documentado por Reticulócitos: 4,2 %; Reticulócitos Absolutos: 126.000 /mm³.",
      "results": {
        "reticulocitos_percentual": "4,2",
        "reticulocitos_absoluto": "126.000",
        "impressao": "Reticulocitose, indicando resposta eritropoiética aumentada"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Contagem de Reticulócitos: Reticulócitos: 2,6; Reticulócitos Absolutos: 78.000.",
      "interpretation": "Os principais resultados (Reticulócitos: 2,6 %; Reticulócitos Absolutos: 78.000 /mm³) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Contagem de Reticulócitos com resultado limítrofe/inespecífico, destacando-se Reticulócitos: 2,6 %; Reticulócitos Absolutos: 78.000 /mm³.",
      "results": {
        "reticulocitos_percentual": "2,6",
        "reticulocitos_absoluto": "78.000",
        "impressao": "Contagem reticulocitária discretamente elevada"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Contagem de Reticulócitos: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "reticulocitos_percentual": "1,4",
        "reticulocitos_absoluto": "52.000",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Contagem de Reticulócitos",
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
  "technique": "Amostra de sangue total processada para contagem de reticulócitos e avaliação da resposta eritropoiética.",
  "method": "Contagem automatizada de reticulócitos por citometria/fluorescência, com cálculo do percentual e contagem absoluta quando disponível.",
  "parameters": [
    {
      "id": "reticulocitos_percentual",
      "label": "Reticulócitos",
      "unidade": "%",
      "referencia": "0.5 – 2.5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Reticulócitos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "reticulocitos_absoluto",
      "label": "Reticulócitos Absolutos",
      "unidade": "/mm³",
      "referencia": "25.000 – 75.000",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Reticulócitos Absolutos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Hematológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Hematológica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Contagem de Reticulócitos compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Contagem de Reticulócitos com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Contagem de Reticulócitos com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Contagem de Reticulócitos sem alterações significativas nos parâmetros avaliados.",
    "altered": "Contagem de Reticulócitos alterado conforme resultados objetivos descritos.",
    "undefined": "Contagem de Reticulócitos com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
