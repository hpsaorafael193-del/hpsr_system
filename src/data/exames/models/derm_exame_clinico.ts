import type { IntelligentExamModel } from "../types";

export const derm_exame_clinicoModel: IntelligentExamModel = {
  "id": "derm_exame_clinico",
  "nome": "Exame Dermatológico Clínico",
  "descricao": "Avaliação morfológica das lesões cutâneas",
  "categoria": "dermatologia",
  "icone": "fa-skin",
  "campos": [
    {
      "id": "tipo_lesao",
      "tipo": "select",
      "label": "Tipo de Lesão",
      "opcoes": [
        {
          "valor": "macula",
          "label": "Mácula"
        },
        {
          "valor": "papula",
          "label": "Pápula"
        },
        {
          "valor": "nodulo",
          "label": "Nódulo"
        },
        {
          "valor": "vesicula",
          "label": "Vesícula"
        },
        {
          "valor": "placa",
          "label": "Placa"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "distribuicao",
      "tipo": "select",
      "label": "Distribuição",
      "opcoes": [
        {
          "valor": "localizada",
          "label": "Localizada"
        },
        {
          "valor": "difusa",
          "label": "Difusa"
        }
      ],
      "referencia": "Localizada"
    },
    {
      "id": "sinais_inflamatorios",
      "tipo": "select",
      "label": "Sinais Inflamatórios",
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
      "label": "Impressão Dermatológica",
      "opcoes": [
        {
          "valor": "benigna",
          "label": "Lesão de aspecto benigno"
        },
        {
          "valor": "inflamatoria",
          "label": "Dermatose inflamatória"
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
      "resultSummary": "Exame Dermatológico Clínico com Tipo de Lesão: Sem lesões elementares suspeitas; Distribuição: Localizada; Sinais Inflamatórios: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Tipo de Lesão: Sem lesões elementares suspeitas; Distribuição: Localizada; Sinais Inflamatórios: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Exame Dermatológico Clínico com parâmetros compatíveis com o padrão esperado, incluindo Tipo de Lesão: Sem lesões elementares suspeitas; Distribuição: Localizada.",
      "results": {
        "tipo_lesao": "Sem lesões elementares suspeitas",
        "distribuicao": "Localizada",
        "sinais_inflamatorios": "Ausentes",
        "impressao": "Exame dermatológico sem alterações relevantes"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Exame Dermatológico Clínico: Tipo de Lesão: Placa eritematodescamativa de limites parcialmente definidos; Distribuição: Localizada em tronco; Sinais Inflamatórios: Eritema e descamação presentes.",
      "interpretation": "Os resultados principais (Tipo de Lesão: Placa eritematodescamativa de limites parcialmente definidos; Distribuição: Localizada em tronco; Sinais Inflamatórios: Eritema e descamação presentes) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Exame Dermatológico Clínico com padrão alterado, documentado por Tipo de Lesão: Placa eritematodescamativa de limites parcialmente definidos; Distribuição: Localizada em tronco.",
      "results": {
        "tipo_lesao": "Placa eritematodescamativa de limites parcialmente definidos",
        "distribuicao": "Localizada em tronco",
        "sinais_inflamatorios": "Eritema e descamação presentes",
        "impressao": "Dermatose inflamatória localizada, a correlacionar com história e exame complementar"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Exame Dermatológico Clínico: Tipo de Lesão: Mácula eritematosa discreta; Sinais Inflamatórios: Eritema discreto, sem exsudato.",
      "interpretation": "Os principais resultados (Tipo de Lesão: Mácula eritematosa discreta; Sinais Inflamatórios: Eritema discreto, sem exsudato) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Exame Dermatológico Clínico com resultado limítrofe/inespecífico, destacando-se Tipo de Lesão: Mácula eritematosa discreta; Sinais Inflamatórios: Eritema discreto, sem exsudato.",
      "results": {
        "tipo_lesao": "Mácula eritematosa discreta",
        "distribuicao": "Localizada",
        "sinais_inflamatorios": "Eritema discreto, sem exsudato",
        "impressao": "Achado cutâneo discreto e inespecífico"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame Dermatológico Clínico: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "tipo_lesao": "Sem lesões elementares suspeitas",
        "distribuicao": "Localizada",
        "sinais_inflamatorios": "Ausentes",
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
    "title": "Exame Dermatológico Clínico",
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
  "technique": "Exame dermatológico dirigido com inspeção e palpação das lesões, caracterização morfológica, distribuição, sinais inflamatórios e alterações anexiais relevantes.",
  "method": "Avaliação clínica dermatológica sistematizada, com descrição das lesões elementares, topografia e características semiológicas observadas.",
  "parameters": [
    {
      "id": "tipo_lesao",
      "label": "Tipo de Lesão",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Lesão conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "distribuicao",
      "label": "Distribuição",
      "unidade": null,
      "referencia": "Localizada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Distribuição conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sinais_inflamatorios",
      "label": "Sinais Inflamatórios",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sinais Inflamatórios conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Dermatológica",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Dermatológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Exame Dermatológico Clínico compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Exame Dermatológico Clínico com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Exame Dermatológico Clínico com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Exame Dermatológico Clínico sem alterações significativas nos parâmetros avaliados.",
    "altered": "Exame Dermatológico Clínico alterado conforme resultados objetivos descritos.",
    "undefined": "Exame Dermatológico Clínico com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
