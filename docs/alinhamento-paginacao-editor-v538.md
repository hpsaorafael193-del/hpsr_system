# v0.5.38 — Alinhamento entre paginação do editor e paginação do laudo

- A capacidade útil do laudo voltou a usar os limites reais da página renderizada.
- A primeira página do editor agora usa uma guia menor que as seguintes, refletindo o espaço ocupado por cabeçalho e assinatura no laudo.
- As páginas seguintes do editor usam uma guia própria, maior, alinhada ao espaço útil das páginas de continuação.
- O contador de páginas do editor passa a considerar também a paginação real do laudo montado, reduzindo divergências entre o editor e o PNG.
- As marcações/quebras de página do editor continuam sendo respeitadas.
