import type { IntelligentExamModel } from "../types";

export const func_potenciais_evocadosModel: IntelligentExamModel = {
  "id": "func_potenciais_evocados",
  "nome": "Potenciais Evocados",
  "descricao": "Avaliação da condução sensorial central",
  "categoria": "funcional",
  "icone": "fa-brain",
  "campos": [
    {
      "id": "tipo",
      "tipo": "select",
      "label": "Tipo de Potencial Evocado",
      "opcoes": [
        {
          "valor": "visual",
          "label": "Visual"
        },
        {
          "valor": "auditivo",
          "label": "Auditivo"
        },
        {
          "valor": "somatossensorial",
          "label": "Somatossensorial"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "latencia",
      "tipo": "select",
      "label": "Latência",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "aumentada",
          "label": "Aumentada"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "amplitude",
      "tipo": "select",
      "label": "Amplitude",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "reduzida",
          "label": "Reduzida"
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
          "label": "Condução preservada"
        },
        {
          "valor": "desmielinizante",
          "label": "Alteração desmielinizante"
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
      "resultSummary": "Potenciais Evocados com Tipo de Potencial Evocado: Potencial evocado visual; Latência: Normal; Amplitude: Normal.",
      "interpretation": "Os parâmetros mensurados — Tipo de Potencial Evocado: Potencial evocado visual; Latência: Normal; Amplitude: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Potenciais Evocados com parâmetros compatíveis com o padrão esperado, incluindo Tipo de Potencial Evocado: Potencial evocado visual; Latência: Normal.",
      "results": {
        "tipo": "Potencial evocado visual",
        "latencia": "Normal",
        "amplitude": "Normal",
        "impressao": "Latências e amplitudes preservadas bilateralmente"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Potenciais Evocados: Latência: Latência P100 prolongada bilateralmente; Amplitude: Amplitude discretamente reduzida.",
      "interpretation": "Os resultados principais (Latência: Latência P100 prolongada bilateralmente; Amplitude: Amplitude discretamente reduzida) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Potenciais Evocados com padrão alterado, documentado por Latência: Latência P100 prolongada bilateralmente; Amplitude: Amplitude discretamente reduzida.",
      "results": {
        "tipo": "Potencial evocado visual",
        "latencia": "Latência P100 prolongada bilateralmente",
        "amplitude": "Amplitude discretamente reduzida",
        "impressao": "Atraso de condução nas vias visuais, bilateral"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Potenciais Evocados: Latência: Latência discretamente prolongada em um lado; Amplitude: Amplitude preservada.",
      "interpretation": "Os principais resultados (Latência: Latência discretamente prolongada em um lado; Amplitude: Amplitude preservada) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Potenciais Evocados com resultado limítrofe/inespecífico, destacando-se Latência: Latência discretamente prolongada em um lado; Amplitude: Amplitude preservada.",
      "results": {
        "tipo": "Potencial evocado visual",
        "latencia": "Latência discretamente prolongada em um lado",
        "amplitude": "Amplitude preservada",
        "impressao": "Assimetria discreta de latência, sem alteração bilateral definida"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Potenciais Evocados: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "tipo": "Potencial evocado visual",
        "latencia": "Normal",
        "amplitude": "Normal",
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
    "title": "Potenciais Evocados",
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
  "technique": "Potenciais evocados registrados após estímulo padronizado da via avaliada, com análise de latências, amplitudes e simetria das respostas.",
  "method": "Registro neurofisiológico por eletrodos de superfície, promediação dos sinais e análise dos componentes eletrofisiológicos conforme o tipo de potencial evocado selecionado.",
  "parameters": [
    {
      "id": "tipo",
      "label": "Tipo de Potencial Evocado",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Potencial Evocado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "latencia",
      "label": "Latência",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Latência conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "amplitude",
      "label": "Amplitude",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Amplitude conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Potenciais Evocados compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Potenciais Evocados com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Potenciais Evocados com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Potenciais Evocados sem alterações significativas nos parâmetros avaliados.",
    "altered": "Potenciais Evocados alterado conforme resultados objetivos descritos.",
    "undefined": "Potenciais Evocados com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
