import type { IntelligentExamModel } from "../types";

export const neuro_enmgModel: IntelligentExamModel = {
  "id": "neuro_enmg",
  "nome": "Eletroneuromiografia (ENMG)",
  "descricao": "Avaliação da condução nervosa e da atividade muscular",
  "categoria": "neurologia",
  "icone": "fa-dna",
  "campos": [
    {
      "id": "territorio",
      "tipo": "select",
      "label": "Território Avaliado",
      "opcoes": [
        {
          "valor": "membros_superiores",
          "label": "Membros Superiores"
        },
        {
          "valor": "membros_inferiores",
          "label": "Membros Inferiores"
        },
        {
          "valor": "ambos",
          "label": "Ambos"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "conducao_nervosa",
      "tipo": "select",
      "label": "Condução Nervosa",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "reduzida",
          "label": "Reduzida"
        },
        {
          "valor": "bloqueio",
          "label": "Bloqueio de condução"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "atividade_muscular",
      "tipo": "select",
      "label": "Atividade Muscular",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "denervacao",
          "label": "Sinais de denervação"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "padrao_neuropatico",
      "tipo": "select",
      "label": "Padrão Neuropático",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "axonal",
          "label": "Axonal"
        },
        {
          "valor": "desmielinizante",
          "label": "Desmielinizante"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Neurológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Exame normal"
        },
        {
          "valor": "neuropatia",
          "label": "Neuropatia periférica"
        },
        {
          "valor": "radiculopatia",
          "label": "Radiculopatia"
        },
        {
          "valor": "miopatia",
          "label": "Miopatia"
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
      "resultSummary": "Eletroneuromiografia (ENMG) com Território Avaliado: Membros superiores e/ou inferiores conforme solicitação; Condução Nervosa: Normal; Atividade Muscular: Normal.",
      "interpretation": "Os parâmetros mensurados — Território Avaliado: Membros superiores e/ou inferiores conforme solicitação; Condução Nervosa: Normal; Atividade Muscular: Normal; Padrão Neuropático: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Eletroneuromiografia (ENMG) com parâmetros compatíveis com o padrão esperado, incluindo Território Avaliado: Membros superiores e/ou inferiores conforme solicitação; Condução Nervosa: Normal.",
      "results": {
        "territorio": "Membros superiores e/ou inferiores conforme solicitação",
        "conducao_nervosa": "Normal",
        "atividade_muscular": "Normal",
        "padrao_neuropatico": "Ausente",
        "impressao": "Estudo de condução nervosa e atividade muscular sem sinais de neuropatia ou miopatia"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Eletroneuromiografia (ENMG): Território Avaliado: Membro superior direito; Condução Nervosa: Redução da velocidade de condução sensitiva do nervo mediano; Atividade Muscular: Sinais de desnervação crônica discreta em território correspondente; Padrão Neuropático: Presente, focal.",
      "interpretation": "Os resultados principais (Território Avaliado: Membro superior direito; Condução Nervosa: Redução da velocidade de condução sensitiva do nervo mediano; Atividade Muscular: Sinais de desnervação crônica discreta em território correspondente; Padrão Neuropático: Presente, focal) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Eletroneuromiografia (ENMG) com padrão alterado, documentado por Território Avaliado: Membro superior direito; Condução Nervosa: Redução da velocidade de condução sensitiva do nervo mediano.",
      "results": {
        "territorio": "Membro superior direito",
        "conducao_nervosa": "Redução da velocidade de condução sensitiva do nervo mediano",
        "atividade_muscular": "Sinais de desnervação crônica discreta em território correspondente",
        "padrao_neuropatico": "Presente, focal",
        "impressao": "Neuropatia do nervo mediano compatível com síndrome do túnel do carpo moderada"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Eletroneuromiografia (ENMG): Condução Nervosa: Velocidade sensitiva discretamente reduzida; Atividade Muscular: Sem desnervação ativa; Padrão Neuropático: Não definido.",
      "interpretation": "Os principais resultados (Condução Nervosa: Velocidade sensitiva discretamente reduzida; Atividade Muscular: Sem desnervação ativa; Padrão Neuropático: Não definido) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Eletroneuromiografia (ENMG) com resultado limítrofe/inespecífico, destacando-se Condução Nervosa: Velocidade sensitiva discretamente reduzida; Atividade Muscular: Sem desnervação ativa.",
      "results": {
        "territorio": "Membros superiores e/ou inferiores conforme solicitação",
        "conducao_nervosa": "Velocidade sensitiva discretamente reduzida",
        "atividade_muscular": "Sem desnervação ativa",
        "padrao_neuropatico": "Não definido",
        "impressao": "Alteração de condução discreta e inespecífica, sem neuropatia estabelecida"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Eletroneuromiografia (ENMG): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "territorio": "Membros superiores e/ou inferiores conforme solicitação",
        "conducao_nervosa": "Normal",
        "atividade_muscular": "Normal",
        "padrao_neuropatico": "Ausente",
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
    "title": "Eletroneuromiografia (ENMG)",
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
  "technique": "Eletroneuromiografia realizada para avaliação da condução nervosa periférica e da atividade elétrica muscular nos territórios selecionados.",
  "method": "Estudos de condução motora e sensitiva associados à eletromiografia de agulha quando indicada, com análise de latências, amplitudes, velocidades e padrão de unidades motoras.",
  "parameters": [
    {
      "id": "territorio",
      "label": "Território Avaliado",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Território Avaliado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "conducao_nervosa",
      "label": "Condução Nervosa",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Condução Nervosa conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "atividade_muscular",
      "label": "Atividade Muscular",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Atividade Muscular conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "padrao_neuropatico",
      "label": "Padrão Neuropático",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão Neuropático conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Neurológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Neurológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Eletroneuromiografia (ENMG) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Eletroneuromiografia (ENMG) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Eletroneuromiografia (ENMG) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Eletroneuromiografia (ENMG) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Eletroneuromiografia (ENMG) alterado conforme resultados objetivos descritos.",
    "undefined": "Eletroneuromiografia (ENMG) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
