import type { IntelligentExamModel } from "../types";

export const derm_micologico_diretoModel: IntelligentExamModel = {
  "id": "derm_micologico_direto",
  "nome": "Exame Microscópico Direto (Micológico)",
  "descricao": "Pesquisa de fungos em pele, unhas ou cabelos",
  "categoria": "dermatologia",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "material",
      "tipo": "select",
      "label": "Material Coletado",
      "opcoes": [
        {
          "valor": "pele",
          "label": "Pele"
        },
        {
          "valor": "unha",
          "label": "Unha"
        },
        {
          "valor": "cabelo",
          "label": "Cabelo"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "fungos",
      "tipo": "select",
      "label": "Fungos",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "presentes",
          "label": "Presentes"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Dermatológica",
      "opcoes": [
        {
          "valor": "negativo",
          "label": "Exame negativo"
        },
        {
          "valor": "positivo",
          "label": "Micoses confirmadas"
        }
      ],
      "referencia": "Negativo / Positivo"
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
      "resultSummary": "Exame Microscópico Direto (Micológico) com Material Coletado: Raspado cutâneo; Fungos: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Material Coletado: Raspado cutâneo; Fungos: Ausentes — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Exame Microscópico Direto (Micológico) com parâmetros compatíveis com o padrão esperado, incluindo Material Coletado: Raspado cutâneo; Fungos: Ausentes.",
      "results": {
        "material": "Raspado cutâneo",
        "fungos": "Ausentes",
        "impressao": "Pesquisa micológica direta negativa"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Exame Microscópico Direto (Micológico): Material Coletado: Raspado de borda ativa de lesão cutânea; Fungos: Hifas hialinas septadas presentes.",
      "interpretation": "Os resultados principais (Material Coletado: Raspado de borda ativa de lesão cutânea; Fungos: Hifas hialinas septadas presentes) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Exame Microscópico Direto (Micológico) com padrão alterado, documentado por Material Coletado: Raspado de borda ativa de lesão cutânea; Fungos: Hifas hialinas septadas presentes.",
      "results": {
        "material": "Raspado de borda ativa de lesão cutânea",
        "fungos": "Hifas hialinas septadas presentes",
        "impressao": "Exame micológico direto positivo para estruturas fúngicas"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Exame Microscópico Direto (Micológico): Fungos: Estruturas duvidosas/raras, sem confirmação inequívoca.",
      "interpretation": "Os principais resultados (Fungos: Estruturas duvidosas/raras, sem confirmação inequívoca) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Exame Microscópico Direto (Micológico) com resultado limítrofe/inespecífico, destacando-se Fungos: Estruturas duvidosas/raras, sem confirmação inequívoca.",
      "results": {
        "material": "Raspado cutâneo",
        "fungos": "Estruturas duvidosas/raras, sem confirmação inequívoca",
        "impressao": "Exame micológico inconclusivo; considerar nova coleta"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame Microscópico Direto (Micológico): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "material": "Raspado cutâneo",
        "fungos": "Ausentes",
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
    "title": "Exame Microscópico Direto (Micológico)",
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
  "technique": "Material coletado da área suspeita e preparado para pesquisa microscópica direta de estruturas fúngicas.",
  "method": "Microscopia direta após clarificação da amostra, habitualmente com hidróxido de potássio, para pesquisa de hifas, leveduras ou outras estruturas compatíveis com fungos.",
  "parameters": [
    {
      "id": "material",
      "label": "Material Coletado",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Material Coletado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "fungos",
      "label": "Fungos",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fungos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Dermatológica",
      "unidade": null,
      "referencia": "Negativo / Positivo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Dermatológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Exame Microscópico Direto (Micológico) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Exame Microscópico Direto (Micológico) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Exame Microscópico Direto (Micológico) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Exame Microscópico Direto (Micológico) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Exame Microscópico Direto (Micológico) alterado conforme resultados objetivos descritos.",
    "undefined": "Exame Microscópico Direto (Micológico) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
