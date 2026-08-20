import type { IntelligentExamModel } from "../types";

export const oftalmo_fundo_olhoModel: IntelligentExamModel = {
  "id": "oftalmo_fundo_olho",
  "nome": "Fundo de Olho",
  "descricao": "Avaliação da retina, mácula e nervo óptico",
  "categoria": "oftalmologia",
  "icone": "fa-eye-low-vision",
  "campos": [
    {
      "id": "disco_optico",
      "tipo": "select",
      "label": "Disco Óptico",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "escavacao_aumentada",
          "label": "Escavação aumentada"
        },
        {
          "valor": "edema",
          "label": "Edema de papila"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "macula",
      "tipo": "select",
      "label": "Mácula",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "edema",
          "label": "Edema macular"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "retina",
      "tipo": "select",
      "label": "Retina",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "retinopatia_diabetica",
          "label": "Retinopatia diabética"
        },
        {
          "valor": "lesoes",
          "label": "Lesões retinianas"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Oftalmoscópica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Fundo de olho normal"
        },
        {
          "valor": "alterado",
          "label": "Alterações fundoscópicas"
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
      "resultSummary": "Fundo de Olho com Disco Óptico: Normal; Mácula: Normal; Retina: Normal.",
      "interpretation": "Os parâmetros mensurados — Disco Óptico: Normal; Mácula: Normal; Retina: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Fundo de Olho com parâmetros compatíveis com o padrão esperado, incluindo Disco Óptico: Normal; Mácula: Normal.",
      "results": {
        "disco_optico": "Normal",
        "macula": "Normal",
        "retina": "Normal",
        "impressao": "Fundo de Olho com parâmetros compatíveis com o padrão esperado, incluindo Disco Óptico: Normal; Mácula: Normal"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Fundo de Olho: Disco Óptico: Escavação aumentada, relação C/D aproximada de 0,7; Mácula: Reflexo foveal discretamente reduzido; Retina: Sem descolamento; rarefação vascular discreta.",
      "interpretation": "Os resultados principais (Disco Óptico: Escavação aumentada, relação C/D aproximada de 0,7; Mácula: Reflexo foveal discretamente reduzido; Retina: Sem descolamento; rarefação vascular discreta) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Fundo de Olho com padrão alterado, documentado por Disco Óptico: Escavação aumentada, relação C/D aproximada de 0,7; Mácula: Reflexo foveal discretamente reduzido.",
      "results": {
        "disco_optico": "Escavação aumentada, relação C/D aproximada de 0,7",
        "macula": "Reflexo foveal discretamente reduzido",
        "retina": "Sem descolamento; rarefação vascular discreta",
        "impressao": "Escavação papilar aumentada, recomendando correlação com pressão intraocular e campo visual"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Fundo de Olho: Disco Óptico: Escavação 0,6, simétrica; Mácula: Preservada; Retina: Sem lesões focais.",
      "interpretation": "Os principais resultados (Disco Óptico: Escavação 0,6, simétrica; Mácula: Preservada; Retina: Sem lesões focais) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Fundo de Olho com resultado limítrofe/inespecífico, destacando-se Disco Óptico: Escavação 0,6, simétrica; Mácula: Preservada.",
      "results": {
        "disco_optico": "Escavação 0,6, simétrica",
        "macula": "Preservada",
        "retina": "Sem lesões focais",
        "impressao": "Escavação papilar limítrofe, recomendando correlação com demais exames"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Fundo de Olho: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "disco_optico": "Normal",
        "macula": "Normal",
        "retina": "Normal",
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
    "title": "Fundo de Olho",
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
  "technique": "Fundoscopia realizada para avaliação do nervo óptico, mácula, vasos retinianos e retina periférica acessível ao método.",
  "method": "Oftalmoscopia direta e/ou indireta após adequada visualização do fundo ocular, com descrição sistematizada das estruturas observadas.",
  "parameters": [
    {
      "id": "disco_optico",
      "label": "Disco Óptico",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Disco Óptico conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "macula",
      "label": "Mácula",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Mácula conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "retina",
      "label": "Retina",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Retina conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Oftalmoscópica",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Oftalmoscópica conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Fundo de Olho compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Fundo de Olho com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Fundo de Olho com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Fundo de Olho sem alterações significativas nos parâmetros avaliados.",
    "altered": "Fundo de Olho alterado conforme resultados objetivos descritos.",
    "undefined": "Fundo de Olho com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
