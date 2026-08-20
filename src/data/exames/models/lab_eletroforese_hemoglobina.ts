import type { IntelligentExamModel } from "../types";

export const lab_eletroforese_hemoglobinaModel: IntelligentExamModel = {
  "id": "lab_eletroforese_hemoglobina",
  "nome": "Eletroforese de Hemoglobina",
  "descricao": "Identificação e quantificação das frações de hemoglobina",
  "categoria": "laboratorio",
  "icone": "fa-dna",
  "campos": [
    {
      "id": "hemoglobina_a",
      "tipo": "number",
      "label": "Hemoglobina A (HbA)",
      "unidade": "%",
      "referencia": "95 – 98"
    },
    {
      "id": "hemoglobina_a2",
      "tipo": "number",
      "label": "Hemoglobina A2 (HbA2)",
      "unidade": "%",
      "referencia": "2 – 3.5"
    },
    {
      "id": "hemoglobina_f",
      "tipo": "number",
      "label": "Hemoglobina F (HbF)",
      "unidade": "%",
      "referencia": "< 1"
    },
    {
      "id": "hemoglobina_variantes",
      "tipo": "select",
      "label": "Variantes de Hemoglobina",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausentes"
        },
        {
          "valor": "presente",
          "label": "Presentes"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Diagnóstica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Padrão normal"
        },
        {
          "valor": "talassemia",
          "label": "Sugestivo de talassemia"
        },
        {
          "valor": "hemoglobinopatia",
          "label": "Hemoglobinopatia"
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
      "resultSummary": "Eletroforese de Hemoglobina com Hemoglobina A (HbA): 96,8; Hemoglobina A2 (HbA2): 2,8; Hemoglobina F (HbF): 0,4.",
      "interpretation": "Os parâmetros mensurados — Hemoglobina A (HbA): 96,8 %; Hemoglobina A2 (HbA2): 2,8 %; Hemoglobina F (HbF): 0,4 %; Variantes de Hemoglobina: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Eletroforese de Hemoglobina com parâmetros compatíveis com o padrão esperado, incluindo Hemoglobina A (HbA): 96,8 %; Hemoglobina A2 (HbA2): 2,8 %.",
      "results": {
        "hemoglobina_a": "96,8",
        "hemoglobina_a2": "2,8",
        "hemoglobina_f": "0,4",
        "hemoglobina_variantes": "Ausentes",
        "impressao": "Padrão eletroforético adulto habitual"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Eletroforese de Hemoglobina: Hemoglobina A (HbA): 58,2; Hemoglobina A2 (HbA2): 3,2; Hemoglobina F (HbF): 0,6; Variantes de Hemoglobina: HbS: 38,0%.",
      "interpretation": "Os resultados principais (Hemoglobina A (HbA): 58,2 %; Hemoglobina A2 (HbA2): 3,2 %; Hemoglobina F (HbF): 0,6 %; Variantes de Hemoglobina: HbS: 38,0%) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Eletroforese de Hemoglobina com padrão alterado, documentado por Hemoglobina A (HbA): 58,2 %; Hemoglobina A2 (HbA2): 3,2 %.",
      "results": {
        "hemoglobina_a": "58,2",
        "hemoglobina_a2": "3,2",
        "hemoglobina_f": "0,6",
        "hemoglobina_variantes": "HbS: 38,0%",
        "impressao": "Padrão eletroforético com variante HbS, compatível com traço falciforme no contexto apropriado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Eletroforese de Hemoglobina: Hemoglobina A (HbA): 94,8; Hemoglobina A2 (HbA2): 3,6; Hemoglobina F (HbF): 1,6; Variantes de Hemoglobina: Sem variante majoritária definida.",
      "interpretation": "Os principais resultados (Hemoglobina A (HbA): 94,8 %; Hemoglobina A2 (HbA2): 3,6 %; Hemoglobina F (HbF): 1,6 %; Variantes de Hemoglobina: Sem variante majoritária definida) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Eletroforese de Hemoglobina com resultado limítrofe/inespecífico, destacando-se Hemoglobina A (HbA): 94,8 %; Hemoglobina A2 (HbA2): 3,6 %.",
      "results": {
        "hemoglobina_a": "94,8",
        "hemoglobina_a2": "3,6",
        "hemoglobina_f": "1,6",
        "hemoglobina_variantes": "Sem variante majoritária definida",
        "impressao": "Distribuição de frações em faixa limítrofe, recomendando correlação hematológica"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Eletroforese de Hemoglobina: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "hemoglobina_a": "96,8",
        "hemoglobina_a2": "2,8",
        "hemoglobina_f": "0,4",
        "hemoglobina_variantes": "Ausentes",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Eletroforese de Hemoglobina",
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
  "technique": "Amostra de sangue total processada para separação e quantificação das principais frações de hemoglobina.",
  "method": "Separação das frações de hemoglobina por método eletroforético ou cromatográfico validado, com quantificação relativa e interpretação do padrão obtido.",
  "parameters": [
    {
      "id": "hemoglobina_a",
      "label": "Hemoglobina A (HbA)",
      "unidade": "%",
      "referencia": "95 – 98",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemoglobina A (HbA) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemoglobina_a2",
      "label": "Hemoglobina A2 (HbA2)",
      "unidade": "%",
      "referencia": "2 – 3.5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemoglobina A2 (HbA2) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemoglobina_f",
      "label": "Hemoglobina F (HbF)",
      "unidade": "%",
      "referencia": "< 1",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemoglobina F (HbF) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemoglobina_variantes",
      "label": "Variantes de Hemoglobina",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Variantes de Hemoglobina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Diagnóstica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Diagnóstica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Eletroforese de Hemoglobina compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Eletroforese de Hemoglobina com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Eletroforese de Hemoglobina com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Eletroforese de Hemoglobina sem alterações significativas nos parâmetros avaliados.",
    "altered": "Eletroforese de Hemoglobina alterado conforme resultados objetivos descritos.",
    "undefined": "Eletroforese de Hemoglobina com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
