import type { IntelligentExamModel } from "../types";

export const obst_us_4dModel: IntelligentExamModel = {
  "id": "obst_us_4d",
  "nome": "Ultrassonografia Obstétrica 4D",
  "descricao": "Avaliação dinâmica em tempo real do feto com reconstrução tridimensional",
  "categoria": "obstetricia",
  "icone": "fa-video",
  "campos": [
    {
      "id": "idade_gestacional",
      "tipo": "number",
      "label": "Idade Gestacional",
      "unidade": "semanas",
      "referencia": "—"
    },
    {
      "id": "movimentos_fetais",
      "tipo": "select",
      "label": "Movimentos Fetais",
      "opcoes": [
        {
          "valor": "adequados",
          "label": "Adequados"
        },
        {
          "valor": "reduzidos",
          "label": "Reduzidos"
        }
      ],
      "referencia": "Adequados"
    },
    {
      "id": "expressao_facial",
      "tipo": "select",
      "label": "Expressões Faciais",
      "opcoes": [
        {
          "valor": "presentes",
          "label": "Presentes"
        },
        {
          "valor": "pouco_observadas",
          "label": "Pouco observadas"
        }
      ],
      "referencia": "Presentes"
    },
    {
      "id": "atividade_global",
      "tipo": "select",
      "label": "Atividade Global Fetal",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "hipoativa",
          "label": "Hipoativa"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Obstétrica",
      "opcoes": [
        {
          "valor": "bem_estar",
          "label": "Bem-estar fetal preservado"
        },
        {
          "valor": "alteracao_comportamental",
          "label": "Alterações comportamentais fetais"
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
    "id": "tipo_ultrassom",
    "label": "Tipo de ultrassonografia",
    "kind": "type",
    "enabled": true,
    "options": [
      "Abdome Total",
      "Abdome Superior",
      "Abdome Inferior",
      "Obstétrica",
      "Obstétrica 3D",
      "Transvaginal",
      "Tireoide",
      "Mamas",
      "Próstata",
      "Bolsa Escrotal",
      "Rins",
      "Vias Urinárias",
      "Doppler",
      "Personalizado"
    ],
    "description": "O exame permanece único; o tipo selecionado define o modelo específico do laudo."
  },
  "clinicalContexts": [
    "Rotina",
    "Primeiro trimestre",
    "Segundo trimestre",
    "Terceiro trimestre",
    "Gemelar",
    "Gestação de risco",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "gestacao_normal",
      "name": "Gestação normal",
      "status": "normal",
      "description": "Parâmetros compatíveis com evolução gestacional.",
      "resultSummary": "Ultrassonografia obstétrica compatível com gestação evolutiva.",
      "interpretation": "Achados biométricos e vitalidade fetal compatíveis com idade gestacional informada.",
      "conclusion": "Gestação evolutiva conforme parâmetros ultrassonográficos avaliados.",
      "results": {
        "idade_gestacional": "28",
        "movimentos_fetais": "Movimentos corporais e de membros presentes",
        "expressao_facial": "Movimentos faciais observados",
        "atividade_global": "Atividade fetal preservada no período examinado",
        "impressao": "Atividade fetal observada em tempo real dentro do esperado"
      }
    },
    {
      "id": "gemelar",
      "name": "Gemelar",
      "status": "contextual",
      "description": "Modelo para gestação gemelar.",
      "resultSummary": "Ultrassonografia obstétrica de gestação gemelar.",
      "interpretation": "Avaliar número de fetos, corionicidade/amnionicidade quando possível e biometria individual.",
      "conclusion": "Gestação gemelar conforme achados descritos.",
      "results": {
        "idade_gestacional": "28",
        "movimentos_fetais": "Movimentos presentes em ambos os fetos",
        "expressao_facial": "Movimentos faciais observados conforme posição",
        "atividade_global": "Atividade global preservada nos dois fetos",
        "impressao": "Gestação gemelar com atividade fetal presente em ambos os fetos"
      }
    },
    {
      "id": "primeiro_trimestre",
      "name": "Primeiro trimestre",
      "status": "contextual",
      "description": "Modelo para avaliação inicial.",
      "resultSummary": "Ultrassonografia obstétrica de primeiro trimestre.",
      "interpretation": "Avaliar saco gestacional, embrião/feto, BCF e datação conforme CCN quando aplicável.",
      "conclusion": "Exame compatível com avaliação de primeiro trimestre.",
      "results": {
        "idade_gestacional": "12",
        "movimentos_fetais": "Movimentos embriofetais presentes",
        "expressao_facial": "Avaliação limitada pela idade gestacional",
        "atividade_global": "Atividade presente",
        "impressao": "Avaliação dinâmica compatível com primeiro trimestre"
      }
    },
    {
      "id": "rciu",
      "name": "RCIU",
      "status": "alterado",
      "description": "Suspeita de restrição de crescimento intrauterino.",
      "resultSummary": "Ultrassonografia com parâmetros de crescimento abaixo do esperado.",
      "interpretation": "Biometria fetal e Doppler, quando aplicável, devem ser correlacionados à idade gestacional.",
      "conclusion": "Achados podem sugerir restrição de crescimento, recomendando seguimento obstétrico.",
      "results": {
        "idade_gestacional": "31",
        "movimentos_fetais": "Movimentos presentes, com atividade global reduzida no período observado",
        "expressao_facial": "Presentes",
        "atividade_global": "Discretamente reduzida",
        "impressao": "Atividade fetal discretamente reduzida em contexto de restrição de crescimento"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia Obstétrica 4D: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "idade_gestacional": "28",
        "movimentos_fetais": "Movimentos corporais e de membros presentes",
        "expressao_facial": "Movimentos faciais observados",
        "atividade_global": "Atividade fetal preservada no período examinado",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [
    {
      "id": "idade_gestacional",
      "label": "Idade gestacional",
      "tipo": "text"
    },
    {
      "id": "numero_fetos",
      "label": "Número de fetos",
      "tipo": "number"
    },
    {
      "id": "fiv",
      "label": "Gestação por FIV",
      "tipo": "select",
      "options": [
        "Sim",
        "Não",
        "Não informado"
      ]
    },
    {
      "id": "risco",
      "label": "Gestação de risco",
      "tipo": "select",
      "options": [
        "Sim",
        "Não",
        "Não informado"
      ]
    }
  ],
  "editorModel": {
    "title": "Ultrassonografia Obstétrica 4D",
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
    "defaultProfileId": "gestacao_normal"
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
  "technique": "Ultrassonografia obstétrica 4D realizada com aquisição volumétrica em tempo real para documentação de estruturas e movimentos fetais demonstráveis.",
  "method": "Aquisição ultrassonográfica volumétrica dinâmica, complementar à avaliação bidimensional e aos parâmetros obstétricos convencionais.",
  "parameters": [
    {
      "id": "idade_gestacional",
      "label": "Idade Gestacional",
      "unidade": "semanas",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Idade Gestacional conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "movimentos_fetais",
      "label": "Movimentos Fetais",
      "unidade": null,
      "referencia": "Adequados",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Movimentos Fetais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "expressao_facial",
      "label": "Expressões Faciais",
      "unidade": null,
      "referencia": "Presentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Expressões Faciais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "atividade_global",
      "label": "Atividade Global Fetal",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Atividade Global Fetal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Obstétrica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Obstétrica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Ultrassonografia Obstétrica 4D compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ultrassonografia Obstétrica 4D com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ultrassonografia Obstétrica 4D com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ultrassonografia Obstétrica 4D sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ultrassonografia Obstétrica 4D alterado conforme resultados objetivos descritos.",
    "undefined": "Ultrassonografia Obstétrica 4D com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
