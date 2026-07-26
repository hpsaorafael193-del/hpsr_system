# v0.5.39 — Paginação dinâmica alinhada ao conteúdo real

- A divisão do laudo passou a medir o conteúdo com tipografia, tabelas e espaçamentos equivalentes aos usados no PNG.
- A página é preenchida até o limite útil imediatamente anterior à assinatura e ao rodapé.
- Somente o conteúdo que ultrapassa esse limite é movido para a página seguinte.
- Os indicadores do editor deixaram de usar alturas fixas.
- Cada indicador é posicionado no ponto real do texto em que a página seguinte começa no laudo.
- As quebras manuais do editor continuam sendo respeitadas.
