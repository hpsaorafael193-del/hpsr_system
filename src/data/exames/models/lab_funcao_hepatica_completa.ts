import type { IntelligentExamModel } from "../types";

export const lab_funcao_hepatica_completaModel: IntelligentExamModel = {
  "id": "lab_funcao_hepatica_completa",
  "nome": "Função Hepática",
  "descricao": "Avaliação da função hepática, integridade hepatocelular e vias biliares",
  "categoria": "laboratorio",
  "icone": "fa-flask",
  "campos": [
    {
      "id": "tgo_ast",
      "tipo": "number",
      "label": "TGO / AST",
      "unidade": "U/L",
      "referencia": "< 40"
    },
    {
      "id": "tgp_alt",
      "tipo": "number",
      "label": "TGP / ALT",
      "unidade": "U/L",
      "referencia": "< 41"
    },
    {
      "id": "relacao_ast_alt",
      "tipo": "number",
      "label": "Relação AST/ALT",
      "referencia": "< 1.0"
    },
    {
      "id": "fosfatase_alcalina",
      "tipo": "number",
      "label": "Fosfatase Alcalina",
      "unidade": "U/L",
      "referencia": "40 – 130"
    },
    {
      "id": "ggt",
      "tipo": "number",
      "label": "GGT",
      "unidade": "U/L",
      "referencia": "< 60"
    },
    {
      "id": "bilirrubina_total",
      "tipo": "number",
      "label": "Bilirrubina Total",
      "unidade": "mg/dL",
      "referencia": "0.3 – 1.2"
    },
    {
      "id": "bilirrubina_direta",
      "tipo": "number",
      "label": "Bilirrubina Direta",
      "unidade": "mg/dL",
      "referencia": "< 0.3"
    },
    {
      "id": "bilirrubina_indireta",
      "tipo": "number",
      "label": "Bilirrubina Indireta",
      "unidade": "mg/dL",
      "referencia": "< 0.9"
    },
    {
      "id": "albumina",
      "tipo": "number",
      "label": "Albumina",
      "unidade": "g/dL",
      "referencia": "3.5 – 5.0"
    },
    {
      "id": "tempo_protrombina",
      "tipo": "number",
      "label": "Tempo de Protrombina (TP)",
      "unidade": "segundos",
      "referencia": "—"
    },
    {
      "id": "inr",
      "tipo": "number",
      "label": "INR",
      "referencia": "0.8 – 1.2"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Função hepática preservada"
        },
        {
          "valor": "hepatocelular",
          "label": "Padrão hepatocelular"
        },
        {
          "valor": "colestatico",
          "label": "Padrão colestático"
        },
        {
          "valor": "misto",
          "label": "Padrão misto"
        },
        {
          "valor": "insuficiencia_hepatica",
          "label": "Insuficiência hepática"
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
      "description": "Enzimas hepáticas e bilirrubinas dentro da referência.",
      "resultSummary": "Função hepática sem alterações laboratoriais relevantes.",
      "interpretation": "Enzimas hepáticas, bilirrubinas e marcadores de síntese dentro do padrão esperado.",
      "conclusion": "Função hepática preservada pelos parâmetros avaliados."
    },
    {
      "id": "hepatocelular",
      "name": "Padrão hepatocelular",
      "status": "alterado",
      "description": "Predomínio de elevação de transaminases.",
      "resultSummary": "Exame com elevação predominante de transaminases.",
      "interpretation": "Elevação de TGO/AST e TGP/ALT sugere padrão hepatocelular, devendo ser correlacionada com medicamentos, infecções, álcool, esteatose e demais dados clínicos.",
      "conclusion": "Alteração hepática com padrão hepatocelular."
    },
    {
      "id": "colestatico",
      "name": "Padrão colestático",
      "status": "alterado",
      "description": "Predomínio de FA/GGT e/ou bilirrubinas.",
      "resultSummary": "Exame com elevação de marcadores colestáticos.",
      "interpretation": "Elevação de GGT, fosfatase alcalina e/ou bilirrubinas sugere padrão colestático, devendo ser correlacionada com imagem e contexto clínico.",
      "conclusion": "Alteração hepática com padrão colestático."
    },
    {
      "id": "misto",
      "name": "Padrão misto",
      "status": "alterado",
      "description": "Elevação combinada de transaminases e marcadores colestáticos.",
      "resultSummary": "Exame com alterações hepáticas de padrão misto.",
      "interpretation": "Elevação combinada de transaminases e marcadores colestáticos sugere padrão misto, requerendo correlação clínica.",
      "conclusion": "Alteração hepática de padrão misto."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alterações discretas sem padrão definido.",
      "resultSummary": "Função hepática com alterações discretas/limítrofes.",
      "interpretation": "Alterações discretas podem ser transitórias ou inespecíficas e devem ser interpretadas conforme evolução e contexto clínico.",
      "conclusion": "Achado hepático limítrofe/inespecífico."
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
    "title": "Função Hepática",
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
      "id": "tgo_ast",
      "label": "TGO / AST",
      "unidade": "U/L",
      "referencia": "< 40",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar TGO / AST conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tgp_alt",
      "label": "TGP / ALT",
      "unidade": "U/L",
      "referencia": "< 41",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar TGP / ALT conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "relacao_ast_alt",
      "label": "Relação AST/ALT",
      "unidade": null,
      "referencia": "< 1.0",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Relação AST/ALT conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "fosfatase_alcalina",
      "label": "Fosfatase Alcalina",
      "unidade": "U/L",
      "referencia": "40 – 130",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fosfatase Alcalina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "ggt",
      "label": "GGT",
      "unidade": "U/L",
      "referencia": "< 60",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar GGT conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "bilirrubina_total",
      "label": "Bilirrubina Total",
      "unidade": "mg/dL",
      "referencia": "0.3 – 1.2",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Bilirrubina Total conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "bilirrubina_direta",
      "label": "Bilirrubina Direta",
      "unidade": "mg/dL",
      "referencia": "< 0.3",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Bilirrubina Direta conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "bilirrubina_indireta",
      "label": "Bilirrubina Indireta",
      "unidade": "mg/dL",
      "referencia": "< 0.9",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Bilirrubina Indireta conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "albumina",
      "label": "Albumina",
      "unidade": "g/dL",
      "referencia": "3.5 – 5.0",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Albumina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "tempo_protrombina",
      "label": "Tempo de Protrombina (TP)",
      "unidade": "segundos",
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tempo de Protrombina (TP) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "inr",
      "label": "INR",
      "unidade": null,
      "referencia": "0.8 – 1.2",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar INR conforme referência, contexto clínico e método utilizado."
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
