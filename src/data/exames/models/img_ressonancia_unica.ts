import type { IntelligentExamModel } from "../types";

export const imgRessonanciaUnicaModel: IntelligentExamModel = {
  "id": "img_ressonancia_unica",
  "nome": "Ressonância Magnética",
  "descricao": "Exame de ressonância único; região e contraste definem o modelo do laudo.",
  "categoria": "imagem",
  "icone": "fa-x-ray",
  "campos": [
    {
      "id": "adaptador_principal",
      "tipo": "select",
      "label": "Região / tipo",
      "opcoes": [
        {
          "valor": "crânio",
          "label": "Crânio"
        },
        {
          "valor": "coluna",
          "label": "Coluna"
        },
        {
          "valor": "articulação",
          "label": "Articulação"
        },
        {
          "valor": "joelho",
          "label": "Joelho"
        },
        {
          "valor": "ombro",
          "label": "Ombro"
        },
        {
          "valor": "abdome",
          "label": "Abdome"
        },
        {
          "valor": "pelve",
          "label": "Pelve"
        },
        {
          "valor": "mamas",
          "label": "Mamas"
        },
        {
          "valor": "cardíaca",
          "label": "Cardíaca"
        },
        {
          "valor": "personalizado",
          "label": "Personalizado"
        }
      ],
      "referencia": "Selecionar conforme exame"
    },
    {
      "id": "contraste",
      "tipo": "select",
      "label": "Contraste",
      "opcoes": [
        {
          "valor": "sem_contraste",
          "label": "Sem contraste"
        },
        {
          "valor": "com_contraste",
          "label": "Com contraste"
        }
      ],
      "referencia": "Conforme solicitação"
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
    "label": "Região examinada",
    "kind": "region-contrast",
    "enabled": true,
    "options": [
      "Crânio",
      "Coluna",
      "Articulação",
      "Joelho",
      "Ombro",
      "Abdome",
      "Pelve",
      "Mamas",
      "Cardíaca",
      "Personalizado"
    ],
    "secondaryOptions": [
      "Sem contraste",
      "Com contraste"
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
      "resultSummary": "Ressonância Magnética sem alterações significativas.",
      "interpretation": "Estruturas avaliadas sem alterações relevantes para o método, região/tipo selecionado e contexto clínico informado.",
      "conclusion": "Ressonância Magnética sem alterações significativas.",
      "results": {
        "qualidade_tecnica": "Exame com qualidade diagnóstica adequada",
        "regiao_tipo": "Conforme região selecionada"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achados relevantes no método.",
      "resultSummary": "Ressonância Magnética com alteração a caracterizar.",
      "interpretation": "Os resultados principais (Região / tipo: Região selecionada com alteração focal identificada) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ressonância Magnética com alteração a correlacionar clinicamente.",
      "results": {
        "qualidade_tecnica": "Exame com qualidade diagnóstica adequada",
        "regiao_tipo": "Região selecionada com alteração focal identificada"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado limítrofe ou inespecífico.",
      "resultSummary": "Ressonância Magnética com achado inespecífico.",
      "interpretation": "Os principais resultados (Qualidade técnica: Exame com artefatos discretos, ainda diagnóstico; Região / tipo: Pequena alteração inespecífica na região selecionada) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ressonância Magnética com resultado limítrofe/inespecífico, destacando-se Qualidade técnica: Exame com artefatos discretos, ainda diagnóstico; Região / tipo: Pequena alteração inespecífica na região selecionada.",
      "results": {
        "qualidade_tecnica": "Exame com artefatos discretos, ainda diagnóstico",
        "regiao_tipo": "Pequena alteração inespecífica na região selecionada"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ressonância Magnética: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "qualidade_tecnica": "Exame com qualidade diagnóstica adequada",
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
        "Crânio",
        "Coluna",
        "Articulação",
        "Joelho",
        "Ombro",
        "Abdome",
        "Pelve",
        "Mamas",
        "Cardíaca",
        "Personalizado"
      ]
    },
    {
      "id": "contraste",
      "label": "Contraste",
      "tipo": "select",
      "required": true,
      "options": [
        "Sem contraste",
        "Com contraste"
      ]
    }
  ],
  "editorModel": {
    "title": "Ressonância Magnética",
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
  "technique": "Ressonância Magnética realizada com aquisição multiplanar de sequências de ressonância magnética adequadas à região selecionada, incluindo sequências adicionais quando clinicamente indicadas.",
  "method": "Aquisição por ressonância magnética com sequências ponderadas e planos anatômicos apropriados ao protocolo, com contraste paramagnético somente quando indicado.",
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
    "normal": "Resultados de Ressonância Magnética compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ressonância Magnética com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ressonância Magnética com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ressonância Magnética sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ressonância Magnética alterado conforme resultados objetivos descritos.",
    "undefined": "Ressonância Magnética com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
