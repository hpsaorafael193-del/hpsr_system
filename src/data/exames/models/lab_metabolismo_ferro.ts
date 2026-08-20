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
      "conclusion": "Metabolismo do ferro preservado.",
      "results": {
        "ferro_serico": "94",
        "ferritina": "72",
        "tibc": "332",
        "saturacao_transferrina": "28",
        "impressao": "Metabolismo do ferro dentro das faixas de referência"
      }
    },
    {
      "id": "deficiencia_ferro",
      "name": "Deficiência de ferro",
      "status": "alterado",
      "description": "Padrão compatível com deficiência de ferro.",
      "resultSummary": "Exame com redução de ferro sérico, ferritina e saturação de transferrina, com TIBC aumentado.",
      "interpretation": "O conjunto de ferro sérico reduzido, ferritina baixa, TIBC elevado e saturação reduzida é compatível com deficiência de ferro, devendo ser correlacionado com hemograma, perdas sanguíneas e contexto clínico.",
      "conclusion": "Ferro sérico e ferritina reduzidos, TIBC elevado e saturação de transferrina baixa, padrão compatível com deficiência de ferro.",
      "results": {
        "ferro_serico": "32",
        "ferritina": "8",
        "tibc": "480",
        "saturacao_transferrina": "8",
        "impressao": "Perfil laboratorial compatível com deficiência de ferro"
      }
    },
    {
      "id": "sobrecarga_ferro",
      "name": "Sobrecarga de ferro",
      "status": "alterado",
      "description": "Padrão compatível com excesso de ferro/estoque aumentado.",
      "resultSummary": "Exame com ferro sérico, ferritina e saturação de transferrina elevados.",
      "interpretation": "Elevação de ferritina e saturação de transferrina pode sugerir sobrecarga de ferro ou contexto inflamatório/metabólico, devendo ser interpretada clinicamente.",
      "conclusion": "Ferro sérico, ferritina e saturação de transferrina elevados, padrão compatível com sobrecarga de ferro no contexto apropriado.",
      "results": {
        "ferro_serico": "210",
        "ferritina": "420",
        "tibc": "235",
        "saturacao_transferrina": "68",
        "impressao": "Perfil compatível com sobrecarga de ferro"
      }
    },
    {
      "id": "inflamatorio",
      "name": "Ferritina elevada / inflamatório",
      "status": "indefinido",
      "description": "Ferritina elevada com padrão não conclusivo para sobrecarga isolada.",
      "resultSummary": "Exame com elevação de ferritina, podendo ter caráter inflamatório ou metabólico.",
      "interpretation": "Ferritina elevada isoladamente pode refletir estoque aumentado, inflamação ou alterações metabólicas. Resultado isolado não define diagnóstico.",
      "conclusion": "Elevação de ferritina de significado clínico dependente do contexto.",
      "results": {
        "ferro_serico": "44",
        "ferritina": "286",
        "tibc": "220",
        "saturacao_transferrina": "20",
        "impressao": "Ferritina elevada com ferro sérico reduzido, padrão possível em contexto inflamatório"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Variações discretas no metabolismo do ferro.",
      "resultSummary": "Parâmetros do metabolismo do ferro em faixas limítrofes.",
      "interpretation": "Alterações discretas podem requerer repetição ou correlação com hemograma e marcadores inflamatórios.",
      "conclusion": "Perfil do metabolismo do ferro limítrofe, sem definição etiológica isolada.",
      "results": {
        "ferro_serico": "52",
        "ferritina": "16",
        "tibc": "438",
        "saturacao_transferrina": "19",
        "impressao": "Parâmetros do ferro em faixa limítrofe"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Metabolismo do Ferro: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "ferro_serico": "94",
        "ferritina": "72",
        "tibc": "332",
        "saturacao_transferrina": "28",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
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
  "technique": "Amostra sérica processada para avaliação do metabolismo do ferro por meio dos marcadores disponíveis no painel.",
  "method": "Ferro sérico e capacidade de ligação determinados por métodos bioquímicos; ferritina e transferrina por imunoensaio/imunoturbidimetria conforme plataforma analítica.",
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
    "normal": "Resultados de Metabolismo do Ferro compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Metabolismo do Ferro com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Metabolismo do Ferro com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Metabolismo do Ferro sem alterações significativas nos parâmetros avaliados.",
    "altered": "Metabolismo do Ferro alterado conforme resultados objetivos descritos.",
    "undefined": "Metabolismo do Ferro com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
