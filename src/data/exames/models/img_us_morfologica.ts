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
      "resultSummary": "USG Morfológica com Idade Gestacional: 21; Número de Fetos: Feto único; Batimentos Cardíacos Fetais: 146.",
      "interpretation": "Os parâmetros mensurados — Idade Gestacional: 21 semanas; Número de Fetos: Feto único; Batimentos Cardíacos Fetais: 146 bpm; Apresentação Fetal: Cefálica — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "USG Morfológica com parâmetros compatíveis com o padrão esperado, incluindo Idade Gestacional: 21 semanas; Número de Fetos: Feto único.",
      "results": {
        "idade_gestacional": "21",
        "numero_fetos": "Feto único",
        "batimentos_cardiacos": "146",
        "apresentacao_fetal": "Cefálica",
        "placenta_localizacao": "Posterior, sem cobrir o orifício interno do colo",
        "liquido_amniotico": "Volume preservado",
        "cranio_cerebro": "Morfologia encefálica compatível com a idade gestacional",
        "face": "Perfil e estruturas faciais sem alterações evidentes",
        "coluna": "Continuidade vertebral preservada",
        "torax_coracao": "Quatro câmaras e eixo cardíaco sem alterações evidentes",
        "abdome": "Parede abdominal e órgãos avaliáveis sem alterações evidentes",
        "rins_bexiga": "Rins tópicos e bexiga visualizada",
        "membros": "Quatro membros visualizados, sem deformidades evidentes",
        "sexo_fetal": "Conforme visualização ultrassonográfica",
        "impressao": "Morfologia fetal compatível com a idade gestacional"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "USG Morfológica: Batimentos Cardíacos Fetais: 142; Placenta (Localização): Posterior; Crânio e Encéfalo: Ventriculomegalia lateral discreta; Face: Sem alteração estrutural evidente.",
      "interpretation": "Os resultados principais (Batimentos Cardíacos Fetais: 142 bpm; Placenta (Localização): Posterior; Crânio e Encéfalo: Ventriculomegalia lateral discreta; Face: Sem alteração estrutural evidente) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "USG Morfológica com padrão alterado, documentado por Batimentos Cardíacos Fetais: 142 bpm; Placenta (Localização): Posterior.",
      "results": {
        "idade_gestacional": "21",
        "numero_fetos": "Feto único",
        "batimentos_cardiacos": "142",
        "apresentacao_fetal": "Cefálica",
        "placenta_localizacao": "Posterior",
        "liquido_amniotico": "Volume preservado",
        "cranio_cerebro": "Ventriculomegalia lateral discreta",
        "face": "Sem alteração estrutural evidente",
        "coluna": "Continuidade preservada",
        "torax_coracao": "Quatro câmaras visualizadas, sem alteração maior evidente",
        "abdome": "Sem alteração estrutural maior evidente",
        "rins_bexiga": "Pelve renal discretamente dilatada à esquerda",
        "membros": "Quatro membros visualizados",
        "sexo_fetal": "Conforme visualização ultrassonográfica",
        "impressao": "Ventriculomegalia discreta e pieloectasia fetal esquerda, recomendando seguimento morfológico"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "USG Morfológica: Batimentos Cardíacos Fetais: 145; Crânio e Encéfalo: Ventrículos laterais em limite superior da normalidade; Face: Normal; Coluna Vertebral: Normal.",
      "interpretation": "Os principais resultados (Batimentos Cardíacos Fetais: 145 bpm; Crânio e Encéfalo: Ventrículos laterais em limite superior da normalidade; Face: Normal; Coluna Vertebral: Normal) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "USG Morfológica com resultado limítrofe/inespecífico, destacando-se Batimentos Cardíacos Fetais: 145 bpm; Crânio e Encéfalo: Ventrículos laterais em limite superior da normalidade.",
      "results": {
        "idade_gestacional": "21",
        "numero_fetos": "Feto único",
        "batimentos_cardiacos": "145",
        "apresentacao_fetal": "Cefálica",
        "placenta_localizacao": "Posterior, sem cobrir o orifício interno do colo",
        "liquido_amniotico": "Volume preservado",
        "cranio_cerebro": "Ventrículos laterais em limite superior da normalidade",
        "face": "Normal",
        "coluna": "Normal",
        "torax_coracao": "Normal",
        "abdome": "Normal",
        "rins_bexiga": "Pelve renal em limite superior à esquerda",
        "membros": "Normais",
        "sexo_fetal": "Conforme visualização ultrassonográfica",
        "impressao": "Marcadores discretamente limítrofes, recomendando controle ultrassonográfico"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "USG Morfológica: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "idade_gestacional": "21",
        "numero_fetos": "Feto único",
        "batimentos_cardiacos": "146",
        "apresentacao_fetal": "Cefálica",
        "placenta_localizacao": "Posterior, sem cobrir o orifício interno do colo",
        "liquido_amniotico": "Volume preservado",
        "cranio_cerebro": "Morfologia encefálica compatível com a idade gestacional",
        "face": "Perfil e estruturas faciais sem alterações evidentes",
        "coluna": "Continuidade vertebral preservada",
        "torax_coracao": "Quatro câmaras e eixo cardíaco sem alterações evidentes",
        "abdome": "Parede abdominal e órgãos avaliáveis sem alterações evidentes",
        "rins_bexiga": "Rins tópicos e bexiga visualizada",
        "membros": "Quatro membros visualizados, sem deformidades evidentes",
        "sexo_fetal": "Conforme visualização ultrassonográfica",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
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
  "technique": "Ultrassonografia morfológica fetal realizada de forma sistematizada para avaliação anatômica, biometria, placenta, líquido amniótico e marcadores demonstráveis na idade gestacional.",
  "method": "Exame ultrassonográfico obstétrico bidimensional com cortes anatômicos padronizados e Doppler complementar quando indicado.",
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
    "normal": "Resultados de USG Morfológica compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "USG Morfológica com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "USG Morfológica com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "USG Morfológica sem alterações significativas nos parâmetros avaliados.",
    "altered": "USG Morfológica alterado conforme resultados objetivos descritos.",
    "undefined": "USG Morfológica com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
