import type { IntelligentExamModel } from "../types";

export const oftalmo_acuidade_visualModel: IntelligentExamModel = {
  "id": "oftalmo_acuidade_visual",
  "nome": "Acuidade Visual",
  "descricao": "Avaliação da acuidade visual utilizando escala de Snellen.",
  "categoria": "oftalmologia",
  "icone": "fa-eye",
  "campos": [
    {
      "id": "condicao_avaliacao",
      "tipo": "select",
      "label": "Condição da avaliação",
      "opcoes": [
        {
          "valor": "sem_correcao",
          "label": "Sem correção óptica"
        },
        {
          "valor": "com_correcao",
          "label": "Com correção óptica"
        }
      ],
      "referencia": "Uso de óculos/lentes"
    },
    {
      "id": "acuidade_od",
      "tipo": "text",
      "label": "Acuidade visual – Olho Direito (OD)",
      "placeholder": "Ex: 20/20, 20/40, CD, MM, PL, NPL"
    },
    {
      "id": "acuidade_oe",
      "tipo": "text",
      "label": "Acuidade visual – Olho Esquerdo (OE)",
      "placeholder": "Ex: 20/20, 20/40, CD, MM, PL, NPL"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Oftalmológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Acuidade visual dentro dos padrões de normalidade"
        },
        {
          "valor": "reduzida",
          "label": "Redução da acuidade visual"
        },
        {
          "valor": "baixa_visao",
          "label": "Baixa visão"
        },
        {
          "valor": "cegueira_funcional",
          "label": "Cegueira funcional"
        }
      ],
      "referencia": "Classificação funcional"
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
      "resultSummary": "Acuidade Visual com Condição da avaliação: Com correção habitual; Acuidade visual – Olho Direito (OD): 20/20; Acuidade visual – Olho Esquerdo (OE): 20/20.",
      "interpretation": "Os parâmetros mensurados — Condição da avaliação: Com correção habitual; Acuidade visual – Olho Direito (OD): 20/20; Acuidade visual – Olho Esquerdo (OE): 20/20 — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Acuidade Visual com parâmetros compatíveis com o padrão esperado, incluindo Condição da avaliação: Com correção habitual; Acuidade visual – Olho Direito (OD): 20/20.",
      "results": {
        "condicao_avaliacao": "Com correção habitual",
        "acuidade_od": "20/20",
        "acuidade_oe": "20/20",
        "impressao": "Acuidade visual corrigida preservada bilateralmente"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Acuidade Visual: Acuidade visual – Olho Direito (OD): 20/80; Acuidade visual – Olho Esquerdo (OE): 20/40.",
      "interpretation": "Os resultados principais (Acuidade visual – Olho Direito (OD): 20/80; Acuidade visual – Olho Esquerdo (OE): 20/40) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Acuidade Visual com padrão alterado, documentado por Acuidade visual – Olho Direito (OD): 20/80; Acuidade visual – Olho Esquerdo (OE): 20/40.",
      "results": {
        "condicao_avaliacao": "Com correção habitual",
        "acuidade_od": "20/80",
        "acuidade_oe": "20/40",
        "impressao": "Redução de acuidade visual, mais acentuada em OD"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Acuidade Visual: Acuidade visual – Olho Direito (OD): 20/30; Acuidade visual – Olho Esquerdo (OE): 20/25.",
      "interpretation": "Os principais resultados (Acuidade visual – Olho Direito (OD): 20/30; Acuidade visual – Olho Esquerdo (OE): 20/25) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Acuidade Visual com resultado limítrofe/inespecífico, destacando-se Acuidade visual – Olho Direito (OD): 20/30; Acuidade visual – Olho Esquerdo (OE): 20/25.",
      "results": {
        "condicao_avaliacao": "Com correção habitual",
        "acuidade_od": "20/30",
        "acuidade_oe": "20/25",
        "impressao": "Redução visual discreta, com melhor acuidade em OE"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Acuidade Visual: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "condicao_avaliacao": "Com correção habitual",
        "acuidade_od": "20/20",
        "acuidade_oe": "20/20",
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
    "title": "Acuidade Visual",
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
  "technique": "Avaliação da acuidade visual realizada separadamente em cada olho, com e sem correção conforme o contexto clínico.",
  "method": "Mensuração optométrica por tabela padronizada de optotipos a distância apropriada, registrando a melhor acuidade visual obtida em cada olho.",
  "parameters": [
    {
      "id": "condicao_avaliacao",
      "label": "Condição da avaliação",
      "unidade": null,
      "referencia": "Uso de óculos/lentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Condição da avaliação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "acuidade_od",
      "label": "Acuidade visual – Olho Direito (OD)",
      "unidade": null,
      "referencia": "Ex: 20/20, 20/40, CD, MM, PL, NPL",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Acuidade visual – Olho Direito (OD) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "acuidade_oe",
      "label": "Acuidade visual – Olho Esquerdo (OE)",
      "unidade": null,
      "referencia": "Ex: 20/20, 20/40, CD, MM, PL, NPL",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Acuidade visual – Olho Esquerdo (OE) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Oftalmológica",
      "unidade": null,
      "referencia": "Classificação funcional",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Oftalmológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Acuidade Visual compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Acuidade Visual com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Acuidade Visual com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Acuidade Visual sem alterações significativas nos parâmetros avaliados.",
    "altered": "Acuidade Visual alterado conforme resultados objetivos descritos.",
    "undefined": "Acuidade Visual com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
