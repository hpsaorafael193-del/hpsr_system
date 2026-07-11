import type { IntelligentExamModel } from "../types";

export const obst_us_abdominal_gestacao_inicialModel: IntelligentExamModel = {
  "id": "obst_us_abdominal_gestacao_inicial",
  "nome": "Ultrassonografia Abdominal – Obstetrica",
  "descricao": "Avaliação ultrassonográfica abdominal.",
  "categoria": "obstetricia",
  "icone": "fa-baby",
  "campos": [
    {
      "id": "saco_gestacional",
      "tipo": "select",
      "label": "Saco gestacional",
      "opcoes": [
        {
          "valor": "presente",
          "label": "Presente"
        },
        {
          "valor": "ausente",
          "label": "Ausente"
        }
      ],
      "referencia": "Visualização intrauterina esperada"
    },
    {
      "id": "localizacao",
      "tipo": "select",
      "label": "Localização da gestação",
      "opcoes": [
        {
          "valor": "intrauterina",
          "label": "Intrauterina"
        },
        {
          "valor": "indefinida",
          "label": "Indefinida"
        },
        {
          "valor": "suspeita_ectopica",
          "label": "Suspeita de ectópica"
        }
      ],
      "referencia": "Localização da gestação"
    },
    {
      "id": "vesicula_vitelina",
      "tipo": "select",
      "label": "Vesícula vitelina",
      "opcoes": [
        {
          "valor": "presente",
          "label": "Presente"
        },
        {
          "valor": "ausente",
          "label": "Ausente"
        }
      ],
      "referencia": "Estrutura embrionária inicial"
    },
    {
      "id": "embriao",
      "tipo": "select",
      "label": "Embrião visível",
      "opcoes": [
        {
          "valor": "sim",
          "label": "Sim"
        },
        {
          "valor": "nao",
          "label": "Não"
        }
      ],
      "referencia": "Visualização embrionária"
    },
    {
      "id": "batimentos_cardiacos",
      "tipo": "select",
      "label": "Batimentos cardíacos fetais",
      "opcoes": [
        {
          "valor": "presentes",
          "label": "Presentes"
        },
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "nao_avaliavel",
          "label": "Não avaliável"
        }
      ],
      "referencia": "Viabilidade fetal"
    },
    {
      "id": "frequencia_cardiaca",
      "tipo": "number",
      "label": "Frequência cardíaca fetal",
      "unidade": "bpm",
      "referencia": "Normal: 110–160 bpm"
    },
    {
      "id": "diametro_saco",
      "tipo": "number",
      "label": "Diâmetro médio do saco gestacional (DMS)",
      "unidade": "mm",
      "referencia": "Compatível com idade gestacional"
    },
    {
      "id": "idade_gestacional",
      "tipo": "text",
      "label": "Idade gestacional estimada",
      "placeholder": "Ex: 6 semanas e 3 dias"
    },
    {
      "id": "achados_adicionais",
      "tipo": "textarea",
      "label": "Achados adicionais",
      "placeholder": "Ex: descolamento ovular, hematoma subcoriônico, etc."
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão",
      "opcoes": [
        {
          "valor": "gestacao_inicial_viavel",
          "label": "Gestação inicial viável"
        },
        {
          "valor": "gestacao_inicial_sem_viabilidade_definida",
          "label": "Gestação inicial sem viabilidade definida"
        },
        {
          "valor": "suspeita_aborto",
          "label": "Suspeita de abortamento"
        },
        {
          "valor": "suspeita_ectopica",
          "label": "Suspeita de gestação ectópica"
        }
      ],
      "referencia": "Classificação inicial"
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
    "title": "Ultrassonografia Abdominal – Obstetrica",
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
      "id": "saco_gestacional",
      "label": "Saco gestacional",
      "unidade": null,
      "referencia": "Visualização intrauterina esperada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Saco gestacional conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "localizacao",
      "label": "Localização da gestação",
      "unidade": null,
      "referencia": "Localização da gestação",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Localização da gestação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "vesicula_vitelina",
      "label": "Vesícula vitelina",
      "unidade": null,
      "referencia": "Estrutura embrionária inicial",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Vesícula vitelina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "embriao",
      "label": "Embrião visível",
      "unidade": null,
      "referencia": "Visualização embrionária",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Embrião visível conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "batimentos_cardiacos",
      "label": "Batimentos cardíacos fetais",
      "unidade": null,
      "referencia": "Viabilidade fetal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Batimentos cardíacos fetais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "frequencia_cardiaca",
      "label": "Frequência cardíaca fetal",
      "unidade": "bpm",
      "referencia": "Normal: 110–160 bpm",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Frequência cardíaca fetal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "diametro_saco",
      "label": "Diâmetro médio do saco gestacional (DMS)",
      "unidade": "mm",
      "referencia": "Compatível com idade gestacional",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Diâmetro médio do saco gestacional (DMS) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "idade_gestacional",
      "label": "Idade gestacional estimada",
      "unidade": null,
      "referencia": "Ex: 6 semanas e 3 dias",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Idade gestacional estimada conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "achados_adicionais",
      "label": "Achados adicionais",
      "unidade": null,
      "referencia": "Ex: descolamento ovular, hematoma subcoriônico, etc.",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Achados adicionais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão",
      "unidade": null,
      "referencia": "Classificação inicial",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão conforme referência, contexto clínico e método utilizado."
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
