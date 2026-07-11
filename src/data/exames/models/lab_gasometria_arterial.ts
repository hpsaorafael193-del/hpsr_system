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
  "technique": "Amostra processada conforme método laboratorial validado, com controles internos e referências aplicáveis ao exame.",
  "method": "Método laboratorial compatível com o parâmetro analisado, conforme validação interna do serviço.",
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
