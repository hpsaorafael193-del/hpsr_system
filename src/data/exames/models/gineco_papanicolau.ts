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
      "resultSummary": "Exame sem alterações relevantes.",
      "interpretation": "Resultados dentro do esperado para método, referência e contexto clínico informado.",
      "conclusion": "Exame sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Exame com alterações nos parâmetros avaliados.",
      "interpretation": "Alterações devem ser correlacionadas com quadro clínico, medicamentos, evolução e exames complementares.",
      "conclusion": "Exame alterado, recomendando correlação clínica."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Exame com achado limítrofe ou inespecífico.",
      "interpretation": "Resultado isolado não define diagnóstico e pode requerer repetição/seguimento conforme avaliação médica.",
      "conclusion": "Achado indefinido ou limítrofe, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame personalizado.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
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
  "technique": "Exame realizado conforme protocolo institucional e indicação clínica informada.",
  "method": "Método técnico definido conforme exame solicitado.",
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
    "normal": "Sem alterações relevantes.",
    "altered": "Alterações a correlacionar clinicamente.",
    "undefined": "Achado indefinido, sem conclusão diagnóstica isolada."
  },
  "conclusion": {
    "normal": "Exame sem alterações significativas.",
    "altered": "Exame alterado, recomendando correlação clínica.",
    "undefined": "Achado indefinido ou limítrofe, recomendando correlação clínica."
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
