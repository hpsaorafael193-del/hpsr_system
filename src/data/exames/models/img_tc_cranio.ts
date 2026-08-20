import type { IntelligentExamModel } from "../types";

export const img_tc_cranioModel: IntelligentExamModel = {
  "id": "img_tc_cranio",
  "nome": "Tomografia Computadorizada de Crânio",
  "descricao": "Avaliação de estruturas encefálicas e ósseas do crânio",
  "categoria": "imagem",
  "icone": "fa-brain",
  "campos": [
    {
      "id": "uso_contraste",
      "tipo": "select",
      "label": "Uso de Contraste",
      "opcoes": [
        {
          "valor": "sem",
          "label": "Sem contraste"
        },
        {
          "valor": "com",
          "label": "Com contraste"
        }
      ],
      "referencia": "Sem contraste"
    },
    {
      "id": "hemorragia",
      "tipo": "select",
      "label": "Hemorragia",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "intraparenquimatosa",
          "label": "Intraparenquimatosa"
        },
        {
          "valor": "subaracnoidea",
          "label": "Subaracnoidea"
        },
        {
          "valor": "subdural",
          "label": "Subdural"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "isquemia",
      "tipo": "select",
      "label": "Sinais de Isquemia",
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
      "id": "efeito_massa",
      "tipo": "select",
      "label": "Efeito de Massa",
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
      "id": "ventriculos",
      "tipo": "select",
      "label": "Sistema Ventricular",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "hidrocefalia",
          "label": "Hidrocefalia"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Tomográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem alterações tomográficas"
        },
        {
          "valor": "avc_isquemico",
          "label": "Achados compatíveis com AVC isquêmico"
        },
        {
          "valor": "avc_hemorragico",
          "label": "Achados compatíveis com AVC hemorrágico"
        },
        {
          "valor": "traumatica",
          "label": "Achados pós-traumáticos"
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
    "id": "regiao_contraste",
    "label": "Região e contraste",
    "kind": "region-contrast",
    "enabled": true,
    "options": [
      "Crânio",
      "Tórax",
      "Abdome",
      "Pelve",
      "Coluna",
      "Seios da face",
      "Extremidades",
      "Angiotomografia",
      "Personalizado"
    ],
    "secondaryOptions": [
      "Sem contraste",
      "Com contraste"
    ],
    "description": "A combinação entre região e uso de contraste define técnica, achados e conclusão sugerida."
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
      "resultSummary": "Tomografia Computadorizada de Crânio com Uso de Contraste: Sem contraste; Hemorragia: Ausente; Sinais de Isquemia: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Uso de Contraste: Sem contraste; Hemorragia: Ausente; Sinais de Isquemia: Ausentes; Efeito de Massa: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Tomografia Computadorizada de Crânio com parâmetros compatíveis com o padrão esperado, incluindo Uso de Contraste: Sem contraste; Hemorragia: Ausente.",
      "results": {
        "uso_contraste": "Sem contraste",
        "hemorragia": "Ausente",
        "isquemia": "Ausentes",
        "efeito_massa": "Ausente",
        "ventriculos": "Normal",
        "impressao": "Tomografia Computadorizada de Crânio com parâmetros compatíveis com o padrão esperado, incluindo Uso de Contraste: Sem contraste; Hemorragia: Ausente"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Tomografia Computadorizada de Crânio: Hemorragia: Pequeno foco de hemorragia intraparenquimatosa frontal; Sinais de Isquemia: Sem sinais tomográficos definidos de isquemia aguda extensa; Efeito de Massa: Discreto efeito de massa local, sem desvio de linha média; Sistema Ventricular: Dimensões preservadas.",
      "interpretation": "Os resultados principais (Hemorragia: Pequeno foco de hemorragia intraparenquimatosa frontal; Sinais de Isquemia: Sem sinais tomográficos definidos de isquemia aguda extensa; Efeito de Massa: Discreto efeito de massa local, sem desvio de linha média; Sistema Ventricular: Dimensões preservadas) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Tomografia Computadorizada de Crânio com padrão alterado, documentado por Hemorragia: Pequeno foco de hemorragia intraparenquimatosa frontal; Sinais de Isquemia: Sem sinais tomográficos definidos de isquemia aguda extensa.",
      "results": {
        "uso_contraste": "Sem contraste",
        "hemorragia": "Pequeno foco de hemorragia intraparenquimatosa frontal",
        "isquemia": "Sem sinais tomográficos definidos de isquemia aguda extensa",
        "efeito_massa": "Discreto efeito de massa local, sem desvio de linha média",
        "ventriculos": "Dimensões preservadas",
        "impressao": "Pequeno foco hemorrágico intraparenquimatoso, sem desvio de linha média"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Tomografia Computadorizada de Crânio: Sinais de Isquemia: Hipodensidade puntiforme inespecífica de aspecto crônico; Sistema Ventricular: Discreta assimetria sem hidrocefalia.",
      "interpretation": "Os principais resultados (Sinais de Isquemia: Hipodensidade puntiforme inespecífica de aspecto crônico; Sistema Ventricular: Discreta assimetria sem hidrocefalia) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Tomografia Computadorizada de Crânio com resultado limítrofe/inespecífico, destacando-se Sinais de Isquemia: Hipodensidade puntiforme inespecífica de aspecto crônico; Sistema Ventricular: Discreta assimetria sem hidrocefalia.",
      "results": {
        "uso_contraste": "Sem contraste",
        "hemorragia": "Ausente",
        "isquemia": "Hipodensidade puntiforme inespecífica de aspecto crônico",
        "efeito_massa": "Ausente",
        "ventriculos": "Discreta assimetria sem hidrocefalia",
        "impressao": "Alterações crônicas/inespecíficas discretas, sem evento agudo definido"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Tomografia Computadorizada de Crânio: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "uso_contraste": "Sem contraste",
        "hemorragia": "Ausente",
        "isquemia": "Ausentes",
        "efeito_massa": "Ausente",
        "ventriculos": "Normal",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [
    {
      "id": "contraste",
      "label": "Contraste",
      "tipo": "select",
      "options": [
        "Sem contraste",
        "Com contraste"
      ]
    },
    {
      "id": "regiao",
      "label": "Região examinada",
      "tipo": "select",
      "options": [
        "Crânio",
        "Tórax",
        "Abdome",
        "Pelve",
        "Coluna",
        "Extremidades",
        "Personalizado"
      ]
    }
  ],
  "editorModel": {
    "title": "Tomografia Computadorizada de Crânio",
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
  "technique": "Tomografia Computadorizada de Crânio realizada por aquisição tomográfica volumétrica da região selecionada, com reconstruções multiplanares e documentação das estruturas avaliadas.",
  "method": "Tomografia computadorizada multislice com reconstruções nos planos adequados; meio de contraste iodado utilizado apenas quando indicado pelo protocolo clínico.",
  "parameters": [
    {
      "id": "uso_contraste",
      "label": "Uso de Contraste",
      "unidade": null,
      "referencia": "Sem contraste",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Uso de Contraste conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemorragia",
      "label": "Hemorragia",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemorragia conforme referência, contexto clínico e método utilizado."
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
      "id": "efeito_massa",
      "label": "Efeito de Massa",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Efeito de Massa conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ventriculos",
      "label": "Sistema Ventricular",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sistema Ventricular conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Tomográfica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Tomográfica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Tomografia Computadorizada de Crânio compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Tomografia Computadorizada de Crânio com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Tomografia Computadorizada de Crânio com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Tomografia Computadorizada de Crânio sem alterações significativas nos parâmetros avaliados.",
    "altered": "Tomografia Computadorizada de Crânio alterado conforme resultados objetivos descritos.",
    "undefined": "Tomografia Computadorizada de Crânio com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
