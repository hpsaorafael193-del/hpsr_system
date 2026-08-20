import type { IntelligentExamModel } from "../types";

export const func_teste_pezinhoModel: IntelligentExamModel = {
  "id": "func_teste_pezinho",
  "nome": "Teste do Pezinho",
  "descricao": "Triagem neonatal para doenças metabólicas e genéticas",
  "categoria": "neonatal",
  "icone": "fa-baby",
  "campos": [
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
      "id": "doenca_suspeita",
      "tipo": "select",
      "label": "Doença Suspeita",
      "opcoes": [
        {
          "valor": "nenhuma",
          "label": "Nenhuma"
        },
        {
          "valor": "fenilcetonuria",
          "label": "Fenilcetonúria"
        },
        {
          "valor": "hipotireoidismo",
          "label": "Hipotireoidismo congênito"
        },
        {
          "valor": "fibrose_cistica",
          "label": "Fibrose cística"
        }
      ],
      "referencia": "Nenhuma"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Neonatal",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Triagem neonatal normal"
        },
        {
          "valor": "encaminhamento",
          "label": "Necessita confirmação diagnóstica"
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
      "resultSummary": "Teste do Pezinho com Resultado: Normal; Doença Suspeita: Nenhuma.",
      "interpretation": "Os parâmetros mensurados — Resultado: Normal; Doença Suspeita: Nenhuma — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste do Pezinho com parâmetros compatíveis com o padrão esperado, incluindo Resultado: Normal; Doença Suspeita: Nenhuma.",
      "results": {
        "resultado": "Normal",
        "doenca_suspeita": "Nenhuma",
        "impressao": "Teste do Pezinho com parâmetros compatíveis com o padrão esperado, incluindo Resultado: Normal; Doença Suspeita: Nenhuma"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Teste do Pezinho: Resultado: Triagem positiva; Doença Suspeita: Fenilcetonúria — marcador acima do ponto de corte.",
      "interpretation": "Os resultados principais (Resultado: Triagem positiva; Doença Suspeita: Fenilcetonúria — marcador acima do ponto de corte) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste do Pezinho com padrão alterado, documentado por Resultado: Triagem positiva; Doença Suspeita: Fenilcetonúria — marcador acima do ponto de corte.",
      "results": {
        "resultado": "Triagem positiva",
        "doenca_suspeita": "Fenilcetonúria — marcador acima do ponto de corte",
        "impressao": "Triagem neonatal alterada; necessária confirmação diagnóstica conforme protocolo"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Teste do Pezinho: Resultado: Limítrofe; Doença Suspeita: Marcador próximo ao ponto de corte.",
      "interpretation": "Os principais resultados (Resultado: Limítrofe; Doença Suspeita: Marcador próximo ao ponto de corte) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste do Pezinho com resultado limítrofe/inespecífico, destacando-se Resultado: Limítrofe; Doença Suspeita: Marcador próximo ao ponto de corte.",
      "results": {
        "resultado": "Limítrofe",
        "doenca_suspeita": "Marcador próximo ao ponto de corte",
        "impressao": "Triagem neonatal limítrofe; indicada repetição conforme protocolo"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste do Pezinho: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "resultado": "Normal",
        "doenca_suspeita": "Nenhuma",
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
    "title": "Teste do Pezinho",
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
  "technique": "Triagem neonatal realizada em amostra de sangue capilar coletada em papel-filtro, destinada ao rastreamento de doenças incluídas no painel neonatal.",
  "method": "Análise de sangue seco em papel-filtro por metodologias específicas para cada marcador do painel, com liberação conforme critérios de triagem e necessidade de confirmação quando aplicável.",
  "parameters": [
    {
      "id": "resultado",
      "label": "Resultado",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "doenca_suspeita",
      "label": "Doença Suspeita",
      "unidade": null,
      "referencia": "Nenhuma",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Doença Suspeita conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Neonatal",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Neonatal conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Teste do Pezinho compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste do Pezinho com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste do Pezinho com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste do Pezinho sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste do Pezinho alterado conforme resultados objetivos descritos.",
    "undefined": "Teste do Pezinho com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
