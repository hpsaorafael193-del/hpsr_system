import type { IntelligentExamModel } from "../types";

export const derm_patch_testModel: IntelligentExamModel = {
  "id": "derm_patch_test",
  "nome": "Teste de Contato (Patch Test)",
  "descricao": "Investigação de dermatite de contato alérgica",
  "categoria": "dermatologia",
  "icone": "fa-allergies",
  "campos": [
    {
      "id": "substancia_testada",
      "tipo": "select",
      "label": "Substância Testada",
      "opcoes": [
        {
          "valor": "niquel",
          "label": "Níquel"
        },
        {
          "valor": "cromo",
          "label": "Cromo"
        },
        {
          "valor": "perfume",
          "label": "Perfumes"
        },
        {
          "valor": "conservantes",
          "label": "Conservantes"
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
          "valor": "negativo",
          "label": "Negativo"
        },
        {
          "valor": "positivo",
          "label": "Positivo"
        }
      ],
      "referencia": "Negativo"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Dermatológica",
      "opcoes": [
        {
          "valor": "sem_sensibilizacao",
          "label": "Sem sensibilização"
        },
        {
          "valor": "dermatite_contato",
          "label": "Dermatite de contato alérgica"
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
      "resultSummary": "Teste de Contato (Patch Test) com Substância Testada: Bateria padrão de contato; Resultado: Negativo.",
      "interpretation": "Os parâmetros mensurados — Substância Testada: Bateria padrão de contato; Resultado: Negativo — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste de Contato (Patch Test) com parâmetros compatíveis com o padrão esperado, incluindo Substância Testada: Bateria padrão de contato; Resultado: Negativo.",
      "results": {
        "substancia_testada": "Bateria padrão de contato",
        "resultado": "Negativo",
        "impressao": "Teste de contato sem reação positiva às substâncias avaliadas"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Teste de Contato (Patch Test): Substância Testada: Níquel (sulfato de níquel); Resultado: Positivo ++ em 48/96 horas.",
      "interpretation": "Os resultados principais (Substância Testada: Níquel (sulfato de níquel); Resultado: Positivo ++ em 48/96 horas) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste de Contato (Patch Test) com padrão alterado, documentado por Substância Testada: Níquel (sulfato de níquel); Resultado: Positivo ++ em 48/96 horas.",
      "results": {
        "substancia_testada": "Níquel (sulfato de níquel)",
        "resultado": "Positivo ++ em 48/96 horas",
        "impressao": "Reação positiva compatível com sensibilização de contato ao níquel"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Teste de Contato (Patch Test): Resultado: Reação duvidosa (+/-) em 48 horas, não persistente.",
      "interpretation": "Os principais resultados (Resultado: Reação duvidosa (+/-) em 48 horas, não persistente) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste de Contato (Patch Test) com resultado limítrofe/inespecífico, destacando-se Resultado: Reação duvidosa (+/-) em 48 horas, não persistente.",
      "results": {
        "substancia_testada": "Bateria padrão de contato",
        "resultado": "Reação duvidosa (+/-) em 48 horas, não persistente",
        "impressao": "Resposta limítrofe sem critério definitivo de sensibilização"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste de Contato (Patch Test): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "substancia_testada": "Bateria padrão de contato",
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
    "title": "Teste de Contato (Patch Test)",
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
  "technique": "Teste de contato realizado com aplicação padronizada de substâncias/alérgenos na pele íntegra e leituras seriadas das reações locais.",
  "method": "Aplicação oclusiva de bateria de contato, com leitura clínica em tempos padronizados e graduação da resposta cutânea conforme intensidade observada.",
  "parameters": [
    {
      "id": "substancia_testada",
      "label": "Substância Testada",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Substância Testada conforme referência, contexto clínico e método utilizado."
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
      "label": "Impressão Dermatológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Dermatológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Teste de Contato (Patch Test) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste de Contato (Patch Test) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste de Contato (Patch Test) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste de Contato (Patch Test) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste de Contato (Patch Test) alterado conforme resultados objetivos descritos.",
    "undefined": "Teste de Contato (Patch Test) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
