import type { IntelligentExamModel } from "../types";

export const geral_exame_toxicologicoModel: IntelligentExamModel = {
  "id": "geral_exame_toxicologico",
  "nome": "Exame Toxicológico",
  "descricao": "Pesquisa laboratorial de substâncias psicoativas, metabólitos e compostos relacionados.",
  "categoria": "toxicologia",
  "icone": "fa-flask-vial",
  "campos": [
    {
      "id": "material",
      "tipo": "select",
      "label": "Material biológico",
      "opcoes": [
        {
          "valor": "Urina",
          "label": "Urina"
        },
        {
          "valor": "Sangue",
          "label": "Sangue"
        },
        {
          "valor": "Cabelo",
          "label": "Cabelo"
        },
        {
          "valor": "Pelos",
          "label": "Pelos"
        },
        {
          "valor": "Saliva",
          "label": "Saliva"
        }
      ]
    },
    {
      "id": "data_coleta",
      "tipo": "date",
      "label": "Data da coleta"
    },
    {
      "id": "hora_coleta",
      "tipo": "text",
      "label": "Hora da coleta",
      "placeholder": "HH:MM"
    },
    {
      "id": "condicao_amostra",
      "tipo": "select",
      "label": "Condições da amostra",
      "opcoes": [
        {
          "valor": "Adequada",
          "label": "Adequada"
        },
        {
          "valor": "Inadequada",
          "label": "Inadequada"
        },
        {
          "valor": "Com ressalvas",
          "label": "Com ressalvas"
        }
      ]
    },
    {
      "id": "identificacao_amostra",
      "tipo": "text",
      "label": "Identificação da amostra",
      "placeholder": "Código único"
    }
  ],
  "adapter": {
    "id": "material_biologico",
    "label": "Material biológico",
    "kind": "type",
    "enabled": true,
    "options": [
      "Urina",
      "Sangue",
      "Cabelo",
      "Pelos",
      "Saliva"
    ],
    "description": "Selecione o material biológico utilizado na análise toxicológica."
  },
  "clinicalContexts": [
    "Rotina",
    "Ocupacional",
    "Administrativo",
    "Porte de arma",
    "Pilotagem aérea",
    "Treinamento de combate",
    "Suspeita clínica"
  ],
  "profiles": [
    {
      "id": "negativo",
      "name": "Negativo",
      "status": "normal",
      "description": "Nenhuma substância pesquisada detectada acima dos respectivos valores de corte.",
      "resultSummary": "Não foram identificadas substâncias psicoativas ou metabólitos acima dos limites analíticos estabelecidos para o método empregado.",
      "results": {
        "integridade": "Preservada",
        "aspecto": "Normal",
        "adulterantes": "Não detectados",
        "canabinoides": "Não reagente",
        "cocaina": "Não reagente",
        "anfetaminas": "Não reagente",
        "metanfetaminas": "Não reagente",
        "opiaceos": "Não reagente",
        "benzodiazepinicos": "Não reagente",
        "barbituricos": "Não reagente",
        "metadona": "Não reagente",
        "fenciclidina": "Não reagente",
        "outras_substancias": "Não reagente",
        "temperatura": "36,2 °C",
        "creatinina": "118 mg/dL",
        "ph": "6,1",
        "densidade": "1,018"
      },
      "interpretation": "Os resultados não reagentes indicam ausência de detecção ou concentrações inferiores aos valores de corte considerados para as substâncias pesquisadas.",
      "conclusion": "Perfil toxicológico negativo para as substâncias pesquisadas, considerando o material biológico, o método e os valores de corte utilizados."
    },
    {
      "id": "positivo",
      "name": "Positivo",
      "status": "alterado",
      "description": "Detecção de uma ou mais substâncias acima do valor de corte.",
      "resultSummary": "Foram identificados resultados reagentes na pesquisa toxicológica, com detecção acima do limite analítico estabelecido para uma ou mais classes pesquisadas.",
      "results": {
        "integridade": "Preservada",
        "aspecto": "Normal",
        "adulterantes": "Não detectados",
        "canabinoides": "Reagente",
        "cocaina": "Não reagente",
        "anfetaminas": "Não reagente",
        "metanfetaminas": "Não reagente",
        "opiaceos": "Não reagente",
        "benzodiazepinicos": "Não reagente",
        "barbituricos": "Não reagente",
        "metadona": "Não reagente",
        "fenciclidina": "Não reagente",
        "outras_substancias": "Não reagente",
        "temperatura": "36,4 °C",
        "creatinina": "132 mg/dL",
        "ph": "6,4",
        "densidade": "1,021"
      },
      "interpretation": "Resultado reagente indica detecção da substância ou de seus metabólitos acima do limite analítico estabelecido. Quando aplicável, recomenda-se correlação com método confirmatório de maior especificidade.",
      "conclusion": "Perfil toxicológico positivo para as classes assinaladas como reagentes. O resultado deve ser correlacionado ao método confirmatório, ao material analisado e ao contexto da solicitação."
    },
    {
      "id": "inconclusivo",
      "name": "Inconclusivo",
      "status": "indefinido",
      "description": "Resultado não conclusivo por interferência, concentração limítrofe ou necessidade de repetição.",
      "resultSummary": "A análise apresentou resultado inconclusivo, não permitindo classificação definitiva para uma ou mais substâncias pesquisadas.",
      "results": {
        "integridade": "Inconclusiva",
        "aspecto": "Alterado",
        "adulterantes": "Inconclusiva",
        "canabinoides": "Indeterminado — próximo ao valor de corte",
        "cocaina": "Não reagente",
        "anfetaminas": "Inconclusivo",
        "metanfetaminas": "Inconclusivo",
        "opiaceos": "Inconclusivo",
        "benzodiazepinicos": "Inconclusivo",
        "barbituricos": "Inconclusivo",
        "metadona": "Inconclusivo",
        "fenciclidina": "Inconclusivo",
        "outras_substancias": "Inconclusivo",
        "temperatura": "Indeterminada",
        "creatinina": "Limítrofe",
        "ph": "Limítrofe",
        "densidade": "Limítrofe"
      },
      "interpretation": "Resultados inconclusivos podem estar relacionados a interferências analíticas, concentração limítrofe, condição da amostra ou necessidade de nova coleta.",
      "conclusion": "Perfil toxicológico inconclusivo. Recomenda-se nova coleta e repetição da análise conforme avaliação técnica."
    },
    {
      "id": "amostra_inadequada",
      "name": "Amostra inadequada",
      "status": "alterado",
      "description": "Amostra sem condições técnicas adequadas para conclusão da análise.",
      "resultSummary": "A amostra recebida não apresentou condições técnicas adequadas para emissão de resultado toxicológico conclusivo.",
      "results": {
        "integridade": "Alterada",
        "aspecto": "Alterado",
        "adulterantes": "Detectados",
        "canabinoides": "Não liberado — amostra inadequada",
        "cocaina": "Não liberado — amostra inadequada",
        "anfetaminas": "Não aplicável",
        "metanfetaminas": "Não aplicável",
        "opiaceos": "Não aplicável",
        "benzodiazepinicos": "Não aplicável",
        "barbituricos": "Não aplicável",
        "metadona": "Não aplicável",
        "fenciclidina": "Não aplicável",
        "outras_substancias": "Não aplicável",
        "temperatura": "Fora da faixa",
        "creatinina": "Incompatível",
        "ph": "Incompatível",
        "densidade": "Incompatível"
      },
      "interpretation": "A inadequação da amostra impede interpretação segura. Os parâmetros de integridade e controle de qualidade inviabilizam a liberação conclusiva da pesquisa toxicológica.",
      "conclusion": "Amostra inadequada para análise toxicológica conclusiva. Recomenda-se nova coleta conforme protocolo institucional."
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Exame Toxicológico",
    "sections": [
      {
        "id": "tecnica",
        "title": "Finalidade, material e técnica",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "resultados",
        "title": "Resultado laboratorial",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "Substâncias e controle da amostra",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "Interpretação",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "conclusao",
        "title": "Conclusão",
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
    "defaultProfileId": "negativo"
  },
  "pdfModel": {
    "template": "institutional-a4",
    "sections": [
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
        "id": "tecnica",
        "title": "Finalidade, material e técnica",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "resultados",
        "title": "Resultado laboratorial",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "Substâncias e controle da amostra",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "Interpretação",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "conclusao",
        "title": "Conclusão",
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
  "technique": "Pesquisa toxicológica realizada em material biológico informado, com controle de integridade da amostra e rastreamento das classes de substâncias previstas no painel.",
  "method": "Triagem por método imunológico compatível com a matriz analisada; resultados reagentes podem ser submetidos a confirmação por cromatografia associada à espectrometria de massas, conforme protocolo.",
  "parameters": [
    {
      "id": "canabinoides",
      "label": "Canabinoides",
      "unidade": null,
      "referencia": "Valor de corte: 50 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "cocaina",
      "label": "Cocaína e metabólitos",
      "unidade": null,
      "referencia": "Valor de corte: 300 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "anfetaminas",
      "label": "Anfetaminas",
      "unidade": null,
      "referencia": "Valor de corte: 500 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "metanfetaminas",
      "label": "Metanfetaminas",
      "unidade": null,
      "referencia": "Valor de corte: 500 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "opiaceos",
      "label": "Opiáceos",
      "unidade": null,
      "referencia": "Valor de corte: 300 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "benzodiazepinicos",
      "label": "Benzodiazepínicos",
      "unidade": null,
      "referencia": "Valor de corte: 200 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "barbituricos",
      "label": "Barbitúricos",
      "unidade": null,
      "referencia": "Valor de corte: 200 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "metadona",
      "label": "Metadona",
      "unidade": null,
      "referencia": "Valor de corte: 300 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "fenciclidina",
      "label": "Fenciclidina",
      "unidade": null,
      "referencia": "Valor de corte: 25 ng/mL",
      "resultPlaceholder": "Não reagente / Reagente / Inconclusivo",
      "interpretationHint": "Interpretar conforme valor de corte."
    },
    {
      "id": "outras_substancias",
      "label": "Outras substâncias",
      "unidade": null,
      "referencia": "Conforme painel solicitado",
      "resultPlaceholder": "Resultado",
      "interpretationHint": "Interpretar conforme painel."
    },
    {
      "id": "integridade",
      "label": "Integridade da amostra",
      "unidade": null,
      "referencia": "Preservada",
      "resultPlaceholder": "Preservada / Alterada / Inconclusiva",
      "interpretationHint": "Controle de qualidade."
    },
    {
      "id": "aspecto",
      "label": "Aspecto",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "Normal / Alterado",
      "interpretationHint": "Controle de qualidade."
    },
    {
      "id": "temperatura",
      "label": "Temperatura no momento da coleta",
      "unidade": null,
      "referencia": "32,0 a 38,0 °C",
      "resultPlaceholder": "Valor",
      "interpretationHint": "Controle de qualidade."
    },
    {
      "id": "creatinina",
      "label": "Creatinina",
      "unidade": null,
      "referencia": "Conforme material e método",
      "resultPlaceholder": "Valor",
      "interpretationHint": "Controle de qualidade."
    },
    {
      "id": "ph",
      "label": "pH",
      "unidade": null,
      "referencia": "4,5 a 8,0",
      "resultPlaceholder": "Valor",
      "interpretationHint": "Controle de qualidade."
    },
    {
      "id": "densidade",
      "label": "Densidade",
      "unidade": null,
      "referencia": "1,003 a 1,035",
      "resultPlaceholder": "Valor",
      "interpretationHint": "Controle de qualidade."
    },
    {
      "id": "adulterantes",
      "label": "Pesquisa de adulterantes",
      "unidade": null,
      "referencia": "Não detectados",
      "resultPlaceholder": "Não detectados / Detectados / Inconclusiva",
      "interpretationHint": "Controle de qualidade."
    }
  ],
  "tables": [
    {
      "id": "substancias",
      "title": "Substâncias pesquisadas",
      "headers": [
        "Substância ou classe",
        "Resultado",
        "Valor de corte"
      ],
      "rowsFromParameters": true
    },
    {
      "id": "controle_amostra",
      "title": "Controle de qualidade da amostra",
      "headers": [
        "Parâmetro",
        "Resultado",
        "Referência"
      ],
      "rowsFromParameters": true
    }
  ],
  "interpretation": {
    "normal": "Resultados de Exame Toxicológico compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Exame Toxicológico com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Exame Toxicológico com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Exame Toxicológico sem alterações significativas nos parâmetros avaliados.",
    "altered": "Exame Toxicológico alterado conforme resultados objetivos descritos.",
    "undefined": "Exame Toxicológico com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
  },
  "attachments": {
    "enabled": true,
    "mode": "future",
    "acceptedTypes": [
      "image/png",
      "image/jpeg",
      "application/pdf"
    ]
  }
};
