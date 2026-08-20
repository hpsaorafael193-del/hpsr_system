import type { IntelligentExamModel } from "../types";

export const oftalmo_biomicroscopiaModel: IntelligentExamModel = {
  "id": "oftalmo_biomicroscopia",
  "nome": "Biomicroscopia",
  "descricao": "Avaliação do segmento anterior do olho",
  "categoria": "oftalmologia",
  "icone": "fa-search",
  "campos": [
    {
      "id": "palpebras_conjuntiva",
      "tipo": "select",
      "label": "Pálpebras e Conjuntiva",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normais"
        },
        {
          "valor": "hiperemia",
          "label": "Hiperemia"
        },
        {
          "valor": "blefarite",
          "label": "Blefarite"
        }
      ],
      "referencia": "Normais"
    },
    {
      "id": "cornea",
      "tipo": "select",
      "label": "Córnea",
      "opcoes": [
        {
          "valor": "transparente",
          "label": "Transparente"
        },
        {
          "valor": "opacidade",
          "label": "Opacidade"
        },
        {
          "valor": "ceratite",
          "label": "Ceratite"
        }
      ],
      "referencia": "Transparente"
    },
    {
      "id": "camara_anterior",
      "tipo": "select",
      "label": "Câmara Anterior",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "rasa",
          "label": "Rasa"
        },
        {
          "valor": "inflamacao",
          "label": "Sinais inflamatórios"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "cristalino",
      "tipo": "select",
      "label": "Cristalino",
      "opcoes": [
        {
          "valor": "transparente",
          "label": "Transparente"
        },
        {
          "valor": "catarata",
          "label": "Opacidades (Catarata)"
        }
      ],
      "referencia": "Transparente"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Biomicroscópica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Segmento anterior sem alterações"
        },
        {
          "valor": "alterado",
          "label": "Alterações no segmento anterior"
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
      "resultSummary": "Biomicroscopia com Pálpebras e Conjuntiva: Normais; Córnea: Transparente; Câmara Anterior: Normal.",
      "interpretation": "Os parâmetros mensurados — Pálpebras e Conjuntiva: Normais; Córnea: Transparente; Câmara Anterior: Normal; Cristalino: Transparente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Biomicroscopia com parâmetros compatíveis com o padrão esperado, incluindo Pálpebras e Conjuntiva: Normais; Córnea: Transparente.",
      "results": {
        "palpebras_conjuntiva": "Normais",
        "cornea": "Transparente",
        "camara_anterior": "Normal",
        "cristalino": "Transparente",
        "impressao": "Biomicroscopia com parâmetros compatíveis com o padrão esperado, incluindo Pálpebras e Conjuntiva: Normais; Córnea: Transparente"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Biomicroscopia: Pálpebras e Conjuntiva: Hiperemia conjuntival discreta; Córnea: Opacidade estromal periférica discreta; Câmara Anterior: Sem células ou flare significativos; Cristalino: Opacidade nuclear inicial.",
      "interpretation": "Os resultados principais (Pálpebras e Conjuntiva: Hiperemia conjuntival discreta; Córnea: Opacidade estromal periférica discreta; Câmara Anterior: Sem células ou flare significativos; Cristalino: Opacidade nuclear inicial) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Biomicroscopia com padrão alterado, documentado por Pálpebras e Conjuntiva: Hiperemia conjuntival discreta; Córnea: Opacidade estromal periférica discreta.",
      "results": {
        "palpebras_conjuntiva": "Hiperemia conjuntival discreta",
        "cornea": "Opacidade estromal periférica discreta",
        "camara_anterior": "Sem células ou flare significativos",
        "cristalino": "Opacidade nuclear inicial",
        "impressao": "Alterações de superfície ocular e catarata nuclear incipiente"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Biomicroscopia: Pálpebras e Conjuntiva: Hiperemia discreta; Cristalino: Opacidade nuclear mínima.",
      "interpretation": "Os principais resultados (Pálpebras e Conjuntiva: Hiperemia discreta; Cristalino: Opacidade nuclear mínima) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Biomicroscopia com resultado limítrofe/inespecífico, destacando-se Pálpebras e Conjuntiva: Hiperemia discreta; Cristalino: Opacidade nuclear mínima.",
      "results": {
        "palpebras_conjuntiva": "Hiperemia discreta",
        "cornea": "Transparente",
        "camara_anterior": "Normal",
        "cristalino": "Opacidade nuclear mínima",
        "impressao": "Alterações discretas de superfície ocular e cristalino"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Biomicroscopia: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "palpebras_conjuntiva": "Normais",
        "cornea": "Transparente",
        "camara_anterior": "Normal",
        "cristalino": "Transparente",
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
    "title": "Biomicroscopia",
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
  "technique": "Biomicroscopia ocular realizada para inspeção ampliada do segmento anterior e estruturas acessíveis ao exame.",
  "method": "Exame em lâmpada de fenda com iluminação focal e magnificação, avaliando pálpebras, conjuntiva, córnea, câmara anterior, íris e cristalino.",
  "parameters": [
    {
      "id": "palpebras_conjuntiva",
      "label": "Pálpebras e Conjuntiva",
      "unidade": null,
      "referencia": "Normais",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Pálpebras e Conjuntiva conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "cornea",
      "label": "Córnea",
      "unidade": null,
      "referencia": "Transparente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Córnea conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "camara_anterior",
      "label": "Câmara Anterior",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Câmara Anterior conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "cristalino",
      "label": "Cristalino",
      "unidade": null,
      "referencia": "Transparente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cristalino conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Biomicroscópica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Biomicroscópica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Biomicroscopia compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Biomicroscopia com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Biomicroscopia com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Biomicroscopia sem alterações significativas nos parâmetros avaliados.",
    "altered": "Biomicroscopia alterado conforme resultados objetivos descritos.",
    "undefined": "Biomicroscopia com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
