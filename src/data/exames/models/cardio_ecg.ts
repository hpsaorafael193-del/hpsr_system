import type { IntelligentExamModel } from "../types";

export const cardio_ecgModel: IntelligentExamModel = {
  "id": "cardio_ecg",
  "nome": "Eletrocardiograma (ECG)",
  "descricao": "Registro da atividade elétrica cardíaca em repouso",
  "categoria": "cardiologia",
  "icone": "fa-heartbeat",
  "campos": [
    {
      "id": "ritmo",
      "tipo": "select",
      "label": "Ritmo Cardíaco",
      "opcoes": [
        {
          "valor": "sinusal",
          "label": "Ritmo sinusal"
        },
        {
          "valor": "fibrilacao_atrial",
          "label": "Fibrilação atrial"
        },
        {
          "valor": "flutter",
          "label": "Flutter atrial"
        },
        {
          "valor": "outro",
          "label": "Outro ritmo"
        }
      ],
      "referencia": "Ritmo sinusal"
    },
    {
      "id": "frequencia_cardiaca",
      "tipo": "number",
      "label": "Frequência Cardíaca",
      "unidade": "bpm",
      "referencia": "60 – 100"
    },
    {
      "id": "eixo",
      "tipo": "select",
      "label": "Eixo Elétrico",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "desviado_esquerda",
          "label": "Desvio à esquerda"
        },
        {
          "valor": "desviado_direita",
          "label": "Desvio à direita"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "intervalo_pr",
      "tipo": "number",
      "label": "Intervalo PR",
      "unidade": "ms",
      "referencia": "120 – 200"
    },
    {
      "id": "qrs",
      "tipo": "number",
      "label": "Duração do QRS",
      "unidade": "ms",
      "referencia": "< 120"
    },
    {
      "id": "segmento_st",
      "tipo": "select",
      "label": "Segmento ST",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "supra",
          "label": "Supra de ST"
        },
        {
          "valor": "infra",
          "label": "Infra de ST"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "onda_t",
      "tipo": "select",
      "label": "Onda T",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "invertida",
          "label": "Invertida"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Eletrocardiográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "ECG dentro da normalidade"
        },
        {
          "valor": "isquemia",
          "label": "Alterações isquêmicas"
        },
        {
          "valor": "arritmia",
          "label": "Arritmia cardíaca"
        },
        {
          "valor": "bloqueio",
          "label": "Distúrbio de condução"
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
    "title": "Eletrocardiograma (ECG)",
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
      "id": "ritmo",
      "label": "Ritmo Cardíaco",
      "unidade": null,
      "referencia": "Ritmo sinusal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ritmo Cardíaco conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "frequencia_cardiaca",
      "label": "Frequência Cardíaca",
      "unidade": "bpm",
      "referencia": "60 – 100",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Frequência Cardíaca conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "eixo",
      "label": "Eixo Elétrico",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Eixo Elétrico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "intervalo_pr",
      "label": "Intervalo PR",
      "unidade": "ms",
      "referencia": "120 – 200",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Intervalo PR conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "qrs",
      "label": "Duração do QRS",
      "unidade": "ms",
      "referencia": "< 120",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Duração do QRS conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "segmento_st",
      "label": "Segmento ST",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Segmento ST conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "onda_t",
      "label": "Onda T",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Onda T conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Eletrocardiográfica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Eletrocardiográfica conforme referência, contexto clínico e método utilizado."
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
