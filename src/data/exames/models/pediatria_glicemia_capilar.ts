import type { IntelligentExamModel } from "../types";

export const pediatria_glicemia_capilarModel: IntelligentExamModel = {
  "id": "pediatria_glicemia_capilar",
  "nome": "Glicemia Capilar Pediátrica",
  "descricao": "Avaliação rápida da glicemia em criança",
  "categoria": "pediatria",
  "icone": "fa-droplet",
  "campos": [
    {
      "id": "valor",
      "tipo": "number",
      "label": "Glicemia",
      "unidade": "mg/dL",
      "referencia": "70 – 100"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Pediátrica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Glicemia normal"
        },
        {
          "valor": "hipoglicemia",
          "label": "Hipoglicemia"
        },
        {
          "valor": "hiperglicemia",
          "label": "Hiperglicemia"
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
      "resultSummary": "Glicemia Capilar Pediátrica com Glicemia: 84,4.",
      "interpretation": "Os parâmetros mensurados — Glicemia: 84,4 mg/dL — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Glicemia Capilar Pediátrica com parâmetros compatíveis com o padrão esperado, incluindo Glicemia: 84,4 mg/dL.",
      "results": {
        "valor": "84,4",
        "impressao": "Glicemia Capilar Pediátrica com parâmetros compatíveis com o padrão esperado, incluindo Glicemia: 84,4 mg/dL"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Glicemia Capilar Pediátrica: Glicemia: 154.",
      "interpretation": "Os resultados principais (Glicemia: 154 mg/dL) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Glicemia Capilar Pediátrica com padrão alterado, documentado por Glicemia: 154 mg/dL.",
      "results": {
        "valor": "154",
        "impressao": "Hiperglicemia capilar"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Glicemia Capilar Pediátrica: Glicemia: 104.",
      "interpretation": "Os principais resultados (Glicemia: 104 mg/dL) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Glicemia Capilar Pediátrica com resultado limítrofe/inespecífico, destacando-se Glicemia: 104 mg/dL.",
      "results": {
        "valor": "104",
        "impressao": "Glicemia capilar discretamente acima da faixa de referência"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Glicemia Capilar Pediátrica: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "valor": "84,4",
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
    "title": "Glicemia Capilar Pediátrica",
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
  "technique": "Glicemia capilar pediátrica aferida em amostra de sangue periférico obtida por punção digital ou de local apropriado à idade.",
  "method": "Leitura por sistema portátil de glicose validado, com controle da qualidade da tira reagente e interpretação segundo contexto alimentar e clínico.",
  "parameters": [
    {
      "id": "valor",
      "label": "Glicemia",
      "unidade": "mg/dL",
      "referencia": "70 – 100",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Glicemia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Pediátrica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Pediátrica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Glicemia Capilar Pediátrica compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Glicemia Capilar Pediátrica com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Glicemia Capilar Pediátrica com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Glicemia Capilar Pediátrica sem alterações significativas nos parâmetros avaliados.",
    "altered": "Glicemia Capilar Pediátrica alterado conforme resultados objetivos descritos.",
    "undefined": "Glicemia Capilar Pediátrica com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
