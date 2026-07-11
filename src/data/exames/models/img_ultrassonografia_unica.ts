import type { IntelligentExamModel } from "../types";

export const imgUltrassonografiaUnicaModel: IntelligentExamModel = {
  "id": "img_ultrassonografia_unica",
  "nome": "Ultrassonografia",
  "descricao": "Exame ultrassonográfico único; o tipo selecionado pelo adaptador define o modelo do laudo.",
  "categoria": "imagem",
  "icone": "fa-x-ray",
  "campos": [
    {
      "id": "adaptador_principal",
      "tipo": "select",
      "label": "Região / tipo",
      "opcoes": [
        {
          "valor": "abdome_total",
          "label": "Abdome Total"
        },
        {
          "valor": "abdome_superior",
          "label": "Abdome Superior"
        },
        {
          "valor": "abdome_inferior",
          "label": "Abdome Inferior"
        },
        {
          "valor": "obstétrica",
          "label": "Obstétrica"
        },
        {
          "valor": "obstétrica_3d",
          "label": "Obstétrica 3D"
        },
        {
          "valor": "transvaginal",
          "label": "Transvaginal"
        },
        {
          "valor": "tireoide",
          "label": "Tireoide"
        },
        {
          "valor": "mamas",
          "label": "Mamas"
        },
        {
          "valor": "próstata",
          "label": "Próstata"
        },
        {
          "valor": "bolsa_escrotal",
          "label": "Bolsa Escrotal"
        },
        {
          "valor": "rins",
          "label": "Rins"
        },
        {
          "valor": "vias_urinárias",
          "label": "Vias Urinárias"
        },
        {
          "valor": "doppler",
          "label": "Doppler"
        },
        {
          "valor": "personalizado",
          "label": "Personalizado"
        }
      ],
      "referencia": "Selecionar conforme exame"
    },
    {
      "id": "tecnica",
      "tipo": "textarea",
      "label": "Técnica",
      "placeholder": "Descrever técnica utilizada"
    },
    {
      "id": "achados",
      "tipo": "textarea",
      "label": "Achados",
      "placeholder": "Descrever achados por região/tipo selecionado"
    },
    {
      "id": "medidas",
      "tipo": "textarea",
      "label": "Medidas",
      "placeholder": "Inserir medidas quando aplicável"
    },
    {
      "id": "conclusao",
      "tipo": "textarea",
      "label": "Conclusão",
      "placeholder": "Conclusão objetiva"
    }
  ],
  "adapter": {
    "id": "adaptador_principal",
    "label": "Tipo do exame",
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
    "description": "Exame único; o adaptador define o modelo específico carregado no laudo."
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
      "resultSummary": "Ultrassonografia sem alterações significativas.",
      "interpretation": "Estruturas avaliadas sem alterações relevantes para o método, região/tipo selecionado e contexto clínico informado.",
      "conclusion": "Ultrassonografia sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achados relevantes no método.",
      "resultSummary": "Ultrassonografia com alteração a caracterizar.",
      "interpretation": "Achado deve ser descrito com localização, extensão, medidas, relação anatômica e limitações técnicas quando aplicável.",
      "conclusion": "Ultrassonografia com alteração a correlacionar clinicamente."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado limítrofe ou inespecífico.",
      "resultSummary": "Ultrassonografia com achado inespecífico.",
      "interpretation": "Achado não permite definição diagnóstica isolada e pode exigir comparação, seguimento ou método complementar.",
      "conclusion": "Achado inespecífico, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia personalizado.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
    }
  ],
  "variables": [
    {
      "id": "adaptador_principal",
      "label": "Região / tipo",
      "tipo": "select",
      "required": true,
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
      ]
    }
  ],
  "editorModel": {
    "title": "Ultrassonografia",
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
  "method": "Aquisição de imagens conforme região/tipo selecionado pelo adaptador, com análise descritiva dos achados.",
  "parameters": [
    {
      "id": "qualidade_tecnica",
      "label": "Qualidade técnica",
      "referencia": "Adequada salvo limitação descrita",
      "resultPlaceholder": "Adequada",
      "interpretationHint": "Informar limitações técnicas quando presentes."
    },
    {
      "id": "regiao_tipo",
      "label": "Região / tipo",
      "referencia": "Conforme adaptador",
      "resultPlaceholder": "Selecionar",
      "interpretationHint": "Carrega modelo específico."
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
    "normal": "Sem achados relevantes no método selecionado.",
    "altered": "Achado relevante a caracterizar e correlacionar clinicamente.",
    "undefined": "Achado inespecífico ou limítrofe, sem definição diagnóstica isolada."
  },
  "conclusion": {
    "normal": "Ultrassonografia sem alterações significativas.",
    "altered": "Ultrassonografia com alteração a correlacionar clinicamente.",
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
