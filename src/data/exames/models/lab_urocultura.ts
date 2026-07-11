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
      "interpretation": "Ausência de crescimento bacteriano significativo nas condições analisadas.",
      "conclusion": "Urocultura negativa."
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
        "contagem_colonias": "≥ 100.000 UFC/mL",
        "antibiograma": "Sensibilidade conforme antimicrobianos testados",
        "antibioticos_testados": "Nitrofurantoína sensível; Ciprofloxacino sensível; Amoxicilina-clavulanato resistente",
        "impressao": "Crescimento bacteriano significativo"
      },
      "interpretation": "Crescimento bacteriano significativo, devendo ser correlacionado com sintomas urinários e exame de urina tipo I.",
      "conclusion": "Urocultura positiva para crescimento bacteriano significativo."
    },
    {
      "id": "contaminacao",
      "name": "Provável contaminação",
      "status": "indefinido",
      "description": "Crescimento misto ou contagem sem significado isolado.",
      "resultSummary": "Amostra com achado sugestivo de contaminação ou crescimento não conclusivo.",
      "results": {
        "crescimento_bacteriano": "Crescimento misto",
        "microorganismo": "Flora mista",
        "contagem_colonias": "< 100.000 UFC/mL",
        "antibiograma": "Não realizado / não aplicável",
        "antibioticos_testados": "Não aplicável",
        "impressao": "Sugestivo de contaminação da amostra"
      },
      "interpretation": "Crescimento misto ou contagem baixa pode indicar contaminação da amostra, recomendando nova coleta quando clinicamente indicado.",
      "conclusion": "Resultado não conclusivo, sugestivo de contaminação da amostra."
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
  "technique": "Amostra processada conforme método laboratorial validado, com controles internos e referências aplicáveis ao exame.",
  "method": "Método laboratorial compatível com o parâmetro analisado, conforme validação interna do serviço.",
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
      "referencia": "≥ 100.000",
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
