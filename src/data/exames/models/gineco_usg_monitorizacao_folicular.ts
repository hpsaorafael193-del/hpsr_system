import type { IntelligentExamModel } from "../types";

export const gineco_usg_monitorizacao_folicularModel: IntelligentExamModel = {
  "id": "gineco_usg_monitorizacao_folicular",
  "nome": "Transvaginal com Monitorização Folicular",
  "descricao": "Avaliação ultrassonográfica seriada para acompanhamento do desenvolvimento folicular, espessura endometrial e monitorização da ovulação.",
  "categoria": "ginecologia",
  "icone": "fa-wave-square",
  "campos": [
    {
      "id": "utero",
      "tipo": "select",
      "label": "Útero",
      "opcoes": [
        {
          "valor": "aspecto_normal",
          "label": "Aspecto ultrassonográfico preservado"
        },
        {
          "valor": "miomatose",
          "label": "Presença de miomatose uterina"
        },
        {
          "valor": "adenomiose",
          "label": "Aspecto sugestivo de adenomiose"
        },
        {
          "valor": "alterado",
          "label": "Outras alterações uterinas"
        }
      ],
      "referencia": "Morfologia uterina"
    },
    {
      "id": "endometrio",
      "tipo": "select",
      "label": "Padrão endometrial",
      "opcoes": [
        {
          "valor": "trilaminar",
          "label": "Padrão trilaminar"
        },
        {
          "valor": "secretor",
          "label": "Padrão secretor"
        },
        {
          "valor": "homogeneo",
          "label": "Aspecto homogêneo"
        },
        {
          "valor": "heterogeneo",
          "label": "Aspecto heterogêneo"
        }
      ],
      "referencia": "Aspecto endometrial"
    },
    {
      "id": "espessura_endometrial",
      "tipo": "number",
      "label": "Espessura endometrial",
      "unidade": "mm",
      "referencia": "Compatível com fase do ciclo"
    },
    {
      "id": "ovario_direito",
      "tipo": "text",
      "label": "Ovário direito",
      "placeholder": "Ex: Folículo dominante medindo 18 mm"
    },
    {
      "id": "foliculos_od",
      "tipo": "text",
      "label": "Folículos – Ovário direito",
      "placeholder": "Ex: 12 mm, 14 mm, 18 mm"
    },
    {
      "id": "ovario_esquerdo",
      "tipo": "text",
      "label": "Ovário esquerdo",
      "placeholder": "Ex: Ovário com múltiplos folículos antrais"
    },
    {
      "id": "foliculos_oe",
      "tipo": "text",
      "label": "Folículos – Ovário esquerdo",
      "placeholder": "Ex: 10 mm, 11 mm, 13 mm"
    },
    {
      "id": "foliculo_dominante",
      "tipo": "select",
      "label": "Folículo dominante",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "od",
          "label": "Presente em ovário direito"
        },
        {
          "valor": "oe",
          "label": "Presente em ovário esquerdo"
        },
        {
          "valor": "bilateral",
          "label": "Presente bilateralmente"
        }
      ],
      "referencia": "Dominância folicular"
    },
    {
      "id": "sinais_ovulacao",
      "tipo": "select",
      "label": "Sinais ultrassonográficos de ovulação",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "presentes",
          "label": "Presentes"
        },
        {
          "valor": "indeterminados",
          "label": "Indeterminados"
        }
      ],
      "referencia": "Ruptura folicular / líquido livre"
    },
    {
      "id": "liquido_fundo_saco",
      "tipo": "select",
      "label": "Líquido livre em fundo de saco",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "discreto",
          "label": "Discreto"
        },
        {
          "valor": "moderado",
          "label": "Moderado"
        }
      ],
      "referencia": "Avaliação pós-ovulatória"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão ultrassonográfica",
      "opcoes": [
        {
          "valor": "crescimento_folicular_adequado",
          "label": "Crescimento folicular adequado"
        },
        {
          "valor": "foliculo_pre_ovulatorio",
          "label": "Folículo em fase pré-ovulatória"
        },
        {
          "valor": "sinais_ovulacao",
          "label": "Achados sugestivos de ovulação recente"
        },
        {
          "valor": "anovulacao",
          "label": "Ausência de sinais ovulatórios"
        },
        {
          "valor": "padrao_sop",
          "label": "Morfologia sugestiva de síndrome dos ovários policísticos"
        }
      ],
      "referencia": "Síntese do exame"
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
    "title": "Transvaginal com Monitorização Folicular",
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
      "id": "utero",
      "label": "Útero",
      "unidade": null,
      "referencia": "Morfologia uterina",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Útero conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "endometrio",
      "label": "Padrão endometrial",
      "unidade": null,
      "referencia": "Aspecto endometrial",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão endometrial conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "espessura_endometrial",
      "label": "Espessura endometrial",
      "unidade": "mm",
      "referencia": "Compatível com fase do ciclo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Espessura endometrial conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ovario_direito",
      "label": "Ovário direito",
      "unidade": null,
      "referencia": "Ex: Folículo dominante medindo 18 mm",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ovário direito conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "foliculos_od",
      "label": "Folículos – Ovário direito",
      "unidade": null,
      "referencia": "Ex: 12 mm, 14 mm, 18 mm",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Folículos – Ovário direito conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ovario_esquerdo",
      "label": "Ovário esquerdo",
      "unidade": null,
      "referencia": "Ex: Ovário com múltiplos folículos antrais",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ovário esquerdo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "foliculos_oe",
      "label": "Folículos – Ovário esquerdo",
      "unidade": null,
      "referencia": "Ex: 10 mm, 11 mm, 13 mm",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Folículos – Ovário esquerdo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "foliculo_dominante",
      "label": "Folículo dominante",
      "unidade": null,
      "referencia": "Dominância folicular",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Folículo dominante conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sinais_ovulacao",
      "label": "Sinais ultrassonográficos de ovulação",
      "unidade": null,
      "referencia": "Ruptura folicular / líquido livre",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sinais ultrassonográficos de ovulação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "liquido_fundo_saco",
      "label": "Líquido livre em fundo de saco",
      "unidade": null,
      "referencia": "Avaliação pós-ovulatória",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Líquido livre em fundo de saco conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão ultrassonográfica",
      "unidade": null,
      "referencia": "Síntese do exame",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão ultrassonográfica conforme referência, contexto clínico e método utilizado."
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
