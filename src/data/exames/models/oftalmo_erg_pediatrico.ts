import type { IntelligentExamModel } from "../types";

export const oftalmo_erg_pediatricoModel: IntelligentExamModel = {
  "id": "oftalmo_erg_pediatrico",
  "nome": "Eletrorretinograma (ERG)",
  "descricao": "Avaliação funcional da retina, com foco em distrofias retinianas e alterações congênitas.",
  "categoria": "oftalmologia",
  "icone": "fa-eye-low-vision",
  "campos": [
    {
      "id": "condicao_exame",
      "tipo": "select",
      "label": "Condição do exame",
      "opcoes": [
        {
          "valor": "vigilia",
          "label": "Realizado em vigília"
        },
        {
          "valor": "sedacao",
          "label": "Realizado sob sedação"
        },
        {
          "valor": "limitado",
          "label": "Exame limitado por baixa colaboração"
        }
      ],
      "referencia": "Condições técnicas"
    },
    {
      "id": "resposta_global",
      "tipo": "select",
      "label": "Resposta retiniana global",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Resposta dentro da normalidade"
        },
        {
          "valor": "reduzida",
          "label": "Resposta global reduzida"
        },
        {
          "valor": "ausente",
          "label": "Resposta ausente"
        }
      ],
      "referencia": "Avaliação geral"
    },
    {
      "id": "padrao_resposta",
      "tipo": "select",
      "label": "Padrão de resposta",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Padrão normal"
        },
        {
          "valor": "predominio_bastonetes",
          "label": "Comprometimento predominante de bastonetes"
        },
        {
          "valor": "predominio_cones",
          "label": "Comprometimento predominante de cones"
        },
        {
          "valor": "disfuncao_mista",
          "label": "Disfunção mista (cones e bastonetes)"
        },
        {
          "valor": "extinto",
          "label": "Extinção da resposta retiniana"
        }
      ],
      "referencia": "Classificação funcional"
    },
    {
      "id": "simetria",
      "tipo": "select",
      "label": "Simetria entre os olhos",
      "opcoes": [
        {
          "valor": "simetrico",
          "label": "Simétrico"
        },
        {
          "valor": "assimetrico",
          "label": "Assimétrico"
        },
        {
          "valor": "nao_avaliavel",
          "label": "Não avaliável"
        }
      ],
      "referencia": "Comparação OD/OE"
    },
    {
      "id": "suspeita_clinica",
      "tipo": "select",
      "label": "Correlação clínica sugerida",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem evidência de disfunção retiniana significativa"
        },
        {
          "valor": "acromatopsia",
          "label": "Padrão compatível com acromatopsia"
        },
        {
          "valor": "retinose_pigmentar",
          "label": "Padrão compatível com retinose pigmentar"
        },
        {
          "valor": "distrofia_cones",
          "label": "Sugestivo de distrofia de cones"
        },
        {
          "valor": "distrofia_bastonetes",
          "label": "Sugestivo de distrofia de bastonetes"
        },
        {
          "valor": "indeterminado",
          "label": "Padrão inespecífico"
        }
      ],
      "referencia": "Hipótese diagnóstica"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Função retiniana preservada"
        },
        {
          "valor": "alteracao_leve",
          "label": "Alteração funcional leve"
        },
        {
          "valor": "alteracao_moderada",
          "label": "Alteração funcional moderada"
        },
        {
          "valor": "alteracao_grave",
          "label": "Alteração funcional grave"
        },
        {
          "valor": "extincao",
          "label": "Extinção da atividade retiniana"
        }
      ],
      "referencia": "Gravidade"
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
    "title": "Eletrorretinograma (ERG)",
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
      "id": "condicao_exame",
      "label": "Condição do exame",
      "unidade": null,
      "referencia": "Condições técnicas",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Condição do exame conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resposta_global",
      "label": "Resposta retiniana global",
      "unidade": null,
      "referencia": "Avaliação geral",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta retiniana global conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "padrao_resposta",
      "label": "Padrão de resposta",
      "unidade": null,
      "referencia": "Classificação funcional",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão de resposta conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "simetria",
      "label": "Simetria entre os olhos",
      "unidade": null,
      "referencia": "Comparação OD/OE",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Simetria entre os olhos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "suspeita_clinica",
      "label": "Correlação clínica sugerida",
      "unidade": null,
      "referencia": "Hipótese diagnóstica",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Correlação clínica sugerida conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão",
      "unidade": null,
      "referencia": "Gravidade",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão conforme referência, contexto clínico e método utilizado."
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
