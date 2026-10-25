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
        },
        {
          "valor": "indeterminado",
          "label": "Inconclusivo / indeterminado"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "beta_hcg_quantitativo",
      "tipo": "number",
      "label": "β-hCG Quantitativo",
      "unidade": "mUI/mL",
      "referencia": "Negativo: < 5; inconclusivo: 5–25; positivo: > 25 mUI/mL"
    },
    {
      "id": "correspondencia_gestacional",
      "tipo": "select",
      "label": "Estimativa Gestacional pelo β-hCG",
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
      "referencia": "Estimativa aproximada; faixas de β-hCG se sobrepõem"
    },
    {
      "id": "evolucao_seriada",
      "tipo": "select",
      "label": "Evolução Seriada",
      "opcoes": [
        {
          "valor": "sem_curva_seriada",
          "label": "Sem curva seriada neste exame"
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
      "referencia": "Comparar apenas quando houver dosagens seriadas"
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
        "beta_hcg_quantitativo": "2,1",
        "correspondencia_gestacional": "Faixa de não gestante",
        "evolucao_seriada": "Sem indicação de curva seriada neste resultado isolado",
        "impressao": "β-hCG negativo"
      },
      "interpretation": "A concentração de β-hCG está abaixo do limite de detecção de gravidez adotado pelo método. Uma coleta muito precoce pode preceder a elevação do hormônio.",
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
        "beta_hcg_quantitativo": "1840",
        "correspondencia_gestacional": "Compatível com gestação inicial; correlacionar com idade gestacional",
        "evolucao_seriada": "Controle seriado somente quando clinicamente indicado",
        "impressao": "β-hCG positivo"
      },
      "interpretation": "A concentração de β-hCG supera o limite de positividade do método. A dosagem isolada não determina a localização nem a viabilidade da gestação.",
      "conclusion": "β-hCG positivo. Recomenda-se correlação clínica e acompanhamento conforme avaliação médica."
    },
    {
      "id": "indeterminado",
      "name": "Inconclusivo / indeterminado",
      "status": "indefinido",
      "description": "Valor baixo ou limítrofe, sem definição isolada.",
      "resultSummary": "β-hCG em faixa limítrofe/indeterminada.",
      "results": {
        "tipo_exame": "Quantitativo",
        "resultado_qualitativo": "Inconclusivo",
        "beta_hcg_quantitativo": "14",
        "correspondencia_gestacional": "Faixa limítrofe, sem definição isolada",
        "evolucao_seriada": "Repetir em 48–72 horas conforme avaliação clínica",
        "impressao": "β-hCG em faixa indeterminada"
      },
      "interpretation": "A concentração está na faixa intermediária do método, sem permitir confirmar ou excluir gestação nesta amostra. Nova dosagem permite verificar se há elevação ou queda do hormônio.",
      "conclusion": "β-hCG inconclusivo (faixa indeterminada)."
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
        "beta_hcg_quantitativo": "286",
        "correspondencia_gestacional": "Compatível com gestação muito inicial; interpretar pela tendência",
        "evolucao_seriada": "Comparar com dosagem anterior em 48–72 horas",
        "impressao": "β-hCG em seguimento seriado"
      },
      "interpretation": "A avaliação seriada do β-hCG deve considerar intervalo entre coletas e tendência de elevação, estabilização ou queda dos valores.",
      "conclusion": "Resultado destinado a seguimento seriado. Correlacionar com evolução clínica e exames anteriores."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Preencha os achados observados ou edite o laudo. Nenhum resultado normal é preenchido automaticamente.",
      "resultSummary": "β-hCG (Beta hCG): modelo personalizado preparado para edição dos resultados.",
      "results": {
        "tipo_exame": "Quantitativo",
        "resultado_qualitativo": "Negativo",
        "beta_hcg_quantitativo": "2,1",
        "correspondencia_gestacional": "Faixa de não gestante",
        "evolucao_seriada": "Sem indicação de curva seriada neste resultado isolado",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      },
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados."
    }
  ],
  "variables": [
    {
      "id": "idade_gestacional_referida",
      "label": "Idade gestacional referida (semanas)",
      "tipo": "number",
      "required": false,
      "appliesTo": [
        "positivo"
      ]
    }
  ],
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
  "documentModel": {
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
  "technique": "Amostra sérica processada para determinação quantitativa de β-hCG, com interpretação conforme concentração obtida e contexto gestacional.",
  "method": "Imunoensaio quantitativo para gonadotrofina coriônica humana beta, com resultado expresso em mUI/mL e comparação com faixas interpretativas do método.",
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
      "id": "idade_gestacional_referida",
      "label": "Idade Gestacional Informada",
      "unidade": "semanas",
      "referencia": "Informação clínica",
      "resultPlaceholder": "A informar",
      "interpretationHint": "Usar a idade gestacional informada para contextualizar o valor quantitativo, sem substituir DUM ou ultrassonografia."
    },
    {
      "id": "correspondencia_gestacional",
      "label": "Estimativa Gestacional pelo β-hCG",
      "unidade": null,
      "referencia": "Estimativa aproximada; faixas de β-hCG se sobrepõem",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Estimativa gestacional aproximada calculada a partir do valor quantitativo gerado pelo motor; confirmar idade gestacional por DUM e/ou ultrassonografia."
    },
    {
      "id": "evolucao_seriada",
      "label": "Evolução Seriada",
      "unidade": null,
      "referencia": "Comparar apenas quando houver dosagens seriadas",
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
    "normal": "Resultados de β-hCG (Beta hCG) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "β-hCG (Beta hCG) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "β-hCG (Beta hCG) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "β-hCG (Beta hCG) sem alterações significativas nos parâmetros avaliados.",
    "altered": "β-hCG (Beta hCG) alterado conforme resultados objetivos descritos.",
    "undefined": "β-hCG (Beta hCG) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
  },
  "attachments": {
    "enabled": false,
    "mode": "future",
    "acceptedTypes": [
      "image/png",
      "image/jpeg"
    ]
  }
};
