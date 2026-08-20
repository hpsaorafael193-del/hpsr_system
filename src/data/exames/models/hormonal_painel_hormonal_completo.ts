import type { IntelligentExamModel } from "../types";

export const hormonal_painel_hormonal_completoModel: IntelligentExamModel = {
  "id": "hormonal_painel_hormonal_completo",
  "nome": "Painel Hormonal Completo",
  "descricao": "Avaliação integrada dos hormônios gonadotróficos, ovarianos e tireoidianos para investigação da função reprodutiva, fertilidade e equilíbrio endócrino.",
  "categoria": "hormonal",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "fase_ciclo",
      "tipo": "select",
      "label": "Fase do ciclo menstrual",
      "opcoes": [
        {
          "valor": "folicular",
          "label": "Fase folicular"
        },
        {
          "valor": "ovulatoria",
          "label": "Fase ovulatória"
        },
        {
          "valor": "lutea",
          "label": "Fase lútea"
        },
        {
          "valor": "gestacao",
          "label": "Gestação"
        },
        {
          "valor": "pos_menopausa",
          "label": "Pós-menopausa"
        }
      ],
      "referencia": "Contexto fisiológico"
    },
    {
      "id": "fsh",
      "tipo": "number",
      "label": "FSH",
      "unidade": "mUI/mL",
      "referencia": "Fase folicular: 3,5–12,5"
    },
    {
      "id": "lh",
      "tipo": "number",
      "label": "LH",
      "unidade": "mUI/mL",
      "referencia": "Fase folicular: 2,4–12,6"
    },
    {
      "id": "estradiol",
      "tipo": "number",
      "label": "Estradiol (E2)",
      "unidade": "pg/mL",
      "referencia": "Fase folicular: 20–350"
    },
    {
      "id": "progesterona",
      "tipo": "number",
      "label": "Progesterona",
      "unidade": "ng/mL",
      "referencia": "Fase lútea: 1,8–23"
    },
    {
      "id": "prolactina",
      "tipo": "number",
      "label": "Prolactina",
      "unidade": "ng/mL",
      "referencia": "Mulheres: 2–25"
    },
    {
      "id": "tsh",
      "tipo": "number",
      "label": "TSH",
      "unidade": "µUI/mL",
      "referencia": "0,4–4,0"
    },
    {
      "id": "t4_livre",
      "tipo": "number",
      "label": "T4 Livre",
      "unidade": "ng/dL",
      "referencia": "0,8–1,8"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Laboratorial",
      "opcoes": [
        {
          "valor": "perfil_hormonal_preservado",
          "label": "Perfil hormonal global dentro dos parâmetros de referência"
        },
        {
          "valor": "padrao_ovulatorio_adequado",
          "label": "Achados compatíveis com atividade ovulatória preservada"
        },
        {
          "valor": "padrao_anovulatorio",
          "label": "Achados sugestivos de disfunção ovulatória"
        },
        {
          "valor": "hiperprolactinemia",
          "label": "Elevação dos níveis séricos de prolactina"
        },
        {
          "valor": "disfuncao_tireoidiana",
          "label": "Alterações laboratoriais da função tireoidiana"
        },
        {
          "valor": "reserva_ovariana_reduzida",
          "label": "Achados sugestivos de redução da reserva ovariana"
        },
        {
          "valor": "alteracoes_hormonais_multiplas",
          "label": "Múltiplas alterações hormonais identificadas"
        }
      ],
      "referencia": "Síntese laboratorial"
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
    "id": "contexto_clinico",
    "label": "Contexto clínico",
    "kind": "clinical-context",
    "enabled": true,
    "options": [
      "Rotina",
      "FIV",
      "Infertilidade",
      "SOP",
      "Menopausa",
      "Masculino",
      "Pediátrico",
      "Personalizado"
    ],
    "description": "O painel permanece único; o contexto clínico ajusta referências, observações e interpretação."
  },
  "clinicalContexts": [
    "Rotina",
    "FIV",
    "Infertilidade",
    "SOP",
    "Menopausa",
    "Masculino",
    "Pediátrico",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Painel dentro do esperado para o contexto informado.",
      "resultSummary": "Painel hormonal sem alterações relevantes.",
      "interpretation": "FSH, LH, estradiol, progesterona, prolactina, TSH e T4 livre devem ser interpretados conforme sexo, idade, fase do ciclo e contexto clínico.",
      "conclusion": "Painel hormonal sem alterações laboratoriais relevantes no contexto informado.",
      "results": {
        "fase_ciclo": "Fase folicular",
        "fsh": "6,8",
        "lh": "5,9",
        "estradiol": "92",
        "progesterona": "0,8",
        "prolactina": "14",
        "tsh": "2,1",
        "t4_livre": "1,2",
        "impressao": "Perfil hormonal compatível com fase folicular, sem alterações relevantes"
      }
    },
    {
      "id": "disfuncao_ovulatoria",
      "name": "Disfunção ovulatória",
      "status": "alterado",
      "description": "Padrão sugestivo de alteração ovulatória.",
      "resultSummary": "Painel hormonal com alteração em eixo gonadal.",
      "interpretation": "Alterações em FSH, LH, estradiol e/ou progesterona podem sugerir disfunção ovulatória, devendo ser correlacionadas ao ciclo.",
      "conclusion": "Progesterona baixa para a fase lútea presumida, com perfil compatível com possível disfunção ovulatória no contexto adequado.",
      "results": {
        "fase_ciclo": "Fase lútea presumida",
        "fsh": "7,1",
        "lh": "8,2",
        "estradiol": "88",
        "progesterona": "1,2",
        "prolactina": "16",
        "tsh": "2,0",
        "t4_livre": "1,2",
        "impressao": "Progesterona baixa para fase lútea, sugerindo atividade ovulatória insuficiente no contexto adequado"
      }
    },
    {
      "id": "hiperprolactinemia",
      "name": "Hiperprolactinemia",
      "status": "alterado",
      "description": "Elevação de prolactina.",
      "resultSummary": "Painel hormonal com prolactina elevada.",
      "interpretation": "Elevação de prolactina deve ser interpretada com medicações, estresse, gestação e função tireoidiana.",
      "conclusion": "Hiperprolactinemia laboratorial a correlacionar clinicamente.",
      "results": {
        "fase_ciclo": "Fase folicular",
        "fsh": "6,2",
        "lh": "5,1",
        "estradiol": "76",
        "progesterona": "0,7",
        "prolactina": "46",
        "tsh": "2,3",
        "t4_livre": "1,1",
        "impressao": "Hiperprolactinemia laboratorial"
      }
    },
    {
      "id": "tireoide",
      "name": "Disfunção tireoidiana",
      "status": "alterado",
      "description": "Alteração de TSH e/ou T4 livre.",
      "resultSummary": "Painel hormonal com alteração tireoidiana.",
      "interpretation": "TSH e T4 livre fora da referência podem sugerir disfunção tireoidiana conforme padrão hormonal.",
      "conclusion": "TSH elevado associado a T4 livre reduzido, padrão hormonal sugestivo de hipotireoidismo primário no contexto clínico adequado.",
      "results": {
        "fase_ciclo": "Fase folicular",
        "fsh": "6,5",
        "lh": "5,7",
        "estradiol": "84",
        "progesterona": "0,8",
        "prolactina": "18",
        "tsh": "6,2",
        "t4_livre": "0,7",
        "impressao": "Padrão compatível com hipotireoidismo primário no contexto clínico adequado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alterações discretas sem conclusão diagnóstica.",
      "resultSummary": "Painel hormonal com variações limítrofes.",
      "interpretation": "Alterações discretas podem não definir diagnóstico isoladamente e dependem de ciclo, idade, medicamentos e contexto clínico.",
      "conclusion": "Painel hormonal com parâmetros em faixas limítrofes, sem definição endócrina isolada.",
      "results": {
        "fase_ciclo": "Fase folicular",
        "fsh": "12,6",
        "lh": "12,4",
        "estradiol": "44",
        "progesterona": "1,7",
        "prolactina": "25",
        "tsh": "4,1",
        "t4_livre": "0,8",
        "impressao": "Parâmetros hormonais em faixas limítrofes"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Painel Hormonal Completo: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "fase_ciclo": "Fase folicular",
        "fsh": "6,8",
        "lh": "5,9",
        "estradiol": "92",
        "progesterona": "0,8",
        "prolactina": "14",
        "tsh": "2,1",
        "t4_livre": "1,2",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [
    {
      "id": "fase_ciclo",
      "label": "Fase do ciclo",
      "tipo": "select",
      "options": [
        "Folicular",
        "Ovulatória",
        "Lútea",
        "Menopausa",
        "Não se aplica"
      ]
    },
    {
      "id": "dia_estimulacao",
      "label": "Dia da estimulação",
      "tipo": "number"
    },
    {
      "id": "contexto",
      "label": "Contexto clínico",
      "tipo": "select",
      "options": [
        "Rotina",
        "FIV",
        "Infertilidade",
        "SOP",
        "Menopausa",
        "Masculino",
        "Pediátrico",
        "Personalizado"
      ]
    }
  ],
  "editorModel": {
    "title": "Painel Hormonal Completo",
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
  "technique": "Amostra sérica processada para painel hormonal, com avaliação integrada de gonadotrofinas, hormônios ovarianos, prolactina e eixo tireoidiano conforme o contexto informado.",
  "method": "Dosagens hormonais por imunoensaios automatizados validados, com interpretação considerando sexo, idade, fase do ciclo, horário de coleta e referências específicas de cada analito.",
  "parameters": [
    {
      "id": "fase_ciclo",
      "label": "Fase do ciclo menstrual",
      "unidade": null,
      "referencia": "Contexto fisiológico",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fase do ciclo menstrual conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "fsh",
      "label": "FSH",
      "unidade": "mUI/mL",
      "referencia": "Fase folicular: 3,5–12,5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar FSH conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "lh",
      "label": "LH",
      "unidade": "mUI/mL",
      "referencia": "Fase folicular: 2,4–12,6",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar LH conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "estradiol",
      "label": "Estradiol (E2)",
      "unidade": "pg/mL",
      "referencia": "Fase folicular: 20–350",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estradiol (E2) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "progesterona",
      "label": "Progesterona",
      "unidade": "ng/mL",
      "referencia": "Fase lútea: 1,8–23",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Progesterona conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "prolactina",
      "label": "Prolactina",
      "unidade": "ng/mL",
      "referencia": "Mulheres: 2–25",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Prolactina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tsh",
      "label": "TSH",
      "unidade": "µUI/mL",
      "referencia": "0,4–4,0",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar TSH conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "t4_livre",
      "label": "T4 Livre",
      "unidade": "ng/dL",
      "referencia": "0,8–1,8",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar T4 Livre conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Laboratorial",
      "unidade": null,
      "referencia": "Síntese laboratorial",
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
    "normal": "Resultados de Painel Hormonal Completo compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Painel Hormonal Completo com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Painel Hormonal Completo com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Painel Hormonal Completo sem alterações significativas nos parâmetros avaliados.",
    "altered": "Painel Hormonal Completo alterado conforme resultados objetivos descritos.",
    "undefined": "Painel Hormonal Completo com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
