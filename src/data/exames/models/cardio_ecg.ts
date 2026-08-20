import type { IntelligentExamModel } from "../types";

export const cardio_ecgModel: IntelligentExamModel = {
  "id": "cardio_ecg",
  "nome": "Eletrocardiograma (ECG)",
  "descricao": "Registro da atividade elétrica cardíaca em repouso",
  "categoria": "cardiologia",
  "icone": "fa-heartbeat",
  "campos": [
    {
      "id": "ritmo",
      "tipo": "select",
      "label": "Ritmo Cardíaco",
      "opcoes": [
        {
          "valor": "sinusal",
          "label": "Ritmo sinusal"
        },
        {
          "valor": "fibrilacao_atrial",
          "label": "Fibrilação atrial"
        },
        {
          "valor": "flutter",
          "label": "Flutter atrial"
        },
        {
          "valor": "outro",
          "label": "Outro ritmo"
        }
      ],
      "referencia": "Ritmo sinusal"
    },
    {
      "id": "frequencia_cardiaca",
      "tipo": "number",
      "label": "Frequência Cardíaca",
      "unidade": "bpm",
      "referencia": "60 – 100"
    },
    {
      "id": "eixo",
      "tipo": "select",
      "label": "Eixo Elétrico",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "desviado_esquerda",
          "label": "Desvio à esquerda"
        },
        {
          "valor": "desviado_direita",
          "label": "Desvio à direita"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "intervalo_pr",
      "tipo": "number",
      "label": "Intervalo PR",
      "unidade": "ms",
      "referencia": "120 – 200"
    },
    {
      "id": "qrs",
      "tipo": "number",
      "label": "Duração do QRS",
      "unidade": "ms",
      "referencia": "< 120"
    },
    {
      "id": "segmento_st",
      "tipo": "select",
      "label": "Segmento ST",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "supra",
          "label": "Supra de ST"
        },
        {
          "valor": "infra",
          "label": "Infra de ST"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "onda_t",
      "tipo": "select",
      "label": "Onda T",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "invertida",
          "label": "Invertida"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Eletrocardiográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "ECG dentro da normalidade"
        },
        {
          "valor": "isquemia",
          "label": "Alterações isquêmicas"
        },
        {
          "valor": "arritmia",
          "label": "Arritmia cardíaca"
        },
        {
          "valor": "bloqueio",
          "label": "Distúrbio de condução"
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
      "resultSummary": "Eletrocardiograma (ECG) com Ritmo Cardíaco: Ritmo sinusal; Frequência Cardíaca: 79,2; Eixo Elétrico: Normal.",
      "interpretation": "Os parâmetros mensurados — Ritmo Cardíaco: Ritmo sinusal; Frequência Cardíaca: 79,2 bpm; Eixo Elétrico: Normal; Intervalo PR: 158,4 ms — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Eletrocardiograma (ECG) com parâmetros compatíveis com o padrão esperado, incluindo Ritmo Cardíaco: Ritmo sinusal; Frequência Cardíaca: 79,2 bpm.",
      "results": {
        "ritmo": "Ritmo sinusal",
        "frequencia_cardiaca": "79,2",
        "eixo": "Normal",
        "intervalo_pr": "158,4",
        "qrs": "86,4",
        "segmento_st": "Normal",
        "onda_t": "Normal",
        "impressao": "Eletrocardiograma (ECG) com parâmetros compatíveis com o padrão esperado, incluindo Ritmo Cardíaco: Ritmo sinusal; Frequência Cardíaca: 79,2 bpm"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Eletrocardiograma (ECG): Ritmo Cardíaco: Ritmo sinusal taquicárdico com extrassístoles supraventriculares isoladas; Frequência Cardíaca: 112; Segmento ST: Discreto infradesnivelamento inespecífico de ST em derivações laterais; Onda T: Alterações inespecíficas de repolarização.",
      "interpretation": "Os resultados principais (Ritmo Cardíaco: Ritmo sinusal taquicárdico com extrassístoles supraventriculares isoladas; Frequência Cardíaca: 112 bpm; Segmento ST: Discreto infradesnivelamento inespecífico de ST em derivações laterais; Onda T: Alterações inespecíficas de repolarização) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Eletrocardiograma (ECG) com padrão alterado, documentado por Ritmo Cardíaco: Ritmo sinusal taquicárdico com extrassístoles supraventriculares isoladas; Frequência Cardíaca: 112 bpm.",
      "results": {
        "ritmo": "Ritmo sinusal taquicárdico com extrassístoles supraventriculares isoladas",
        "frequencia_cardiaca": "112",
        "eixo": "Normal",
        "intervalo_pr": "158,4",
        "qrs": "86,4",
        "segmento_st": "Discreto infradesnivelamento inespecífico de ST em derivações laterais",
        "onda_t": "Alterações inespecíficas de repolarização",
        "impressao": "Taquicardia sinusal com alterações inespecíficas de repolarização"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Eletrocardiograma (ECG): Frequência Cardíaca: 101; Segmento ST: Alterações discretas e inespecíficas de repolarização.",
      "interpretation": "Os principais resultados (Frequência Cardíaca: 101 bpm; Segmento ST: Alterações discretas e inespecíficas de repolarização) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Eletrocardiograma (ECG) com resultado limítrofe/inespecífico, destacando-se Frequência Cardíaca: 101 bpm; Segmento ST: Alterações discretas e inespecíficas de repolarização.",
      "results": {
        "ritmo": "Ritmo sinusal",
        "frequencia_cardiaca": "101",
        "eixo": "Normal",
        "intervalo_pr": "158,4",
        "qrs": "86,4",
        "segmento_st": "Alterações discretas e inespecíficas de repolarização",
        "onda_t": "Normal",
        "impressao": "Taquicardia sinusal limítrofe com alterações inespecíficas de repolarização"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Eletrocardiograma (ECG): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "ritmo": "Ritmo sinusal",
        "frequencia_cardiaca": "79,2",
        "eixo": "Normal",
        "intervalo_pr": "158,4",
        "qrs": "86,4",
        "segmento_st": "Normal",
        "onda_t": "Normal",
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
    "title": "Eletrocardiograma (ECG)",
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
  "technique": "Eletrocardiograma de repouso realizado em 12 derivações, com registro padronizado da atividade elétrica cardíaca e análise de ritmo, frequência, eixo, intervalos e alterações de repolarização.",
  "method": "Registro eletrocardiográfico convencional, com calibração técnica padronizada e interpretação morfológica e temporal dos traçados obtidos.",
  "parameters": [
    {
      "id": "ritmo",
      "label": "Ritmo Cardíaco",
      "unidade": null,
      "referencia": "Ritmo sinusal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Ritmo Cardíaco conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "frequencia_cardiaca",
      "label": "Frequência Cardíaca",
      "unidade": "bpm",
      "referencia": "60 – 100",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Frequência Cardíaca conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "eixo",
      "label": "Eixo Elétrico",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Eixo Elétrico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "intervalo_pr",
      "label": "Intervalo PR",
      "unidade": "ms",
      "referencia": "120 – 200",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Intervalo PR conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "qrs",
      "label": "Duração do QRS",
      "unidade": "ms",
      "referencia": "< 120",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Duração do QRS conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "segmento_st",
      "label": "Segmento ST",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Segmento ST conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "onda_t",
      "label": "Onda T",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Onda T conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Eletrocardiográfica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Eletrocardiográfica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Eletrocardiograma (ECG) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Eletrocardiograma (ECG) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Eletrocardiograma (ECG) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Eletrocardiograma (ECG) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Eletrocardiograma (ECG) alterado conforme resultados objetivos descritos.",
    "undefined": "Eletrocardiograma (ECG) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
