import type { IntelligentExamModel } from "../types";

export const lab_gasometria_arterialModel: IntelligentExamModel = {
  "id": "lab_gasometria_arterial",
  "nome": "Gasometria Arterial",
  "descricao": "Avaliação do equilíbrio ácido-base, ventilação e oxigenação",
  "categoria": "laboratorio",
  "icone": "fa-lungs",
  "campos": [
    {
      "id": "ph",
      "tipo": "number",
      "label": "pH",
      "referencia": "7.35 – 7.45"
    },
    {
      "id": "pco2",
      "tipo": "number",
      "label": "pCO₂",
      "unidade": "mmHg",
      "referencia": "35 – 45"
    },
    {
      "id": "po2",
      "tipo": "number",
      "label": "pO₂",
      "unidade": "mmHg",
      "referencia": "80 – 100"
    },
    {
      "id": "hco3",
      "tipo": "number",
      "label": "HCO₃⁻",
      "unidade": "mEq/L",
      "referencia": "22 – 26"
    },
    {
      "id": "saturacao_o2",
      "tipo": "number",
      "label": "Saturação de O₂",
      "unidade": "%",
      "referencia": "≥ 95"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Gasométrica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Equilíbrio ácido-base preservado"
        },
        {
          "valor": "acidose",
          "label": "Acidose"
        },
        {
          "valor": "alcalose",
          "label": "Alcalose"
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
      "resultSummary": "Gasometria Arterial com pH: 7,40; pCO₂: 40; pO₂: 92.",
      "interpretation": "Os parâmetros mensurados — pH: 7,40; pCO₂: 40 mmHg; pO₂: 92 mmHg; HCO₃⁻: 24 mEq/L — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Gasometria Arterial com parâmetros compatíveis com o padrão esperado, incluindo pH: 7,40; pCO₂: 40 mmHg.",
      "results": {
        "ph": "7,40",
        "pco2": "40",
        "po2": "92",
        "hco3": "24",
        "saturacao_o2": "97",
        "impressao": "Equilíbrio ácido-base e oxigenação preservados"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Gasometria Arterial: pH: 7,29; pCO₂: 52; pO₂: 71; HCO₃⁻: 24.",
      "interpretation": "Os resultados principais (pH: 7,29; pCO₂: 52 mmHg; pO₂: 71 mmHg; Saturação de O₂: 92 %) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Gasometria Arterial com padrão alterado, documentado por pH: 7,29; pCO₂: 52 mmHg.",
      "results": {
        "ph": "7,29",
        "pco2": "52",
        "po2": "71",
        "hco3": "24",
        "saturacao_o2": "92",
        "impressao": "Acidemia com retenção de CO₂ e hipoxemia leve"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Gasometria Arterial: pH: 7,35; pCO₂: 46; pO₂: 78; HCO₃⁻: 25.",
      "interpretation": "Os principais resultados (pH: 7,35; pCO₂: 46 mmHg; pO₂: 78 mmHg; HCO₃⁻: 25 mEq/L) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Gasometria Arterial com resultado limítrofe/inespecífico, destacando-se pH: 7,35; pCO₂: 46 mmHg.",
      "results": {
        "ph": "7,35",
        "pco2": "46",
        "po2": "78",
        "hco3": "25",
        "saturacao_o2": "94",
        "impressao": "Alterações gasométricas discretas, sem distúrbio grave isolado"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Gasometria Arterial: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "ph": "7,40",
        "pco2": "40",
        "po2": "92",
        "hco3": "24",
        "saturacao_o2": "97",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Gasometria Arterial",
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
  "technique": "Amostra de sangue arterial coletada em condições adequadas e analisada para avaliação do equilíbrio ácido-base, ventilação e oxigenação.",
  "method": "Análise gasométrica por eletrodos específicos para pH, pCO₂ e pO₂, com cálculo/derivação dos demais parâmetros conforme o equipamento.",
  "parameters": [
    {
      "id": "ph",
      "label": "pH",
      "unidade": null,
      "referencia": "7.35 – 7.45",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar pH conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "pco2",
      "label": "pCO₂",
      "unidade": "mmHg",
      "referencia": "35 – 45",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar pCO₂ conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "po2",
      "label": "pO₂",
      "unidade": "mmHg",
      "referencia": "80 – 100",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar pO₂ conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hco3",
      "label": "HCO₃⁻",
      "unidade": "mEq/L",
      "referencia": "22 – 26",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar HCO₃⁻ conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "saturacao_o2",
      "label": "Saturação de O₂",
      "unidade": "%",
      "referencia": "≥ 95",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Saturação de O₂ conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Gasométrica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Gasométrica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Gasometria Arterial compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Gasometria Arterial com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Gasometria Arterial com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Gasometria Arterial sem alterações significativas nos parâmetros avaliados.",
    "altered": "Gasometria Arterial alterado conforme resultados objetivos descritos.",
    "undefined": "Gasometria Arterial com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
