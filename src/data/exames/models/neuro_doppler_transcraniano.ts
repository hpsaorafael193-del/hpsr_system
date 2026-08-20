import type { IntelligentExamModel } from "../types";

export const neuro_doppler_transcranianoModel: IntelligentExamModel = {
  "id": "neuro_doppler_transcraniano",
  "nome": "Doppler Transcraniano",
  "descricao": "Avaliação do fluxo sanguíneo nas artérias cerebrais",
  "categoria": "neurologia",
  "icone": "fa-wave-square",
  "campos": [
    {
      "id": "arterias_avaliadas",
      "tipo": "select",
      "label": "Artérias Avaliadas",
      "opcoes": [
        {
          "valor": "cerebral_media",
          "label": "Cerebral Média"
        },
        {
          "valor": "cerebral_anterior",
          "label": "Cerebral Anterior"
        },
        {
          "valor": "cerebral_posterior",
          "label": "Cerebral Posterior"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "fluxo",
      "tipo": "select",
      "label": "Fluxo Sanguíneo",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "reduzido",
          "label": "Reduzido"
        },
        {
          "valor": "aumentado",
          "label": "Aumentado"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "estenose",
      "tipo": "select",
      "label": "Estenose",
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
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Hemodinâmica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Fluxo cerebral preservado"
        },
        {
          "valor": "isquemica",
          "label": "Sugestivo de isquemia cerebral"
        },
        {
          "valor": "vasoespasmo",
          "label": "Vasoespasmo cerebral"
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
      "resultSummary": "Doppler Transcraniano com Artérias Avaliadas: Artérias cerebrais médias, anteriores e posteriores bilateralmente; Fluxo Sanguíneo: Normal; Estenose: Ausente.",
      "interpretation": "Os parâmetros mensurados — Artérias Avaliadas: Artérias cerebrais médias, anteriores e posteriores bilateralmente; Fluxo Sanguíneo: Normal; Estenose: Ausente — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Doppler Transcraniano com parâmetros compatíveis com o padrão esperado, incluindo Artérias Avaliadas: Artérias cerebrais médias, anteriores e posteriores bilateralmente; Fluxo Sanguíneo: Normal.",
      "results": {
        "arterias_avaliadas": "Artérias cerebrais médias, anteriores e posteriores bilateralmente",
        "fluxo": "Normal",
        "estenose": "Ausente",
        "impressao": "Padrão hemodinâmico intracraniano preservado, sem estenose significativa"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Doppler Transcraniano: Fluxo Sanguíneo: Velocidades elevadas na artéria cerebral média direita; Estenose: Padrão hemodinâmico sugestivo de estenose moderada.",
      "interpretation": "Os resultados principais (Fluxo Sanguíneo: Velocidades elevadas na artéria cerebral média direita; Estenose: Padrão hemodinâmico sugestivo de estenose moderada) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Doppler Transcraniano com padrão alterado, documentado por Fluxo Sanguíneo: Velocidades elevadas na artéria cerebral média direita; Estenose: Padrão hemodinâmico sugestivo de estenose moderada.",
      "results": {
        "arterias_avaliadas": "Artérias cerebrais médias, anteriores e posteriores bilateralmente",
        "fluxo": "Velocidades elevadas na artéria cerebral média direita",
        "estenose": "Padrão hemodinâmico sugestivo de estenose moderada",
        "impressao": "Aumento focal de velocidade compatível com estenose intracraniana no território avaliado"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Doppler Transcraniano: Fluxo Sanguíneo: Velocidade discretamente elevada em segmento focal; Estenose: Sem critério hemodinâmico definitivo.",
      "interpretation": "Os principais resultados (Fluxo Sanguíneo: Velocidade discretamente elevada em segmento focal; Estenose: Sem critério hemodinâmico definitivo) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Doppler Transcraniano com resultado limítrofe/inespecífico, destacando-se Fluxo Sanguíneo: Velocidade discretamente elevada em segmento focal; Estenose: Sem critério hemodinâmico definitivo.",
      "results": {
        "arterias_avaliadas": "Artérias cerebrais médias, anteriores e posteriores bilateralmente",
        "fluxo": "Velocidade discretamente elevada em segmento focal",
        "estenose": "Sem critério hemodinâmico definitivo",
        "impressao": "Assimetria discreta de velocidades, sem estenose significativa definida"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Doppler Transcraniano: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "arterias_avaliadas": "Artérias cerebrais médias, anteriores e posteriores bilateralmente",
        "fluxo": "Normal",
        "estenose": "Ausente",
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
    "title": "Doppler Transcraniano",
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
  "technique": "Doppler transcraniano realizado para avaliação hemodinâmica das principais artérias intracranianas acessíveis pelas janelas acústicas usuais.",
  "method": "Ultrassonografia Doppler pulsada transcraniana com mensuração de velocidades de fluxo, índices de resistência e comparação entre os territórios examinados.",
  "parameters": [
    {
      "id": "arterias_avaliadas",
      "label": "Artérias Avaliadas",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Artérias Avaliadas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "fluxo",
      "label": "Fluxo Sanguíneo",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Fluxo Sanguíneo conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "estenose",
      "label": "Estenose",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Estenose conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Hemodinâmica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Hemodinâmica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Doppler Transcraniano compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Doppler Transcraniano com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Doppler Transcraniano com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Doppler Transcraniano sem alterações significativas nos parâmetros avaliados.",
    "altered": "Doppler Transcraniano alterado conforme resultados objetivos descritos.",
    "undefined": "Doppler Transcraniano com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
