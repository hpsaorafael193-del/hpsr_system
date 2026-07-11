import type { IntelligentExamModel } from "../types";

export const func_tilt_testModel: IntelligentExamModel = {
  "id": "func_tilt_test",
  "nome": "Teste de Inclinação (Tilt Test)",
  "descricao": "Avaliação de síncope e disautonomia",
  "categoria": "funcional",
  "icone": "fa-sync",
  "campos": [
    {
      "id": "resposta_pressorica",
      "tipo": "select",
      "label": "Resposta Pressórica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "queda_pa",
          "label": "Queda de pressão"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "frequencia_cardiaca",
      "tipo": "select",
      "label": "Resposta da Frequência Cardíaca",
      "opcoes": [
        {
          "valor": "adequada",
          "label": "Adequada"
        },
        {
          "valor": "inadequada",
          "label": "Inadequada"
        }
      ],
      "referencia": "Adequada"
    },
    {
      "id": "sintomas",
      "tipo": "select",
      "label": "Sintomas Durante o Teste",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "sincope",
          "label": "Síncope"
        },
        {
          "valor": "pre_sincope",
          "label": "Pré-síncope"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Funcional",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Teste negativo"
        },
        {
          "valor": "vasovagal",
          "label": "Resposta vasovagal"
        },
        {
          "valor": "disautonomia",
          "label": "Disautonomia"
        }
      ],
      "referencia": "Negativo"
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
    "Trauma",
    "Dor",
    "Controle pós-operatório",
    "Oncológico",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Sem alterações significativas no método.",
      "resultSummary": "Exame de imagem sem alterações relevantes.",
      "interpretation": "Estruturas avaliadas sem alterações significativas para o método e região examinada.",
      "conclusion": "Estudo sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Exame de imagem com alteração.",
      "interpretation": "Achado deve ser descrito com localização, extensão, medidas e relação anatômica quando aplicável.",
      "conclusion": "Estudo com alteração a correlacionar clinicamente."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Exame de imagem com achado inespecífico.",
      "interpretation": "Achado não permite definição diagnóstica isolada e pode demandar comparação, seguimento ou outro método.",
      "conclusion": "Achado inespecífico, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame de imagem personalizado.",
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
    "title": "Teste de Inclinação (Tilt Test)",
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
        "title": "2. Achados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "medidas",
        "title": "3. Medidas",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": false,
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
      "medidas",
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
      "medidas",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "imagem",
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
        "title": "2. Achados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "medidas",
        "title": "3. Medidas",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": false,
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
  "technique": "Exame realizado conforme protocolo técnico do método, com documentação das estruturas avaliadas e limitações quando presentes.",
  "method": "Aquisição de imagens conforme protocolo da região/tipo selecionado, com análise descritiva dos achados.",
  "parameters": [
    {
      "id": "resposta_pressorica",
      "label": "Resposta Pressórica",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta Pressórica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "frequencia_cardiaca",
      "label": "Resposta da Frequência Cardíaca",
      "unidade": null,
      "referencia": "Adequada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta da Frequência Cardíaca conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sintomas",
      "label": "Sintomas Durante o Teste",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sintomas Durante o Teste conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Funcional",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Funcional conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [
    {
      "id": "medidas",
      "title": "Medidas",
      "headers": [
        "Estrutura / Medida",
        "Resultado",
        "Referência / Observação"
      ],
      "rowsFromParameters": false
    }
  ],
  "interpretation": {
    "normal": "Sem achados relevantes no método e região avaliados.",
    "altered": "Achado de imagem relevante, devendo ser caracterizado e correlacionado clinicamente.",
    "undefined": "Achado inespecífico, podendo exigir comparação, seguimento ou complementação."
  },
  "conclusion": {
    "normal": "Estudo sem alterações significativas.",
    "altered": "Estudo com alteração a correlacionar clinicamente.",
    "undefined": "Achado inespecífico, recomendando correlação clínica."
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
