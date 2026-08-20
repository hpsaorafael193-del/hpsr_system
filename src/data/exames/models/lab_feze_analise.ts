import type { IntelligentExamModel } from "../types";

export const lab_feze_analiseModel: IntelligentExamModel = {
  "id": "lab_feze_analise",
  "nome": "Fezes – Análise Completa",
  "descricao": "Avaliação macroscópica, microscópica, funcional e parasitológica das fezes",
  "categoria": "laboratorio",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "cor",
      "tipo": "select",
      "label": "Cor",
      "opcoes": [
        {
          "valor": "marrom",
          "label": "Marrom"
        },
        {
          "valor": "amarelada",
          "label": "Amarelada"
        },
        {
          "valor": "esverdeada",
          "label": "Esverdeada"
        },
        {
          "valor": "enegrecida",
          "label": "Enegrecida"
        },
        {
          "valor": "esbranquicada",
          "label": "Esbranquiçada"
        }
      ],
      "referencia": "Marrom"
    },
    {
      "id": "consistencia",
      "tipo": "select",
      "label": "Consistência",
      "opcoes": [
        {
          "valor": "formada",
          "label": "Formada"
        },
        {
          "valor": "pastosa",
          "label": "Pastosa"
        },
        {
          "valor": "liquida",
          "label": "Líquida"
        }
      ],
      "referencia": "Formada"
    },
    {
      "id": "muco",
      "tipo": "select",
      "label": "Muco",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "presente",
          "label": "Presente"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "sangue_visivel",
      "tipo": "select",
      "label": "Sangue Visível",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "presente",
          "label": "Presente"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "ph",
      "tipo": "number",
      "label": "pH",
      "referencia": "6.0 – 7.5"
    },
    {
      "id": "leucocitos",
      "tipo": "select",
      "label": "Leucócitos",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "presentes",
          "label": "Presentes"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "hemacias",
      "tipo": "select",
      "label": "Hemácias",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "presentes",
          "label": "Presentes"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "gordura",
      "tipo": "select",
      "label": "Gordura",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "aumentada",
          "label": "Aumentada"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "parasitas",
      "tipo": "select",
      "label": "Parasitas",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "giardia",
          "label": "Giardia lamblia"
        },
        {
          "valor": "entamoeba",
          "label": "Entamoeba histolytica"
        },
        {
          "valor": "ascaris",
          "label": "Ascaris lumbricoides"
        },
        {
          "valor": "ancilostomideos",
          "label": "Ancilostomídeos"
        },
        {
          "valor": "oxiuros",
          "label": "Enterobius vermicularis"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "ovos_cistos",
      "tipo": "select",
      "label": "Ovos e Cistos",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "presentes",
          "label": "Presentes"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Laboratorial",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Exame dentro da normalidade"
        },
        {
          "valor": "parasitose",
          "label": "Parasitose intestinal"
        },
        {
          "valor": "diarreia_infecciosa",
          "label": "Quadro sugestivo de diarreia infecciosa"
        },
        {
          "valor": "sind_ma_absorcao",
          "label": "Síndrome de má absorção"
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
    "Controle",
    "Rastreamento",
    "Suspeita clínica",
    "Acompanhamento",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Análise de fezes sem alterações relevantes.",
      "resultSummary": "Amostra fecal sem alterações laboratoriais relevantes.",
      "interpretation": "Aspectos macroscópicos e microscópicos dentro do padrão esperado, sem parasitas, sangue ou leucócitos detectáveis.",
      "conclusion": "Exame de fezes sem alterações laboratoriais significativas.",
      "results": {
        "cor": "Marrom",
        "consistencia": "Formada",
        "muco": "Ausente",
        "sangue_visivel": "Ausente",
        "ph": "6,8",
        "leucocitos": "Ausentes",
        "hemacias": "Ausentes",
        "gordura": "Ausente",
        "parasitas": "Ausentes",
        "ovos_cistos": "Ausentes",
        "impressao": "Exame coproparasitológico e macroscópico sem alterações relevantes"
      }
    },
    {
      "id": "inflamatorio",
      "name": "Processo inflamatório",
      "status": "alterado",
      "description": "Leucócitos/sangue ou muco presentes.",
      "resultSummary": "Amostra fecal com muco presente, leucócitos numerosos e hemácias detectáveis, configurando padrão inflamatório.",
      "interpretation": "Presença de leucócitos, muco e/ou sangue pode indicar processo inflamatório/infeccioso intestinal, devendo ser correlacionada clinicamente.",
      "conclusion": "Resultado fecal sugestivo de processo inflamatório/infeccioso, conforme parâmetros descritos.",
      "results": {
        "cor": "Marrom-amarelada",
        "consistencia": "Pastosa",
        "muco": "Presente",
        "sangue_visivel": "Traços",
        "ph": "6,2",
        "leucocitos": "Numerosos",
        "hemacias": "Presentes",
        "gordura": "Ausente",
        "parasitas": "Ausentes",
        "ovos_cistos": "Ausentes",
        "impressao": "Padrão fecal inflamatório com muco e leucócitos"
      }
    },
    {
      "id": "parasitose",
      "name": "Parasitose",
      "status": "alterado",
      "description": "Pesquisa parasitológica positiva.",
      "resultSummary": "Exame com presença de parasitas/ovos/cistos.",
      "interpretation": "Identificação de formas parasitárias deve ser correlacionada com quadro clínico e epidemiologia.",
      "conclusion": "Pesquisa parasitológica positiva, com cistos de Giardia duodenalis identificados.",
      "results": {
        "cor": "Marrom",
        "consistencia": "Pastosa",
        "muco": "Discreto",
        "sangue_visivel": "Ausente",
        "ph": "6,5",
        "leucocitos": "Raros",
        "hemacias": "Ausentes",
        "gordura": "Ausente",
        "parasitas": "Presentes",
        "ovos_cistos": "Cistos de Giardia duodenalis identificados",
        "impressao": "Pesquisa parasitológica positiva"
      }
    },
    {
      "id": "sangramento",
      "name": "Sangue nas fezes",
      "status": "alterado",
      "description": "Presença de sangue/hemácias.",
      "resultSummary": "Exame com presença de sangue/hemácias nas fezes.",
      "interpretation": "Presença de sangue nas fezes deve ser correlacionada com sintomas, medicações e investigação clínica.",
      "conclusion": "Sangue visível e hemácias detectadas na amostra fecal.",
      "results": {
        "cor": "Marrom escuro",
        "consistencia": "Formada",
        "muco": "Ausente",
        "sangue_visivel": "Presente",
        "ph": "6,7",
        "leucocitos": "Raros",
        "hemacias": "Numerosas",
        "gordura": "Ausente",
        "parasitas": "Ausentes",
        "ovos_cistos": "Ausentes",
        "impressao": "Presença de sangue e hemácias nas fezes"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Achados discretos ou inespecíficos.",
      "resultSummary": "Exame com alteração discreta/inespecífica.",
      "interpretation": "Alterações discretas e inespecíficas na amostra fecal, sem padrão etiológico definido no exame isolado.",
      "conclusion": "Resultado fecal limítrofe/inespecífico, sem definição etiológica isolada.",
      "results": {
        "cor": "Marrom",
        "consistencia": "Pastosa",
        "muco": "Traços",
        "sangue_visivel": "Ausente",
        "ph": "6,0",
        "leucocitos": "Raros",
        "hemacias": "Raras",
        "gordura": "Traços",
        "parasitas": "Ausentes",
        "ovos_cistos": "Ausentes",
        "impressao": "Alterações discretas, sem padrão etiológico definido"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Fezes – Análise Completa: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "cor": "Marrom",
        "consistencia": "Formada",
        "muco": "Ausente",
        "sangue_visivel": "Ausente",
        "ph": "6,8",
        "leucocitos": "Ausentes",
        "hemacias": "Ausentes",
        "gordura": "Ausente",
        "parasitas": "Ausentes",
        "ovos_cistos": "Ausentes",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Fezes – Análise Completa",
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
        "id": "resultados",
        "title": "2. Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabela técnica",
        "required": false,
        "visibleByDefault": true
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
      "resultados",
      "tabelas",
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
      "resultados",
      "tabelas",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "laboratorio",
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
        "id": "resultados",
        "title": "2. Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabela técnica",
        "required": false,
        "visibleByDefault": true
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
  "technique": "Amostra fecal analisada quanto a características macroscópicas e pesquisa microscópica de elementos parasitológicos e outros componentes previstos no modelo.",
  "method": "Exame macroscópico e microscópico de fezes, com técnicas de concentração e pesquisa parasitológica conforme indicação e qualidade da amostra.",
  "parameters": [
    {
      "id": "cor",
      "label": "Cor",
      "unidade": null,
      "referencia": "Marrom",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cor conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "consistencia",
      "label": "Consistência",
      "unidade": null,
      "referencia": "Formada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Consistência conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "muco",
      "label": "Muco",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Muco conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "sangue_visivel",
      "label": "Sangue Visível",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sangue Visível conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ph",
      "label": "pH",
      "unidade": null,
      "referencia": "6.0 – 7.5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar pH conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "leucocitos",
      "label": "Leucócitos",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Leucócitos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemacias",
      "label": "Hemácias",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemácias conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "gordura",
      "label": "Gordura",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Gordura conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "parasitas",
      "label": "Parasitas",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Parasitas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ovos_cistos",
      "label": "Ovos e Cistos",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ovos e Cistos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Laboratorial",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Laboratorial conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [
    {
      "id": "tabela_tecnica",
      "title": "Tabela técnica laboratorial",
      "headers": [
        "Parâmetro",
        "Resultado",
        "Valores de referência"
      ],
      "rowsFromParameters": true
    }
  ],
  "interpretation": {
    "normal": "Resultados de Fezes – Análise Completa compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Fezes – Análise Completa com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Fezes – Análise Completa com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Fezes – Análise Completa sem alterações significativas nos parâmetros avaliados.",
    "altered": "Fezes – Análise Completa alterado conforme resultados objetivos descritos.",
    "undefined": "Fezes – Análise Completa com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
