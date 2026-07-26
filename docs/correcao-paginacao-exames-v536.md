# v0.5.36 — Correção de paginação e marcação dos exames

- A paginação do laudo agora usa capacidades mais conservadoras para respeitar melhor a altura útil da folha.
- O relatório passou a respeitar quebras de página inseridas pelo editor (placeholders e marcadores internos).
- A separação em páginas passou a considerar melhor a estrutura real do HTML do editor.
- Títulos e o bloco seguinte permanecem juntos com mais frequência, evitando cabeçalhos isolados no fim da página.
- A exportação continua preservando o nome do paciente no nome do arquivo PNG.
