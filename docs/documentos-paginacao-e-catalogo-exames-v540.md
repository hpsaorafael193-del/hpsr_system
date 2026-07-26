# v0.5.40 — Paginação de Documentos e reorganização do catálogo de Exames

## Documentos
- O editor de Documentos passou a usar a mesma lógica dinâmica de paginação dos Exames.
- O conteúdo ocupa o espaço útil da folha até a área de assinatura e apenas o excedente segue para a página seguinte.
- O editor mostra a marca da página seguinte no ponto calculado pela paginação real.
- A pré-visualização passou a suportar várias páginas e navegação entre elas.
- Cada página pode ser baixada em PNG com o nome do paciente no arquivo.
- A base visual do PNG foi alinhada ao modelo institucional limpo usado pelos Exames.

## Exames
- O Exame Clínico Genérico foi removido do catálogo ativo.
- Avaliação Psicotécnica foi movida para Psicologia e Psiquiatria.
- Exame Toxicológico foi movido para Toxicologia.
- A ordenação agora agrupa exames pela categoria correspondente.
- A busca passou a ignorar acentos, pontuação e diferenças de caixa.
- Foram adicionados termos equivalentes para localizar o psicotécnico.
