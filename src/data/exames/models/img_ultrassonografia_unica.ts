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
      "conclusion": "Ultrassonografia sem alterações significativas.",
      "results": {
        "qualidade_tecnica": "Janela acústica adequada para avaliação",
        "regiao_tipo": "Conforme região selecionada"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achados relevantes no método.",
      "resultSummary": "Ultrassonografia com alteração a caracterizar.",
      "interpretation": "Os resultados principais (Região / tipo: Região selecionada com alteração focal demonstrável) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ultrassonografia com alteração a correlacionar clinicamente.",
      "results": {
        "qualidade_tecnica": "Janela acústica adequada para avaliação",
        "regiao_tipo": "Região selecionada com alteração focal demonstrável"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado limítrofe ou inespecífico.",
      "resultSummary": "Ultrassonografia com achado inespecífico.",
      "interpretation": "Os principais resultados (Qualidade técnica: Janela acústica parcialmente limitada, porém diagnóstica; Região / tipo: Alteração discreta e inespecífica na região selecionada) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ultrassonografia com resultado limítrofe/inespecífico, destacando-se Qualidade técnica: Janela acústica parcialmente limitada, porém diagnóstica; Região / tipo: Alteração discreta e inespecífica na região selecionada.",
      "results": {
        "qualidade_tecnica": "Janela acústica parcialmente limitada, porém diagnóstica",
        "regiao_tipo": "Alteração discreta e inespecífica na região selecionada"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "qualidade_tecnica": "Janela acústica adequada para avaliação",
        "regiao_tipo": "Conforme região selecionada"
      }
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
  "technique": "Ultrassonografia realizada por ultrassonografia com avaliação sistematizada das estruturas previstas para a região selecionada e medidas pertinentes.",
  "method": "Aquisição ultrassonográfica em modo bidimensional, complementada por Doppler colorido/espectral quando indicado pelo tipo de exame e contexto clínico.",
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
    "normal": "Resultados de Ultrassonografia compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ultrassonografia com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ultrassonografia com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ultrassonografia sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ultrassonografia alterado conforme resultados objetivos descritos.",
    "undefined": "Ultrassonografia com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
