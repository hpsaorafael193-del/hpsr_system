import type { IntelligentExamModel } from "../types";

export const lab_beta_hcg_completoModel: IntelligentExamModel = {
  "id": "lab_beta_hcg_completo",
  "nome": "β-hCG (Beta hCG)",
  "descricao": "Dosagem da gonadotrofina coriônica humana para diagnóstico e acompanhamento gestacional",
  "categoria": "laboratorio",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "tipo_exame",
      "tipo": "select",
      "label": "Tipo de Exame",
      "opcoes": [
        {
          "valor": "qualitativo",
          "label": "Qualitativo"
        },
        {
          "valor": "quantitativo",
          "label": "Quantitativo"
        }
      ],
      "referencia": "Qualitativo / Quantitativo"
    },
    {
      "id": "resultado_qualitativo",
      "tipo": "select",
      "label": "Resultado Qualitativo",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "beta_hcg_quantitativo",
      "tipo": "number",
      "label": "β-hCG Quantitativo",
      "unidade": "mUI/mL",
      "referencia": "< 5"
    },
    {
      "id": "correspondencia_gestacional",
      "tipo": "select",
      "label": "Correspondência Gestacional",
      "opcoes": [
        {
          "valor": "nao_gestante",
          "label": "Não gestante"
        },
        {
          "valor": "inicial",
          "label": "Gestação inicial (até 4 semanas)"
        },
        {
          "valor": "evolutiva",
          "label": "Gestação evolutiva"
        },
        {
          "valor": "incompativel",
          "label": "Valor incompatível com IG referida"
        }
      ],
      "referencia": "Não gestante"
    },
    {
      "id": "evolucao_seriada",
      "tipo": "select",
      "label": "Evolução Seriada",
      "opcoes": [
        {
          "valor": "nao_aplicavel",
          "label": "Não aplicável"
        },
        {
          "valor": "adequada",
          "label": "Elevação adequada"
        },
        {
          "valor": "inadequada",
          "label": "Elevação inadequada"
        },
        {
          "valor": "queda",
          "label": "Queda dos níveis"
        }
      ],
      "referencia": "Não aplicável"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Ausência de gestação"
        },
        {
          "valor": "gestacao_inicial",
          "label": "Gestação inicial confirmada"
        },
        {
          "valor": "gestacao_evolutiva",
          "label": "Gestação em evolução"
        },
        {
          "valor": "suspeita_abortamento",
          "label": "Suspeita de abortamento"
        },
        {
          "valor": "suspeita_ectopica",
          "label": "Suspeita de gestação ectópica"
        }
      ],
      "referencia": "Negativo / Alterado"
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
    "Gestação",
    "FIV",
    "Abortamento",
    "Seguimento",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "negativo",
      "name": "Negativo",
      "status": "normal",
      "description": "β-hCG negativo, sem elevação laboratorial significativa.",
      "resultSummary": "β-hCG negativo.",
      "results": {
        "tipo_exame": "Quantitativo",
        "resultado_qualitativo": "Negativo",
        "beta_hcg_quantitativo": "< 5 mUI/mL",
        "correspondencia_gestacional": "Não gestante",
        "evolucao_seriada": "Não aplicável",
        "impressao": "Negativo"
      },
      "interpretation": "Resultado de β-hCG dentro da faixa considerada negativa para o método utilizado. Correlacionar com data da coleta, atraso menstrual, uso de medicações e contexto clínico quando necessário.",
      "conclusion": "β-hCG negativo no material analisado."
    },
    {
      "id": "positivo",
      "name": "Positivo",
      "status": "alterado",
      "description": "β-hCG positivo, compatível com presença de gonadotrofina coriônica humana detectável.",
      "resultSummary": "β-hCG positivo.",
      "results": {
        "tipo_exame": "Quantitativo",
        "resultado_qualitativo": "Positivo",
        "beta_hcg_quantitativo": "1.250 mUI/mL",
        "correspondencia_gestacional": "Compatível com gestação inicial, conforme correlação clínica",
        "evolucao_seriada": "Avaliar evolução seriada se indicado",
        "impressao": "Positivo"
      },
      "interpretation": "Resultado positivo para β-hCG. A interpretação deve considerar idade gestacional estimada, data da última menstruação, contexto de FIV quando aplicável e evolução seriada dos valores.",
      "conclusion": "β-hCG positivo. Recomenda-se correlação clínica e acompanhamento conforme avaliação médica."
    },
    {
      "id": "indeterminado",
      "name": "Indeterminado / limítrofe",
      "status": "indefinido",
      "description": "Valor baixo ou limítrofe, sem definição isolada.",
      "resultSummary": "β-hCG em faixa limítrofe/indeterminada.",
      "results": {
        "tipo_exame": "Quantitativo",
        "resultado_qualitativo": "Indeterminado",
        "beta_hcg_quantitativo": "12 mUI/mL",
        "correspondencia_gestacional": "Valor baixo, sem definição isolada",
        "evolucao_seriada": "Repetir conforme orientação médica",
        "impressao": "Indeterminado"
      },
      "interpretation": "Valor de β-hCG em faixa limítrofe, sem definição diagnóstica isolada. Pode ocorrer em fase muito inicial, variação analítica, seguimento pós-evento gestacional ou outras situações clínicas.",
      "conclusion": "β-hCG indeterminado/limítrofe. Recomenda-se repetir a dosagem e correlacionar clinicamente."
    },
    {
      "id": "seguimento",
      "name": "Seguimento seriado",
      "status": "contextual",
      "description": "Modelo para acompanhamento evolutivo dos níveis de β-hCG.",
      "resultSummary": "β-hCG em acompanhamento seriado.",
      "results": {
        "tipo_exame": "Quantitativo",
        "resultado_qualitativo": "Detectável",
        "beta_hcg_quantitativo": "A preencher mUI/mL",
        "correspondencia_gestacional": "Correlacionar com exame anterior e contexto clínico",
        "evolucao_seriada": "A preencher conforme comparação seriada",
        "impressao": "Seguimento"
      },
      "interpretation": "A avaliação seriada do β-hCG deve considerar intervalo entre coletas e tendência de elevação, estabilização ou queda dos valores.",
      "conclusion": "Resultado destinado a seguimento seriado. Correlacionar com evolução clínica e exames anteriores."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "β-hCG personalizado.",
      "results": {
        "tipo_exame": "A preencher",
        "resultado_qualitativo": "A preencher",
        "beta_hcg_quantitativo": "A preencher mUI/mL",
        "correspondencia_gestacional": "A preencher",
        "evolucao_seriada": "A preencher",
        "impressao": "A preencher"
      },
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "β-hCG (Beta hCG)",
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
    "defaultProfileId": "negativo"
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
  "technique": "Dosagem de β-hCG realizada por método imunoquímico validado, com controles internos e referências aplicáveis ao ensaio.",
  "method": "Resultado expresso de forma qualitativa e/ou quantitativa conforme método utilizado. Valores devem ser interpretados de acordo com contexto clínico e evolução seriada quando indicada.",
  "parameters": [
    {
      "id": "tipo_exame",
      "label": "Tipo de Exame",
      "unidade": null,
      "referencia": "Qualitativo / Quantitativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Exame conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resultado_qualitativo",
      "label": "Resultado Qualitativo",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado Qualitativo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "beta_hcg_quantitativo",
      "label": "β-hCG Quantitativo",
      "unidade": "mUI/mL",
      "referencia": "< 5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar β-hCG Quantitativo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "correspondencia_gestacional",
      "label": "Correspondência Gestacional",
      "unidade": null,
      "referencia": "Não gestante",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Correspondência Gestacional conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "evolucao_seriada",
      "label": "Evolução Seriada",
      "unidade": null,
      "referencia": "Não aplicável",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Evolução Seriada conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Clínica",
      "unidade": null,
      "referencia": "Negativo / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Clínica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultado negativo para β-hCG conforme referência do método.",
    "altered": "Resultado positivo/detectável para β-hCG, com interpretação dependente do contexto clínico e evolução seriada.",
    "undefined": "Resultado limítrofe ou indeterminado, sem definição diagnóstica isolada."
  },
  "conclusion": {
    "normal": "β-hCG negativo.",
    "altered": "β-hCG positivo/detectável, recomendando correlação clínica.",
    "undefined": "β-hCG indeterminado/limítrofe, recomendando repetição e correlação clínica."
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
