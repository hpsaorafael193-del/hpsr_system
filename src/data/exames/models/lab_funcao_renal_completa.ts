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
          "valor": "nao_aplicavel",
          "label": "Não aplicável"
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
      "referencia": "Não aplicável"
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
      "conclusion": "Função renal preservada pelos parâmetros avaliados."
    },
    {
      "id": "reducao_funcao_renal",
      "name": "Redução da função renal",
      "status": "alterado",
      "description": "Creatinina/ureia elevadas e TFG reduzida.",
      "resultSummary": "Exame com elevação de escórias nitrogenadas e redução da TFG estimada.",
      "interpretation": "Elevação de ureia e creatinina com TFG reduzida sugere redução da função renal, devendo ser correlacionada com hidratação, medicamentos, evolução e dados clínicos.",
      "conclusion": "Achados compatíveis com redução da função renal."
    },
    {
      "id": "azotemia",
      "name": "Azotemia",
      "status": "alterado",
      "description": "Elevação de ureia e/ou creatinina.",
      "resultSummary": "Exame com azotemia laboratorial.",
      "interpretation": "Elevação de escórias nitrogenadas deve ser correlacionada com estado volêmico, função renal prévia e contexto clínico.",
      "conclusion": "Azotemia laboratorial."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou limítrofe.",
      "resultSummary": "Função renal com alteração discreta/limítrofe.",
      "interpretation": "Variações discretas em parâmetros renais podem requerer repetição e correlação com histórico clínico.",
      "conclusion": "Achado renal limítrofe/inespecífico."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Exame personalizado.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
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
  "technique": "Amostra processada conforme método laboratorial validado, com controles internos e referências aplicáveis ao exame.",
  "method": "Método laboratorial compatível com o parâmetro analisado, conforme validação interna do serviço.",
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
      "referencia": "Não aplicável",
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
    "normal": "Parâmetros dentro dos valores de referência disponíveis.",
    "altered": "Um ou mais parâmetros fora da referência, com significado dependente do contexto clínico.",
    "undefined": "Alteração discreta, limítrofe ou inconclusiva, sem definição diagnóstica isolada."
  },
  "conclusion": {
    "normal": "Exame sem alterações significativas.",
    "altered": "Exame alterado, recomendando correlação clínica.",
    "undefined": "Achado indefinido ou limítrofe, recomendando correlação clínica."
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
