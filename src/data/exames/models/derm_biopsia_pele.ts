import type { IntelligentExamModel } from "../types";

export const derm_biopsia_peleModel: IntelligentExamModel = {
  "id": "derm_biopsia_pele",
  "nome": "Biópsia de Pele",
  "descricao": "Análise histopatológica de lesão cutânea",
  "categoria": "dermatologia",
  "icone": "fa-dna",
  "campos": [
    {
      "id": "tipo_biopsia",
      "tipo": "select",
      "label": "Tipo de Biópsia",
      "opcoes": [
        {
          "valor": "punch",
          "label": "Punch"
        },
        {
          "valor": "excisional",
          "label": "Excisional"
        },
        {
          "valor": "incisional",
          "label": "Incisional"
        }
      ],
      "referencia": "Punch"
    },
    {
      "id": "resultado_histologico",
      "tipo": "select",
      "label": "Resultado Histológico",
      "opcoes": [
        {
          "valor": "benigno",
          "label": "Benigno"
        },
        {
          "valor": "maligno",
          "label": "Maligno"
        },
        {
          "valor": "inconclusivo",
          "label": "Inconclusivo"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Histopatológica",
      "opcoes": [
        {
          "valor": "lesao_benigna",
          "label": "Lesão benigna"
        },
        {
          "valor": "neoplasia",
          "label": "Neoplasia cutânea"
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
      "resultSummary": "Biópsia de Pele com Tipo de Biópsia: Punch de 4 mm; Resultado Histológico: Epiderme e derme sem alterações histopatológicas significativas.",
      "interpretation": "Os parâmetros mensurados — Tipo de Biópsia: Punch de 4 mm; Resultado Histológico: Epiderme e derme sem alterações histopatológicas significativas — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Biópsia de Pele com parâmetros compatíveis com o padrão esperado, incluindo Tipo de Biópsia: Punch de 4 mm; Resultado Histológico: Epiderme e derme sem alterações histopatológicas significativas.",
      "results": {
        "tipo_biopsia": "Punch de 4 mm",
        "resultado_histologico": "Epiderme e derme sem alterações histopatológicas significativas",
        "impressao": "Fragmento cutâneo sem evidências histológicas de malignidade"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Biópsia de Pele: Resultado Histológico: Proliferação melanocítica atípica com assimetria arquitetural e atipia citológica.",
      "interpretation": "Os resultados principais (Resultado Histológico: Proliferação melanocítica atípica com assimetria arquitetural e atipia citológica) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Biópsia de Pele com padrão alterado, documentado por Resultado Histológico: Proliferação melanocítica atípica com assimetria arquitetural e atipia citológica.",
      "results": {
        "tipo_biopsia": "Punch de 4 mm",
        "resultado_histologico": "Proliferação melanocítica atípica com assimetria arquitetural e atipia citológica",
        "impressao": "Lesão melanocítica atípica; recomenda-se correlação clínico-patológica e avaliação de margens"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Biópsia de Pele: Resultado Histológico: Alterações inflamatórias inespecíficas, sem critérios histológicos de malignidade.",
      "interpretation": "Os principais resultados (Resultado Histológico: Alterações inflamatórias inespecíficas, sem critérios histológicos de malignidade) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Biópsia de Pele com resultado limítrofe/inespecífico, destacando-se Resultado Histológico: Alterações inflamatórias inespecíficas, sem critérios histológicos de malignidade.",
      "results": {
        "tipo_biopsia": "Punch de 4 mm",
        "resultado_histologico": "Alterações inflamatórias inespecíficas, sem critérios histológicos de malignidade",
        "impressao": "Dermatite inespecífica; correlacionar com aspecto clínico"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Biópsia de Pele: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "tipo_biopsia": "Punch de 4 mm",
        "resultado_histologico": "Epiderme e derme sem alterações histopatológicas significativas",
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
    "title": "Biópsia de Pele",
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
  "technique": "Fragmento cutâneo obtido por biópsia e encaminhado para processamento histopatológico, com descrição das alterações epidérmicas, dérmicas e anexiais observadas.",
  "method": "Fixação e processamento histológico do tecido, confecção de cortes e coloração de rotina por hematoxilina-eosina, com colorações complementares quando indicadas.",
  "parameters": [
    {
      "id": "tipo_biopsia",
      "label": "Tipo de Biópsia",
      "unidade": null,
      "referencia": "Punch",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Biópsia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resultado_histologico",
      "label": "Resultado Histológico",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado Histológico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Histopatológica",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Histopatológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Biópsia de Pele compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Biópsia de Pele com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Biópsia de Pele com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Biópsia de Pele sem alterações significativas nos parâmetros avaliados.",
    "altered": "Biópsia de Pele alterado conforme resultados objetivos descritos.",
    "undefined": "Biópsia de Pele com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
