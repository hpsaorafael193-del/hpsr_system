import type { IntelligentExamModel } from "../types";

export const horm_cortisolModel: IntelligentExamModel = {
  "id": "horm_cortisol",
  "nome": "Cortisol",
  "descricao": "Avaliação da função adrenal",
  "categoria": "hormonal",
  "icone": "fa-clock",
  "campos": [
    {
      "id": "horario_coleta",
      "tipo": "select",
      "label": "Horário da Coleta",
      "opcoes": [
        {
          "valor": "manha",
          "label": "Manhã"
        },
        {
          "valor": "tarde",
          "label": "Tarde"
        },
        {
          "valor": "noite",
          "label": "Noite"
        }
      ],
      "referencia": "Manhã"
    },
    {
      "id": "valor",
      "tipo": "number",
      "label": "Cortisol",
      "unidade": "µg/dL",
      "referencia": "—"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Hormonal",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Eixo preservado"
        },
        {
          "valor": "insuficiencia",
          "label": "Insuficiência adrenal"
        },
        {
          "valor": "hipercortisolismo",
          "label": "Hipercortisolismo"
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
      "Conclusão": "Conclusão"
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
      "resultSummary": "Cortisol com Horário da Coleta: 08:00; Cortisol: 14,2.",
      "interpretation": "Os parâmetros mensurados — Horário da Coleta: 08:00; Cortisol: 14,2 µg/dL — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Cortisol com parâmetros compatíveis com o padrão esperado, incluindo Horário da Coleta: 08:00; Cortisol: 14,2 µg/dL.",
      "results": {
        "horario_coleta": "08:00",
        "valor": "14,2",
        "impressao": "Cortisol matinal em faixa esperada"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Cortisol: Cortisol: 28,4.",
      "interpretation": "Os resultados principais (Cortisol: 28,4 µg/dL) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Cortisol com padrão alterado, documentado por Cortisol: 28,4 µg/dL.",
      "results": {
        "horario_coleta": "08:00",
        "valor": "28,4",
        "impressao": "Cortisol matinal elevado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Cortisol: Cortisol: 19,8.",
      "interpretation": "Os principais resultados (Cortisol: 19,8 µg/dL) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Cortisol com resultado limítrofe/inespecífico, destacando-se Cortisol: 19,8 µg/dL.",
      "results": {
        "horario_coleta": "08:00",
        "valor": "19,8",
        "impressao": "Cortisol matinal em faixa limítrofe para o método"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Cortisol: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "horario_coleta": "08:00",
        "valor": "14,2",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Cortisol",
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
  "technique": "Amostra biológica processada para dosagem de cortisol, com registro do horário de coleta devido à variação circadiana do hormônio.",
  "method": "Dosagem sérica de cortisol por imunoensaio validado pelo laboratório, interpretada segundo horário de coleta e intervalo de referência do método.",
  "parameters": [
    {
      "id": "horario_coleta",
      "label": "Horário da Coleta",
      "unidade": null,
      "referencia": "Manhã",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Horário da Coleta conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "valor",
      "label": "Cortisol",
      "unidade": "µg/dL",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cortisol conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Hormonal",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Hormonal conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Cortisol compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Cortisol com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Cortisol com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Cortisol sem alterações significativas nos parâmetros avaliados.",
    "altered": "Cortisol alterado conforme resultados objetivos descritos.",
    "undefined": "Cortisol com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
