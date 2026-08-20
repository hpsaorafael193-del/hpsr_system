import type { IntelligentExamModel } from "../types";

export const neuro_eegModel: IntelligentExamModel = {
  "id": "neuro_eeg",
  "nome": "Eletroencefalograma (EEG)",
  "descricao": "Registro da atividade elétrica cerebral em repouso e/ou ativação",
  "categoria": "neurologia",
  "icone": "fa-brain",
  "campos": [
    {
      "id": "estado_paciente",
      "tipo": "select",
      "label": "Estado do Paciente",
      "opcoes": [
        {
          "valor": "vigilia",
          "label": "Vigília"
        },
        {
          "valor": "sono",
          "label": "Sono"
        },
        {
          "valor": "vigilia_sono",
          "label": "Vigília e sono"
        }
      ],
      "referencia": "Vigília"
    },
    {
      "id": "atividade_base",
      "tipo": "select",
      "label": "Atividade de Base",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Organizada e simétrica"
        },
        {
          "valor": "lenta",
          "label": "Lentificada"
        },
        {
          "valor": "desorganizada",
          "label": "Desorganizada"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "descargas_epileptiformes",
      "tipo": "select",
      "label": "Descargas Epileptiformes",
      "opcoes": [
        {
          "valor": "ausentes",
          "label": "Ausentes"
        },
        {
          "valor": "focais",
          "label": "Focais"
        },
        {
          "valor": "generalizadas",
          "label": "Generalizadas"
        }
      ],
      "referencia": "Ausentes"
    },
    {
      "id": "resposta_estimulos",
      "tipo": "select",
      "label": "Resposta a Estímulos",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "alterada",
          "label": "Alterada"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Neurológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "EEG dentro da normalidade"
        },
        {
          "valor": "epileptiforme",
          "label": "Atividade epileptiforme"
        },
        {
          "valor": "encefalopatia",
          "label": "Sinais de encefalopatia difusa"
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
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Parâmetros dentro das referências disponíveis.",
      "resultSummary": "Eletroencefalograma (EEG) com Estado do Paciente: Vigília; Atividade de Base: Normal; Descargas Epileptiformes: Ausentes.",
      "interpretation": "Os parâmetros mensurados — Estado do Paciente: Vigília; Atividade de Base: Normal; Descargas Epileptiformes: Ausentes; Resposta a Estímulos: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Eletroencefalograma (EEG) com parâmetros compatíveis com o padrão esperado, incluindo Estado do Paciente: Vigília; Atividade de Base: Normal.",
      "results": {
        "estado_paciente": "Vigília",
        "atividade_base": "Normal",
        "descargas_epileptiformes": "Ausentes",
        "resposta_estimulos": "Normal",
        "impressao": "Eletroencefalograma (EEG) com parâmetros compatíveis com o padrão esperado, incluindo Estado do Paciente: Vigília; Atividade de Base: Normal"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Eletroencefalograma (EEG): Estado do Paciente: Vigília e sonolência; Atividade de Base: Ritmo posterior discretamente desorganizado; Descargas Epileptiformes: Pontas e ondas agudas focais em região temporal esquerda; Resposta a Estímulos: Reatividade preservada à abertura ocular.",
      "interpretation": "Os resultados principais (Estado do Paciente: Vigília e sonolência; Atividade de Base: Ritmo posterior discretamente desorganizado; Descargas Epileptiformes: Pontas e ondas agudas focais em região temporal esquerda; Resposta a Estímulos: Reatividade preservada à abertura ocular) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Eletroencefalograma (EEG) com padrão alterado, documentado por Estado do Paciente: Vigília e sonolência; Atividade de Base: Ritmo posterior discretamente desorganizado.",
      "results": {
        "estado_paciente": "Vigília e sonolência",
        "atividade_base": "Ritmo posterior discretamente desorganizado",
        "descargas_epileptiformes": "Pontas e ondas agudas focais em região temporal esquerda",
        "resposta_estimulos": "Reatividade preservada à abertura ocular",
        "impressao": "EEG com atividade epileptiforme focal temporal esquerda"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Eletroencefalograma (EEG): Atividade de Base: Discretamente desorganizada para a faixa etária; Resposta a Estímulos: Reatividade preservada.",
      "interpretation": "Os principais resultados (Atividade de Base: Discretamente desorganizada para a faixa etária; Resposta a Estímulos: Reatividade preservada) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Eletroencefalograma (EEG) com resultado limítrofe/inespecífico, destacando-se Atividade de Base: Discretamente desorganizada para a faixa etária; Resposta a Estímulos: Reatividade preservada.",
      "results": {
        "estado_paciente": "Vigília",
        "atividade_base": "Discretamente desorganizada para a faixa etária",
        "descargas_epileptiformes": "Ausentes",
        "resposta_estimulos": "Reatividade preservada",
        "impressao": "Desorganização inespecífica discreta da atividade de base, sem descargas epileptiformes"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Eletroencefalograma (EEG): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "estado_paciente": "Vigília",
        "atividade_base": "Normal",
        "descargas_epileptiformes": "Ausentes",
        "resposta_estimulos": "Normal",
        "impressao": "A definir pelo médico conforme os dados inseridos"
      }
    }
  ],
  "variables": [
    {
      "id": "contexto_clinico",
      "label": "Contexto clínico",
      "tipo": "text"
    }
  ],
  "editorModel": {
    "title": "Eletroencefalograma (EEG)",
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
        "id": "achados",
        "title": "2. Achados / Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabelas técnicas",
        "required": false,
        "visibleByDefault": false
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
      "achados",
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
      "achados",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "procedimento",
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
        "id": "achados",
        "title": "2. Achados / Resultados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "tabelas",
        "title": "3. Tabelas técnicas",
        "required": false,
        "visibleByDefault": false
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
  "technique": "Eletroencefalograma realizado com registro da atividade elétrica cerebral em condições padronizadas e manobras de ativação quando indicadas.",
  "method": "Registro digital por eletrodos posicionados segundo sistema internacional, com análise de ritmo de base, simetria, reatividade e atividade paroxística.",
  "parameters": [
    {
      "id": "estado_paciente",
      "label": "Estado do Paciente",
      "unidade": null,
      "referencia": "Vigília",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estado do Paciente conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "atividade_base",
      "label": "Atividade de Base",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Atividade de Base conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "descargas_epileptiformes",
      "label": "Descargas Epileptiformes",
      "unidade": null,
      "referencia": "Ausentes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Descargas Epileptiformes conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resposta_estimulos",
      "label": "Resposta a Estímulos",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta a Estímulos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Neurológica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Neurológica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Eletroencefalograma (EEG) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Eletroencefalograma (EEG) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Eletroencefalograma (EEG) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Eletroencefalograma (EEG) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Eletroencefalograma (EEG) alterado conforme resultados objetivos descritos.",
    "undefined": "Eletroencefalograma (EEG) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
