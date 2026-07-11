import type { IntelligentExamModel } from "../types";

export const imgTomografiaUnicaModel: IntelligentExamModel = {
  "id": "img_tomografia_unica",
  "nome": "Tomografia Computadorizada",
  "descricao": "Exame tomográfico único; região e contraste definem o modelo do laudo.",
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
          "valor": "tórax",
          "label": "Tórax"
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
          "valor": "abdome_e_pelve",
          "label": "Abdome e Pelve"
        },
        {
          "valor": "coluna",
          "label": "Coluna"
        },
        {
          "valor": "seios_da_face",
          "label": "Seios da face"
        },
        {
          "valor": "extremidades",
          "label": "Extremidades"
        },
        {
          "valor": "angiotomografia",
          "label": "Angiotomografia"
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
      "Tórax",
      "Abdome",
      "Pelve",
      "Abdome e Pelve",
      "Coluna",
      "Seios da face",
      "Extremidades",
      "Angiotomografia",
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
      "resultSummary": "Tomografia Computadorizada sem alterações significativas.",
      "interpretation": "Estruturas avaliadas sem alterações relevantes para o método, região/tipo selecionado e contexto clínico informado.",
      "conclusion": "Tomografia Computadorizada sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achados relevantes no método.",
      "resultSummary": "Tomografia Computadorizada com alteração a caracterizar.",
      "interpretation": "Achado deve ser descrito com localização, extensão, medidas, relação anatômica e limitações técnicas quando aplicável.",
      "conclusion": "Tomografia Computadorizada com alteração a correlacionar clinicamente."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado limítrofe ou inespecífico.",
      "resultSummary": "Tomografia Computadorizada com achado inespecífico.",
      "interpretation": "Achado não permite definição diagnóstica isolada e pode exigir comparação, seguimento ou método complementar.",
      "conclusion": "Achado inespecífico, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Tomografia Computadorizada personalizado.",
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
        "Crânio",
        "Tórax",
        "Abdome",
        "Pelve",
        "Abdome e Pelve",
        "Coluna",
        "Seios da face",
        "Extremidades",
        "Angiotomografia",
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
    "title": "Tomografia Computadorizada",
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
    "normal": "Tomografia Computadorizada sem alterações significativas.",
    "altered": "Tomografia Computadorizada com alteração a correlacionar clinicamente.",
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
