import type { IntelligentExamModel } from "../types";

export const neuro_eegModel: IntelligentExamModel = {
  "id": "neuro_eeg",
  "nome": "Eletroencefalograma (EEG)",
  "descricao": "Registro da atividade elétrica cerebral em repouso e/ou ativação",
  "categoria": "neurologia",
  "icone": "fa-brain",
  "campos": [
    {
      "id": "estado_paciente",
      "tipo": "select",
      "label": "Estado do Paciente",
      "opcoes": [
        {
          "valor": "vigilia",
          "label": "Vigília"
        },
        {
          "valor": "sono",
          "label": "Sono"
        },
        {
          "valor": "vigilia_sono",
          "label": "Vigília e sono"
        }
      ],
      "referencia": "Vigília"
    },
    {
      "id": "atividade_base",
      "tipo": "select",
      "label": "Atividade de Base",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Organizada e simétrica"
        },
        {
          "valor": "lenta",
          "label": "Lentificada"
        },
        {
          "valor": "desorganizada",
          "label": "Desorganizada"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "descargas_epileptiformes",
      "tipo": "select",
      "label": "Descargas Epileptiformes",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "focais",
          "label": "Focais"
        },
        {
          "valor": "generalizadas",
          "label": "Generalizadas"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "resposta_estimulos",
      "tipo": "select",
      "label": "Resposta a Estímulos",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "alterada",
          "label": "Alterada"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Neurológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "EEG dentro da normalidade"
        },
        {
          "valor": "epileptiforme",
          "label": "Atividade epileptiforme"
        },
        {
          "valor": "encefalopatia",
          "label": "Sinais de encefalopatia difusa"
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
    "title": "Eletroencefalograma (EEG)",
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
      "id": "estado_paciente",
      "label": "Estado do Paciente",
      "unidade": null,
      "referencia": "Vigília",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estado do Paciente conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "atividade_base",
      "label": "Atividade de Base",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Atividade de Base conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "descargas_epileptiformes",
      "label": "Descargas Epileptiformes",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Descargas Epileptiformes conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resposta_estimulos",
      "label": "Resposta a Estímulos",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta a Estímulos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Neurológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Neurológica conforme referência, contexto clínico e método utilizado."
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
