import type { IntelligentExamModel } from "../types";

export const obst_us_rotina_completoModel: IntelligentExamModel = {
  "id": "obst_us_rotina_completo",
  "nome": "Ultrassonografia Obstétrica",
  "descricao": "Avaliação do desenvolvimento fetal, placenta e líquido amniótico",
  "categoria": "obstetricia",
  "icone": "fa-baby",
  "campos": [
    {
      "id": "idade_gestacional",
      "tipo": "number",
      "label": "Idade Gestacional",
      "unidade": "semanas",
      "referencia": "—"
    },
    {
      "id": "apresentacao_fetal",
      "tipo": "select",
      "label": "Apresentação Fetal",
      "opcoes": [
        {
          "valor": "cefalica",
          "label": "Cefálica"
        },
        {
          "valor": "pelvica",
          "label": "Pélvica"
        },
        {
          "valor": "transversa",
          "label": "Transversa"
        }
      ],
      "referencia": "Cefálica"
    },
    {
      "id": "batimentos_cardiacos",
      "tipo": "number",
      "label": "Batimentos Cardíacos Fetais",
      "unidade": "bpm",
      "referencia": "120 – 160"
    },
    {
      "id": "placenta_localizacao",
      "tipo": "select",
      "label": "Placenta (Localização)",
      "opcoes": [
        {
          "valor": "anterior",
          "label": "Anterior"
        },
        {
          "valor": "posterior",
          "label": "Posterior"
        },
        {
          "valor": "previa",
          "label": "Prévia"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "liquido_amniotico",
      "tipo": "select",
      "label": "Líquido Amniótico",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "oligo",
          "label": "Oligoâmnio"
        },
        {
          "valor": "poli",
          "label": "Polidrâmnio"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "biometria_fetal",
      "tipo": "select",
      "label": "Biometria Fetal",
      "opcoes": [
        {
          "valor": "compatível",
          "label": "Compatível com IG"
        },
        {
          "valor": "discordante",
          "label": "Discordante"
        }
      ],
      "referencia": "Compatível"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Obstétrica",
      "opcoes": [
        {
          "valor": "evolutiva",
          "label": "Gestação evolutiva"
        },
        {
          "valor": "risco",
          "label": "Gestação com achados de risco"
        }
      ],
      "referencia": "Evolutiva"
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
        "apresentacao_fetal": "Cefálica",
        "batimentos_cardiacos": "144",
        "placenta_localizacao": "Posterior, grau compatível com a idade gestacional",
        "liquido_amniotico": "Volume preservado",
        "biometria_fetal": "Compatível com a idade gestacional",
        "impressao": "Gestação única evolutiva, biometria e vitalidade compatíveis com a idade gestacional"
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
        "apresentacao_fetal": "Feto A cefálico; feto B pélvico",
        "batimentos_cardiacos": "142 / 148",
        "placenta_localizacao": "Placenta(s) conforme corionicidade, sem prévia",
        "liquido_amniotico": "Volume preservado em ambos os compartimentos avaliáveis",
        "biometria_fetal": "Compatível com a idade gestacional em ambos os fetos",
        "impressao": "Gestação gemelar evolutiva, com vitalidade e crescimento compatíveis"
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
        "apresentacao_fetal": "Variável",
        "batimentos_cardiacos": "156",
        "placenta_localizacao": "Posterior",
        "liquido_amniotico": "Volume adequado",
        "biometria_fetal": "Compatível com 12 semanas",
        "impressao": "Gestação única evolutiva no primeiro trimestre"
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
        "idade_gestacional": "32",
        "apresentacao_fetal": "Cefálica",
        "batimentos_cardiacos": "138",
        "placenta_localizacao": "Anterior, sem prévia",
        "liquido_amniotico": "Limítrofe inferior",
        "biometria_fetal": "Abaixo do percentil esperado para a idade gestacional",
        "impressao": "Biometria fetal reduzida para a idade gestacional, compatível com suspeita de restrição de crescimento"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ultrassonografia Obstétrica: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "idade_gestacional": "28",
        "apresentacao_fetal": "Cefálica",
        "batimentos_cardiacos": "144",
        "placenta_localizacao": "Posterior, grau compatível com a idade gestacional",
        "liquido_amniotico": "Volume preservado",
        "biometria_fetal": "Compatível com a idade gestacional",
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
    "title": "Ultrassonografia Obstétrica",
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
  "technique": "Ultrassonografia obstétrica de rotina realizada para avaliação de vitalidade, apresentação fetal, biometria, placenta, líquido amniótico e demais estruturas previstas para a idade gestacional.",
  "method": "Exame ultrassonográfico obstétrico bidimensional com biometria fetal e avaliação complementar por Doppler quando clinicamente indicada.",
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
      "id": "apresentacao_fetal",
      "label": "Apresentação Fetal",
      "unidade": null,
      "referencia": "Cefálica",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Apresentação Fetal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "batimentos_cardiacos",
      "label": "Batimentos Cardíacos Fetais",
      "unidade": "bpm",
      "referencia": "120 – 160",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Batimentos Cardíacos Fetais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "placenta_localizacao",
      "label": "Placenta (Localização)",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Placenta (Localização) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "liquido_amniotico",
      "label": "Líquido Amniótico",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Líquido Amniótico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "biometria_fetal",
      "label": "Biometria Fetal",
      "unidade": null,
      "referencia": "Compatível",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Biometria Fetal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Obstétrica",
      "unidade": null,
      "referencia": "Evolutiva",
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
    "normal": "Resultados de Ultrassonografia Obstétrica compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ultrassonografia Obstétrica com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ultrassonografia Obstétrica com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ultrassonografia Obstétrica sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ultrassonografia Obstétrica alterado conforme resultados objetivos descritos.",
    "undefined": "Ultrassonografia Obstétrica com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
