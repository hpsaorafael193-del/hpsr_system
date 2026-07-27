# v0.5.50 — Documentos no prontuário e responsividade multitelas

## Documentos
- Ao salvar, todas as páginas do documento são renderizadas sequencialmente em PNG e armazenadas no registro clínico.
- O registro mantém o HTML original e também `previewImage` / `previewImages`.
- Documentos sem sigilo são liberados imediatamente no Portal do Paciente.
- O prontuário passou a abrir e baixar Documentos com a mesma experiência usada para Exames.

## Responsividade
- Rolagem por toque com inércia foi habilitada para áreas verticais e horizontais.
- Barras de rolagem são ocultadas em dispositivos de toque, sem impedir o gesto de rolagem.
- Em monitores verticais, tablets e larguras menores que 1280 px, as páginas usam fluxo vertical natural.
- Exames e Documentos deixam de prender a estrutura principal em altura fixa fora de telas desktop amplas.
- Modais e listas do Portal do Paciente foram ajustados para celular.
- Botões e campos receberam comportamento de toque mais consistente.
