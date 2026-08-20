import type { IntelligentExamModel } from "../types";

export const neonatal_teste_coracaozinhoModel: IntelligentExamModel = {
  "id": "neonatal_teste_coracaozinho",
  "nome": "Teste do Coraçãozinho",
  "descricao": "Triagem neonatal de cardiopatias congênitas por oximetria",
  "categoria": "neonatal",
  "icone": "fa-heart",
  "campos": [
    {
      "id": "spo2_mao",
      "tipo": "number",
      "label": "SpO₂ Mão Direita",
      "unidade": "%",
      "referencia": "≥ 95"
    },
    {
      "id": "spo2_pe",
      "tipo": "number",
      "label": "SpO₂ Pé",
      "unidade": "%",
      "referencia": "≥ 95"
    },
    {
      "id": "diferenca",
      "tipo": "number",
      "label": "Diferença Mão–Pé",
      "unidade": "%",
      "referencia": "≤ 3"
    },
    {
      "id": "resultado",
      "tipo": "select",
      "label": "Resultado",
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
      "resultSummary": "Teste do Coraçãozinho com SpO₂ Mão Direita: 102,6; SpO₂ Pé: 102,6; Diferença Mão–Pé: 2,2.",
      "interpretation": "Os parâmetros mensurados — SpO₂ Mão Direita: 102,6 %; SpO₂ Pé: 102,6 %; Diferença Mão–Pé: 2,2 %; Resultado: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste do Coraçãozinho com parâmetros compatíveis com o padrão esperado, incluindo SpO₂ Mão Direita: 102,6 %; SpO₂ Pé: 102,6 %.",
      "results": {
        "spo2_mao": "102,6",
        "spo2_pe": "102,6",
        "diferenca": "2,2",
        "resultado": "Normal"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Teste do Coraçãozinho: SpO₂ Mão Direita: 91; SpO₂ Pé: 88; Diferença Mão–Pé: 3; Resultado: Falhou — saturações abaixo do ponto de corte, requer reavaliação conforme protocolo.",
      "interpretation": "Os resultados principais (SpO₂ Mão Direita: 91 %; SpO₂ Pé: 88 %; Diferença Mão–Pé: 3 %; Resultado: Falhou — saturações abaixo do ponto de corte, requer reavaliação conforme protocolo) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste do Coraçãozinho com padrão alterado, documentado por SpO₂ Mão Direita: 91 %; SpO₂ Pé: 88 %.",
      "results": {
        "spo2_mao": "91",
        "spo2_pe": "88",
        "diferenca": "3",
        "resultado": "Falhou — saturações abaixo do ponto de corte, requer reavaliação conforme protocolo"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Teste do Coraçãozinho: SpO₂ Mão Direita: 94; SpO₂ Pé: 93; Diferença Mão–Pé: 1; Resultado: Repetir teste conforme protocolo por saturações limítrofes.",
      "interpretation": "Os principais resultados (SpO₂ Mão Direita: 94 %; SpO₂ Pé: 93 %; Diferença Mão–Pé: 1 %; Resultado: Repetir teste conforme protocolo por saturações limítrofes) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste do Coraçãozinho com resultado limítrofe/inespecífico, destacando-se SpO₂ Mão Direita: 94 %; SpO₂ Pé: 93 %.",
      "results": {
        "spo2_mao": "94",
        "spo2_pe": "93",
        "diferenca": "1",
        "resultado": "Repetir teste conforme protocolo por saturações limítrofes"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste do Coraçãozinho: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "spo2_mao": "102,6",
        "spo2_pe": "102,6",
        "diferenca": "2,2",
        "resultado": "Normal"
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
    "title": "Teste do Coraçãozinho",
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
  "technique": "Triagem neonatal de cardiopatia congênita crítica realizada por oximetria de pulso em membro superior direito e membro inferior, após estabilização clínica.",
  "method": "Mensuração comparativa da saturação periférica de oxigênio pré-ductal e pós-ductal, interpretada segundo critérios de triagem neonatal.",
  "parameters": [
    {
      "id": "spo2_mao",
      "label": "SpO₂ Mão Direita",
      "unidade": "%",
      "referencia": "≥ 95",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar SpO₂ Mão Direita conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "spo2_pe",
      "label": "SpO₂ Pé",
      "unidade": "%",
      "referencia": "≥ 95",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar SpO₂ Pé conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "diferenca",
      "label": "Diferença Mão–Pé",
      "unidade": "%",
      "referencia": "≤ 3",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Diferença Mão–Pé conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resultado",
      "label": "Resultado",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Teste do Coraçãozinho compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste do Coraçãozinho com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste do Coraçãozinho com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste do Coraçãozinho sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste do Coraçãozinho alterado conforme resultados objetivos descritos.",
    "undefined": "Teste do Coraçãozinho com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
