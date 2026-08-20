import type { IntelligentExamModel } from "../types";

export const lab_dtpaModel: IntelligentExamModel = {
  "id": "lab_dtpa",
  "nome": "dTpa (Difteria, Tétano e Coqueluche)",
  "descricao": "Registro e avaliação de imunização dTpa",
  "categoria": "laboratorio",
  "icone": "fa-syringe",
  "campos": [
    {
      "id": "situacao_vacinal",
      "tipo": "select",
      "label": "Situação Vacinal",
      "opcoes": [
        {
          "valor": "em_dia",
          "label": "Em dia"
        },
        {
          "valor": "atrasada",
          "label": "Atrasada"
        },
        {
          "valor": "nao_vacinado",
          "label": "Não vacinado"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "dose",
      "tipo": "select",
      "label": "Dose Avaliada",
      "opcoes": [
        {
          "valor": "primeira",
          "label": "1ª dose"
        },
        {
          "valor": "reforco",
          "label": "Reforço"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "indicacao",
      "tipo": "select",
      "label": "Indicação Clínica",
      "opcoes": [
        {
          "valor": "gestante",
          "label": "Gestante"
        },
        {
          "valor": "adulto",
          "label": "Adulto"
        },
        {
          "valor": "profissional_saude",
          "label": "Profissional de saúde"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Vacinal",
      "opcoes": [
        {
          "valor": "adequada",
          "label": "Imunização adequada"
        },
        {
          "valor": "necessita_dose",
          "label": "Necessita atualização vacinal"
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
      "resultSummary": "dTpa (Difteria, Tétano e Coqueluche) com Situação Vacinal: Esquema vacinal compatível com o histórico informado; Dose Avaliada: Dose de reforço / conforme calendário; Indicação Clínica: Profilaxia contra difteria, tétano e coqueluche.",
      "interpretation": "Os parâmetros mensurados — Situação Vacinal: Esquema vacinal compatível com o histórico informado; Dose Avaliada: Dose de reforço / conforme calendário; Indicação Clínica: Profilaxia contra difteria, tétano e coqueluche — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "dTpa (Difteria, Tétano e Coqueluche) com parâmetros compatíveis com o padrão esperado, incluindo Situação Vacinal: Esquema vacinal compatível com o histórico informado; Dose Avaliada: Dose de reforço / conforme calendário.",
      "results": {
        "situacao_vacinal": "Esquema vacinal compatível com o histórico informado",
        "dose": "Dose de reforço / conforme calendário",
        "indicacao": "Profilaxia contra difteria, tétano e coqueluche",
        "impressao": "Situação vacinal adequada ao contexto informado"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "dTpa (Difteria, Tétano e Coqueluche): Situação Vacinal: Esquema incompleto para o contexto informado; Dose Avaliada: Dose de reforço pendente; Indicação Clínica: Atualização vacinal recomendada conforme calendário aplicável.",
      "interpretation": "Os resultados principais (Situação Vacinal: Esquema incompleto para o contexto informado; Dose Avaliada: Dose de reforço pendente; Indicação Clínica: Atualização vacinal recomendada conforme calendário aplicável) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "dTpa (Difteria, Tétano e Coqueluche) com padrão alterado, documentado por Situação Vacinal: Esquema incompleto para o contexto informado; Dose Avaliada: Dose de reforço pendente.",
      "results": {
        "situacao_vacinal": "Esquema incompleto para o contexto informado",
        "dose": "Dose de reforço pendente",
        "indicacao": "Atualização vacinal recomendada conforme calendário aplicável",
        "impressao": "Situação vacinal incompleta para dTpa"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "dTpa (Difteria, Tétano e Coqueluche): Situação Vacinal: Histórico vacinal não comprovado; Dose Avaliada: Dose prévia não confirmada; Indicação Clínica: Revisar carteira/documentação vacinal.",
      "interpretation": "Os principais resultados (Situação Vacinal: Histórico vacinal não comprovado; Dose Avaliada: Dose prévia não confirmada; Indicação Clínica: Revisar carteira/documentação vacinal) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "dTpa (Difteria, Tétano e Coqueluche) com resultado limítrofe/inespecífico, destacando-se Situação Vacinal: Histórico vacinal não comprovado; Dose Avaliada: Dose prévia não confirmada.",
      "results": {
        "situacao_vacinal": "Histórico vacinal não comprovado",
        "dose": "Dose prévia não confirmada",
        "indicacao": "Revisar carteira/documentação vacinal",
        "impressao": "Situação vacinal indeterminada por ausência de comprovação"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "dTpa (Difteria, Tétano e Coqueluche): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "situacao_vacinal": "Esquema vacinal compatível com o histórico informado",
        "dose": "Dose de reforço / conforme calendário",
        "indicacao": "Profilaxia contra difteria, tétano e coqueluche",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "dTpa (Difteria, Tétano e Coqueluche)",
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
  "technique": "Avaliação da situação vacinal relacionada à dTpa com base no histórico informado, registro de doses e indicação clínica vigente.",
  "method": "Revisão documental e clínica do esquema vacinal; este modelo registra situação, dose e indicação e não representa uma dosagem laboratorial de anticorpos.",
  "parameters": [
    {
      "id": "situacao_vacinal",
      "label": "Situação Vacinal",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Situação Vacinal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "dose",
      "label": "Dose Avaliada",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Dose Avaliada conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "indicacao",
      "label": "Indicação Clínica",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Indicação Clínica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Vacinal",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Vacinal conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de dTpa (Difteria, Tétano e Coqueluche) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "dTpa (Difteria, Tétano e Coqueluche) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "dTpa (Difteria, Tétano e Coqueluche) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "dTpa (Difteria, Tétano e Coqueluche) sem alterações significativas nos parâmetros avaliados.",
    "altered": "dTpa (Difteria, Tétano e Coqueluche) alterado conforme resultados objetivos descritos.",
    "undefined": "dTpa (Difteria, Tétano e Coqueluche) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
