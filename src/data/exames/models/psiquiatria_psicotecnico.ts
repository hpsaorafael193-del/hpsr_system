import type { IntelligentExamModel } from "../types";

export const psiquiatria_psicotecnicoModel: IntelligentExamModel = {
  "id": "psiquiatria_psicotecnico",
  "nome": "Avaliação Psicotécnica",
  "descricao": "Avaliação psicotécnica integrada, com análise psicológica, física, cardíaca e respiratória antes da conclusão de aptidão.",
  "categoria": "psicologia_psiquiatria",
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
        "id": "impressao_psicologica",
        "title": "3. Impressão psicológica",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "avaliacao_fisica",
        "title": "4. Avaliação física",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "avaliacao_cardiaca",
        "title": "5. Avaliação cardíaca",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "avaliacao_respiratoria",
        "title": "6. Avaliação respiratória",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "7. Interpretação",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "conclusao",
        "title": "8. Conclusão",
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
      "impressao_psicologica",
      "avaliacao_fisica",
      "avaliacao_cardiaca",
      "avaliacao_respiratoria",
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
      "impressao_psicologica",
      "avaliacao_fisica",
      "avaliacao_cardiaca",
      "avaliacao_respiratoria",
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
        "id": "impressao_psicologica",
        "title": "3. Impressão psicológica",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "avaliacao_fisica",
        "title": "4. Avaliação física",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "avaliacao_cardiaca",
        "title": "5. Avaliação cardíaca",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "avaliacao_respiratoria",
        "title": "6. Avaliação respiratória",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "7. Interpretação",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "conclusao",
        "title": "8. Conclusão",
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
  "technique": "Avaliação presencial estruturada, composta por entrevista dirigida, observação comportamental, tarefas de atenção e resposta psicomotora, exame físico funcional e verificação de parâmetros cardiovasculares e respiratórios.",
  "method": "Os resultados são registrados de forma integrada, considerando desempenho durante o protocolo, sinais vitais aferidos e resposta funcional observada no momento da avaliação.",
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
      "referencia": "Síntese do comportamento, estabilidade emocional e desempenho cognitivo observados.",
      "resultPlaceholder": "Descrição técnica específica",
      "interpretationHint": "Sintetizar os dados psicológicos observados durante o protocolo."
    },
    {
      "id": "condicao_fisica_geral",
      "label": "Condição física geral",
      "unidade": null,
      "referencia": "Mobilidade funcional, postura e tolerância ao protocolo",
      "resultPlaceholder": "Descrição funcional específica",
      "interpretationHint": "Descrever condição física e limitações observadas."
    },
    {
      "id": "coordenacao_equilibrio",
      "label": "Coordenação e equilíbrio",
      "unidade": null,
      "referencia": "Execução estável das manobras funcionais",
      "resultPlaceholder": "Descrição objetiva das manobras",
      "interpretationHint": "Registrar estabilidade, coordenação e eventuais desvios."
    },
    {
      "id": "forca_mobilidade",
      "label": "Força e mobilidade",
      "unidade": null,
      "referencia": "Força global e amplitude funcional compatíveis com o protocolo",
      "resultPlaceholder": "Descrição funcional específica",
      "interpretationHint": "Registrar força, mobilidade e assimetrias."
    },
    {
      "id": "frequencia_cardiaca",
      "label": "Frequência cardíaca",
      "unidade": "bpm",
      "referencia": "60 a 100 bpm",
      "resultPlaceholder": "Valor aferido",
      "interpretationHint": "Interpretar a frequência cardíaca aferida."
    },
    {
      "id": "pressao_arterial_sistolica",
      "label": "Pressão arterial sistólica",
      "unidade": "mmHg",
      "referencia": "90 a 139 mmHg",
      "resultPlaceholder": "Valor aferido",
      "interpretationHint": "Interpretar a pressão arterial sistólica aferida."
    },
    {
      "id": "pressao_arterial_diastolica",
      "label": "Pressão arterial diastólica",
      "unidade": "mmHg",
      "referencia": "60 a 89 mmHg",
      "resultPlaceholder": "Valor aferido",
      "interpretationHint": "Interpretar a pressão arterial diastólica aferida."
    },
    {
      "id": "ritmo_cardiaco",
      "label": "Ritmo cardíaco",
      "unidade": null,
      "referencia": "Ritmo regular à avaliação clínica",
      "resultPlaceholder": "Descrição técnica específica",
      "interpretationHint": "Registrar regularidade e intercorrências observadas."
    },
    {
      "id": "frequencia_respiratoria",
      "label": "Frequência respiratória",
      "unidade": "irpm",
      "referencia": "12 a 20 irpm",
      "resultPlaceholder": "Valor aferido",
      "interpretationHint": "Interpretar a frequência respiratória aferida."
    },
    {
      "id": "saturacao_oxigenio",
      "label": "Saturação periférica de oxigênio",
      "unidade": "%",
      "referencia": "95 a 100%",
      "resultPlaceholder": "Valor aferido",
      "interpretationHint": "Interpretar a saturação periférica aferida."
    },
    {
      "id": "ausculta_respiratoria",
      "label": "Ausculta respiratória",
      "unidade": null,
      "referencia": "Murmúrio vesicular bilateral, sem ruídos adventícios",
      "resultPlaceholder": "Descrição auscultatória específica",
      "interpretationHint": "Registrar distribuição do murmúrio vesicular e ruídos adventícios."
    },
    {
      "id": "expansibilidade_toracica",
      "label": "Expansibilidade torácica",
      "unidade": null,
      "referencia": "Expansão bilateral e simétrica",
      "resultPlaceholder": "Descrição objetiva",
      "interpretationHint": "Registrar simetria e padrão de expansão torácica."
    }
  ],
  "tables": [
    {
      "id": "tabela_tecnica",
      "title": "Resultados objetivos",
      "headers": [
        "Parâmetro",
        "Resultado",
        "Valores de referência"
      ],
      "rowsFromParameters": true
    }
  ],
  "interpretation": {
    "normal": "Desempenho psicológico, condição funcional e parâmetros cardiorrespiratórios compatíveis com o protocolo aplicado.",
    "altered": "Um ou mais parâmetros fora da referência, com significado dependente do contexto clínico.",
    "undefined": "Alteração discreta, limítrofe ou inconclusiva, sem definição diagnóstica isolada."
  },
  "conclusion": {
    "normal": "Avaliação integrada compatível com aptidão, conforme os resultados descritos.",
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
