import type { IntelligentExamModel } from "../types";

export const gineco_papanicolauModel: IntelligentExamModel = {
  "id": "gineco_papanicolau",
  "nome": "Citopatológico do Colo do Útero (Papanicolau)",
  "descricao": "Avaliação citológica do colo uterino para rastreamento de lesões intraepiteliais e câncer",
  "categoria": "ginecologia",
  "icone": "fa-female",
  "campos": [
    {
      "id": "amostra_satisfatoria",
      "tipo": "select",
      "label": "Amostra Satisfatória",
      "opcoes": [
        {
          "valor": "sim",
          "label": "Sim"
        },
        {
          "valor": "nao",
          "label": "Não"
        }
      ],
      "referencia": "Sim"
    },
    {
      "id": "zona_transformacao",
      "tipo": "select",
      "label": "Representatividade da Zona de Transformação",
      "opcoes": [
        {
          "valor": "presente",
          "label": "Presente"
        },
        {
          "valor": "ausente",
          "label": "Ausente"
        }
      ],
      "referencia": "Presente"
    },
    {
      "id": "achados_inflamatorios",
      "tipo": "select",
      "label": "Achados Inflamatórios",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "leves",
          "label": "Leves"
        },
        {
          "valor": "moderados",
          "label": "Moderados"
        },
        {
          "valor": "intensos",
          "label": "Intensos"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "microbiologia",
      "tipo": "select",
      "label": "Microbiologia",
      "opcoes": [
        {
          "valor": "flora_habitual",
          "label": "Flora habitual"
        },
        {
          "valor": "candidiase",
          "label": "Candida spp."
        },
        {
          "valor": "gardnerella",
          "label": "Vaginose bacteriana (Gardnerella)"
        },
        {
          "valor": "trichomonas",
          "label": "Trichomonas vaginalis"
        }
      ],
      "referencia": "Flora habitual"
    },
    {
      "id": "lesao_intraepitelial",
      "tipo": "select",
      "label": "Lesão Intraepitelial / Malignidade",
      "opcoes": [
        {
          "valor": "negativa",
          "label": "Negativa"
        },
        {
          "valor": "ascus",
          "label": "ASC-US"
        },
        {
          "valor": "lsil",
          "label": "LSIL"
        },
        {
          "valor": "hsil",
          "label": "HSIL"
        },
        {
          "valor": "carcinoma",
          "label": "Carcinoma"
        }
      ],
      "referencia": "Negativa"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Ginecológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Exame dentro da normalidade"
        },
        {
          "valor": "inflamatorio",
          "label": "Citologia inflamatória"
        },
        {
          "valor": "alteracao_citologica",
          "label": "Alteração citológica"
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
      "resultSummary": "Citopatológico do Colo do Útero (Papanicolau) com Amostra Satisfatória: Sim; Representatividade da Zona de Transformação: Presente; Achados Inflamatórios: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Amostra Satisfatória: Sim; Representatividade da Zona de Transformação: Presente; Achados Inflamatórios: Ausentes; Microbiologia: Flora habitual — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Citopatológico do Colo do Útero (Papanicolau) com parâmetros compatíveis com o padrão esperado, incluindo Amostra Satisfatória: Sim; Representatividade da Zona de Transformação: Presente.",
      "results": {
        "amostra_satisfatoria": "Sim",
        "zona_transformacao": "Presente",
        "achados_inflamatorios": "Ausentes",
        "microbiologia": "Flora habitual",
        "lesao_intraepitelial": "Negativa",
        "impressao": "Citopatológico do Colo do Útero (Papanicolau) com parâmetros compatíveis com o padrão esperado, incluindo Amostra Satisfatória: Sim; Representatividade da Zona de Transformação: Presente"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Citopatológico do Colo do Útero (Papanicolau): Achados Inflamatórios: Inflamação moderada; Microbiologia: Flora bacilar mista; Lesão Intraepitelial / Malignidade: LSIL — lesão intraepitelial escamosa de baixo grau.",
      "interpretation": "Os resultados principais (Achados Inflamatórios: Inflamação moderada; Microbiologia: Flora bacilar mista; Lesão Intraepitelial / Malignidade: LSIL — lesão intraepitelial escamosa de baixo grau) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Citopatológico do Colo do Útero (Papanicolau) com padrão alterado, documentado por Achados Inflamatórios: Inflamação moderada; Microbiologia: Flora bacilar mista.",
      "results": {
        "amostra_satisfatoria": "Sim",
        "zona_transformacao": "Presente",
        "achados_inflamatorios": "Inflamação moderada",
        "microbiologia": "Flora bacilar mista",
        "lesao_intraepitelial": "LSIL — lesão intraepitelial escamosa de baixo grau",
        "impressao": "Citologia com LSIL"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Citopatológico do Colo do Útero (Papanicolau): Achados Inflamatórios: Inflamação discreta; Microbiologia: Flora mista; Lesão Intraepitelial / Malignidade: ASC-US — células escamosas atípicas de significado indeterminado.",
      "interpretation": "Os principais resultados (Achados Inflamatórios: Inflamação discreta; Microbiologia: Flora mista; Lesão Intraepitelial / Malignidade: ASC-US — células escamosas atípicas de significado indeterminado) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Citopatológico do Colo do Útero (Papanicolau) com resultado limítrofe/inespecífico, destacando-se Achados Inflamatórios: Inflamação discreta; Microbiologia: Flora mista.",
      "results": {
        "amostra_satisfatoria": "Sim",
        "zona_transformacao": "Presente",
        "achados_inflamatorios": "Inflamação discreta",
        "microbiologia": "Flora mista",
        "lesao_intraepitelial": "ASC-US — células escamosas atípicas de significado indeterminado",
        "impressao": "Citologia com ASC-US"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Citopatológico do Colo do Útero (Papanicolau): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "amostra_satisfatoria": "Sim",
        "zona_transformacao": "Presente",
        "achados_inflamatorios": "Ausentes",
        "microbiologia": "Flora habitual",
        "lesao_intraepitelial": "Negativa",
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
    "title": "Citopatológico do Colo do Útero (Papanicolau)",
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
  "technique": "Amostra citológica do colo uterino processada para avaliação de células escamosas e glandulares, alterações inflamatórias e atipias.",
  "method": "Citologia cervicovaginal com fixação e coloração de Papanicolau, interpretada segundo critérios citomorfológicos padronizados.",
  "parameters": [
    {
      "id": "amostra_satisfatoria",
      "label": "Amostra Satisfatória",
      "unidade": null,
      "referencia": "Sim",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Amostra Satisfatória conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "zona_transformacao",
      "label": "Representatividade da Zona de Transformação",
      "unidade": null,
      "referencia": "Presente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Representatividade da Zona de Transformação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "achados_inflamatorios",
      "label": "Achados Inflamatórios",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Achados Inflamatórios conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "microbiologia",
      "label": "Microbiologia",
      "unidade": null,
      "referencia": "Flora habitual",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Microbiologia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "lesao_intraepitelial",
      "label": "Lesão Intraepitelial / Malignidade",
      "unidade": null,
      "referencia": "Negativa",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Lesão Intraepitelial / Malignidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Ginecológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Ginecológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Citopatológico do Colo do Útero (Papanicolau) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Citopatológico do Colo do Útero (Papanicolau) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Citopatológico do Colo do Útero (Papanicolau) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Citopatológico do Colo do Útero (Papanicolau) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Citopatológico do Colo do Útero (Papanicolau) alterado conforme resultados objetivos descritos.",
    "undefined": "Citopatológico do Colo do Útero (Papanicolau) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
