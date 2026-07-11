import type { IntelligentExamModel } from "../types";

export const gineco_colposcopiaModel: IntelligentExamModel = {
  "id": "gineco_colposcopia",
  "nome": "Colposcopia",
  "descricao": "Avaliação do colo uterino e vagina com magnificação e testes com reagentes",
  "categoria": "ginecologia",
  "icone": "fa-search",
  "campos": [
    {
      "id": "juncao_escamocolunar",
      "tipo": "select",
      "label": "Junção Escamocolunar (JEC)",
      "opcoes": [
        {
          "valor": "visivel",
          "label": "Visível"
        },
        {
          "valor": "nao_visivel",
          "label": "Não visível"
        }
      ],
      "referencia": "Visível"
    },
    {
      "id": "teste_acido_acetico",
      "tipo": "select",
      "label": "Teste com Ácido Acético",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "acetobranco",
          "label": "Acetobranco"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "teste_lugol",
      "tipo": "select",
      "label": "Teste de Lugol",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo (captação)"
        },
        {
          "valor": "negativo",
          "label": "Negativo (iodo-negativo)"
        }
      ],
      "referencia": "Positivo"
    },
    {
      "id": "achado_suspeito",
      "tipo": "select",
      "label": "Achado Suspeito",
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
      "id": "conduta_sugerida",
      "tipo": "select",
      "label": "Conduta Sugerida",
      "opcoes": [
        {
          "valor": "rotina",
          "label": "Rotina"
        },
        {
          "valor": "biopsia",
          "label": "Biópsia dirigida"
        },
        {
          "valor": "seguimento",
          "label": "Seguimento"
        }
      ],
      "referencia": "Rotina"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Colposcópica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Exame colposcópico normal"
        },
        {
          "valor": "alterado",
          "label": "Achados colposcópicos alterados"
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
    "title": "Colposcopia",
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
      "id": "juncao_escamocolunar",
      "label": "Junção Escamocolunar (JEC)",
      "unidade": null,
      "referencia": "Visível",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Junção Escamocolunar (JEC) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "teste_acido_acetico",
      "label": "Teste com Ácido Acético",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Teste com Ácido Acético conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "teste_lugol",
      "label": "Teste de Lugol",
      "unidade": null,
      "referencia": "Positivo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Teste de Lugol conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "achado_suspeito",
      "label": "Achado Suspeito",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Achado Suspeito conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "conduta_sugerida",
      "label": "Conduta Sugerida",
      "unidade": null,
      "referencia": "Rotina",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Conduta Sugerida conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Colposcópica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Colposcópica conforme referência, contexto clínico e método utilizado."
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
