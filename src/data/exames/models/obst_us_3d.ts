import type { IntelligentExamModel } from "../types";

export const obst_us_3dModel: IntelligentExamModel = {
  "id": "obst_us_3d",
  "nome": "Ultrassonografia Obstétrica 3D",
  "descricao": "Avaliação tridimensional da anatomia fetal com reconstrução volumétrica",
  "categoria": "obstetricia",
  "icone": "fa-cube",
  "campos": [
    {
      "id": "idade_gestacional",
      "tipo": "number",
      "label": "Idade Gestacional",
      "unidade": "semanas",
      "referencia": "—"
    },
    {
      "id": "face_fetal",
      "tipo": "select",
      "label": "Face Fetal",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Aspecto normal"
        },
        {
          "valor": "suspeita",
          "label": "Suspeita de malformação"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "membros",
      "tipo": "select",
      "label": "Membros",
      "opcoes": [
        {
          "valor": "preservados",
          "label": "Preservados"
        },
        {
          "valor": "alterados",
          "label": "Alterações morfológicas"
        }
      ],
      "referencia": "Preservados"
    },
    {
      "id": "coluna",
      "tipo": "select",
      "label": "Coluna Vertebral",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "defeito",
          "label": "Defeito de fechamento"
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
          "valor": "normal",
          "label": "Anatomia fetal sem alterações significativas"
        },
        {
          "valor": "suspeita_malformacao",
          "label": "Suspeita de malformação fetal"
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
      "conclusion": "Gestação evolutiva conforme parâmetros ultrassonográficos avaliados."
    },
    {
      "id": "gemelar",
      "name": "Gemelar",
      "status": "contextual",
      "description": "Modelo para gestação gemelar.",
      "resultSummary": "Ultrassonografia obstétrica de gestação gemelar.",
      "interpretation": "Avaliar número de fetos, corionicidade/amnionicidade quando possível e biometria individual.",
      "conclusion": "Gestação gemelar conforme achados descritos."
    },
    {
      "id": "primeiro_trimestre",
      "name": "Primeiro trimestre",
      "status": "contextual",
      "description": "Modelo para avaliação inicial.",
      "resultSummary": "Ultrassonografia obstétrica de primeiro trimestre.",
      "interpretation": "Avaliar saco gestacional, embrião/feto, BCF e datação conforme CCN quando aplicável.",
      "conclusion": "Exame compatível com avaliação de primeiro trimestre."
    },
    {
      "id": "rciu",
      "name": "RCIU",
      "status": "alterado",
      "description": "Suspeita de restrição de crescimento intrauterino.",
      "resultSummary": "Ultrassonografia com parâmetros de crescimento abaixo do esperado.",
      "interpretation": "Biometria fetal e Doppler, quando aplicável, devem ser correlacionados à idade gestacional.",
      "conclusion": "Achados podem sugerir restrição de crescimento, recomendando seguimento obstétrico."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia obstétrica personalizada.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
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
    "title": "Ultrassonografia Obstétrica 3D",
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
  "technique": "Exame realizado conforme protocolo técnico do método, com documentação das estruturas avaliadas e limitações quando presentes.",
  "method": "Aquisição de imagens conforme protocolo da região/tipo selecionado, com análise descritiva dos achados.",
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
      "id": "face_fetal",
      "label": "Face Fetal",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Face Fetal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "membros",
      "label": "Membros",
      "unidade": null,
      "referencia": "Preservados",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Membros conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "coluna",
      "label": "Coluna Vertebral",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Coluna Vertebral conforme referência, contexto clínico e método utilizado."
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
    "normal": "Sem achados relevantes no método e região avaliados.",
    "altered": "Achado de imagem relevante, devendo ser caracterizado e correlacionado clinicamente.",
    "undefined": "Achado inespecífico, podendo exigir comparação, seguimento ou complementação."
  },
  "conclusion": {
    "normal": "Gestação evolutiva conforme parâmetros ultrassonográficos avaliados.",
    "altered": "Achados podem sugerir restrição de crescimento, recomendando seguimento obstétrico.",
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
