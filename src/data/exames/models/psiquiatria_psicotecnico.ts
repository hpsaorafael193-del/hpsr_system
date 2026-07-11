import type { IntelligentExamModel } from "../types";

export const psiquiatria_psicotecnicoModel: IntelligentExamModel = {
  "id": "psiquiatria_psicotecnico",
  "nome": "Avaliação Psicotécnica",
  "descricao": "Avaliação psicológica destinada à análise de aptidão emocional, comportamental e atencional.",
  "categoria": "geral",
  "icone": "fa-brain",
  "campos": [
    {
      "id": "estado_mental",
      "tipo": "select",
      "label": "Estado mental geral",
      "opcoes": [
        {
          "valor": "preservado",
          "label": "Estado mental preservado"
        },
        {
          "valor": "leve_alteracao",
          "label": "Leve alteração emocional/comportamental"
        },
        {
          "valor": "moderada_alteracao",
          "label": "Alteração moderada"
        },
        {
          "valor": "importante_alteracao",
          "label": "Alteração importante"
        }
      ],
      "referencia": "Avaliação clínica"
    },
    {
      "id": "nivel_atencao",
      "tipo": "select",
      "label": "Nível de atenção e concentração",
      "opcoes": [
        {
          "valor": "adequado",
          "label": "Adequado"
        },
        {
          "valor": "levemente_reduzido",
          "label": "Levemente reduzido"
        },
        {
          "valor": "reduzido",
          "label": "Reduzido"
        },
        {
          "valor": "prejudicado",
          "label": "Significativamente prejudicado"
        }
      ],
      "referencia": "Desempenho atencional"
    },
    {
      "id": "tempo_reacao",
      "tipo": "select",
      "label": "Tempo de reação",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Dentro da normalidade"
        },
        {
          "valor": "lentificado",
          "label": "Lentificado"
        },
        {
          "valor": "inconsistente",
          "label": "Inconsistente"
        }
      ],
      "referencia": "Resposta psicomotora"
    },
    {
      "id": "controle_emocional",
      "tipo": "select",
      "label": "Controle emocional",
      "opcoes": [
        {
          "valor": "adequado",
          "label": "Adequado"
        },
        {
          "valor": "instabilidade_leve",
          "label": "Leve instabilidade emocional"
        },
        {
          "valor": "instabilidade_moderada",
          "label": "Instabilidade emocional moderada"
        },
        {
          "valor": "instabilidade_importante",
          "label": "Instabilidade emocional importante"
        }
      ],
      "referencia": "Regulação emocional"
    },
    {
      "id": "impulsividade",
      "tipo": "select",
      "label": "Impulsividade",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Sem impulsividade relevante"
        },
        {
          "valor": "leve",
          "label": "Impulsividade leve"
        },
        {
          "valor": "moderada",
          "label": "Impulsividade moderada"
        },
        {
          "valor": "elevada",
          "label": "Impulsividade elevada"
        }
      ],
      "referencia": "Controle comportamental"
    },
    {
      "id": "capacidade_decisao",
      "tipo": "select",
      "label": "Capacidade de julgamento e tomada de decisão",
      "opcoes": [
        {
          "valor": "preservada",
          "label": "Preservada"
        },
        {
          "valor": "levemente_comprometida",
          "label": "Levemente comprometida"
        },
        {
          "valor": "comprometida",
          "label": "Comprometida"
        }
      ],
      "referencia": "Função executiva"
    },
    {
      "id": "perfil_comportamental",
      "tipo": "select",
      "label": "Perfil comportamental observado",
      "opcoes": [
        {
          "valor": "cooperativo",
          "label": "Cooperativo e estável"
        },
        {
          "valor": "ansioso",
          "label": "Ansioso"
        },
        {
          "valor": "agitado",
          "label": "Agitado/hipervigilante"
        },
        {
          "valor": "apatetico",
          "label": "Apatia/desmotivação"
        },
        {
          "valor": "hostil",
          "label": "Hostilidade/resistência"
        }
      ],
      "referencia": "Observação clínica"
    },
    {
      "id": "aptidao",
      "tipo": "select",
      "label": "Resultado psicotécnico",
      "opcoes": [
        {
          "valor": "apto",
          "label": "Apto"
        },
        {
          "valor": "apto_restricao",
          "label": "Apto com restrições"
        },
        {
          "valor": "inapto_temporario",
          "label": "Inapto temporariamente"
        },
        {
          "valor": "inapto",
          "label": "Inapto"
        }
      ],
      "referencia": "Conclusão pericial"
    },
    {
      "id": "impressao",
      "tipo": "textarea",
      "label": "Impressão Psicológica",
      "placeholder": "Descrever comportamento observado, estabilidade emocional e desempenho cognitivo."
    },
    {
      "id": "interpretacao",
      "tipo": "textarea",
      "label": "Interpretação",
      "placeholder": "Correlacionar desempenho psicotécnico com a atividade pretendida."
    },
    {
      "id": "conclusao",
      "tipo": "textarea",
      "label": "Conclusão",
      "placeholder": "Síntese final da avaliação psicotécnica."
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
  "variables": [],
  "editorModel": {
    "title": "Avaliação Psicotécnica",
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
  "technique": "Amostra processada conforme método laboratorial validado, com controles internos e referências aplicáveis ao exame.",
  "method": "Método laboratorial compatível com o parâmetro analisado, conforme validação interna do serviço.",
  "parameters": [
    {
      "id": "estado_mental",
      "label": "Estado mental geral",
      "unidade": null,
      "referencia": "Avaliação clínica",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estado mental geral conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "nivel_atencao",
      "label": "Nível de atenção e concentração",
      "unidade": null,
      "referencia": "Desempenho atencional",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Nível de atenção e concentração conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tempo_reacao",
      "label": "Tempo de reação",
      "unidade": null,
      "referencia": "Resposta psicomotora",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tempo de reação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "controle_emocional",
      "label": "Controle emocional",
      "unidade": null,
      "referencia": "Regulação emocional",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Controle emocional conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impulsividade",
      "label": "Impulsividade",
      "unidade": null,
      "referencia": "Controle comportamental",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impulsividade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "capacidade_decisao",
      "label": "Capacidade de julgamento e tomada de decisão",
      "unidade": null,
      "referencia": "Função executiva",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Capacidade de julgamento e tomada de decisão conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "perfil_comportamental",
      "label": "Perfil comportamental observado",
      "unidade": null,
      "referencia": "Observação clínica",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Perfil comportamental observado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "aptidao",
      "label": "Resultado psicotécnico",
      "unidade": null,
      "referencia": "Conclusão pericial",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado psicotécnico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Psicológica",
      "unidade": null,
      "referencia": "Descrever comportamento observado, estabilidade emocional e desempenho cognitivo.",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Psicológica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Parâmetros dentro dos valores de referência disponíveis.",
    "altered": "Um ou mais parâmetros fora da referência, com significado dependente do contexto clínico.",
    "undefined": "Alteração discreta, limítrofe ou inconclusiva, sem definição diagnóstica isolada."
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
