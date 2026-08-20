import type { IntelligentExamModel } from "../types";

export const derm_teste_sensibilidadeModel: IntelligentExamModel = {
  "id": "derm_teste_sensibilidade",
  "nome": "Avaliação de Sensibilidade Cutânea",
  "descricao": "Avaliação neurossensorial da pele (Hanseníase)",
  "categoria": "dermatologia",
  "icone": "fa-hand",
  "campos": [
    {
      "id": "sensibilidade",
      "tipo": "select",
      "label": "Sensibilidade",
      "opcoes": [
        {
          "valor": "preservada",
          "label": "Preservada"
        },
        {
          "valor": "reduzida",
          "label": "Reduzida"
        },
        {
          "valor": "ausente",
          "label": "Ausente"
        }
      ],
      "referencia": "Preservada"
    },
    {
      "id": "nervos_perifericos",
      "tipo": "select",
      "label": "Espessamento de Nervos",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "presente",
          "label": "Presente"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Dermatoneurológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Sem sinais de hanseníase"
        },
        {
          "valor": "suspeita",
          "label": "Suspeita de hanseníase"
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
      "resultSummary": "Avaliação de Sensibilidade Cutânea com Sensibilidade: Preservada; Espessamento de Nervos: Ausente.",
      "interpretation": "Os parâmetros mensurados — Sensibilidade: Preservada; Espessamento de Nervos: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Avaliação de Sensibilidade Cutânea com parâmetros compatíveis com o padrão esperado, incluindo Sensibilidade: Preservada; Espessamento de Nervos: Ausente.",
      "results": {
        "sensibilidade": "Preservada",
        "nervos_perifericos": "Ausente",
        "impressao": "Avaliação de Sensibilidade Cutânea com parâmetros compatíveis com o padrão esperado, incluindo Sensibilidade: Preservada; Espessamento de Nervos: Ausente"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Avaliação de Sensibilidade Cutânea: Sensibilidade: Hipoestesia tátil e térmica localizada; Espessamento de Nervos: Espessamento discreto de nervo periférico palpável.",
      "interpretation": "Os resultados principais (Sensibilidade: Hipoestesia tátil e térmica localizada; Espessamento de Nervos: Espessamento discreto de nervo periférico palpável) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Avaliação de Sensibilidade Cutânea com padrão alterado, documentado por Sensibilidade: Hipoestesia tátil e térmica localizada; Espessamento de Nervos: Espessamento discreto de nervo periférico palpável.",
      "results": {
        "sensibilidade": "Hipoestesia tátil e térmica localizada",
        "nervos_perifericos": "Espessamento discreto de nervo periférico palpável",
        "impressao": "Alteração sensitiva periférica que requer correlação dermatoneurológica"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Avaliação de Sensibilidade Cutânea: Sensibilidade: Hipoestesia discreta e localizada; Espessamento de Nervos: Sem espessamento inequívoco.",
      "interpretation": "Os principais resultados (Sensibilidade: Hipoestesia discreta e localizada; Espessamento de Nervos: Sem espessamento inequívoco) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Avaliação de Sensibilidade Cutânea com resultado limítrofe/inespecífico, destacando-se Sensibilidade: Hipoestesia discreta e localizada; Espessamento de Nervos: Sem espessamento inequívoco.",
      "results": {
        "sensibilidade": "Hipoestesia discreta e localizada",
        "nervos_perifericos": "Sem espessamento inequívoco",
        "impressao": "Alteração sensitiva discreta, sem definição etiológica isolada"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Avaliação de Sensibilidade Cutânea: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "sensibilidade": "Preservada",
        "nervos_perifericos": "Ausente",
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
    "title": "Avaliação de Sensibilidade Cutânea",
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
  "technique": "Avaliação dermatoneurológica dirigida da sensibilidade cutânea e de nervos periféricos nos territórios selecionados.",
  "method": "Exame clínico comparativo de sensibilidade tátil, térmica e/ou dolorosa, associado à palpação de nervos periféricos quando pertinente.",
  "parameters": [
    {
      "id": "sensibilidade",
      "label": "Sensibilidade",
      "unidade": null,
      "referencia": "Preservada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Sensibilidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "nervos_perifericos",
      "label": "Espessamento de Nervos",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Espessamento de Nervos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Dermatoneurológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Dermatoneurológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Avaliação de Sensibilidade Cutânea compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Avaliação de Sensibilidade Cutânea com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Avaliação de Sensibilidade Cutânea com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Avaliação de Sensibilidade Cutânea sem alterações significativas nos parâmetros avaliados.",
    "altered": "Avaliação de Sensibilidade Cutânea alterado conforme resultados objetivos descritos.",
    "undefined": "Avaliação de Sensibilidade Cutânea com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
