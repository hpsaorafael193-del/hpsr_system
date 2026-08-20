import type { IntelligentExamModel } from "../types";

export const neuro_liquorModel: IntelligentExamModel = {
  "id": "neuro_liquor",
  "nome": "Análise do Líquor (LCR)",
  "descricao": "Avaliação do líquido cefalorraquidiano",
  "categoria": "neurologia",
  "icone": "fa-vial",
  "campos": [
    {
      "id": "aspecto",
      "tipo": "select",
      "label": "Aspecto",
      "opcoes": [
        {
          "valor": "claro",
          "label": "Claro"
        },
        {
          "valor": "turvo",
          "label": "Turvo"
        }
      ],
      "referencia": "Claro"
    },
    {
      "id": "celulas",
      "tipo": "number",
      "label": "Células",
      "unidade": "cél/mm³",
      "referencia": "< 5"
    },
    {
      "id": "proteinas",
      "tipo": "number",
      "label": "Proteínas",
      "unidade": "mg/dL",
      "referencia": "15 – 45"
    },
    {
      "id": "glicose",
      "tipo": "number",
      "label": "Glicose",
      "unidade": "mg/dL",
      "referencia": "≥ 2/3 da glicemia"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Neurológica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "LCR normal"
        },
        {
          "valor": "meningite",
          "label": "Sugestivo de meningite"
        },
        {
          "valor": "inflamatoria",
          "label": "Processo inflamatório do SNC"
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
      "resultSummary": "Análise do Líquor (LCR) com Aspecto: Claro; Células: 3,6; Proteínas: 29,4.",
      "interpretation": "Os parâmetros mensurados — Aspecto: Claro; Células: 3,6 cél/mm³; Proteínas: 29,4 mg/dL; Glicose: 2,2 mg/dL — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Análise do Líquor (LCR) com parâmetros compatíveis com o padrão esperado, incluindo Aspecto: Claro; Células: 3,6 cél/mm³.",
      "results": {
        "aspecto": "Claro",
        "celulas": "3,6",
        "proteinas": "29,4",
        "glicose": "2,2",
        "impressao": "Análise do Líquor (LCR) com parâmetros compatíveis com o padrão esperado, incluindo Aspecto: Claro; Células: 3,6 cél/mm³"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Análise do Líquor (LCR): Aspecto: Ligeiramente turvo; Células: 42; Proteínas: 78; Glicose: 42.",
      "interpretation": "Os resultados principais (Aspecto: Ligeiramente turvo; Células: 42 cél/mm³; Proteínas: 78 mg/dL; Glicose: 42 mg/dL) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Análise do Líquor (LCR) com padrão alterado, documentado por Aspecto: Ligeiramente turvo; Células: 42 cél/mm³.",
      "results": {
        "aspecto": "Ligeiramente turvo",
        "celulas": "42",
        "proteinas": "78",
        "glicose": "42",
        "impressao": "Pleocitose e hiperproteinorraquia, padrão inflamatório/infeccioso a correlacionar clinicamente"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Análise do Líquor (LCR): Células: 6; Proteínas: 46; Glicose: 62.",
      "interpretation": "Os principais resultados (Células: 6 cél/mm³; Proteínas: 46 mg/dL; Glicose: 62 mg/dL) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Análise do Líquor (LCR) com resultado limítrofe/inespecífico, destacando-se Células: 6 cél/mm³; Proteínas: 46 mg/dL.",
      "results": {
        "aspecto": "Claro",
        "celulas": "6",
        "proteinas": "46",
        "glicose": "62",
        "impressao": "Pleocitose e proteinorraquia discretamente limítrofes"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Análise do Líquor (LCR): modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "aspecto": "Claro",
        "celulas": "3,6",
        "proteinas": "29,4",
        "glicose": "2,2",
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
    "title": "Análise do Líquor (LCR)",
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
  "technique": "Amostra de líquido cefalorraquidiano analisada quanto a aspectos físico-químicos, citológicos e outros parâmetros previstos no painel.",
  "method": "Análise laboratorial do LCR com contagem celular, dosagens bioquímicas e avaliação microscópica/microbiológica conforme indicação clínica.",
  "parameters": [
    {
      "id": "aspecto",
      "label": "Aspecto",
      "unidade": null,
      "referencia": "Claro",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Aspecto conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "celulas",
      "label": "Células",
      "unidade": "cél/mm³",
      "referencia": "< 5",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Células conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "proteinas",
      "label": "Proteínas",
      "unidade": "mg/dL",
      "referencia": "15 – 45",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Proteínas conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "glicose",
      "label": "Glicose",
      "unidade": "mg/dL",
      "referencia": "≥ 2/3 da glicemia",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Glicose conforme referência, contexto clínico e método utilizado."
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
    "normal": "Resultados de Análise do Líquor (LCR) compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Análise do Líquor (LCR) com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Análise do Líquor (LCR) com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Análise do Líquor (LCR) sem alterações significativas nos parâmetros avaliados.",
    "altered": "Análise do Líquor (LCR) alterado conforme resultados objetivos descritos.",
    "undefined": "Análise do Líquor (LCR) com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
