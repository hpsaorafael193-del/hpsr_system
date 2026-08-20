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
      "resultSummary": "Anticorpos Irregulares com Resultado da Pesquisa: Negativo; Anticorpo Identificado: Não identificado; Classe de Imunoglobulina: Não aplicável.",
      "interpretation": "Os parâmetros mensurados — Resultado da Pesquisa: Negativo; Anticorpo Identificado: Não identificado; Classe de Imunoglobulina: Não aplicável; Intensidade da Reação: Sem reação detectável — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Anticorpos Irregulares com parâmetros compatíveis com o padrão esperado, incluindo Resultado da Pesquisa: Negativo; Anticorpo Identificado: Não identificado.",
      "results": {
        "resultado": "Negativo",
        "anticorpo": "Não identificado",
        "classe": "Não aplicável",
        "intensidade": "Sem reação detectável",
        "correlacao": "Sem anticorpos eritrocitários irregulares detectáveis",
        "impressao": "Pesquisa de anticorpos irregulares negativa"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Anticorpos Irregulares: Resultado da Pesquisa: Positivo; Anticorpo Identificado: Anti-D; Classe de Imunoglobulina: IgG; Intensidade da Reação: 2+.",
      "interpretation": "Os resultados principais (Resultado da Pesquisa: Positivo; Anticorpo Identificado: Anti-D; Classe de Imunoglobulina: IgG; Intensidade da Reação: 2+) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Anticorpos Irregulares com padrão alterado, documentado por Resultado da Pesquisa: Positivo; Anticorpo Identificado: Anti-D.",
      "results": {
        "resultado": "Positivo",
        "anticorpo": "Anti-D",
        "classe": "IgG",
        "intensidade": "2+",
        "correlacao": "Anticorpo eritrocitário clinicamente significativo; correlacionar com histórico transfusional/obstétrico",
        "impressao": "Pesquisa positiva para anticorpo eritrocitário irregular Anti-D"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Anticorpos Irregulares: Resultado da Pesquisa: Reação fraca/inconclusiva; Anticorpo Identificado: Especificidade não definida; Classe de Imunoglobulina: Não definida; Intensidade da Reação: ± a 1+.",
      "interpretation": "Os principais resultados (Resultado da Pesquisa: Reação fraca/inconclusiva; Anticorpo Identificado: Especificidade não definida; Classe de Imunoglobulina: Não definida; Intensidade da Reação: ± a 1+) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Anticorpos Irregulares com resultado limítrofe/inespecífico, destacando-se Resultado da Pesquisa: Reação fraca/inconclusiva; Anticorpo Identificado: Especificidade não definida.",
      "results": {
        "resultado": "Reação fraca/inconclusiva",
        "anticorpo": "Especificidade não definida",
        "classe": "Não definida",
        "intensidade": "± a 1+",
        "correlacao": "Recomenda-se repetição e painel de identificação conforme indicação",
        "impressao": "Pesquisa com reatividade fraca, sem especificidade definida"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Anticorpos Irregulares: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "resultado": "Negativo",
        "anticorpo": "Não identificado",
        "classe": "Não aplicável",
        "intensidade": "Sem reação detectável",
        "correlacao": "Sem anticorpos eritrocitários irregulares detectáveis",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
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
  "technique": "Amostra de sangue processada para pesquisa de anticorpos eritrocitários irregulares clinicamente significativos.",
  "method": "Teste de antiglobulina indireta em painel de hemácias reagentes, com identificação complementar quando houver reatividade.",
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
    "normal": "Resultados de Anticorpos Irregulares compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Anticorpos Irregulares com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Anticorpos Irregulares com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Anticorpos Irregulares sem alterações significativas nos parâmetros avaliados.",
    "altered": "Anticorpos Irregulares alterado conforme resultados objetivos descritos.",
    "undefined": "Anticorpos Irregulares com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
