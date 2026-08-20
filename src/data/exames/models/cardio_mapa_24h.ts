import type { IntelligentExamModel } from "../types";

export const cardio_mapa_24hModel: IntelligentExamModel = {
  "id": "cardio_mapa_24h",
  "nome": "MAPA 24 horas",
  "descricao": "Monitorização ambulatorial da pressão arterial",
  "categoria": "cardiologia",
  "icone": "fa-stethoscope",
  "campos": [
    {
      "id": "pa_media",
      "tipo": "number",
      "label": "Pressão Arterial Média",
      "unidade": "mmHg",
      "referencia": "< 130/80"
    },
    {
      "id": "padrao_circadiano",
      "tipo": "select",
      "label": "Padrão Circadiano",
      "opcoes": [
        {
          "valor": "dipper",
          "label": "Dipper"
        },
        {
          "valor": "non_dipper",
          "label": "Non-dipper"
        },
        {
          "valor": "reverse_dipper",
          "label": "Reverse dipper"
        }
      ],
      "referencia": "Dipper"
    },
    {
      "id": "picos_hipertensivos",
      "tipo": "select",
      "label": "Picos Hipertensivos",
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
      "label": "Impressão do MAPA",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Pressão controlada"
        },
        {
          "valor": "has",
          "label": "Hipertensão arterial sistêmica"
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
      "resultSummary": "MAPA 24 horas com Pressão Arterial Média: 118/74; Padrão Circadiano: Dipper; Picos Hipertensivos: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Pressão Arterial Média: 118/74 mmHg; Padrão Circadiano: Dipper; Picos Hipertensivos: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "MAPA 24 horas com parâmetros compatíveis com o padrão esperado, incluindo Pressão Arterial Média: 118/74 mmHg; Padrão Circadiano: Dipper.",
      "results": {
        "pa_media": "118/74",
        "padrao_circadiano": "Dipper",
        "picos_hipertensivos": "Ausentes",
        "impressao": "Perfil pressórico dentro dos limites de normalidade no período avaliado"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "MAPA 24 horas: Pressão Arterial Média: 138/86; Padrão Circadiano: Non-dipper; Picos Hipertensivos: Presentes, predominando em vigília.",
      "interpretation": "Os resultados principais (Pressão Arterial Média: 138/86 mmHg; Padrão Circadiano: Non-dipper; Picos Hipertensivos: Presentes, predominando em vigília) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "MAPA 24 horas com padrão alterado, documentado por Pressão Arterial Média: 138/86 mmHg; Padrão Circadiano: Non-dipper.",
      "results": {
        "pa_media": "138/86",
        "padrao_circadiano": "Non-dipper",
        "picos_hipertensivos": "Presentes, predominando em vigília",
        "impressao": "Médias pressóricas elevadas com descenso noturno reduzido"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "MAPA 24 horas: Pressão Arterial Média: 129/79; Padrão Circadiano: Descenso noturno limítrofe; Picos Hipertensivos: Picos isolados.",
      "interpretation": "Os principais resultados (Pressão Arterial Média: 129/79 mmHg; Padrão Circadiano: Descenso noturno limítrofe; Picos Hipertensivos: Picos isolados) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "MAPA 24 horas com resultado limítrofe/inespecífico, destacando-se Pressão Arterial Média: 129/79 mmHg; Padrão Circadiano: Descenso noturno limítrofe.",
      "results": {
        "pa_media": "129/79",
        "padrao_circadiano": "Descenso noturno limítrofe",
        "picos_hipertensivos": "Picos isolados",
        "impressao": "Valores pressóricos limítrofes, sem padrão hipertensivo sustentado definido"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "MAPA 24 horas: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "pa_media": "118/74",
        "padrao_circadiano": "Dipper",
        "picos_hipertensivos": "Ausentes",
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
    "title": "MAPA 24 horas",
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
  "technique": "Monitorização ambulatorial da pressão arterial por aproximadamente 24 horas, com medidas seriadas em vigília e sono e análise do comportamento circadiano.",
  "method": "Mensuração oscilométrica intermitente da pressão arterial com equipamento ambulatorial, cálculo das médias e avaliação do descenso pressórico noturno.",
  "parameters": [
    {
      "id": "pa_media",
      "label": "Pressão Arterial Média",
      "unidade": "mmHg",
      "referencia": "< 130/80",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Pressão Arterial Média conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "padrao_circadiano",
      "label": "Padrão Circadiano",
      "unidade": null,
      "referencia": "Dipper",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão Circadiano conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "picos_hipertensivos",
      "label": "Picos Hipertensivos",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Picos Hipertensivos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão do MAPA",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão do MAPA conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de MAPA 24 horas compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "MAPA 24 horas com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "MAPA 24 horas com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "MAPA 24 horas sem alterações significativas nos parâmetros avaliados.",
    "altered": "MAPA 24 horas alterado conforme resultados objetivos descritos.",
    "undefined": "MAPA 24 horas com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
