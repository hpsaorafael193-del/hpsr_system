import type { IntelligentExamModel } from "../types";

export const lab_uroculturaModel: IntelligentExamModel = {
  "id": "lab_urocultura",
  "nome": "Urocultura",
  "descricao": "Identificação de microrganismos na urina e teste de sensibilidade aos antimicrobianos",
  "categoria": "laboratorio",
  "icone": "fa-microscope",
  "campos": [
    {
      "id": "crescimento_bacteriano",
      "tipo": "select",
      "label": "Crescimento Bacteriano",
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
      "id": "microorganismo",
      "tipo": "select",
      "label": "Micro-organismo Identificado",
      "opcoes": [
        {
          "valor": "ecoli",
          "label": "Escherichia coli"
        },
        {
          "valor": "klebsiella",
          "label": "Klebsiella pneumoniae"
        },
        {
          "valor": "proteus",
          "label": "Proteus mirabilis"
        },
        {
          "valor": "enterococcus",
          "label": "Enterococcus faecalis"
        },
        {
          "valor": "staph_saprophyticus",
          "label": "Staphylococcus saprophyticus"
        },
        {
          "valor": "Não Encontrado",
          "label": "Não Encontrado"
        },
        {
          "valor": "outros",
          "label": "Outros"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "contagem_colonias",
      "tipo": "number",
      "label": "Contagem de Colônias",
      "unidade": "UFC/mL",
      "referencia": "≥ 100.000"
    },
    {
      "id": "antibiograma",
      "tipo": "select",
      "label": "Resultado do Antibiograma",
      "opcoes": [
        {
          "valor": "sensivel",
          "label": "Sensível (S)"
        },
        {
          "valor": "intermediario",
          "label": "Intermediário (I)"
        },
        {
          "valor": "resistente",
          "label": "Resistente (R)"
        },
        {
          "valor": "Não aplicável",
          "label": "Não aplicável"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "antibioticos_testados",
      "tipo": "textarea",
      "label": "Antibióticos Testados",
      "placeholder": "Ex: Nitrofurantoína, Ciprofloxacino, Amoxicilina-clavulanato..."
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Laboratorial",
      "opcoes": [
        {
          "valor": "negativa",
          "label": "Cultura negativa"
        },
        {
          "valor": "itu",
          "label": "Infecção do trato urinário confirmada"
        },
        {
          "valor": "contaminacao",
          "label": "Amostra possivelmente contaminada"
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
      "id": "negativa",
      "name": "Negativa",
      "status": "normal",
      "description": "Sem crescimento bacteriano significativo.",
      "resultSummary": "Urocultura sem crescimento bacteriano significativo.",
      "results": {
        "crescimento_bacteriano": "Negativo",
        "microorganismo": "Não isolado",
        "contagem_colonias": "< 1.000",
        "antibiograma": "Não realizado por ausência de isolamento significativo",
        "antibioticos_testados": "Não aplicável",
        "impressao": "Ausência de crescimento bacteriano significativo"
      },
      "interpretation": "Ausência de crescimento bacteriano significativo nas condições analisadas. Contagens muito baixas devem ser correlacionadas com sintomas, método de coleta e eventual uso prévio de antimicrobianos.",
      "conclusion": "Urocultura negativa para crescimento bacteriano significativo."
    },
    {
      "id": "positiva",
      "name": "Positiva",
      "status": "alterado",
      "description": "Crescimento bacteriano significativo.",
      "resultSummary": "Urocultura com crescimento bacteriano significativo.",
      "results": {
        "crescimento_bacteriano": "Positivo",
        "microorganismo": "Escherichia coli",
        "contagem_colonias": "180.000",
        "antibiograma": "Sensível: nitrofurantoína e cefuroxima; resistente: ampicilina",
        "antibioticos_testados": "Nitrofurantoína, cefuroxima, ciprofloxacino, ampicilina e sulfametoxazol-trimetoprima",
        "impressao": "Crescimento monomicrobiano significativo de Escherichia coli"
      },
      "interpretation": "Crescimento bacteriano significativo, devendo ser correlacionado com sintomas urinários e exame de urina tipo I.",
      "conclusion": "Urocultura positiva para crescimento bacteriano significativo."
    },
    {
      "id": "contaminacao",
      "name": "Provável contaminação",
      "status": "indefinido",
      "description": "Crescimento misto ou contagem sem significado isolado.",
      "resultSummary": "Crescimento bacteriano misto em contagem não conclusiva, padrão sugestivo de contaminação da amostra.",
      "results": {
        "crescimento_bacteriano": "Crescimento misto",
        "microorganismo": "Flora bacteriana mista, sem predomínio",
        "contagem_colonias": "35.000",
        "antibiograma": "Não liberado por crescimento polimicrobiano",
        "antibioticos_testados": "Não aplicável",
        "impressao": "Padrão sugestivo de contaminação da amostra"
      },
      "interpretation": "Crescimento misto ou contagem baixa pode indicar contaminação da amostra, recomendando nova coleta quando clinicamente indicado.",
      "conclusion": "Resultado não conclusivo, sugestivo de contaminação da amostra."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Urocultura: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "crescimento_bacteriano": "Negativo",
        "microorganismo": "Não isolado",
        "contagem_colonias": "< 1.000",
        "antibiograma": "Não realizado por ausência de isolamento significativo",
        "antibioticos_testados": "Não aplicável",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Urocultura",
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
    "defaultProfileId": "negativa"
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
  "technique": "Amostra de urina processada para pesquisa e quantificação de crescimento bacteriano clinicamente significativo.",
  "method": "Semeadura quantitativa em meios apropriados, identificação do microrganismo isolado e teste de sensibilidade a antimicrobianos quando houver crescimento significativo.",
  "parameters": [
    {
      "id": "crescimento_bacteriano",
      "label": "Crescimento Bacteriano",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Crescimento Bacteriano conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "microorganismo",
      "label": "Micro-organismo Identificado",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Micro-organismo Identificado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "contagem_colonias",
      "label": "Contagem de Colônias",
      "unidade": "UFC/mL",
      "referencia": "Interpretação quantitativa conforme coleta e contexto; ≥ 100.000 UFC/mL é limiar clássico de crescimento significativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Contagem de Colônias conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "antibiograma",
      "label": "Resultado do Antibiograma",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado do Antibiograma conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "antibioticos_testados",
      "label": "Antibióticos Testados",
      "unidade": null,
      "referencia": "Ex: Nitrofurantoína, Ciprofloxacino, Amoxicilina-clavulanato...",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Antibióticos Testados conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Laboratorial",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Laboratorial conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Urocultura compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Urocultura com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Urocultura com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Urocultura sem alterações significativas nos parâmetros avaliados.",
    "altered": "Urocultura alterado conforme resultados objetivos descritos.",
    "undefined": "Urocultura com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
