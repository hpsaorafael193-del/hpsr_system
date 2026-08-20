import type { IntelligentExamModel } from "../types";

export const exame_genericoModel: IntelligentExamModel = {
  "id": "exame_generico",
  "nome": "Exame Clínico Genérico",
  "descricao": "Modelo universal para registro de exames não padronizados",
  "categoria": "geral",
  "icone": "fa-file-medical",
  "campos": [
    {
      "id": "tipo_exame",
      "tipo": "text",
      "label": "Tipo de Exame",
      "placeholder": "Ex: Teste funcional específico, exame externo, avaliação clínica dirigida"
    },
    {
      "id": "metodologia",
      "tipo": "text",
      "label": "Metodologia",
      "placeholder": "Método utilizado para realização do exame"
    },
    {
      "id": "resultado_principal",
      "tipo": "text",
      "label": "Resultado Principal",
      "placeholder": "Resultado objetivo do exame"
    },
    {
      "id": "parametros_adicionais",
      "tipo": "textarea",
      "label": "Parâmetros / Achados Adicionais",
      "placeholder": "Descrever achados complementares relevantes"
    },
    {
      "id": "impressao",
      "tipo": "select",
      "label": "Impressão Clínica",
      "opcoes": [
        {
          "valor": "normal",
          "label": "Dentro da normalidade"
        },
        {
          "valor": "alterado",
          "label": "Com alterações"
        },
        {
          "valor": "inconclusivo",
          "label": "Inconclusivo"
        }
      ],
      "referencia": "Normal / Alterado / Inconclusivo"
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
      "description": "Parâmetros dentro das referências disponíveis.",
      "resultSummary": "Modelo manual: preencher os resultados efetivamente obtidos no exame realizado.",
      "interpretation": "Interpretação a ser preenchida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser preenchida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "tipo_exame": "Informar o exame realizado",
        "metodologia": "Informar a metodologia utilizada",
        "resultado_principal": "Inserir o resultado objetivo do exame",
        "parametros_adicionais": "Inserir parâmetros adicionais quando aplicável",
        "impressao": "A definir pelo médico responsável"
      }
    },
    {
      "id": "alterado",
      "name": "Alterado",
      "status": "alterado",
      "description": "Um ou mais parâmetros fora da referência.",
      "resultSummary": "Modelo manual: preencher os resultados efetivamente obtidos no exame realizado.",
      "interpretation": "Interpretação a ser preenchida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser preenchida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "tipo_exame": "Informar o exame realizado",
        "metodologia": "Informar a metodologia utilizada",
        "resultado_principal": "Inserir o resultado objetivo do exame",
        "parametros_adicionais": "Inserir parâmetros adicionais quando aplicável",
        "impressao": "A definir pelo médico responsável"
      }
    },
    {
      "id": "indefinido",
      "name": "Indefinido / limítrofe",
      "status": "indefinido",
      "description": "Alteração discreta ou inconclusiva.",
      "resultSummary": "Modelo manual: preencher os resultados efetivamente obtidos no exame realizado.",
      "interpretation": "Interpretação a ser preenchida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser preenchida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "tipo_exame": "Informar o exame realizado",
        "metodologia": "Informar a metodologia utilizada",
        "resultado_principal": "Inserir o resultado objetivo do exame",
        "parametros_adicionais": "Inserir parâmetros adicionais quando aplicável",
        "impressao": "A definir pelo médico responsável"
      }
    },
    {
      "id": "personalizado",
      "name": "Personalizado",
      "status": "personalizado",
      "description": "Modelo livre para ajuste médico.",
      "resultSummary": "Modelo manual: preencher os resultados efetivamente obtidos no exame realizado.",
      "interpretation": "Interpretação a ser preenchida pelo médico conforme os resultados efetivamente informados.",
      "conclusion": "Conclusão a ser preenchida pelo médico conforme os resultados efetivamente informados.",
      "results": {
        "tipo_exame": "Informar o exame realizado",
        "metodologia": "Informar a metodologia utilizada",
        "resultado_principal": "Inserir o resultado objetivo do exame",
        "parametros_adicionais": "Inserir parâmetros adicionais quando aplicável",
        "impressao": "A definir pelo médico responsável"
      }
    }
  ],
  "variables": [],
  "editorModel": {
    "title": "Exame Clínico Genérico",
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
  "technique": "Modelo manual de contingência destinado exclusivamente a exames não contemplados por um modelo específico do catálogo.",
  "method": "O método, os parâmetros, os valores de referência, a interpretação e a conclusão devem ser preenchidos manualmente conforme o exame efetivamente realizado; o sistema não deve inferir resultados clínicos neste modelo.",
  "parameters": [
    {
      "id": "tipo_exame",
      "label": "Tipo de Exame",
      "unidade": null,
      "referencia": "Ex: Teste funcional específico, exame externo, avaliação clínica dirigida",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Tipo de Exame conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "metodologia",
      "label": "Metodologia",
      "unidade": null,
      "referencia": "Método utilizado para realização do exame",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Metodologia conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "resultado_principal",
      "label": "Resultado Principal",
      "unidade": null,
      "referencia": "Resultado objetivo do exame",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Resultado Principal conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "parametros_adicionais",
      "label": "Parâmetros / Achados Adicionais",
      "unidade": null,
      "referencia": "Descrever achados complementares relevantes",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Parâmetros / Achados Adicionais conforme referência, contexto clínico e método utilizado."
    },
    {
      "id": "impressao",
      "label": "Impressão Clínica",
      "unidade": null,
      "referencia": "Normal / Alterado / Inconclusivo",
      "resultPlaceholder": "A preencher",
      "interpretationHint": "Interpretar Impressão Clínica conforme referência, contexto clínico e método utilizado."
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
    "normal": "Preenchimento manual obrigatório.",
    "altered": "Preenchimento manual obrigatório.",
    "undefined": "Preenchimento manual obrigatório."
  },
  "conclusion": {
    "normal": "Conclusão manual.",
    "altered": "Conclusão manual.",
    "undefined": "Conclusão manual."
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
