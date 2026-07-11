import type { IntelligentExamModel } from "../types";

export const lab_urina_analiseModel: IntelligentExamModel = {
  "id": "lab_urina_analise",
  "nome": "Urina Tipo I – Análise",
  "descricao": "Análise físico-química e microscópica da urina",
  "categoria": "laboratorio",
  "icone": "fa-flask",
  "campos": [
    {
      "id": "cor",
      "tipo": "select",
      "label": "Cor",
      "opcoes": [
        {
          "valor": "amarelo_claro",
          "label": "Amarelo claro"
        },
        {
          "valor": "amarelo_escuro",
          "label": "Amarelo escuro"
        },
        {
          "valor": "avermelhada",
          "label": "Avermelhada"
        }
      ],
      "referencia": "Amarelo claro"
    },
    {
      "id": "aspecto",
      "tipo": "select",
      "label": "Aspecto",
      "opcoes": [
        {
          "valor": "limpido",
          "label": "Límpido"
        },
        {
          "valor": "turvo",
          "label": "Turvo"
        }
      ],
      "referencia": "Límpido"
    },
    {
      "id": "densidade",
      "tipo": "number",
      "label": "Densidade",
      "referencia": "1.005 – 1.030"
    },
    {
      "id": "ph",
      "tipo": "number",
      "label": "pH",
      "referencia": "4.5 – 8.0"
    },
    {
      "id": "proteinas",
      "tipo": "select",
      "label": "Proteínas",
      "opcoes": [
        {
          "valor": "ausente",
          "label": "Ausente"
        },
        {
          "valor": "tracos",
          "label": "Traços"
        },
        {
          "valor": "presente",
          "label": "Presente"
        }
      ],
      "referencia": "Ausente"
    },
    {
      "id": "glicose",
      "tipo": "select",
      "label": "Glicose",
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
      "id": "cetonas",
      "tipo": "select",
      "label": "Corpos Cetônicos",
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
      "id": "nitrito",
      "tipo": "select",
      "label": "Nitrito",
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
      "id": "leucocitos",
      "tipo": "number",
      "label": "Leucócitos",
      "unidade": "por campo",
      "referencia": "Até 5"
    },
    {
      "id": "hemacias",
      "tipo": "number",
      "label": "Hemácias",
      "unidade": "por campo",
      "referencia": "Até 3"
    },
    {
      "id": "cilindros",
      "tipo": "select",
      "label": "Cilindros",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "hialinos",
          "label": "Hialinos"
        },
        {
          "valor": "patologicos",
          "label": "Patológicos"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "bacterias",
      "tipo": "select",
      "label": "Bactérias",
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
      "label": "Impressão Laboratorial",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Exame dentro da normalidade"
        },
        {
          "valor": "infecao_urinaria",
          "label": "Sugestivo de infecção urinária"
        },
        {
          "valor": "alteracao_metabolica",
          "label": "Alterações metabólicas"
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
      "description": "Urina tipo I sem alterações físico-químicas ou sedimentares relevantes.",
      "resultSummary": "Amostra urinária sem alterações laboratoriais relevantes.",
      "interpretation": "Aspectos físico-químicos e sedimentoscopia dentro do padrão esperado para a amostra analisada.",
      "conclusion": "Urina tipo I sem alterações laboratoriais significativas."
    },
    {
      "id": "itu",
      "name": "Sugestivo de ITU",
      "status": "alterado",
      "description": "Achados compatíveis com processo infeccioso urinário, sem substituir correlação clínica/cultura.",
      "resultSummary": "Exame com leucocitúria, bacteriúria e/ou nitrito positivo, padrão sugestivo de infecção urinária.",
      "interpretation": "A presença de leucocitúria e bacteriúria, associada ou não a nitrito positivo, é compatível com processo inflamatório/infeccioso do trato urinário. Recomenda-se correlação com sintomas e urocultura quando indicada.",
      "conclusion": "Achados urinários sugestivos de infecção do trato urinário."
    },
    {
      "id": "proteinuria",
      "name": "Proteinúria",
      "status": "alterado",
      "description": "Presença de proteína urinária acima do esperado.",
      "resultSummary": "Exame com proteinúria detectável.",
      "interpretation": "A presença de proteínas na urina pode estar associada a alterações renais, condições transitórias ou contexto clínico específico, devendo ser correlacionada clinicamente.",
      "conclusion": "Proteinúria detectável. Recomenda-se correlação clínica e seguimento conforme avaliação médica."
    },
    {
      "id": "hematuria",
      "name": "Hematúria",
      "status": "alterado",
      "description": "Hemácias acima do valor esperado na sedimentoscopia.",
      "resultSummary": "Exame com hematúria microscópica.",
      "interpretation": "A elevação de hemácias no sedimento urinário caracteriza hematúria microscópica e pode ocorrer em diferentes contextos urológicos, nefrológicos ou transitórios.",
      "conclusion": "Hematúria microscópica. Recomenda-se correlação clínica."
    },
    {
      "id": "litiase",
      "name": "Litíase / cristais",
      "status": "alterado",
      "description": "Achados urinários que podem acompanhar litíase ou cristalúria.",
      "resultSummary": "Exame com hematúria e achados compatíveis com cristalúria/litíase, conforme contexto.",
      "interpretation": "Achados de hematúria e/ou cristalúria podem ser observados em litíase urinária, devendo ser correlacionados com dor, imagem e avaliação clínica.",
      "conclusion": "Achados urinários compatíveis com cristalúria/litíase no contexto adequado."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alterações discretas sem definição isolada.",
      "resultSummary": "Exame com alterações discretas ou inespecíficas.",
      "interpretation": "Achados discretos no exame de urina, sem definição diagnóstica isolada.",
      "conclusion": "Alteração urinária limítrofe/inespecífica. Recomenda-se correlação clínica."
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
    "title": "Urina Tipo I – Análise",
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
      "id": "cor",
      "label": "Cor",
      "unidade": null,
      "referencia": "Amarelo claro",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cor conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "aspecto",
      "label": "Aspecto",
      "unidade": null,
      "referencia": "Límpido",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Aspecto conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "densidade",
      "label": "Densidade",
      "unidade": null,
      "referencia": "1.005 – 1.030",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Densidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ph",
      "label": "pH",
      "unidade": null,
      "referencia": "4.5 – 8.0",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar pH conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "proteinas",
      "label": "Proteínas",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Proteínas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "glicose",
      "label": "Glicose",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Glicose conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "cetonas",
      "label": "Corpos Cetônicos",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Corpos Cetônicos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "nitrito",
      "label": "Nitrito",
      "unidade": null,
      "referencia": "Negativo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Nitrito conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "leucocitos",
      "label": "Leucócitos",
      "unidade": "por campo",
      "referencia": "Até 5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Leucócitos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemacias",
      "label": "Hemácias",
      "unidade": "por campo",
      "referencia": "Até 3",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemácias conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "cilindros",
      "label": "Cilindros",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Cilindros conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "bacterias",
      "label": "Bactérias",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Bactérias conforme referência, contexto clínico e método utilizado."
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
