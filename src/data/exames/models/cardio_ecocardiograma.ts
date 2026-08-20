import type { IntelligentExamModel } from "../types";

export const cardio_ecocardiogramaModel: IntelligentExamModel = {
  "id": "cardio_ecocardiograma",
  "nome": "Ecocardiograma Transtorácico",
  "descricao": "Avaliação anatômica e funcional do coração",
  "categoria": "cardiologia",
  "icone": "fa-heart",
  "campos": [
    {
      "id": "fracao_ejecao",
      "tipo": "number",
      "label": "Fração de Ejeção (FEVE)",
      "unidade": "%",
      "referencia": "≥ 55"
    },
    {
      "id": "funcao_sistolica",
      "tipo": "select",
      "label": "Função Sistólica",
      "opcoes": [
        {
          "valor": "preservada",
          "label": "Preservada"
        },
        {
          "valor": "reduzida",
          "label": "Reduzida"
        }
      ],
      "referencia": "Preservada"
    },
    {
      "id": "funcao_diastolica",
      "tipo": "select",
      "label": "Função Diastólica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "grau_1",
          "label": "Disfunção grau I"
        },
        {
          "valor": "grau_2",
          "label": "Disfunção grau II"
        },
        {
          "valor": "grau_3",
          "label": "Disfunção grau III"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "valvulas",
      "tipo": "select",
      "label": "Valvas Cardíacas",
      "opcoes": [
        {
          "valor": "normais",
          "label": "Normais"
        },
        {
          "valor": "estenose",
          "label": "Estenose"
        },
        {
          "valor": "insuficiencia",
          "label": "Insuficiência"
        }
      ],
      "referencia": "Normais"
    },
    {
      "id": "pressao_pulmonar",
      "tipo": "number",
      "label": "Pressão Sistólica da Artéria Pulmonar",
      "unidade": "mmHg",
      "referencia": "< 35"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Ecocardiográfica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Ecocardiograma normal"
        },
        {
          "valor": "miocardiopatia",
          "label": "Miocardiopatia"
        },
        {
          "valor": "valvar",
          "label": "Doença valvar"
        },
        {
          "valor": "ic",
          "label": "Insuficiência cardíaca"
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
      "resultSummary": "Ecocardiograma Transtorácico com Fração de Ejeção (FEVE): 59,4; Função Sistólica: Preservada; Função Diastólica: Normal.",
      "interpretation": "Os parâmetros mensurados — Fração de Ejeção (FEVE): 59,4 %; Função Sistólica: Preservada; Função Diastólica: Normal; Valvas Cardíacas: Normais — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Ecocardiograma Transtorácico com parâmetros compatíveis com o padrão esperado, incluindo Fração de Ejeção (FEVE): 59,4 %; Função Sistólica: Preservada.",
      "results": {
        "fracao_ejecao": "59,4",
        "funcao_sistolica": "Preservada",
        "funcao_diastolica": "Normal",
        "valvulas": "Normais",
        "pressao_pulmonar": "25,2",
        "impressao": "Ecocardiograma Transtorácico com parâmetros compatíveis com o padrão esperado, incluindo Fração de Ejeção (FEVE): 59,4 %; Função Sistólica: Preservada"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Ecocardiograma Transtorácico: Fração de Ejeção (FEVE): 42; Função Sistólica: Disfunção sistólica leve a moderada; Função Diastólica: Disfunção diastólica grau I; Valvas Cardíacas: Insuficiência mitral leve.",
      "interpretation": "Os resultados principais (Fração de Ejeção (FEVE): 42 %; Função Sistólica: Disfunção sistólica leve a moderada; Função Diastólica: Disfunção diastólica grau I; Valvas Cardíacas: Insuficiência mitral leve) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Ecocardiograma Transtorácico com padrão alterado, documentado por Fração de Ejeção (FEVE): 42 %; Função Sistólica: Disfunção sistólica leve a moderada.",
      "results": {
        "fracao_ejecao": "42",
        "funcao_sistolica": "Disfunção sistólica leve a moderada",
        "funcao_diastolica": "Disfunção diastólica grau I",
        "valvulas": "Insuficiência mitral leve",
        "pressao_pulmonar": "38",
        "impressao": "Disfunção ventricular esquerda leve a moderada, com insuficiência mitral discreta"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Ecocardiograma Transtorácico: Fração de Ejeção (FEVE): 53; Função Sistólica: Função sistólica global limítrofe; Função Diastólica: Relaxamento ventricular discretamente alterado; Pressão Sistólica da Artéria Pulmonar: 35.",
      "interpretation": "Os principais resultados (Fração de Ejeção (FEVE): 53 %; Função Sistólica: Função sistólica global limítrofe; Função Diastólica: Relaxamento ventricular discretamente alterado; Pressão Sistólica da Artéria Pulmonar: 35 mmHg) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Ecocardiograma Transtorácico com resultado limítrofe/inespecífico, destacando-se Fração de Ejeção (FEVE): 53 %; Função Sistólica: Função sistólica global limítrofe.",
      "results": {
        "fracao_ejecao": "53",
        "funcao_sistolica": "Função sistólica global limítrofe",
        "funcao_diastolica": "Relaxamento ventricular discretamente alterado",
        "valvulas": "Normais",
        "pressao_pulmonar": "35",
        "impressao": "Função ventricular limítrofe, sem disfunção importante"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Ecocardiograma Transtorácico: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "fracao_ejecao": "59,4",
        "funcao_sistolica": "Preservada",
        "funcao_diastolica": "Normal",
        "valvulas": "Normais",
        "pressao_pulmonar": "25,2",
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
    "title": "Ecocardiograma Transtorácico",
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
  "technique": "Ecocardiograma transtorácico realizado com avaliação bidimensional, modo M e Doppler, incluindo análise das câmaras cardíacas, função ventricular, valvas e estimativa hemodinâmica quando aplicável.",
  "method": "Ultrassonografia cardíaca transtorácica com Doppler pulsado, contínuo e colorido, segundo janelas acústicas convencionais e protocolo ecocardiográfico do serviço.",
  "parameters": [
    {
      "id": "fracao_ejecao",
      "label": "Fração de Ejeção (FEVE)",
      "unidade": "%",
      "referencia": "≥ 55",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fração de Ejeção (FEVE) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "funcao_sistolica",
      "label": "Função Sistólica",
      "unidade": null,
      "referencia": "Preservada",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Função Sistólica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "funcao_diastolica",
      "label": "Função Diastólica",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Função Diastólica conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "valvulas",
      "label": "Valvas Cardíacas",
      "unidade": null,
      "referencia": "Normais",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Valvas Cardíacas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "pressao_pulmonar",
      "label": "Pressão Sistólica da Artéria Pulmonar",
      "unidade": "mmHg",
      "referencia": "< 35",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Pressão Sistólica da Artéria Pulmonar conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Ecocardiográfica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Ecocardiográfica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Ecocardiograma Transtorácico compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Ecocardiograma Transtorácico com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Ecocardiograma Transtorácico com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Ecocardiograma Transtorácico sem alterações significativas nos parâmetros avaliados.",
    "altered": "Ecocardiograma Transtorácico alterado conforme resultados objetivos descritos.",
    "undefined": "Ecocardiograma Transtorácico com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
