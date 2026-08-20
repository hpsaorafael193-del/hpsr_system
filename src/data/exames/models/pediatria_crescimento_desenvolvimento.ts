import type { IntelligentExamModel } from "../types";

export const pediatria_crescimento_desenvolvimentoModel: IntelligentExamModel = {
  "id": "pediatria_crescimento_desenvolvimento",
  "nome": "Avaliação de Crescimento e Desenvolvimento",
  "descricao": "Monitoramento antropométrico e desenvolvimento neuropsicomotor",
  "categoria": "pediatria",
  "icone": "fa-chart-line",
  "campos": [
    {
      "id": "peso",
      "tipo": "number",
      "label": "Peso",
      "unidade": "kg",
      "referencia": "Percentis OMS"
    },
    {
      "id": "estatura",
      "tipo": "number",
      "label": "Estatura",
      "unidade": "cm",
      "referencia": "Percentis OMS"
    },
    {
      "id": "desenvolvimento",
      "tipo": "select",
      "label": "Desenvolvimento Neuropsicomotor",
      "opcoes": [
        {
          "valor": "adequado",
          "label": "Adequado para a idade"
        },
        {
          "valor": "atraso",
          "label": "Atraso no desenvolvimento"
        }
      ],
      "referencia": "Adequado"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Pediátrica",
      "opcoes": [
        {
          "valor": "adequado",
          "label": "Crescimento adequado"
        },
        {
          "valor": "alerta",
          "label": "Necessita acompanhamento"
        }
      ],
      "referencia": "Adequado"
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
      "resultSummary": "Avaliação de Crescimento e Desenvolvimento com Peso: 18,4; Estatura: 108; Desenvolvimento Neuropsicomotor: Marcos neuropsicomotores adequados para a faixa etária.",
      "interpretation": "Os parâmetros mensurados — Peso: 18,4 kg; Estatura: 108 cm; Desenvolvimento Neuropsicomotor: Marcos neuropsicomotores adequados para a faixa etária — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Avaliação de Crescimento e Desenvolvimento com parâmetros compatíveis com o padrão esperado, incluindo Peso: 18,4 kg; Estatura: 108 cm.",
      "results": {
        "peso": "18,4",
        "estatura": "108",
        "desenvolvimento": "Marcos neuropsicomotores adequados para a faixa etária",
        "impressao": "Crescimento e desenvolvimento compatíveis com a faixa etária"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Avaliação de Crescimento e Desenvolvimento: Peso: 14,2; Estatura: 103; Desenvolvimento Neuropsicomotor: Atraso discreto em linguagem expressiva para a faixa etária.",
      "interpretation": "Os resultados principais (Peso: 14,2 kg; Estatura: 103 cm; Desenvolvimento Neuropsicomotor: Atraso discreto em linguagem expressiva para a faixa etária) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Avaliação de Crescimento e Desenvolvimento com padrão alterado, documentado por Peso: 14,2 kg; Estatura: 103 cm.",
      "results": {
        "peso": "14,2",
        "estatura": "103",
        "desenvolvimento": "Atraso discreto em linguagem expressiva para a faixa etária",
        "impressao": "Peso abaixo do canal esperado e atraso discreto de linguagem, necessitando seguimento pediátrico"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Avaliação de Crescimento e Desenvolvimento: Peso: 16,0; Estatura: 105; Desenvolvimento Neuropsicomotor: Marcos globais adequados, com linguagem no limite inferior da faixa.",
      "interpretation": "Os principais resultados (Peso: 16,0 kg; Estatura: 105 cm; Desenvolvimento Neuropsicomotor: Marcos globais adequados, com linguagem no limite inferior da faixa) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Avaliação de Crescimento e Desenvolvimento com resultado limítrofe/inespecífico, destacando-se Peso: 16,0 kg; Estatura: 105 cm.",
      "results": {
        "peso": "16,0",
        "estatura": "105",
        "desenvolvimento": "Marcos globais adequados, com linguagem no limite inferior da faixa",
        "impressao": "Crescimento e desenvolvimento em faixa limítrofe, indicado acompanhamento evolutivo"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Avaliação de Crescimento e Desenvolvimento: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "peso": "18,4",
        "estatura": "108",
        "desenvolvimento": "Marcos neuropsicomotores adequados para a faixa etária",
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
    "title": "Avaliação de Crescimento e Desenvolvimento",
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
  "technique": "Avaliação pediátrica de crescimento e desenvolvimento realizada com antropometria e análise dos marcos neuropsicomotores pertinentes à faixa etária.",
  "method": "Mensuração padronizada de peso e estatura/comprimento, interpretação em curvas de crescimento e avaliação clínica dos marcos do desenvolvimento.",
  "parameters": [
    {
      "id": "peso",
      "label": "Peso",
      "unidade": "kg",
      "referencia": "Percentis OMS",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Peso conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "estatura",
      "label": "Estatura",
      "unidade": "cm",
      "referencia": "Percentis OMS",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estatura conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "desenvolvimento",
      "label": "Desenvolvimento Neuropsicomotor",
      "unidade": null,
      "referencia": "Adequado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Desenvolvimento Neuropsicomotor conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Pediátrica",
      "unidade": null,
      "referencia": "Adequado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Pediátrica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Avaliação de Crescimento e Desenvolvimento compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Avaliação de Crescimento e Desenvolvimento com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Avaliação de Crescimento e Desenvolvimento com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Avaliação de Crescimento e Desenvolvimento sem alterações significativas nos parâmetros avaliados.",
    "altered": "Avaliação de Crescimento e Desenvolvimento alterado conforme resultados objetivos descritos.",
    "undefined": "Avaliação de Crescimento e Desenvolvimento com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
