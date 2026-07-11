import type { IntelligentExamModel } from "../types";

export const lab_anticorpos_irregularesModel: IntelligentExamModel = {
  "id": "lab_anticorpos_irregulares",
  "nome": "Anticorpos Irregulares",
  "descricao": "Detecção de anticorpos irregulares associados a anemia hemolítica imunomediada",
  "categoria": "laboratorio",
  "icone": "fa-droplet",
  "campos": [
    {
      "id": "resultado",
      "tipo": "select",
      "label": "Resultado da Pesquisa",
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
      "id": "anticorpo",
      "tipo": "select",
      "label": "Anticorpo Identificado",
      "opcoes": [
        {
          "valor": "nao_identificado",
          "label": "Não identificado"
        },
        {
          "valor": "anti_d",
          "label": "Anti-D"
        },
        {
          "valor": "anti_c",
          "label": "Anti-C"
        },
        {
          "valor": "anti_e",
          "label": "Anti-E"
        },
        {
          "valor": "anti_kell",
          "label": "Anti-Kell"
        },
        {
          "valor": "anti_duffy",
          "label": "Anti-Duffy"
        },
        {
          "valor": "anti_kidd",
          "label": "Anti-Kidd"
        },
        {
          "valor": "outros",
          "label": "Outros"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "classe",
      "tipo": "select",
      "label": "Classe de Imunoglobulina",
      "opcoes": [
        {
          "valor": "igg",
          "label": "IgG"
        },
        {
          "valor": "igm",
          "label": "IgM"
        },
        {
          "valor": "mista",
          "label": "IgG + IgM"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "intensidade",
      "tipo": "select",
      "label": "Intensidade da Reação",
      "opcoes": [
        {
          "valor": "fraca",
          "label": "Fraca"
        },
        {
          "valor": "moderada",
          "label": "Moderada"
        },
        {
          "valor": "forte",
          "label": "Forte"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "correlacao",
      "tipo": "select",
      "label": "Correlação Clínica",
      "opcoes": [
        {
          "valor": "sem_hemolise",
          "label": "Sem evidência de hemólise"
        },
        {
          "valor": "hemolise_aguda",
          "label": "Sugestivo de hemólise aguda"
        },
        {
          "valor": "hemolise_cronica",
          "label": "Sugestivo de hemólise crônica"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão",
      "opcoes": [
        {
          "valor": "negativa",
          "label": "Pesquisa negativa"
        },
        {
          "valor": "positiva",
          "label": "Anticorpos detectados"
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
      "description": "Parâmetros dentro das referências disponíveis.",
      "resultSummary": "Exame sem alterações relevantes.",
      "interpretation": "Resultados dentro do esperado para método, referência e contexto clínico informado.",
      "conclusion": "Exame sem alterações significativas."
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Exame com alterações nos parâmetros avaliados.",
      "interpretation": "Alterações devem ser correlacionadas com quadro clínico, medicamentos, evolução e exames complementares.",
      "conclusion": "Exame alterado, recomendando correlação clínica."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Exame com achado limítrofe ou inespecífico.",
      "interpretation": "Resultado isolado não define diagnóstico e pode requerer repetição/seguimento conforme avaliação médica.",
      "conclusion": "Achado indefinido ou limítrofe, recomendando correlação clínica."
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
    "title": "Anticorpos Irregulares",
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
      "id": "resultado",
      "label": "Resultado da Pesquisa",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado da Pesquisa conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "anticorpo",
      "label": "Anticorpo Identificado",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Anticorpo Identificado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "classe",
      "label": "Classe de Imunoglobulina",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Classe de Imunoglobulina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "intensidade",
      "label": "Intensidade da Reação",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Intensidade da Reação conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "correlacao",
      "label": "Correlação Clínica",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Correlação Clínica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão conforme referência, contexto clínico e método utilizado."
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
