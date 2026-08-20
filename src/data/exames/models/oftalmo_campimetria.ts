import type { IntelligentExamModel } from "../types";

export const oftalmo_campimetriaModel: IntelligentExamModel = {
  "id": "oftalmo_campimetria",
  "nome": "Campimetria Visual",
  "descricao": "Avaliação do campo visual",
  "categoria": "oftalmologia",
  "icone": "fa-bullseye",
  "campos": [
    {
      "id": "campo_visual",
      "tipo": "select",
      "label": "Campo Visual",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "escotoma",
          "label": "Escotomas"
        },
        {
          "valor": "perda_periferica",
          "label": "Perda periférica"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "padrao_glaucomatoso",
      "tipo": "select",
      "label": "Padrão Glaucomatoso",
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
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Campimétrica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Campo visual preservado"
        },
        {
          "valor": "alterado",
          "label": "Alterações do campo visual"
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
      "resultSummary": "Campimetria Visual com Campo Visual: Normal; Padrão Glaucomatoso: Ausente.",
      "interpretation": "Os parâmetros mensurados — Campo Visual: Normal; Padrão Glaucomatoso: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Campimetria Visual com parâmetros compatíveis com o padrão esperado, incluindo Campo Visual: Normal; Padrão Glaucomatoso: Ausente.",
      "results": {
        "campo_visual": "Normal",
        "padrao_glaucomatoso": "Ausente",
        "impressao": "Campimetria Visual com parâmetros compatíveis com o padrão esperado, incluindo Campo Visual: Normal; Padrão Glaucomatoso: Ausente"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Campimetria Visual: Campo Visual: Defeito arqueado superior em OD; Padrão Glaucomatoso: Presente, compatível com defeito de fibras nervosas.",
      "interpretation": "Os resultados principais (Campo Visual: Defeito arqueado superior em OD; Padrão Glaucomatoso: Presente, compatível com defeito de fibras nervosas) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Campimetria Visual com padrão alterado, documentado por Campo Visual: Defeito arqueado superior em OD; Padrão Glaucomatoso: Presente, compatível com defeito de fibras nervosas.",
      "results": {
        "campo_visual": "Defeito arqueado superior em OD",
        "padrao_glaucomatoso": "Presente, compatível com defeito de fibras nervosas",
        "impressao": "Defeito campimétrico de padrão glaucomatoso em OD"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Campimetria Visual: Campo Visual: Depressão localizada discreta sem padrão reprodutível.",
      "interpretation": "Os principais resultados (Campo Visual: Depressão localizada discreta sem padrão reprodutível) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Campimetria Visual com resultado limítrofe/inespecífico, destacando-se Campo Visual: Depressão localizada discreta sem padrão reprodutível.",
      "results": {
        "campo_visual": "Depressão localizada discreta sem padrão reprodutível",
        "padrao_glaucomatoso": "Ausente",
        "impressao": "Defeito campimétrico discreto e inespecífico"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Campimetria Visual: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "campo_visual": "Normal",
        "padrao_glaucomatoso": "Ausente",
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
    "title": "Campimetria Visual",
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
  "technique": "Campimetria realizada para avaliação quantitativa do campo visual e identificação de defeitos localizados ou difusos.",
  "method": "Perimetria computadorizada estática conforme estratégia selecionada, com análise dos índices globais, mapa de sensibilidade e confiabilidade do teste.",
  "parameters": [
    {
      "id": "campo_visual",
      "label": "Campo Visual",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Campo Visual conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "padrao_glaucomatoso",
      "label": "Padrão Glaucomatoso",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão Glaucomatoso conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Campimétrica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Campimétrica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Campimetria Visual compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Campimetria Visual com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Campimetria Visual com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Campimetria Visual sem alterações significativas nos parâmetros avaliados.",
    "altered": "Campimetria Visual alterado conforme resultados objetivos descritos.",
    "undefined": "Campimetria Visual com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
