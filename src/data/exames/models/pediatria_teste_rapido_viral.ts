import type { IntelligentExamModel } from "../types";

export const pediatria_teste_rapido_viralModel: IntelligentExamModel = {
  "id": "pediatria_teste_rapido_viral",
  "nome": "Teste Rápido Viral",
  "descricao": "Detecção rápida de vírus respiratórios em pediatria",
  "categoria": "pediatria",
  "icone": "fa-virus",
  "campos": [
    {
      "id": "virus",
      "tipo": "select",
      "label": "Vírus Pesquisado",
      "opcoes": [
        {
          "valor": "influenza",
          "label": "Influenza"
        },
        {
          "valor": "covid",
          "label": "SARS-CoV-2"
        },
        {
          "valor": "vrs",
          "label": "Vírus Sincicial Respiratório"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "resultado",
      "tipo": "select",
      "label": "Resultado",
      "opcoes": [
        {
          "valor": "positivo",
          "label": "Positivo"
        },
        {
          "valor": "negativo",
          "label": "Negativo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Pediátrica",
      "opcoes": [
        {
          "valor": "confirmado",
          "label": "Infecção viral confirmada"
        },
        {
          "valor": "descartado",
          "label": "Infecção viral descartada"
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
      "resultSummary": "Teste Rápido Viral com Vírus Pesquisado: SARS-CoV-2 / Influenza conforme kit selecionado; Resultado: Negativo.",
      "interpretation": "Os parâmetros mensurados — Vírus Pesquisado: SARS-CoV-2 / Influenza conforme kit selecionado; Resultado: Negativo — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste Rápido Viral com parâmetros compatíveis com o padrão esperado, incluindo Vírus Pesquisado: SARS-CoV-2 / Influenza conforme kit selecionado; Resultado: Negativo.",
      "results": {
        "virus": "SARS-CoV-2 / Influenza conforme kit selecionado",
        "resultado": "Negativo",
        "impressao": "Teste rápido sem detecção do antígeno viral pesquisado"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Teste Rápido Viral: Vírus Pesquisado: Influenza A; Resultado: Positivo.",
      "interpretation": "Os resultados principais (Vírus Pesquisado: Influenza A; Resultado: Positivo) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste Rápido Viral com padrão alterado, documentado por Vírus Pesquisado: Influenza A; Resultado: Positivo.",
      "results": {
        "virus": "Influenza A",
        "resultado": "Positivo",
        "impressao": "Teste rápido positivo para Influenza A"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Teste Rápido Viral: Vírus Pesquisado: SARS-CoV-2; Resultado: Inconclusivo / linha teste de baixa intensidade.",
      "interpretation": "Os principais resultados (Vírus Pesquisado: SARS-CoV-2; Resultado: Inconclusivo / linha teste de baixa intensidade) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste Rápido Viral com resultado limítrofe/inespecífico, destacando-se Vírus Pesquisado: SARS-CoV-2; Resultado: Inconclusivo / linha teste de baixa intensidade.",
      "results": {
        "virus": "SARS-CoV-2",
        "resultado": "Inconclusivo / linha teste de baixa intensidade",
        "impressao": "Resultado inconclusivo; repetir conforme instruções do método"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste Rápido Viral: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "virus": "SARS-CoV-2 / Influenza conforme kit selecionado",
        "resultado": "Negativo",
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
    "title": "Teste Rápido Viral",
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
  "technique": "Teste rápido viral realizado em amostra respiratória adequada para pesquisa do agente previsto no kit selecionado.",
  "method": "Imunoensaio cromatográfico rápido para detecção de antígeno viral, com leitura dentro do tempo especificado pelo fabricante e controle interno válido.",
  "parameters": [
    {
      "id": "virus",
      "label": "Vírus Pesquisado",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Vírus Pesquisado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resultado",
      "label": "Resultado",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Pediátrica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Pediátrica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Teste Rápido Viral compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste Rápido Viral com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste Rápido Viral com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste Rápido Viral sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste Rápido Viral alterado conforme resultados objetivos descritos.",
    "undefined": "Teste Rápido Viral com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
