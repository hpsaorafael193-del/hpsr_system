import type { IntelligentExamModel } from "../types";

export const func_oximetriaModel: IntelligentExamModel = {
  "id": "func_oximetria",
  "nome": "Oximetria de Pulso",
  "descricao": "Avaliação da saturação periférica de oxigênio",
  "categoria": "funcional",
  "icone": "fa-heartbeat",
  "campos": [
    {
      "id": "spo2",
      "tipo": "number",
      "label": "Saturação de O₂",
      "unidade": "%",
      "referencia": "≥ 95"
    },
    {
      "id": "condicao",
      "tipo": "select",
      "label": "Condição de Medida",
      "opcoes": [
        {
          "valor": "repouso",
          "label": "Repouso"
        },
        {
          "valor": "esforco",
          "label": "Esforço"
        }
      ],
      "referencia": "Repouso"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Funcional",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Oxigenação adequada"
        },
        {
          "valor": "hipoxemia",
          "label": "Hipoxemia"
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
      "resultSummary": "Oximetria de Pulso com Saturação de O₂: 102,6; Condição de Medida: Repouso.",
      "interpretation": "Os parâmetros mensurados — Saturação de O₂: 102,6 %; Condição de Medida: Repouso — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Oximetria de Pulso com parâmetros compatíveis com o padrão esperado, incluindo Saturação de O₂: 102,6 %; Condição de Medida: Repouso.",
      "results": {
        "spo2": "102,6",
        "condicao": "Repouso",
        "impressao": "Oximetria de Pulso com parâmetros compatíveis com o padrão esperado, incluindo Saturação de O₂: 102,6 %; Condição de Medida: Repouso"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Oximetria de Pulso: Saturação de O₂: 90; Condição de Medida: Repouso em ar ambiente.",
      "interpretation": "Os resultados principais (Saturação de O₂: 90 %; Condição de Medida: Repouso em ar ambiente) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Oximetria de Pulso com padrão alterado, documentado por Saturação de O₂: 90 %; Condição de Medida: Repouso em ar ambiente.",
      "results": {
        "spo2": "90",
        "condicao": "Repouso em ar ambiente",
        "impressao": "Dessaturação em repouso"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Oximetria de Pulso: Saturação de O₂: 94; Condição de Medida: Repouso em ar ambiente.",
      "interpretation": "Os principais resultados (Saturação de O₂: 94 %; Condição de Medida: Repouso em ar ambiente) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Oximetria de Pulso com resultado limítrofe/inespecífico, destacando-se Saturação de O₂: 94 %; Condição de Medida: Repouso em ar ambiente.",
      "results": {
        "spo2": "94",
        "condicao": "Repouso em ar ambiente",
        "impressao": "Saturação periférica discretamente reduzida"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Oximetria de Pulso: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "spo2": "102,6",
        "condicao": "Repouso",
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
    "title": "Oximetria de Pulso",
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
  "technique": "Oximetria de pulso realizada em condição clínica informada, com registro da saturação periférica de oxigênio e da condição da medida.",
  "method": "Estimativa não invasiva da saturação arterial por fotopletismografia de pulso, após estabilização do sinal e verificação de qualidade da leitura.",
  "parameters": [
    {
      "id": "spo2",
      "label": "Saturação de O₂",
      "unidade": "%",
      "referencia": "≥ 95",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Saturação de O₂ conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "condicao",
      "label": "Condição de Medida",
      "unidade": null,
      "referencia": "Repouso",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Condição de Medida conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Funcional",
      "unidade": null,
      "referencia": "Normal / Alterado",
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
    "normal": "Resultados de Oximetria de Pulso compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Oximetria de Pulso com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Oximetria de Pulso com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Oximetria de Pulso sem alterações significativas nos parâmetros avaliados.",
    "altered": "Oximetria de Pulso alterado conforme resultados objetivos descritos.",
    "undefined": "Oximetria de Pulso com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
