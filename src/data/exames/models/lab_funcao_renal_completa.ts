import type { IntelligentExamModel } from "../types";

export const lab_funcao_renal_completaModel: IntelligentExamModel = {
  "id": "lab_funcao_renal_completa",
  "nome": "Função Renal",
  "descricao": "Avaliação da função renal e da filtração glomerular",
  "categoria": "laboratorio",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "ureia",
      "tipo": "number",
      "label": "Ureia",
      "unidade": "mg/dL",
      "referencia": "10 – 50"
    },
    {
      "id": "creatinina",
      "tipo": "number",
      "label": "Creatinina",
      "unidade": "mg/dL",
      "referencia": "0.6 – 1.3"
    },
    {
      "id": "taxa_filtracao_glomerular",
      "tipo": "number",
      "label": "Taxa de Filtração Glomerular (TFG estimada)",
      "unidade": "mL/min/1,73m²",
      "referencia": "≥ 90"
    },
    {
      "id": "estagio_drc",
      "tipo": "select",
      "label": "Estágio de Doença Renal Crônica (DRC)",
      "opcoes": [
        {
          "valor": "sem_classificacao_isolada",
          "label": "Sem classificação de DRC pelo exame isolado"
        },
        {
          "valor": "estagio_1",
          "label": "Estágio 1"
        },
        {
          "valor": "estagio_2",
          "label": "Estágio 2"
        },
        {
          "valor": "estagio_3a",
          "label": "Estágio 3A"
        },
        {
          "valor": "estagio_3b",
          "label": "Estágio 3B"
        },
        {
          "valor": "estagio_4",
          "label": "Estágio 4"
        },
        {
          "valor": "estagio_5",
          "label": "Estágio 5"
        }
      ],
      "referencia": "Classificação depende de TFG, cronicidade e contexto clínico"
    },
    {
      "id": "relacao_ureia_creatinina",
      "tipo": "number",
      "label": "Relação Ureia/Creatinina",
      "referencia": "10 – 20"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Função renal preservada"
        },
        {
          "valor": "azotemia_prerrenal",
          "label": "Sugestivo de azotemia pré-renal"
        },
        {
          "valor": "insuficiencia_renal",
          "label": "Insuficiência renal"
        },
        {
          "valor": "drc",
          "label": "Doença renal crônica"
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
      "description": "Marcadores renais dentro da referência.",
      "resultSummary": "Função renal sem alterações laboratoriais relevantes.",
      "interpretation": "Ureia, creatinina e estimativa de filtração glomerular dentro do padrão esperado para a referência informada.",
      "conclusion": "Função renal preservada pelos parâmetros avaliados.",
      "results": {
        "ureia": "32",
        "creatinina": "0,9",
        "taxa_filtracao_glomerular": "104",
        "estagio_drc": "Sem critério laboratorial isolado para DRC",
        "relacao_ureia_creatinina": "15",
        "impressao": "Função renal preservada nos parâmetros avaliados"
      }
    },
    {
      "id": "reducao_funcao_renal",
      "name": "Redução da função renal",
      "status": "alterado",
      "description": "Creatinina/ureia elevadas e TFG reduzida.",
      "resultSummary": "Exame com elevação de escórias nitrogenadas e redução da TFG estimada.",
      "interpretation": "Elevação de ureia e creatinina com TFG reduzida sugere redução da função renal, devendo ser correlacionada com hidratação, medicamentos, evolução e dados clínicos.",
      "conclusion": "Creatinina elevada e TFG estimada reduzida, compatíveis com redução da função renal no contexto clínico apropriado.",
      "results": {
        "ureia": "58",
        "creatinina": "1,6",
        "taxa_filtracao_glomerular": "52",
        "estagio_drc": "TFG na faixa G3a se persistente por ≥3 meses e conforme contexto clínico",
        "relacao_ureia_creatinina": "18",
        "impressao": "Redução da filtração glomerular estimada"
      }
    },
    {
      "id": "azotemia",
      "name": "Azotemia",
      "status": "alterado",
      "description": "Elevação de ureia e/ou creatinina.",
      "resultSummary": "Exame com azotemia laboratorial.",
      "interpretation": "Elevação de escórias nitrogenadas deve ser correlacionada com estado volêmico, função renal prévia e contexto clínico.",
      "conclusion": "Azotemia laboratorial.",
      "results": {
        "ureia": "78",
        "creatinina": "1,5",
        "taxa_filtracao_glomerular": "58",
        "estagio_drc": "Classificação depende de cronicidade e marcadores adicionais",
        "relacao_ureia_creatinina": "24",
        "impressao": "Azotemia com elevação de ureia e creatinina"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou limítrofe.",
      "resultSummary": "Função renal com alteração discreta/limítrofe.",
      "interpretation": "Variações discretas em parâmetros renais podem requerer repetição e correlação com histórico clínico.",
      "conclusion": "Parâmetros renais em faixa limítrofe, sem classificação definitiva em resultado isolado.",
      "results": {
        "ureia": "51",
        "creatinina": "1,3",
        "taxa_filtracao_glomerular": "86",
        "estagio_drc": "Sem classificação definitiva em resultado isolado",
        "relacao_ureia_creatinina": "20",
        "impressao": "Função renal em faixa limítrofe"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Função Renal: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "ureia": "32",
        "creatinina": "0,9",
        "taxa_filtracao_glomerular": "104",
        "estagio_drc": "Sem critério laboratorial isolado para DRC",
        "relacao_ureia_creatinina": "15",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Função Renal",
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
  "technique": "Amostra sérica processada para avaliação laboratorial da função renal, incluindo ureia, creatinina e estimativa da taxa de filtração glomerular.",
  "method": "Ureia e creatinina determinadas por métodos bioquímicos automatizados; TFG estimada a partir da creatinina por equação validada, interpretada em conjunto com idade e contexto clínico.",
  "parameters": [
    {
      "id": "ureia",
      "label": "Ureia",
      "unidade": "mg/dL",
      "referencia": "10 – 50",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ureia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "creatinina",
      "label": "Creatinina",
      "unidade": "mg/dL",
      "referencia": "0.6 – 1.3",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Creatinina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "taxa_filtracao_glomerular",
      "label": "Taxa de Filtração Glomerular (TFG estimada)",
      "unidade": "mL/min/1,73m²",
      "referencia": "≥ 90",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Taxa de Filtração Glomerular (TFG estimada) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "estagio_drc",
      "label": "Estágio de Doença Renal Crônica (DRC)",
      "unidade": null,
      "referencia": "Classificação depende de TFG, cronicidade e contexto clínico",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estágio de Doença Renal Crônica (DRC) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "relacao_ureia_creatinina",
      "label": "Relação Ureia/Creatinina",
      "unidade": null,
      "referencia": "10 – 20",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Relação Ureia/Creatinina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Clínica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Clínica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Função Renal compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Função Renal com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Função Renal com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Função Renal sem alterações significativas nos parâmetros avaliados.",
    "altered": "Função Renal alterado conforme resultados objetivos descritos.",
    "undefined": "Função Renal com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
