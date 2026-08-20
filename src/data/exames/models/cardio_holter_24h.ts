import type { IntelligentExamModel } from "../types";

export const cardio_holter_24hModel: IntelligentExamModel = {
  "id": "cardio_holter_24h",
  "nome": "Holter 24 horas",
  "descricao": "Monitorização contínua do ritmo cardíaco por 24 horas",
  "categoria": "cardiologia",
  "icone": "fa-clock",
  "campos": [
    {
      "id": "fc_minima",
      "tipo": "number",
      "label": "Frequência Cardíaca Mínima",
      "unidade": "bpm",
      "referencia": "—"
    },
    {
      "id": "fc_maxima",
      "tipo": "number",
      "label": "Frequência Cardíaca Máxima",
      "unidade": "bpm",
      "referencia": "—"
    },
    {
      "id": "arritmias",
      "tipo": "select",
      "label": "Arritmias Detectadas",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "supraventriculares",
          "label": "Supraventriculares"
        },
        {
          "valor": "ventriculares",
          "label": "Ventriculares"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "pausas",
      "tipo": "select",
      "label": "Pausas",
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
      "label": "Impressão do Holter",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Ritmo preservado"
        },
        {
          "valor": "arritmico",
          "label": "Arritmia documentada"
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
      "resultSummary": "Holter 24 horas com Frequência Cardíaca Mínima: 52; Frequência Cardíaca Máxima: 132; Arritmias Detectadas: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Frequência Cardíaca Mínima: 52 bpm; Frequência Cardíaca Máxima: 132 bpm; Arritmias Detectadas: Ausentes; Pausas: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Holter 24 horas com parâmetros compatíveis com o padrão esperado, incluindo Frequência Cardíaca Mínima: 52 bpm; Frequência Cardíaca Máxima: 132 bpm.",
      "results": {
        "fc_minima": "52",
        "fc_maxima": "132",
        "arritmias": "Ausentes",
        "pausas": "Ausentes",
        "impressao": "Ritmo sinusal predominante, sem arritmias significativas"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Holter 24 horas: Frequência Cardíaca Mínima: 46; Frequência Cardíaca Máxima: 158; Arritmias Detectadas: Extrassístoles supraventriculares frequentes, com salvas curtas; Pausas: Sem pausas > 2,0 s.",
      "interpretation": "Os resultados principais (Frequência Cardíaca Mínima: 46 bpm; Frequência Cardíaca Máxima: 158 bpm; Arritmias Detectadas: Extrassístoles supraventriculares frequentes, com salvas curtas; Pausas: Sem pausas > 2,0 s) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Holter 24 horas com padrão alterado, documentado por Frequência Cardíaca Mínima: 46 bpm; Frequência Cardíaca Máxima: 158 bpm.",
      "results": {
        "fc_minima": "46",
        "fc_maxima": "158",
        "arritmias": "Extrassístoles supraventriculares frequentes, com salvas curtas",
        "pausas": "Sem pausas > 2,0 s",
        "impressao": "Ectopia supraventricular frequente no período monitorado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Holter 24 horas: Frequência Cardíaca Mínima: 50; Frequência Cardíaca Máxima: 142; Arritmias Detectadas: Extrassístoles supraventriculares isoladas e raras.",
      "interpretation": "Os principais resultados (Frequência Cardíaca Mínima: 50 bpm; Frequência Cardíaca Máxima: 142 bpm; Arritmias Detectadas: Extrassístoles supraventriculares isoladas e raras) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Holter 24 horas com resultado limítrofe/inespecífico, destacando-se Frequência Cardíaca Mínima: 50 bpm; Frequência Cardíaca Máxima: 142 bpm.",
      "results": {
        "fc_minima": "50",
        "fc_maxima": "142",
        "arritmias": "Extrassístoles supraventriculares isoladas e raras",
        "pausas": "Ausentes",
        "impressao": "Ectopia supraventricular rara, sem arritmia sustentada"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Holter 24 horas: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "fc_minima": "52",
        "fc_maxima": "132",
        "arritmias": "Ausentes",
        "pausas": "Ausentes",
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
    "title": "Holter 24 horas",
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
  "technique": "Monitorização eletrocardiográfica ambulatorial contínua por aproximadamente 24 horas, com análise de frequência cardíaca, ritmo, ectopias, pausas e eventos arrítmicos.",
  "method": "Registro eletrocardiográfico multicanal prolongado, seguido de análise automatizada e revisão técnica dos eventos relevantes.",
  "parameters": [
    {
      "id": "fc_minima",
      "label": "Frequência Cardíaca Mínima",
      "unidade": "bpm",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Frequência Cardíaca Mínima conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "fc_maxima",
      "label": "Frequência Cardíaca Máxima",
      "unidade": "bpm",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Frequência Cardíaca Máxima conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "arritmias",
      "label": "Arritmias Detectadas",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Arritmias Detectadas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "pausas",
      "label": "Pausas",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Pausas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão do Holter",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão do Holter conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Holter 24 horas compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Holter 24 horas com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Holter 24 horas com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Holter 24 horas sem alterações significativas nos parâmetros avaliados.",
    "altered": "Holter 24 horas alterado conforme resultados objetivos descritos.",
    "undefined": "Holter 24 horas com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
