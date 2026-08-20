import type { IntelligentExamModel } from "../types";

export const func_espirometriaModel: IntelligentExamModel = {
  "id": "func_espirometria",
  "nome": "Espirometria",
  "descricao": "Avaliação da função pulmonar por volumes e fluxos respiratórios",
  "categoria": "funcional",
  "icone": "fa-lungs",
  "campos": [
    {
      "id": "cvf",
      "tipo": "number",
      "label": "CVF",
      "unidade": "% previsto",
      "referencia": "≥ 80"
    },
    {
      "id": "vef1",
      "tipo": "number",
      "label": "VEF1",
      "unidade": "% previsto",
      "referencia": "≥ 80"
    },
    {
      "id": "vef1_cvf",
      "tipo": "number",
      "label": "VEF1/CVF",
      "unidade": "%",
      "referencia": "≥ 70"
    },
    {
      "id": "padrao",
      "tipo": "select",
      "label": "Padrão Ventilatório",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "obstrutivo",
          "label": "Obstrutivo"
        },
        {
          "valor": "restritivo",
          "label": "Restritivo"
        },
        {
          "valor": "misto",
          "label": "Misto"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "resposta_broncodilatador",
      "tipo": "select",
      "label": "Resposta ao Broncodilatador",
      "opcoes": [
        {
          "valor": "nao_realizado",
          "label": "Não realizado"
        },
        {
          "valor": "negativa",
          "label": "Negativa"
        },
        {
          "valor": "positiva",
          "label": "Positiva"
        }
      ],
      "referencia": "—"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Funcional",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Função pulmonar preservada"
        },
        {
          "valor": "asma",
          "label": "Padrão compatível com asma"
        },
        {
          "valor": "dpoc",
          "label": "Padrão compatível com DPOC"
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
    "Trauma",
    "Dor",
    "Controle pós-operatório",
    "Oncológico",
    "Personalizado"
  ],
  "profiles": [
    {
      "id": "normal",
      "name": "Normal",
      "status": "normal",
      "description": "Sem alterações significativas no método.",
      "resultSummary": "Espirometria com CVF: 86,4; VEF1: 86,4; VEF1/CVF: 75,6.",
      "interpretation": "Os parâmetros mensurados — CVF: 86,4 % previsto; VEF1: 86,4 % previsto; VEF1/CVF: 75,6 %; Padrão Ventilatório: Normal — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Espirometria com parâmetros compatíveis com o padrão esperado, incluindo CVF: 86,4 % previsto; VEF1: 86,4 % previsto.",
      "results": {
        "cvf": "86,4",
        "vef1": "86,4",
        "vef1_cvf": "75,6",
        "padrao": "Normal",
        "resposta_broncodilatador": "Sem resposta broncodilatadora significativa",
        "impressao": "Espirometria com parâmetros compatíveis com o padrão esperado, incluindo CVF: 86,4 % previsto; VEF1: 86,4 % previsto"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Achado estrutural ou funcional relevante.",
      "resultSummary": "Espirometria: CVF: 78; VEF1: 62; VEF1/CVF: 64; Padrão Ventilatório: Distúrbio ventilatório obstrutivo moderado.",
      "interpretation": "Os resultados principais (CVF: 78 % previsto; VEF1: 62 % previsto; VEF1/CVF: 64 %; Padrão Ventilatório: Distúrbio ventilatório obstrutivo moderado) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Espirometria com padrão alterado, documentado por CVF: 78 % previsto; VEF1: 62 % previsto.",
      "results": {
        "cvf": "78",
        "vef1": "62",
        "vef1_cvf": "64",
        "padrao": "Distúrbio ventilatório obstrutivo moderado",
        "resposta_broncodilatador": "Resposta broncodilatadora significativa",
        "impressao": "Padrão obstrutivo moderado com resposta ao broncodilatador"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / inespecífico",
      "status": "indefinido",
      "description": "Achado inespecífico ou limítrofe.",
      "resultSummary": "Espirometria: CVF: 79; VEF1: 78; VEF1/CVF: 70; Padrão Ventilatório: Valores limítrofes para distúrbio ventilatório.",
      "interpretation": "Os principais resultados (CVF: 79 % previsto; VEF1: 78 % previsto; VEF1/CVF: 70 %; Padrão Ventilatório: Valores limítrofes para distúrbio ventilatório) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Espirometria com resultado limítrofe/inespecífico, destacando-se CVF: 79 % previsto; VEF1: 78 % previsto.",
      "results": {
        "cvf": "79",
        "vef1": "78",
        "vef1_cvf": "70",
        "padrao": "Valores limítrofes para distúrbio ventilatório",
        "resposta_broncodilatador": "Sem resposta significativa",
        "impressao": "Espirometria em faixa limítrofe, sem padrão obstrutivo/restritivo definido"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Espirometria: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "cvf": "86,4",
        "vef1": "86,4",
        "vef1_cvf": "75,6",
        "padrao": "Normal",
        "resposta_broncodilatador": "Sem resposta broncodilatadora significativa",
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
    "title": "Espirometria",
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
        "title": "2. Achados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "medidas",
        "title": "3. Medidas",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": false,
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
      "medidas",
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
      "medidas",
      "interpretacao",
      "conclusao",
      "assinatura"
    ]
  },
  "structure": {
    "standard": "imagem",
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
        "title": "2. Achados",
        "required": true,
        "visibleByDefault": true
      },
      {
        "id": "medidas",
        "title": "3. Medidas",
        "required": false,
        "visibleByDefault": true
      },
      {
        "id": "interpretacao",
        "title": "4. Interpretação",
        "required": false,
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
  "technique": "Prova de função pulmonar realizada com manobras expiratórias forçadas reprodutíveis, avaliando CVF, VEF1 e relação VEF1/CVF; prova broncodilatadora quando indicada.",
  "method": "Espirometria computadorizada com curvas fluxo-volume e volume-tempo, aceitação das manobras tecnicamente adequadas e comparação com valores previstos para o paciente.",
  "parameters": [
    {
      "id": "cvf",
      "label": "CVF",
      "unidade": "% previsto",
      "referencia": "≥ 80",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar CVF conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "vef1",
      "label": "VEF1",
      "unidade": "% previsto",
      "referencia": "≥ 80",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar VEF1 conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "vef1_cvf",
      "label": "VEF1/CVF",
      "unidade": "%",
      "referencia": "≥ 70",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar VEF1/CVF conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "padrao",
      "label": "Padrão Ventilatório",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Padrão Ventilatório conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resposta_broncodilatador",
      "label": "Resposta ao Broncodilatador",
      "unidade": null,
      "referencia": "—",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resposta ao Broncodilatador conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Funcional",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Funcional conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [
    {
      "id": "medidas",
      "title": "Medidas",
      "headers": [
        "Estrutura / Medida",
        "Resultado",
        "Referência / Observação"
      ],
      "rowsFromParameters": false
    }
  ],
  "interpretation": {
    "normal": "Resultados de Espirometria compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Espirometria com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Espirometria com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Espirometria sem alterações significativas nos parâmetros avaliados.",
    "altered": "Espirometria alterado conforme resultados objetivos descritos.",
    "undefined": "Espirometria com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
