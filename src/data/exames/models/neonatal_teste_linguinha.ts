import type { IntelligentExamModel } from "../types";

export const neonatal_teste_linguinhaModel: IntelligentExamModel = {
  "id": "neonatal_teste_linguinha",
  "nome": "Teste da Linguinha",
  "descricao": "Avaliação do frênulo lingual no recém-nascido",
  "categoria": "neonatal",
  "icone": "fa-mouth",
  "campos": [
    {
      "id": "freio_lingual",
      "tipo": "select",
      "label": "Frênulo Lingual",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Normal"
        },
        {
          "valor": "curto",
          "label": "Curto (Anquiloglossia)"
        }
      ],
      "referencia": "Normal"
    },
    {
      "id": "impacto_succao",
      "tipo": "select",
      "label": "Impacto na Sucção",
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
      "id": "conduta",
      "tipo": "select",
      "label": "Conduta",
      "opcoes": [
        {
          "valor": "observacao",
          "label": "Observação"
        },
        {
          "valor": "frenotomia",
          "label": "Frenotomia indicada"
        }
      ],
      "referencia": "Observação"
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
      "resultSummary": "Teste da Linguinha com Frênulo Lingual: Normal; Impacto na Sucção: Ausente; Conduta: Observação.",
      "interpretation": "Os parâmetros mensurados — Frênulo Lingual: Normal; Impacto na Sucção: Ausente; Conduta: Observação — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste da Linguinha com parâmetros compatíveis com o padrão esperado, incluindo Frênulo Lingual: Normal; Impacto na Sucção: Ausente.",
      "results": {
        "freio_lingual": "Normal",
        "impacto_succao": "Ausente",
        "conduta": "Observação"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Teste da Linguinha: Frênulo Lingual: Frênulo curto, com inserção anteriorizada; Impacto na Sucção: Limitação de elevação/protrusão lingual com dificuldade de pega; Conduta: Avaliação multiprofissional e seguimento conforme protocolo.",
      "interpretation": "Os resultados principais (Frênulo Lingual: Frênulo curto, com inserção anteriorizada; Impacto na Sucção: Limitação de elevação/protrusão lingual com dificuldade de pega; Conduta: Avaliação multiprofissional e seguimento conforme protocolo) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste da Linguinha com padrão alterado, documentado por Frênulo Lingual: Frênulo curto, com inserção anteriorizada; Impacto na Sucção: Limitação de elevação/protrusão lingual com dificuldade de pega.",
      "results": {
        "freio_lingual": "Frênulo curto, com inserção anteriorizada",
        "impacto_succao": "Limitação de elevação/protrusão lingual com dificuldade de pega",
        "conduta": "Avaliação multiprofissional e seguimento conforme protocolo"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Teste da Linguinha: Frênulo Lingual: Frênulo discretamente curto; Impacto na Sucção: Impacto funcional duvidoso/discreto; Conduta: Reavaliar mamada e função lingual em seguimento.",
      "interpretation": "Os principais resultados (Frênulo Lingual: Frênulo discretamente curto; Impacto na Sucção: Impacto funcional duvidoso/discreto; Conduta: Reavaliar mamada e função lingual em seguimento) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste da Linguinha com resultado limítrofe/inespecífico, destacando-se Frênulo Lingual: Frênulo discretamente curto; Impacto na Sucção: Impacto funcional duvidoso/discreto.",
      "results": {
        "freio_lingual": "Frênulo discretamente curto",
        "impacto_succao": "Impacto funcional duvidoso/discreto",
        "conduta": "Reavaliar mamada e função lingual em seguimento"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste da Linguinha: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "freio_lingual": "Normal",
        "impacto_succao": "Ausente",
        "conduta": "Observação"
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
    "title": "Teste da Linguinha",
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
  "technique": "Avaliação clínica do frênulo lingual e da mobilidade da língua no recém-nascido, considerando anatomia e repercussão funcional observada.",
  "method": "Inspeção orofacial padronizada e avaliação funcional da língua durante movimentos e, quando possível, sucção/alimentação.",
  "parameters": [
    {
      "id": "freio_lingual",
      "label": "Frênulo Lingual",
      "unidade": null,
      "referencia": "Normal",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Frênulo Lingual conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impacto_succao",
      "label": "Impacto na Sucção",
      "unidade": null,
      "referencia": "Ausente",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impacto na Sucção conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "conduta",
      "label": "Conduta",
      "unidade": null,
      "referencia": "Observação",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Conduta conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Teste da Linguinha compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste da Linguinha com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste da Linguinha com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste da Linguinha sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste da Linguinha alterado conforme resultados objetivos descritos.",
    "undefined": "Teste da Linguinha com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
