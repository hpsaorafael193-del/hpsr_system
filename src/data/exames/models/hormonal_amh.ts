import type { IntelligentExamModel } from "../types";

export const hormonal_amhModel: IntelligentExamModel = {
  "id": "hormonal_amh",
  "nome": "Hormônio Anti-Mülleriano (AMH)",
  "descricao": "Dosagem sérica de AMH utilizada para avaliação da reserva ovariana e resposta esperada à estimulação ovariana.",
  "categoria": "hormonal",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "amh_valor",
      "tipo": "number",
      "label": "AMH",
      "unidade": "ng/mL",
      "referencia": "Muito baixo: <0.5 | Baixo: 0.5–1.0 | Normal: 1.0–3.5 | Alto: >3.5"
    },
    {
      "id": "contexto_clinico",
      "tipo": "select",
      "label": "Contexto clínico",
      "opcoes": [
        {
          "valor": "avaliacao_reserva_ovariana",
          "label": "Avaliação de reserva ovariana"
        },
        {
          "valor": "infertilidade",
          "label": "Investigação de infertilidade"
        },
        {
          "valor": "reproducao_assistida",
          "label": "Planejamento de reprodução assistida"
        },
        {
          "valor": "suspeita_sop",
          "label": "Suspeita de síndrome dos ovários policísticos (SOP)"
        },
        {
          "valor": "controle_tratamento",
          "label": "Acompanhamento de tratamento hormonal"
        }
      ],
      "referencia": "Contexto da solicitação"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Reserva ovariana dentro do esperado"
        },
        {
          "valor": "baixa",
          "label": "Reserva ovariana reduzida"
        },
        {
          "valor": "muito_baixa",
          "label": "Reserva ovariana muito reduzida"
        },
        {
          "valor": "elevada",
          "label": "AMH elevado (avaliar possibilidade de SOP)"
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
      "resultSummary": "Hormônio Anti-Mülleriano (AMH) com AMH: 2,2; Contexto clínico: Avaliação de reserva ovariana.",
      "interpretation": "Os parâmetros mensurados — AMH: 2,2 ng/mL; Contexto clínico: Avaliação de reserva ovariana — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Hormônio Anti-Mülleriano (AMH) com parâmetros compatíveis com o padrão esperado, incluindo AMH: 2,2 ng/mL; Contexto clínico: Avaliação de reserva ovariana.",
      "results": {
        "amh_valor": "2,2",
        "contexto_clinico": "Avaliação de reserva ovariana",
        "impressao": "AMH em faixa compatível com reserva ovariana preservada"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Hormônio Anti-Mülleriano (AMH): AMH: 0,4.",
      "interpretation": "Os resultados principais (AMH: 0,4 ng/mL) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Hormônio Anti-Mülleriano (AMH) com padrão alterado, documentado por AMH: 0,4 ng/mL.",
      "results": {
        "amh_valor": "0,4",
        "contexto_clinico": "Avaliação de reserva ovariana",
        "impressao": "AMH reduzido, compatível com baixa reserva ovariana no contexto adequado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Hormônio Anti-Mülleriano (AMH): AMH: 0,9.",
      "interpretation": "Os principais resultados (AMH: 0,9 ng/mL) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Hormônio Anti-Mülleriano (AMH) com resultado limítrofe/inespecífico, destacando-se AMH: 0,9 ng/mL.",
      "results": {
        "amh_valor": "0,9",
        "contexto_clinico": "Avaliação de reserva ovariana",
        "impressao": "AMH em faixa baixa/limítrofe"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Hormônio Anti-Mülleriano (AMH): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "amh_valor": "2,2",
        "contexto_clinico": "Avaliação de reserva ovariana",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Hormônio Anti-Mülleriano (AMH)",
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
  "technique": "Amostra sérica processada para dosagem do hormônio anti-Mülleriano, marcador utilizado na avaliação laboratorial da reserva ovariana no contexto adequado.",
  "method": "Quantificação de AMH por imunoensaio automatizado validado, com interpretação segundo método, faixa etária e contexto clínico.",
  "parameters": [
    {
      "id": "amh_valor",
      "label": "AMH",
      "unidade": "ng/mL",
      "referencia": "Muito baixo: <0.5 | Baixo: 0.5–1.0 | Normal: 1.0–3.5 | Alto: >3.5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar AMH conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "contexto_clinico",
      "label": "Contexto clínico",
      "unidade": null,
      "referencia": "Contexto da solicitação",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Contexto clínico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Hormônio Anti-Mülleriano (AMH) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Hormônio Anti-Mülleriano (AMH) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Hormônio Anti-Mülleriano (AMH) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Hormônio Anti-Mülleriano (AMH) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Hormônio Anti-Mülleriano (AMH) alterado conforme resultados objetivos descritos.",
    "undefined": "Hormônio Anti-Mülleriano (AMH) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
