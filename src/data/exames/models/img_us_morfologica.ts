import type { IntelligentExamModel } from "../types";

export const img_us_morfologicaModel: IntelligentExamModel = {
  "id": "img_us_morfologica",
  "nome": "USG Morfológica",
  "descricao": "Avaliação morfológica fetal detalhada para rastreio de malformações estruturais",
  "categoria": "obstetricia",
  "icone": "fa-baby",
  "campos": [
    {
      "id": "idade_gestacional",
      "tipo": "number",
      "label": "Idade Gestacional",
      "unidade": "semanas",
      "referencia": "18 – 24"
    },
    {
      "id": "numero_fetos",
      "tipo": "select",
      "label": "Número de Fetos",
      "opcoes": [
        {
          "valor": "unico",
          "label": "Feto único"
        },
        {
          "valor": "gemelar",
          "label": "Gestação gemelar"
        }
      ],
      "referencia": "Feto único"
    },
    {
      "id": "batimentos_cardiacos",
      "tipo": "number",
      "label": "Batimentos Cardíacos Fetais",
      "unidade": "bpm",
      "referencia": "120 – 160"
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
      "referencia": "—"
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
          "valor": "fundo",
          "label": "Fúndica"
        },
        {
          "valor": "previa",
          "label": "Prévia"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "liquido_amniotico",
      "tipo": "select",
      "label": "Líquido Amniótico",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Volume normal"
        },
        {
          "valor": "oligodramnio",
          "label": "Oligodrâmnio"
        },
        {
          "valor": "polidramnio",
          "label": "Polidrâmnio"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "cranio_cerebro",
      "tipo": "select",
      "label": "Crânio e Encéfalo",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem alterações"
        },
        {
          "valor": "alterado",
          "label": "Alterações estruturais"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "face",
      "tipo": "select",
      "label": "Face",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Perfil facial preservado"
        },
        {
          "valor": "fenda",
          "label": "Suspeita de fenda labiopalatina"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "coluna",
      "tipo": "select",
      "label": "Coluna Vertebral",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Coluna íntegra"
        },
        {
          "valor": "defeito",
          "label": "Defeito de fechamento"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "torax_coracao",
      "tipo": "select",
      "label": "Tórax e Coração",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Quatro câmaras preservadas"
        },
        {
          "valor": "alterado",
          "label": "Alterações cardíacas estruturais"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "abdome",
      "tipo": "select",
      "label": "Abdome",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Parede abdominal íntegra"
        },
        {
          "valor": "defeito",
          "label": "Defeito de parede abdominal"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "rins_bexiga",
      "tipo": "select",
      "label": "Rins e Bexiga",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Visualização adequada"
        },
        {
          "valor": "alterado",
          "label": "Alterações renais"
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
          "valor": "normal",
          "label": "Membros formados"
        },
        {
          "valor": "alterado",
          "label": "Alterações de membros"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "sexo_fetal",
      "tipo": "select",
      "label": "Sexo Fetal",
      "opcoes": [
        {
          "valor": "masculino",
          "label": "Masculino"
        },
        {
          "valor": "feminino",
          "label": "Feminino"
        },
        {
          "valor": "nao_identificado",
          "label": "Não identificado"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Morfológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Morfologia fetal dentro da normalidade"
        },
        {
          "valor": "suspeita",
          "label": "Achados suspeitos de malformação"
        },
        {
          "valor": "alterada",
          "label": "Malformações fetais identificadas"
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
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Parâmetros dentro das referências disponíveis.",
      "resultSummary": "Exame sem alterações relevantes.",
      "interpretation": "Resultados dentro do esperado para método, referência e contexto clínico informado.",
      "conclusion": "Exame sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Exame com alterações nos parâmetros avaliados.",
      "interpretation": "Alterações devem ser correlacionadas com quadro clínico, medicamentos, evolução e exames complementares.",
      "conclusion": "Exame alterado, recomendando correlação clínica."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Exame com achado limítrofe ou inespecífico.",
      "interpretation": "Resultado isolado não define diagnóstico e pode requerer repetição/seguimento conforme avaliação médica.",
      "conclusion": "Achado indefinido ou limítrofe, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame personalizado.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
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
    "title": "USG Morfológica",
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
        "title": "2. Achados / Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabelas técnicas",
        "required": false,
        "visibleByDefault": false
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": true,
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
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "procedimento",
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
        "title": "2. Achados / Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabelas técnicas",
        "required": false,
        "visibleByDefault": false
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": true,
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
  "technique": "Exame realizado conforme protocolo institucional e indicação clínica informada.",
  "method": "Método técnico definido conforme exame solicitado.",
  "parameters": [
    {
      "id": "idade_gestacional",
      "label": "Idade Gestacional",
      "unidade": "semanas",
      "referencia": "18 – 24",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Idade Gestacional conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "numero_fetos",
      "label": "Número de Fetos",
      "unidade": null,
      "referencia": "Feto único",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Número de Fetos conforme referência, contexto clínico e método utilizado."
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
      "id": "apresentacao_fetal",
      "label": "Apresentação Fetal",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Apresentação Fetal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "placenta_localizacao",
      "label": "Placenta (Localização)",
      "unidade": null,
      "referencia": "—",
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
      "id": "cranio_cerebro",
      "label": "Crânio e Encéfalo",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Crânio e Encéfalo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "face",
      "label": "Face",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Face conforme referência, contexto clínico e método utilizado."
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
      "id": "torax_coracao",
      "label": "Tórax e Coração",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tórax e Coração conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "abdome",
      "label": "Abdome",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Abdome conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "rins_bexiga",
      "label": "Rins e Bexiga",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Rins e Bexiga conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "membros",
      "label": "Membros",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Membros conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sexo_fetal",
      "label": "Sexo Fetal",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sexo Fetal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Morfológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Morfológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Sem alterações relevantes.",
    "altered": "Alterações a correlacionar clinicamente.",
    "undefined": "Achado indefinido, sem conclusão diagnóstica isolada."
  },
  "conclusion": {
    "normal": "Exame sem alterações significativas.",
    "altered": "Exame alterado, recomendando correlação clínica.",
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
