import type { IntelligentExamModel } from "../types";

export const lab_metabolismo_ferroModel: IntelligentExamModel = {
  "id": "lab_metabolismo_ferro",
  "nome": "Metabolismo do Ferro",
  "descricao": "Avaliação do estoque, transporte e utilização do ferro no organismo",
  "categoria": "laboratorio",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "ferro_serico",
      "tipo": "number",
      "label": "Ferro sérico",
      "unidade": "µg/dL",
      "referencia": "50 – 170"
    },
    {
      "id": "ferritina",
      "tipo": "number",
      "label": "Ferritina",
      "unidade": "ng/mL",
      "referencia": "15 – 150"
    },
    {
      "id": "tibc",
      "tipo": "number",
      "label": "Capacidade Total de Ligação do Ferro (TIBC)",
      "unidade": "µg/dL",
      "referencia": "250 – 450"
    },
    {
      "id": "saturacao_transferrina",
      "tipo": "number",
      "label": "Saturação de Transferrina",
      "unidade": "%",
      "referencia": "20 – 50"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Metabolismo do ferro preservado"
        },
        {
          "valor": "deficiencia",
          "label": "Deficiência de ferro"
        },
        {
          "valor": "sobrecarga",
          "label": "Sobrecarga de ferro"
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
      "description": "Parâmetros do metabolismo do ferro dentro da referência.",
      "resultSummary": "Metabolismo do ferro sem alterações laboratoriais relevantes.",
      "interpretation": "Ferro sérico, ferritina, capacidade de ligação e saturação de transferrina dentro do padrão esperado.",
      "conclusion": "Metabolismo do ferro preservado."
    },
    {
      "id": "deficiencia_ferro",
      "name": "Deficiência de ferro",
      "status": "alterado",
      "description": "Padrão compatível com deficiência de ferro.",
      "resultSummary": "Exame com redução de ferro sérico, ferritina e saturação de transferrina, com TIBC aumentado.",
      "interpretation": "O conjunto de ferro sérico reduzido, ferritina baixa, TIBC elevado e saturação reduzida é compatível com deficiência de ferro, devendo ser correlacionado com hemograma, perdas sanguíneas e contexto clínico.",
      "conclusion": "Achados laboratoriais compatíveis com deficiência de ferro."
    },
    {
      "id": "sobrecarga_ferro",
      "name": "Sobrecarga de ferro",
      "status": "alterado",
      "description": "Padrão compatível com excesso de ferro/estoque aumentado.",
      "resultSummary": "Exame com ferro sérico, ferritina e saturação de transferrina elevados.",
      "interpretation": "Elevação de ferritina e saturação de transferrina pode sugerir sobrecarga de ferro ou contexto inflamatório/metabólico, devendo ser interpretada clinicamente.",
      "conclusion": "Achados laboratoriais compatíveis com sobrecarga de ferro no contexto adequado."
    },
    {
      "id": "inflamatorio",
      "name": "Ferritina elevada / inflamatório",
      "status": "indefinido",
      "description": "Ferritina elevada com padrão não conclusivo para sobrecarga isolada.",
      "resultSummary": "Exame com elevação de ferritina, podendo ter caráter inflamatório ou metabólico.",
      "interpretation": "Ferritina elevada isoladamente pode refletir estoque aumentado, inflamação ou alterações metabólicas. Resultado isolado não define diagnóstico.",
      "conclusion": "Elevação de ferritina de significado clínico dependente do contexto."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Variações discretas no metabolismo do ferro.",
      "resultSummary": "Exame com achados limítrofes no metabolismo do ferro.",
      "interpretation": "Alterações discretas podem requerer repetição ou correlação com hemograma e marcadores inflamatórios.",
      "conclusion": "Achado limítrofe no metabolismo do ferro."
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
    "title": "Metabolismo do Ferro",
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
      "id": "ferro_serico",
      "label": "Ferro sérico",
      "unidade": "µg/dL",
      "referencia": "50 – 170",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ferro sérico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ferritina",
      "label": "Ferritina",
      "unidade": "ng/mL",
      "referencia": "15 – 150",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ferritina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tibc",
      "label": "Capacidade Total de Ligação do Ferro (TIBC)",
      "unidade": "µg/dL",
      "referencia": "250 – 450",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Capacidade Total de Ligação do Ferro (TIBC) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "saturacao_transferrina",
      "label": "Saturação de Transferrina",
      "unidade": "%",
      "referencia": "20 – 50",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Saturação de Transferrina conforme referência, contexto clínico e método utilizado."
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
