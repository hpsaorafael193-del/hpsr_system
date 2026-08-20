import type { IntelligentExamModel } from "../types";

export const obst_doppler_materno_fetalModel: IntelligentExamModel = {
  "id": "obst_doppler_materno_fetal",
  "nome": "Doppler Obstétrico (Materno-fetal)",
  "descricao": "Avaliação hemodinâmica fetal e uteroplacentária",
  "categoria": "obstetricia",
  "icone": "fa-wave-square",
  "campos": [
    {
      "id": "arteria_umbilical",
      "tipo": "select",
      "label": "Artéria Umbilical",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "resistencia_aumentada",
          "label": "Resistência aumentada"
        },
        {
          "valor": "fluxo_diastolico_ausente",
          "label": "Fluxo diastólico ausente"
        },
        {
          "valor": "fluxo_reverso",
          "label": "Fluxo reverso"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "arteria_cerebral_media",
      "tipo": "select",
      "label": "Artéria Cerebral Média",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "centralizacao",
          "label": "Centralização fetal"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "ducto_venoso",
      "tipo": "select",
      "label": "Ducto Venoso",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "alterado",
          "label": "Alterado"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Doppler",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Hemodinâmica fetal preservada"
        },
        {
          "valor": "insuficiencia_placentaria",
          "label": "Sugestivo de insuficiência placentária"
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
      "resultSummary": "Doppler Obstétrico (Materno-fetal) com Artéria Umbilical: Normal; Artéria Cerebral Média: Normal; Ducto Venoso: Normal.",
      "interpretation": "Os parâmetros mensurados — Artéria Umbilical: Normal; Artéria Cerebral Média: Normal; Ducto Venoso: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Doppler Obstétrico (Materno-fetal) com parâmetros compatíveis com o padrão esperado, incluindo Artéria Umbilical: Normal; Artéria Cerebral Média: Normal.",
      "results": {
        "arteria_umbilical": "Normal",
        "arteria_cerebral_media": "Normal",
        "ducto_venoso": "Normal",
        "impressao": "Doppler Obstétrico (Materno-fetal) com parâmetros compatíveis com o padrão esperado, incluindo Artéria Umbilical: Normal; Artéria Cerebral Média: Normal"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Doppler Obstétrico (Materno-fetal): Artéria Umbilical: Índice de pulsatilidade aumentado, fluxo diastólico ainda presente; Artéria Cerebral Média: Redução do índice de pulsatilidade; Ducto Venoso: Onda A positiva.",
      "interpretation": "Os resultados principais (Artéria Umbilical: Índice de pulsatilidade aumentado, fluxo diastólico ainda presente; Artéria Cerebral Média: Redução do índice de pulsatilidade; Ducto Venoso: Onda A positiva) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Doppler Obstétrico (Materno-fetal) com padrão alterado, documentado por Artéria Umbilical: Índice de pulsatilidade aumentado, fluxo diastólico ainda presente; Artéria Cerebral Média: Redução do índice de pulsatilidade.",
      "results": {
        "arteria_umbilical": "Índice de pulsatilidade aumentado, fluxo diastólico ainda presente",
        "arteria_cerebral_media": "Redução do índice de pulsatilidade",
        "ducto_venoso": "Onda A positiva",
        "impressao": "Redistribuição hemodinâmica fetal com aumento de resistência placentária"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Doppler Obstétrico (Materno-fetal): Artéria Umbilical: Índice de pulsatilidade em limite superior; Artéria Cerebral Média: Índice de pulsatilidade em limite inferior.",
      "interpretation": "Os principais resultados (Artéria Umbilical: Índice de pulsatilidade em limite superior; Artéria Cerebral Média: Índice de pulsatilidade em limite inferior) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Doppler Obstétrico (Materno-fetal) com resultado limítrofe/inespecífico, destacando-se Artéria Umbilical: Índice de pulsatilidade em limite superior; Artéria Cerebral Média: Índice de pulsatilidade em limite inferior.",
      "results": {
        "arteria_umbilical": "Índice de pulsatilidade em limite superior",
        "arteria_cerebral_media": "Índice de pulsatilidade em limite inferior",
        "ducto_venoso": "Normal",
        "impressao": "Índices Doppler limítrofes, sem alteração crítica do fluxo"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Doppler Obstétrico (Materno-fetal): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "arteria_umbilical": "Normal",
        "arteria_cerebral_media": "Normal",
        "ducto_venoso": "Normal",
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
    "title": "Doppler Obstétrico (Materno-fetal)",
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
  "technique": "Doppler obstétrico realizado para avaliação hemodinâmica materna, placentária e fetal nos vasos selecionados.",
  "method": "Ultrassonografia Doppler pulsada e colorida com obtenção de índices velocimétricos das artérias uterinas, umbilical, cerebral média e outros vasos quando indicados.",
  "parameters": [
    {
      "id": "arteria_umbilical",
      "label": "Artéria Umbilical",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Artéria Umbilical conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "arteria_cerebral_media",
      "label": "Artéria Cerebral Média",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Artéria Cerebral Média conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ducto_venoso",
      "label": "Ducto Venoso",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ducto Venoso conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Doppler",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Doppler conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Doppler Obstétrico (Materno-fetal) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Doppler Obstétrico (Materno-fetal) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Doppler Obstétrico (Materno-fetal) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Doppler Obstétrico (Materno-fetal) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Doppler Obstétrico (Materno-fetal) alterado conforme resultados objetivos descritos.",
    "undefined": "Doppler Obstétrico (Materno-fetal) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
