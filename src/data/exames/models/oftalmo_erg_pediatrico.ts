import type { IntelligentExamModel } from "../types";

export const oftalmo_erg_pediatricoModel: IntelligentExamModel = {
  "id": "oftalmo_erg_pediatrico",
  "nome": "Eletrorretinograma (ERG)",
  "descricao": "Avaliação funcional da retina, com foco em distrofias retinianas e alterações congênitas.",
  "categoria": "oftalmologia",
  "icone": "fa-eye-low-vision",
  "campos": [
    {
      "id": "condicao_exame",
      "tipo": "select",
      "label": "Condição do exame",
      "opcoes": [
        {
          "valor": "vigilia",
          "label": "Realizado em vigília"
        },
        {
          "valor": "sedacao",
          "label": "Realizado sob sedação"
        },
        {
          "valor": "limitado",
          "label": "Exame limitado por baixa colaboração"
        }
      ],
      "referencia": "Condições técnicas"
    },
    {
      "id": "resposta_global",
      "tipo": "select",
      "label": "Resposta retiniana global",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Resposta dentro da normalidade"
        },
        {
          "valor": "reduzida",
          "label": "Resposta global reduzida"
        },
        {
          "valor": "ausente",
          "label": "Resposta ausente"
        }
      ],
      "referencia": "Avaliação geral"
    },
    {
      "id": "padrao_resposta",
      "tipo": "select",
      "label": "Padrão de resposta",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Padrão normal"
        },
        {
          "valor": "predominio_bastonetes",
          "label": "Comprometimento predominante de bastonetes"
        },
        {
          "valor": "predominio_cones",
          "label": "Comprometimento predominante de cones"
        },
        {
          "valor": "disfuncao_mista",
          "label": "Disfunção mista (cones e bastonetes)"
        },
        {
          "valor": "extinto",
          "label": "Extinção da resposta retiniana"
        }
      ],
      "referencia": "Classificação funcional"
    },
    {
      "id": "simetria",
      "tipo": "select",
      "label": "Simetria entre os olhos",
      "opcoes": [
        {
          "valor": "simetrico",
          "label": "Simétrico"
        },
        {
          "valor": "assimetrico",
          "label": "Assimétrico"
        },
        {
          "valor": "nao_avaliavel",
          "label": "Não avaliável"
        }
      ],
      "referencia": "Comparação OD/OE"
    },
    {
      "id": "suspeita_clinica",
      "tipo": "select",
      "label": "Correlação clínica sugerida",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem evidência de disfunção retiniana significativa"
        },
        {
          "valor": "acromatopsia",
          "label": "Padrão compatível com acromatopsia"
        },
        {
          "valor": "retinose_pigmentar",
          "label": "Padrão compatível com retinose pigmentar"
        },
        {
          "valor": "distrofia_cones",
          "label": "Sugestivo de distrofia de cones"
        },
        {
          "valor": "distrofia_bastonetes",
          "label": "Sugestivo de distrofia de bastonetes"
        },
        {
          "valor": "indeterminado",
          "label": "Padrão inespecífico"
        }
      ],
      "referencia": "Hipótese diagnóstica"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Função retiniana preservada"
        },
        {
          "valor": "alteracao_leve",
          "label": "Alteração funcional leve"
        },
        {
          "valor": "alteracao_moderada",
          "label": "Alteração funcional moderada"
        },
        {
          "valor": "alteracao_grave",
          "label": "Alteração funcional grave"
        },
        {
          "valor": "extincao",
          "label": "Extinção da atividade retiniana"
        }
      ],
      "referencia": "Gravidade"
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
      "resultSummary": "Eletrorretinograma (ERG) com Condição do exame: Registro tecnicamente adequado, com cooperação compatível com a idade; Resposta retiniana global: Respostas escotópicas e fotópicas presentes; Padrão de resposta: Amplitudes e tempos implícitos dentro do esperado.",
      "interpretation": "Os parâmetros mensurados — Condição do exame: Registro tecnicamente adequado, com cooperação compatível com a idade; Resposta retiniana global: Respostas escotópicas e fotópicas presentes; Padrão de resposta: Amplitudes e tempos implícitos dentro do esperado; Simetria entre os olhos: Respostas simétricas entre OD e OE — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Eletrorretinograma (ERG) com parâmetros compatíveis com o padrão esperado, incluindo Condição do exame: Registro tecnicamente adequado, com cooperação compatível com a idade; Resposta retiniana global: Respostas escotópicas e fotópicas presentes.",
      "results": {
        "condicao_exame": "Registro tecnicamente adequado, com cooperação compatível com a idade",
        "resposta_global": "Respostas escotópicas e fotópicas presentes",
        "padrao_resposta": "Amplitudes e tempos implícitos dentro do esperado",
        "simetria": "Respostas simétricas entre OD e OE",
        "suspeita_clinica": "Sem padrão eletrofisiológico sugestivo de distrofia retiniana difusa",
        "impressao": "Eletrorretinograma dentro dos limites funcionais esperados"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Eletrorretinograma (ERG): Condição do exame: Registro tecnicamente adequado; Resposta retiniana global: Amplitudes escotópicas e fotópicas reduzidas; Padrão de resposta: Atraso de tempos implícitos e redução de amplitude; Simetria entre os olhos: Redução bilateral relativamente simétrica.",
      "interpretation": "Os resultados principais (Condição do exame: Registro tecnicamente adequado; Resposta retiniana global: Amplitudes escotópicas e fotópicas reduzidas; Padrão de resposta: Atraso de tempos implícitos e redução de amplitude; Simetria entre os olhos: Redução bilateral relativamente simétrica) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Eletrorretinograma (ERG) com padrão alterado, documentado por Condição do exame: Registro tecnicamente adequado; Resposta retiniana global: Amplitudes escotópicas e fotópicas reduzidas.",
      "results": {
        "condicao_exame": "Registro tecnicamente adequado",
        "resposta_global": "Amplitudes escotópicas e fotópicas reduzidas",
        "padrao_resposta": "Atraso de tempos implícitos e redução de amplitude",
        "simetria": "Redução bilateral relativamente simétrica",
        "suspeita_clinica": "Padrão compatível com disfunção retiniana difusa",
        "impressao": "ERG alterado bilateralmente, sugerindo disfunção retiniana difusa"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Eletrorretinograma (ERG): Resposta retiniana global: Amplitude discretamente reduzida; Padrão de resposta: Tempos implícitos em limite superior; Simetria entre os olhos: Simetria preservada; Correlação clínica sugerida: Sem padrão específico definido.",
      "interpretation": "Os principais resultados (Resposta retiniana global: Amplitude discretamente reduzida; Padrão de resposta: Tempos implícitos em limite superior; Simetria entre os olhos: Simetria preservada; Correlação clínica sugerida: Sem padrão específico definido) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Eletrorretinograma (ERG) com resultado limítrofe/inespecífico, destacando-se Resposta retiniana global: Amplitude discretamente reduzida; Padrão de resposta: Tempos implícitos em limite superior.",
      "results": {
        "condicao_exame": "Registro tecnicamente adequado, com cooperação compatível com a idade",
        "resposta_global": "Amplitude discretamente reduzida",
        "padrao_resposta": "Tempos implícitos em limite superior",
        "simetria": "Simetria preservada",
        "suspeita_clinica": "Sem padrão específico definido",
        "impressao": "ERG limítrofe, sem assinatura eletrofisiológica específica"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Eletrorretinograma (ERG): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "condicao_exame": "Registro tecnicamente adequado, com cooperação compatível com a idade",
        "resposta_global": "Respostas escotópicas e fotópicas presentes",
        "padrao_resposta": "Amplitudes e tempos implícitos dentro do esperado",
        "simetria": "Respostas simétricas entre OD e OE",
        "suspeita_clinica": "Sem padrão eletrofisiológico sugestivo de distrofia retiniana difusa",
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
    "title": "Eletrorretinograma (ERG)",
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
  "technique": "Eletrorretinograma realizado para avaliação eletrofisiológica global da função retiniana, com protocolo adaptado à faixa etária.",
  "method": "Registro de respostas retinianas a estímulos luminosos em condições escotópicas e fotópicas, com análise de amplitudes e tempos implícitos.",
  "parameters": [
    {
      "id": "condicao_exame",
      "label": "Condição do exame",
      "unidade": null,
      "referencia": "Condições técnicas",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Condição do exame conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resposta_global",
      "label": "Resposta retiniana global",
      "unidade": null,
      "referencia": "Avaliação geral",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta retiniana global conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "padrao_resposta",
      "label": "Padrão de resposta",
      "unidade": null,
      "referencia": "Classificação funcional",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão de resposta conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "simetria",
      "label": "Simetria entre os olhos",
      "unidade": null,
      "referencia": "Comparação OD/OE",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Simetria entre os olhos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "suspeita_clinica",
      "label": "Correlação clínica sugerida",
      "unidade": null,
      "referencia": "Hipótese diagnóstica",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Correlação clínica sugerida conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão",
      "unidade": null,
      "referencia": "Gravidade",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Eletrorretinograma (ERG) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Eletrorretinograma (ERG) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Eletrorretinograma (ERG) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Eletrorretinograma (ERG) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Eletrorretinograma (ERG) alterado conforme resultados objetivos descritos.",
    "undefined": "Eletrorretinograma (ERG) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
