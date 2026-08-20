import type { IntelligentExamModel } from "../types";

export const lab_painel_alergiaModel: IntelligentExamModel = {
  "id": "lab_painel_alergia",
  "nome": "Painel de Alergia",
  "descricao": "Investigação de sensibilização alérgica por IgE total e específica",
  "categoria": "laboratorio",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "ige_total",
      "tipo": "number",
      "label": "IgE Total",
      "unidade": "UI/mL",
      "referencia": "< 100"
    },
    {
      "id": "alergenos_respiratorios",
      "tipo": "select",
      "label": "Alergenos Respiratórios",
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
      "id": "alergenos_alimentares",
      "tipo": "select",
      "label": "Alergenos Alimentares",
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
      "id": "alergenos_medicamentos",
      "tipo": "select",
      "label": "Alergenos Medicamentosos",
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
      "id": "tipo_reacao",
      "tipo": "select",
      "label": "Tipo de Reação",
      "opcoes": [
        {
          "valor": "cutanea",
          "label": "Cutânea"
        },
        {
          "valor": "respiratoria",
          "label": "Respiratória"
        },
        {
          "valor": "gastrointestinal",
          "label": "Gastrointestinal"
        },
        {
          "valor": "sistemica",
          "label": "Sistêmica"
        },
        {
          "valor": "nao_identificada",
          "label": "Não identificada"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "gravidade",
      "tipo": "select",
      "label": "Gravidade",
      "opcoes": [
        {
          "valor": "leve",
          "label": "Leve"
        },
        {
          "valor": "moderada",
          "label": "Moderada"
        },
        {
          "valor": "grave",
          "label": "Grave"
        }
      ],
      "referencia": "Leve"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem evidências laboratoriais de alergia"
        },
        {
          "valor": "sensibilizacao",
          "label": "Sensibilização alérgica identificada"
        },
        {
          "valor": "alergia_confirmada",
          "label": "Perfil compatível com doença alérgica"
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
      "description": "Parâmetros dentro das referências disponíveis.",
      "resultSummary": "Painel de Alergia com IgE Total: 46; Alergenos Respiratórios: Negativo; Alergenos Alimentares: Negativo.",
      "interpretation": "Os parâmetros mensurados — IgE Total: 46 UI/mL; Alergenos Respiratórios: Negativo; Alergenos Alimentares: Negativo; Alergenos Medicamentosos: Negativo — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Painel de Alergia com parâmetros compatíveis com o padrão esperado, incluindo IgE Total: 46 UI/mL; Alergenos Respiratórios: Negativo.",
      "results": {
        "ige_total": "46",
        "alergenos_respiratorios": "Negativo",
        "alergenos_alimentares": "Negativo",
        "alergenos_medicamentos": "Negativo",
        "tipo_reacao": "Sem sensibilização específica detectável",
        "gravidade": "Não aplicável",
        "impressao": "Painel sem sensibilização IgE-mediada detectável nos alérgenos pesquisados"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Painel de Alergia: IgE Total: 286; Alergenos Respiratórios: Positivo para ácaros (Dermatophagoides spp.); Tipo de Reação: Sensibilização respiratória IgE-mediada; Gravidade: Moderada pelo padrão laboratorial.",
      "interpretation": "Os resultados principais (IgE Total: 286 UI/mL; Alergenos Respiratórios: Positivo para ácaros (Dermatophagoides spp.); Tipo de Reação: Sensibilização respiratória IgE-mediada; Gravidade: Moderada pelo padrão laboratorial) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Painel de Alergia com padrão alterado, documentado por IgE Total: 286 UI/mL; Alergenos Respiratórios: Positivo para ácaros (Dermatophagoides spp.).",
      "results": {
        "ige_total": "286",
        "alergenos_respiratorios": "Positivo para ácaros (Dermatophagoides spp.)",
        "alergenos_alimentares": "Negativo",
        "alergenos_medicamentos": "Negativo",
        "tipo_reacao": "Sensibilização respiratória IgE-mediada",
        "gravidade": "Moderada pelo padrão laboratorial",
        "impressao": "Sensibilização respiratória a ácaros com IgE total elevada"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Painel de Alergia: IgE Total: 108; Alergenos Respiratórios: Baixa reatividade para ácaros; Tipo de Reação: Sensibilização de baixa intensidade.",
      "interpretation": "Os principais resultados (IgE Total: 108 UI/mL; Alergenos Respiratórios: Baixa reatividade para ácaros; Tipo de Reação: Sensibilização de baixa intensidade; Gravidade: Leve) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Painel de Alergia com resultado limítrofe/inespecífico, destacando-se IgE Total: 108 UI/mL; Alergenos Respiratórios: Baixa reatividade para ácaros.",
      "results": {
        "ige_total": "108",
        "alergenos_respiratorios": "Baixa reatividade para ácaros",
        "alergenos_alimentares": "Negativo",
        "alergenos_medicamentos": "Negativo",
        "tipo_reacao": "Sensibilização de baixa intensidade",
        "gravidade": "Leve",
        "impressao": "Reatividade alérgica limítrofe, sem definição clínica isolada"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Painel de Alergia: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "ige_total": "46",
        "alergenos_respiratorios": "Negativo",
        "alergenos_alimentares": "Negativo",
        "alergenos_medicamentos": "Negativo",
        "tipo_reacao": "Sem sensibilização específica detectável",
        "gravidade": "Não aplicável",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Painel de Alergia",
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
  "technique": "Amostra sérica processada para pesquisa de sensibilização alérgica pelos marcadores incluídos no painel solicitado.",
  "method": "Determinação de IgE total e/ou IgE específica por imunoensaio, com interpretação por classe de reatividade e alérgeno pesquisado quando aplicável.",
  "parameters": [
    {
      "id": "ige_total",
      "label": "IgE Total",
      "unidade": "UI/mL",
      "referencia": "< 100",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar IgE Total conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "alergenos_respiratorios",
      "label": "Alergenos Respiratórios",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Alergenos Respiratórios conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "alergenos_alimentares",
      "label": "Alergenos Alimentares",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Alergenos Alimentares conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "alergenos_medicamentos",
      "label": "Alergenos Medicamentosos",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Alergenos Medicamentosos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tipo_reacao",
      "label": "Tipo de Reação",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Reação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "gravidade",
      "label": "Gravidade",
      "unidade": null,
      "referencia": "Leve",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Gravidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Clínica",
      "unidade": null,
      "referencia": "Normal / Alterado",
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
    "normal": "Resultados de Painel de Alergia compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Painel de Alergia com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Painel de Alergia com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Painel de Alergia sem alterações significativas nos parâmetros avaliados.",
    "altered": "Painel de Alergia alterado conforme resultados objetivos descritos.",
    "undefined": "Painel de Alergia com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
