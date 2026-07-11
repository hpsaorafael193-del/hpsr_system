import type { IntelligentExamModel } from "../types";

export const lab_hemograma_completoModel: IntelligentExamModel = {
  "id": "lab_hemograma_completo",
  "nome": "Hemograma Completo",
  "descricao": "Avaliação quantitativa e qualitativa das células sanguíneas",
  "categoria": "laboratorio",
  "icone": "fa-tint",
  "campos": [
    {
      "id": "hemacias",
      "tipo": "number",
      "label": "Hemácias",
      "unidade": "milhões/mm³",
      "referencia": "4,0 – 5,5"
    },
    {
      "id": "hemoglobina",
      "tipo": "number",
      "label": "Hemoglobina",
      "unidade": "g/dL",
      "referencia": "12 – 16"
    },
    {
      "id": "hematocrito",
      "tipo": "number",
      "label": "Hematócrito",
      "unidade": "%",
      "referencia": "36 – 48"
    },
    {
      "id": "vcm",
      "tipo": "number",
      "label": "VCM (Volume Corpuscular Médio)",
      "unidade": "fL",
      "referencia": "80 – 100"
    },
    {
      "id": "hcm",
      "tipo": "number",
      "label": "HCM (Hemoglobina Corpuscular Média)",
      "unidade": "pg",
      "referencia": "27 – 33"
    },
    {
      "id": "chcm",
      "tipo": "number",
      "label": "CHCM (Concentração de Hemoglobina Corpuscular Média)",
      "unidade": "g/dL",
      "referencia": "32 – 36"
    },
    {
      "id": "anisocitose",
      "tipo": "select",
      "label": "Anisocitose",
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
      "id": "leucocitos_totais",
      "tipo": "number",
      "label": "Leucócitos Totais",
      "unidade": "/mm³",
      "referencia": "4.000 – 10.000"
    },
    {
      "id": "neutrofilos",
      "tipo": "number",
      "label": "Neutrófilos",
      "unidade": "%",
      "referencia": "40 – 70"
    },
    {
      "id": "linfocitos",
      "tipo": "number",
      "label": "Linfócitos",
      "unidade": "%",
      "referencia": "20 – 45"
    },
    {
      "id": "monocitos",
      "tipo": "number",
      "label": "Monócitos",
      "unidade": "%",
      "referencia": "2 – 10"
    },
    {
      "id": "eosinofilos",
      "tipo": "number",
      "label": "Eosinófilos",
      "unidade": "%",
      "referencia": "1 – 6"
    },
    {
      "id": "basofilos",
      "tipo": "number",
      "label": "Basófilos",
      "unidade": "%",
      "referencia": "< 1"
    },
    {
      "id": "plaquetas",
      "tipo": "number",
      "label": "Plaquetas",
      "unidade": "/mm³",
      "referencia": "150.000 – 450.000"
    },
    {
      "id": "agregados_plaquetarios",
      "tipo": "select",
      "label": "Agregados Plaquetários",
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
      "label": "Impressão Global",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Hemograma dentro da normalidade"
        },
        {
          "valor": "anemia",
          "label": "Sugestivo de anemia"
        },
        {
          "valor": "infeccao",
          "label": "Sugestivo de processo infeccioso"
        },
        {
          "valor": "alterado",
          "label": "Hemograma alterado"
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
      "description": "Parâmetros hematológicos dentro das referências disponíveis.",
      "resultSummary": "Hemograma sem alterações relevantes.",
      "results": {
        "hemacias": "4,8 milhões/mm³",
        "hemoglobina": "14 g/dL",
        "hematocrito": "42 %",
        "vcm": "90 fL",
        "hcm": "30 pg",
        "chcm": "34 g/dL",
        "anisocitose": "Ausente",
        "leucocitos_totais": "7.000/mm³",
        "neutrofilos": "55 %",
        "linfocitos": "33 %",
        "monocitos": "6 %",
        "eosinofilos": "4 %",
        "basofilos": "1 %",
        "plaquetas": "300.000/mm³",
        "agregados_plaquetarios": "Ausente",
        "impressao": "Normal"
      },
      "interpretation": "Parâmetros de série vermelha, série branca e plaquetas dentro do padrão esperado.",
      "conclusion": "Hemograma sem alterações hematológicas significativas."
    },
    {
      "id": "anemia",
      "name": "Anemia",
      "status": "alterado",
      "description": "Alteração predominante em série vermelha.",
      "resultSummary": "Hemograma com alteração em série vermelha.",
      "results": {
        "hemacias": "3,6 milhões/mm³",
        "hemoglobina": "10,2 g/dL",
        "hematocrito": "31 %",
        "vcm": "78 fL",
        "hcm": "25 pg",
        "chcm": "31 g/dL",
        "anisocitose": "Presente",
        "leucocitos_totais": "7.600/mm³",
        "neutrofilos": "56 %",
        "linfocitos": "32 %",
        "monocitos": "7 %",
        "eosinofilos": "4 %",
        "basofilos": "1 %",
        "plaquetas": "280.000/mm³",
        "agregados_plaquetarios": "Ausente",
        "impressao": "Alteração em série vermelha"
      },
      "interpretation": "Achados laboratoriais compatíveis com anemia, devendo ser correlacionados com clínica e exames complementares.",
      "conclusion": "Hemograma com achados compatíveis com anemia a correlacionar clinicamente."
    },
    {
      "id": "infeccao",
      "name": "Infecção",
      "status": "alterado",
      "description": "Alteração em série branca com possível padrão infeccioso/inflamatório.",
      "resultSummary": "Hemograma com alteração de leucócitos.",
      "results": {
        "hemacias": "4,7 milhões/mm³",
        "hemoglobina": "13,8 g/dL",
        "hematocrito": "41 %",
        "vcm": "89 fL",
        "hcm": "30 pg",
        "chcm": "34 g/dL",
        "anisocitose": "Ausente",
        "leucocitos_totais": "14.800/mm³",
        "neutrofilos": "78 %",
        "linfocitos": "15 %",
        "monocitos": "5 %",
        "eosinofilos": "1 %",
        "basofilos": "1 %",
        "plaquetas": "310.000/mm³",
        "agregados_plaquetarios": "Ausente",
        "impressao": "Leucocitose com neutrofilia"
      },
      "interpretation": "Leucocitose, neutrofilia, linfocitose ou outro padrão deve ser interpretado conforme quadro clínico.",
      "conclusion": "Hemograma com alterações sugestivas de resposta infecciosa/inflamatória."
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou isolada, sem conclusão diagnóstica.",
      "resultSummary": "Hemograma com variação discreta em parâmetro isolado.",
      "results": {
        "hemacias": "4,1 milhões/mm³",
        "hemoglobina": "11,8 g/dL",
        "hematocrito": "35,5 %",
        "vcm": "82 fL",
        "hcm": "27 pg",
        "chcm": "32 g/dL",
        "anisocitose": "Ausente",
        "leucocitos_totais": "4.100/mm³",
        "neutrofilos": "42 %",
        "linfocitos": "44 %",
        "monocitos": "8 %",
        "eosinofilos": "5 %",
        "basofilos": "1 %",
        "plaquetas": "155.000/mm³",
        "agregados_plaquetarios": "Ausente",
        "impressao": "Alteração discreta / limítrofe"
      },
      "interpretation": "Achado inespecífico, sem definição diagnóstica isolada.",
      "conclusion": "Hemograma com alteração discreta, recomendando correlação clínica."
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Hemograma personalizado.",
      "interpretation": "Interpretação a ser definida pelo médico.",
      "conclusion": "Conclusão a ser definida pelo médico."
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Hemograma Completo",
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
  "method": "Análise hematológica automatizada com avaliação de séries vermelha, branca e plaquetária; revisão microscópica quando indicada.",
  "parameters": [
    {
      "id": "hemacias",
      "label": "Hemácias",
      "unidade": "milhões/mm³",
      "referencia": "4,0 – 5,5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemácias conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hemoglobina",
      "label": "Hemoglobina",
      "unidade": "g/dL",
      "referencia": "12 – 16",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hemoglobina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hematocrito",
      "label": "Hematócrito",
      "unidade": "%",
      "referencia": "36 – 48",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Hematócrito conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "vcm",
      "label": "VCM (Volume Corpuscular Médio)",
      "unidade": "fL",
      "referencia": "80 – 100",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar VCM (Volume Corpuscular Médio) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "hcm",
      "label": "HCM (Hemoglobina Corpuscular Média)",
      "unidade": "pg",
      "referencia": "27 – 33",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar HCM (Hemoglobina Corpuscular Média) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "chcm",
      "label": "CHCM (Concentração de Hemoglobina Corpuscular Média)",
      "unidade": "g/dL",
      "referencia": "32 – 36",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar CHCM (Concentração de Hemoglobina Corpuscular Média) conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "anisocitose",
      "label": "Anisocitose",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Anisocitose conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "leucocitos_totais",
      "label": "Leucócitos Totais",
      "unidade": "/mm³",
      "referencia": "4.000 – 10.000",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Leucócitos Totais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "neutrofilos",
      "label": "Neutrófilos",
      "unidade": "%",
      "referencia": "40 – 70",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Neutrófilos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "linfocitos",
      "label": "Linfócitos",
      "unidade": "%",
      "referencia": "20 – 45",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Linfócitos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "monocitos",
      "label": "Monócitos",
      "unidade": "%",
      "referencia": "2 – 10",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Monócitos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "eosinofilos",
      "label": "Eosinófilos",
      "unidade": "%",
      "referencia": "1 – 6",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Eosinófilos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "basofilos",
      "label": "Basófilos",
      "unidade": "%",
      "referencia": "< 1",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Basófilos conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "plaquetas",
      "label": "Plaquetas",
      "unidade": "/mm³",
      "referencia": "150.000 – 450.000",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Plaquetas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "agregados_plaquetarios",
      "label": "Agregados Plaquetários",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Agregados Plaquetários conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Global",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Global conforme referência, contexto clínico e método utilizado."
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
    "normal": "Hemograma sem alterações hematológicas significativas.",
    "altered": "Hemograma com achados compatíveis com anemia a correlacionar clinicamente.",
    "undefined": "Hemograma com alteração discreta, recomendando correlação clínica."
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
