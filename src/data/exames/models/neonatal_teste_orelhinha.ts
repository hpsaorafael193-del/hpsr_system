import type { IntelligentExamModel } from "../types";

export const neonatal_teste_orelhinhaModel: IntelligentExamModel = {
  "id": "neonatal_teste_orelhinha",
  "nome": "Teste da Orelhinha",
  "descricao": "Triagem auditiva neonatal por emissões otoacústicas",
  "categoria": "neonatal",
  "icone": "fa-ear-listen",
  "campos": [
    {
      "id": "resultado",
      "tipo": "select",
      "label": "Resultado",
      "opcoes": [
        {
          "valor": "passou",
          "label": "Passou"
        },
        {
          "valor": "falhou",
          "label": "Falhou"
        }
      ],
      "referencia": "Passou"
    },
    {
      "id": "lateralidade",
      "tipo": "select",
      "label": "Lateralidade",
      "opcoes": [
        {
          "valor": "bilateral",
          "label": "Bilateral"
        },
        {
          "valor": "direita",
          "label": "Orelha direita"
        },
        {
          "valor": "esquerda",
          "label": "Orelha esquerda"
        }
      ],
      "referencia": "Bilateral"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Neonatal",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Triagem auditiva normal"
        },
        {
          "valor": "encaminhamento",
          "label": "Necessita avaliação audiológica"
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
      "resultSummary": "Teste da Orelhinha com Resultado: Passou; Lateralidade: Bilateral.",
      "interpretation": "Os parâmetros mensurados — Resultado: Passou; Lateralidade: Bilateral — apresentam conjunto compatível com o padrão de referência e com a qualidade técnica prevista para este exame.",
      "conclusion": "Teste da Orelhinha com parâmetros compatíveis com o padrão esperado, incluindo Resultado: Passou; Lateralidade: Bilateral.",
      "results": {
        "resultado": "Passou",
        "lateralidade": "Bilateral",
        "impressao": "Teste da Orelhinha com parâmetros compatíveis com o padrão esperado, incluindo Resultado: Passou; Lateralidade: Bilateral"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Teste da Orelhinha: Resultado: Falhou / Refer; Lateralidade: Orelha direita.",
      "interpretation": "Os resultados principais (Resultado: Falhou / Refer; Lateralidade: Orelha direita) documentam o padrão alterado selecionado. A interpretação deve considerar a distribuição das alterações, o contexto clínico e, quando aplicável, exames anteriores ou complementares.",
      "conclusion": "Teste da Orelhinha com padrão alterado, documentado por Resultado: Falhou / Refer; Lateralidade: Orelha direita.",
      "results": {
        "resultado": "Falhou / Refer",
        "lateralidade": "Orelha direita",
        "impressao": "Emissões otoacústicas ausentes à direita; repetir triagem e encaminhar se persistente"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Teste da Orelhinha: Resultado: Inconclusivo; Lateralidade: Orelha direita.",
      "interpretation": "Os principais resultados (Resultado: Inconclusivo; Lateralidade: Orelha direita) situam-se em faixa limítrofe ou apresentam alteração inespecífica. O conjunto, isoladamente, não estabelece diagnóstico e deve ser interpretado de forma evolutiva e clínica.",
      "conclusion": "Teste da Orelhinha com resultado limítrofe/inespecífico, destacando-se Resultado: Inconclusivo; Lateralidade: Orelha direita.",
      "results": {
        "resultado": "Inconclusivo",
        "lateralidade": "Orelha direita",
        "impressao": "Resposta limítrofe à direita; repetir triagem em condições técnicas adequadas"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Teste da Orelhinha: modelo personalizado preparado para edição dos resultados.",
      "interpretation": "Interpretação a ser definida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser definida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "resultado": "Passou",
        "lateralidade": "Bilateral",
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
    "title": "Teste da Orelhinha",
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
  "technique": "Triagem auditiva neonatal realizada para avaliar a resposta coclear e identificar recém-nascidos que necessitam investigação audiológica complementar.",
  "method": "Registro de emissões otoacústicas evocadas e/ou potencial auditivo automatizado, conforme protocolo e fatores de risco informados.",
  "parameters": [
    {
      "id": "resultado",
      "label": "Resultado",
      "unidade": null,
      "referencia": "Passou",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "lateralidade",
      "label": "Lateralidade",
      "unidade": null,
      "referencia": "Bilateral",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Lateralidade conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Neonatal",
      "unidade": null,
      "referencia": "Normal / Alterado",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Neonatal conforme referência, contexto clínico e método utilizado."
    }
  ],
  "tables": [],
  "interpretation": {
    "normal": "Resultados de Teste da Orelhinha compatíveis com os valores e padrões de referência aplicáveis ao método.",
    "altered": "Teste da Orelhinha com alteração objetiva em um ou mais parâmetros, devendo a interpretação considerar o padrão específico demonstrado no laudo.",
    "undefined": "Teste da Orelhinha com variações discretas ou limítrofes, sem definição clínica isolada."
  },
  "conclusion": {
    "normal": "Teste da Orelhinha sem alterações significativas nos parâmetros avaliados.",
    "altered": "Teste da Orelhinha alterado conforme resultados objetivos descritos.",
    "undefined": "Teste da Orelhinha com resultado limítrofe/inconclusivo, conforme parâmetros descritos."
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
