import type { IntelligentExamModel } from "../types";

export const img_raio_x_unicoModel: IntelligentExamModel = {
  "id": "img_raio_x_unico",
  "nome": "Raio-X",
  "descricao": "Radiografia simples única com seleção do local/região examinada.",
  "categoria": "imagem",
  "icone": "fa-x-ray",
  "campos": [
    {
      "id": "local_examinado",
      "tipo": "select",
      "label": "Local examinado",
      "opcoes": [
        {
          "valor": "tórax",
          "label": "Tórax"
        },
        {
          "valor": "coluna",
          "label": "Coluna"
        },
        {
          "valor": "crânio",
          "label": "Crânio"
        },
        {
          "valor": "ombro",
          "label": "Ombro"
        },
        {
          "valor": "braço_antebraço",
          "label": "Braço / antebraço / cotovelo"
        },
        {
          "valor": "joelho",
          "label": "Joelho"
        },
        {
          "valor": "perna_coxa_canela",
          "label": "Perna / coxa / canela"
        },
        {
          "valor": "pé",
          "label": "Pé"
        }
      ],
      "referencia": "Selecionar conforme solicitação médica"
    },
    {
      "id": "lateralidade",
      "tipo": "select",
      "label": "Lateralidade",
      "opcoes": [
        {
          "valor": "nao_aplicavel",
          "label": "Não aplicável"
        },
        {
          "valor": "direita",
          "label": "Direita"
        },
        {
          "valor": "esquerda",
          "label": "Esquerda"
        },
        {
          "valor": "bilateral",
          "label": "Bilateral"
        }
      ],
      "referencia": "Conforme local examinado"
    },
    {
      "id": "incidencia",
      "tipo": "select",
      "label": "Incidência",
      "opcoes": [
        {
          "valor": "ap",
          "label": "AP"
        },
        {
          "valor": "pa",
          "label": "PA"
        },
        {
          "valor": "perfil",
          "label": "Perfil"
        },
        {
          "valor": "ap_perfil",
          "label": "AP + Perfil"
        },
        {
          "valor": "pa_perfil",
          "label": "PA + Perfil"
        },
        {
          "valor": "obliquas",
          "label": "Oblíquas"
        }
      ],
      "referencia": "Conforme protocolo"
    },
    {
      "id": "qualidade_tecnica",
      "tipo": "select",
      "label": "Qualidade técnica",
      "opcoes": [
        {
          "valor": "adequada",
          "label": "Adequada"
        },
        {
          "valor": "limitada",
          "label": "Limitada"
        },
        {
          "valor": "inadequada",
          "label": "Inadequada"
        }
      ],
      "referencia": "Adequada"
    },
    {
      "id": "alinhamento",
      "tipo": "select",
      "label": "Alinhamento / Eixo",
      "opcoes": [
        {
          "valor": "preservado",
          "label": "Preservado"
        },
        {
          "valor": "desvio",
          "label": "Desvio identificado"
        },
        {
          "valor": "subluxacao",
          "label": "Subluxação"
        },
        {
          "valor": "luxacao",
          "label": "Luxação"
        }
      ],
      "referencia": "Preservado"
    },
    {
      "id": "estrutura_ossea",
      "tipo": "select",
      "label": "Estrutura óssea",
      "opcoes": [
        {
          "valor": "integra",
          "label": "Íntegra"
        },
        {
          "valor": "fratura",
          "label": "Fratura"
        },
        {
          "valor": "lesao_litica",
          "label": "Lesão lítica"
        },
        {
          "valor": "alteracao_degenerativa",
          "label": "Alteração degenerativa"
        }
      ],
      "referencia": "Íntegra"
    },
    {
      "id": "espaco_articular",
      "tipo": "select",
      "label": "Espaços articulares / discais",
      "opcoes": [
        {
          "valor": "preservados",
          "label": "Preservados"
        },
        {
          "valor": "reduzidos",
          "label": "Reduzidos"
        },
        {
          "valor": "irregulares",
          "label": "Irregulares"
        },
        {
          "valor": "nao_aplicavel",
          "label": "Não aplicável"
        }
      ],
      "referencia": "Preservados"
    },
    {
      "id": "partes_moles",
      "tipo": "select",
      "label": "Partes moles",
      "opcoes": [
        {
          "valor": "sem_alteracoes",
          "label": "Sem alterações"
        },
        {
          "valor": "aumento_volume",
          "label": "Aumento de volume"
        },
        {
          "valor": "edema",
          "label": "Edema"
        },
        {
          "valor": "corpo_estranho",
          "label": "Corpo estranho radiopaco"
        }
      ],
      "referencia": "Sem alterações"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Radiológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem alterações radiográficas significativas"
        },
        {
          "valor": "fratura",
          "label": "Achados compatíveis com fratura"
        },
        {
          "valor": "luxacao",
          "label": "Achados compatíveis com luxação/subluxação"
        },
        {
          "valor": "degenerativa",
          "label": "Alterações degenerativas"
        }
      ],
      "referencia": "Normal / Alterado"
    },
    {
      "id": "achados",
      "tipo": "textarea",
      "label": "Achados"
    },
    {
      "id": "parametros_avaliados",
      "tipo": "textarea",
      "label": "Parâmetros avaliados"
    },
    {
      "id": "medidas_valores",
      "tipo": "textarea",
      "label": "Medidas / Valores / Unidades"
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
    "id": "regiao",
    "label": "Região examinada",
    "kind": "region",
    "enabled": true,
    "options": [
      "Tórax",
      "Coluna",
      "Crânio",
      "Ombro",
      "Braço / antebraço / cotovelo",
      "Joelho",
      "Perna / coxa / canela",
      "Pé"
    ],
    "description": "O exame permanece único; a região examinada define técnica, achados e interpretação inicial."
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
      "description": "Sem alterações radiográficas agudas.",
      "resultSummary": "Exame radiográfico sem alterações agudas evidentes.",
      "interpretation": "Ausência de sinais radiográficos de fratura, luxação ou alteração óssea aguda no segmento examinado.",
      "conclusion": "Radiografia sem alterações agudas significativas."
    },
    {
      "id": "trauma",
      "name": "Trauma",
      "status": "alterado",
      "description": "Modelo para avaliação pós-trauma.",
      "resultSummary": "Exame radiográfico orientado por contexto traumático.",
      "interpretation": "Avaliar alinhamento, corticais ósseas, partes moles e congruência articular.",
      "conclusion": "Achados a correlacionar com mecanismo do trauma e exame físico."
    },
    {
      "id": "fratura",
      "name": "Fratura",
      "status": "alterado",
      "description": "Achado compatível com solução de continuidade óssea.",
      "resultSummary": "Exame radiográfico com achado compatível com fratura.",
      "interpretation": "Presença de solução de continuidade óssea, com ou sem desvio, conforme segmento examinado.",
      "conclusion": "Achados compatíveis com fratura no segmento avaliado."
    },
    {
      "id": "luxacao",
      "name": "Luxação",
      "status": "alterado",
      "description": "Alteração da congruência articular.",
      "resultSummary": "Exame radiográfico com desalinhamento articular.",
      "interpretation": "Perda ou alteração da congruência articular, com avaliação de fratura associada.",
      "conclusion": "Achados sugestivos de luxação/subluxação a correlacionar clinicamente."
    },
    {
      "id": "degenerativo",
      "name": "Degenerativo",
      "status": "alterado",
      "description": "Alterações crônicas/degenerativas.",
      "resultSummary": "Exame radiográfico com alterações degenerativas.",
      "interpretation": "Redução de espaços articulares, osteófitos ou esclerose devem ser descritos conforme intensidade.",
      "conclusion": "Alterações degenerativas no segmento avaliado."
    },
    {
      "id": "pos_operatorio",
      "name": "Pós-operatório",
      "status": "contextual",
      "description": "Controle de material cirúrgico/alinhamento.",
      "resultSummary": "Controle radiográfico pós-operatório.",
      "interpretation": "Avaliar posição de material, alinhamento e sinais de complicação.",
      "conclusion": "Controle pós-operatório conforme achados descritos."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Radiografia personalizada.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
    }
  ],
  "variables": [
    {
      "id": "regiao",
      "label": "Região examinada",
      "tipo": "select",
      "options": [
        "Tórax",
        "Joelho",
        "Pé",
        "Ombro",
        "Coluna",
        "Crânio",
        "Abdome",
        "Outro"
      ]
    },
    {
      "id": "incidencias",
      "label": "Incidências",
      "tipo": "text"
    }
  ],
  "editorModel": {
    "title": "Raio-X",
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
      "id": "local_examinado",
      "label": "Local examinado",
      "unidade": null,
      "referencia": "Selecionar conforme solicitação médica",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Local examinado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "lateralidade",
      "label": "Lateralidade",
      "unidade": null,
      "referencia": "Conforme local examinado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Lateralidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "incidencia",
      "label": "Incidência",
      "unidade": null,
      "referencia": "Conforme protocolo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Incidência conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "qualidade_tecnica",
      "label": "Qualidade técnica",
      "unidade": null,
      "referencia": "Adequada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Qualidade técnica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "alinhamento",
      "label": "Alinhamento / Eixo",
      "unidade": null,
      "referencia": "Preservado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Alinhamento / Eixo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "estrutura_ossea",
      "label": "Estrutura óssea",
      "unidade": null,
      "referencia": "Íntegra",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estrutura óssea conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "espaco_articular",
      "label": "Espaços articulares / discais",
      "unidade": null,
      "referencia": "Preservados",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Espaços articulares / discais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "partes_moles",
      "label": "Partes moles",
      "unidade": null,
      "referencia": "Sem alterações",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Partes moles conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Radiológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Radiológica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Radiografia sem alterações agudas significativas.",
    "altered": "Achados a correlacionar com mecanismo do trauma e exame físico.",
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
