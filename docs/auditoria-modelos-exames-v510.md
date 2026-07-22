# Auditoria dos modelos de exames — v0.5.10

## Objetivo

Garantir que o modo guiado produza resultados clínicos plausíveis e contextualizados, evitando valores genéricos como `Alterado`, `Achados` ou `A preencher` nos blocos automáticos do laudo.

## Abrangência

- 86 arquivos de modelos revisados em `src/data/exames/models`.
- Perfis normal, alterado, limítrofe, contextual e personalizado.
- Exames laboratoriais, de imagem, cardiológicos, neurológicos, ginecológicos, obstétricos, pediátricos, neonatais, oftalmológicos, dermatológicos, hormonais, genéticos, funcionais e gerais.

## Ajustes no motor adaptativo

- Valores explícitos curados pelos modelos continuam prioritários.
- Valores genéricos são substituídos por resultados coerentes com o parâmetro, referência, unidade, perfil e contexto clínico.
- Perfis alterados não tornam todos os parâmetros anormais: apenas parâmetros relacionados ao perfil ou um conjunto principal recebem alterações; os demais permanecem coerentes com a referência.
- Resultados numéricos são gerados dentro, fora ou próximos dos limites de referência conforme o perfil selecionado.
- Resultados qualitativos usam descrições específicas, como presença, ausência, redução, aumento, estenose, formação focal, líquido livre ou alteração discreta.
- Exames de imagem passam a gerar um bloco de achados com descrição por estrutura/parâmetro.
- Exames laboratoriais passam a gerar um resumo com os parâmetros efetivamente alterados e seus valores.
- O perfil personalizado recebe uma base clínica preenchida, permanecendo editável pelo profissional.

## Preservação

Nenhum modelo, campo, perfil, seção, tabela, adaptador, contexto clínico ou funcionalidade foi removido.
