import type { IntelligentExamModel } from "../types";

export const derm_dermatoscopiaModel: IntelligentExamModel = {
  "id": "derm_dermatoscopia",
  "nome": "Dermatoscopia",
  "descricao": "Avaliação ampliada das estruturas cutâneas",
  "categoria": "dermatologia",
  "icone": "fa-search",
  "campos": [
    {
      "id": "padrao_pigmentar",
      "tipo": "select",
      "label": "Padrão Pigmentar",
      "opcoes": [
        {
          "valor": "regular",
          "label": "Regular"
        },
        {
          "valor": "irregular",
          "label": "Irregular"
        }
      ],
      "referencia": "Regular"
    },
    {
      "id": "estrutura_vascular",
      "tipo": "select",
      "label": "Estrutura Vascular",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "atipica",
          "label": "Atípica"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "criterios_malignidade",
      "tipo": "select",
      "label": "Critérios de Malignidade",
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
      "label": "Impressão Dermatoscópica",
      "opcoes": [
        {
          "valor": "benigna",
          "label": "Lesão benigna"
        },
        {
          "valor": "suspeita",
          "label": "Lesão suspeita"
        }
      ],
      "referencia": "—"
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
      "resultSummary": "Dermatoscopia com Padrão Pigmentar: Regular; Estrutura Vascular: Normal; Critérios de Malignidade: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Padrão Pigmentar: Regular; Estrutura Vascular: Normal; Critérios de Malignidade: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Dermatoscopia com parâmetros compatíveis com o padrão esperado, incluindo Padrão Pigmentar: Regular; Estrutura Vascular: Normal.",
      "results": {
        "padrao_pigmentar": "Regular",
        "estrutura_vascular": "Normal",
        "criterios_malignidade": "Ausentes",
        "impressao": "Dermatoscopia com parâmetros compatíveis com o padrão esperado, incluindo Padrão Pigmentar: Regular; Estrutura Vascular: Normal"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Dermatoscopia: Padrão Pigmentar: Rede pigmentar assimétrica e irregular; Estrutura Vascular: Vasos puntiformes e polimórficos; Critérios de Malignidade: Assimetria, múltiplas cores e estruturas atípicas presentes.",
      "interpretation": "Os resultados principais (Padrão Pigmentar: Rede pigmentar assimétrica e irregular; Estrutura Vascular: Vasos puntiformes e polimórficos; Critérios de Malignidade: Assimetria, múltiplas cores e estruturas atípicas presentes) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Dermatoscopia com padrão alterado, documentado por Padrão Pigmentar: Rede pigmentar assimétrica e irregular; Estrutura Vascular: Vasos puntiformes e polimórficos.",
      "results": {
        "padrao_pigmentar": "Rede pigmentar assimétrica e irregular",
        "estrutura_vascular": "Vasos puntiformes e polimórficos",
        "criterios_malignidade": "Assimetria, múltiplas cores e estruturas atípicas presentes",
        "impressao": "Lesão dermatoscópica suspeita, indicada avaliação histopatológica"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Dermatoscopia: Padrão Pigmentar: Leve assimetria da rede pigmentar; Estrutura Vascular: Vasos regulares esparsos; Critérios de Malignidade: Sem critérios maiores; um critério menor isolado.",
      "interpretation": "Os principais resultados (Padrão Pigmentar: Leve assimetria da rede pigmentar; Estrutura Vascular: Vasos regulares esparsos; Critérios de Malignidade: Sem critérios maiores; um critério menor isolado) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Dermatoscopia com resultado limítrofe/inespecífico, destacando-se Padrão Pigmentar: Leve assimetria da rede pigmentar; Estrutura Vascular: Vasos regulares esparsos.",
      "results": {
        "padrao_pigmentar": "Leve assimetria da rede pigmentar",
        "estrutura_vascular": "Vasos regulares esparsos",
        "criterios_malignidade": "Sem critérios maiores; um critério menor isolado",
        "impressao": "Lesão de baixo grau de suspeição, indicada documentação/seguimento conforme contexto"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Dermatoscopia: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "padrao_pigmentar": "Regular",
        "estrutura_vascular": "Normal",
        "criterios_malignidade": "Ausentes",
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
    "title": "Dermatoscopia",
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
  "technique": "Avaliação dermatoscópica da lesão cutânea com inspeção de padrões pigmentares, estruturas vasculares, simetria e critérios morfológicos de suspeição.",
  "method": "Exame por dermatoscópio com luz polarizada e/ou não polarizada, documentando estruturas não visíveis à inspeção clínica direta.",
  "parameters": [
    {
      "id": "padrao_pigmentar",
      "label": "Padrão Pigmentar",
      "unidade": null,
      "referencia": "Regular",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão Pigmentar conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "estrutura_vascular",
      "label": "Estrutura Vascular",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estrutura Vascular conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "criterios_malignidade",
      "label": "Critérios de Malignidade",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Critérios de Malignidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Dermatoscópica",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Dermatoscópica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Dermatoscopia compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Dermatoscopia com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Dermatoscopia com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Dermatoscopia sem alterações significativas nos parâmetros avaliados.",
    "altered": "Dermatoscopia alterado conforme resultados objetivos descritos.",
    "undefined": "Dermatoscopia com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
