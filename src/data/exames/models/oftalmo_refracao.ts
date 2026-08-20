import type { IntelligentExamModel } from "../types";

export const oftalmo_refracaoModel: IntelligentExamModel = {
  "id": "oftalmo_refracao",
  "nome": "Refração",
  "descricao": "Determinação do erro refrativo",
  "categoria": "oftalmologia",
  "icone": "fa-glasses",
  "campos": [
    {
      "id": "esferico_od",
      "tipo": "number",
      "label": "Esférico OD",
      "unidade": "D",
      "referencia": "—"
    },
    {
      "id": "cilindrico_od",
      "tipo": "number",
      "label": "Cilíndrico OD",
      "unidade": "D",
      "referencia": "—"
    },
    {
      "id": "esferico_oe",
      "tipo": "number",
      "label": "Esférico OE",
      "unidade": "D",
      "referencia": "—"
    },
    {
      "id": "cilindrico_oe",
      "tipo": "number",
      "label": "Cilíndrico OE",
      "unidade": "D",
      "referencia": "—"
    },
    {
      "id": "diagnostico",
      "tipo": "select",
      "label": "Diagnóstico Refrativo",
      "opcoes": [
        {
          "valor": "emmetropia",
          "label": "Emetropia"
        },
        {
          "valor": "miopia",
          "label": "Miopia"
        },
        {
          "valor": "hipermetropia",
          "label": "Hipermetropia"
        },
        {
          "valor": "astigmatismo",
          "label": "Astigmatismo"
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
      "resultSummary": "Refração com Esférico OD: 0,00; Cilíndrico OD: -0,25; Esférico OE: 0,00.",
      "interpretation": "Os parâmetros mensurados — Esférico OD: 0,00 D; Cilíndrico OD: -0,25 D; Esférico OE: 0,00 D; Cilíndrico OE: -0,25 D — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Refração com parâmetros compatíveis com o padrão esperado, incluindo Esférico OD: 0,00 D; Cilíndrico OD: -0,25 D.",
      "results": {
        "esferico_od": "0,00",
        "cilindrico_od": "-0,25",
        "esferico_oe": "0,00",
        "cilindrico_oe": "-0,25",
        "diagnostico": "Erro refrativo mínimo, sem repercussão funcional significativa"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Refração: Esférico OD: -2,25; Cilíndrico OD: -0,75; Esférico OE: -1,75; Cilíndrico OE: -0,50.",
      "interpretation": "Os resultados principais (Esférico OD: -2,25 D; Cilíndrico OD: -0,75 D; Esférico OE: -1,75 D; Cilíndrico OE: -0,50 D) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Refração com padrão alterado, documentado por Esférico OD: -2,25 D; Cilíndrico OD: -0,75 D.",
      "results": {
        "esferico_od": "-2,25",
        "cilindrico_od": "-0,75",
        "esferico_oe": "-1,75",
        "cilindrico_oe": "-0,50",
        "diagnostico": "Miopia bilateral com astigmatismo associado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Refração: Esférico OD: -0,75; Cilíndrico OD: -0,50; Esférico OE: -0,50; Cilíndrico OE: -0,50.",
      "interpretation": "Os principais resultados (Esférico OD: -0,75 D; Cilíndrico OD: -0,50 D; Esférico OE: -0,50 D; Cilíndrico OE: -0,50 D) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Refração com resultado limítrofe/inespecífico, destacando-se Esférico OD: -0,75 D; Cilíndrico OD: -0,50 D.",
      "results": {
        "esferico_od": "-0,75",
        "cilindrico_od": "-0,50",
        "esferico_oe": "-0,50",
        "cilindrico_oe": "-0,50",
        "diagnostico": "Miopia e astigmatismo leves"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Refração: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "esferico_od": "0,00",
        "cilindrico_od": "-0,25",
        "esferico_oe": "0,00",
        "cilindrico_oe": "-0,25",
        "diagnostico": "Erro refrativo mínimo, sem repercussão funcional significativa"
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
    "title": "Refração",
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
  "technique": "Refração ocular realizada para determinação do erro refrativo de cada olho e estimativa da correção óptica quando necessária.",
  "method": "Refração objetiva e/ou subjetiva com avaliação esférica e cilíndrica, ajustada pela resposta visual e condições do exame.",
  "parameters": [
    {
      "id": "esferico_od",
      "label": "Esférico OD",
      "unidade": "D",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Esférico OD conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "cilindrico_od",
      "label": "Cilíndrico OD",
      "unidade": "D",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cilíndrico OD conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "esferico_oe",
      "label": "Esférico OE",
      "unidade": "D",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Esférico OE conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "cilindrico_oe",
      "label": "Cilíndrico OE",
      "unidade": "D",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cilíndrico OE conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "diagnostico",
      "label": "Diagnóstico Refrativo",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Diagnóstico Refrativo conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Refração compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Refração com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Refração com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Refração sem alterações significativas nos parâmetros avaliados.",
    "altered": "Refração alterado conforme resultados objetivos descritos.",
    "undefined": "Refração com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
