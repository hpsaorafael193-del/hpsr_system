# v1.1.16-test.82

Projeto completo com ajustes de navegação, rascunhos privados e interface de exames.

- Exames: removidos o bloqueio geral do formulário e o aviso de saída. Somente a edição de texto aguarda a leitura inicial para evitar substituir um rascunho existente; uma falha de leitura libera o editor, informa o problema e oferece nova tentativa sem sobrescrever o rascunho remoto.
- Exames e Documentos: salvamento automático privado no Supabase, independente da publicação no Portal. Ao trocar de página, salva a última versão; ao voltar imediatamente, a recuperação aguarda esse salvamento. A recuperação de um rascunho intacto não provoca uma gravação redundante.
- Documentos: restaura paciente, médico, modelo, campos guiados, texto, registro em edição, visibilidade e estado de publicação. A assinatura do médico restaurado não é substituída pelo carregamento da lista de profissionais.
- Interface de exames: superfícies mais escuras em tons neutros, painéis principais simplificados e redução de molduras internas. Folha branca, renderer institucional, dimensões e composição do laudo preservados.
- Cursor: cor explícita, foco visível e marcador de 3 px com mistura de contraste, exclusivo da edição e ausente do HTML do laudo.
- Catálogo: ordenação e normalização dos textos calculadas uma vez por montagem; buscas mantêm categorias, aliases, acentos e correspondência de todos os termos.
- Assinaturas: cache limitado a oito imagens, apenas em memória, reaproveita carregamento e recorte nas páginas de prévia. Falhas podem ser tentadas novamente.
- Imagens: 50 PNGs recomprimidos, redução total de 15.515.446 bytes. Comparação com a versão .81 confirmou igualdade exata dos dados descomprimidos e de todos os metadados.
- Configuração pnpm movida para pnpm-workspace.yaml, mantendo override e hoisting existentes. CI alinhado a Node 24 e pnpm 12.2.1. Lockfile original preservado; versões de dependências não atualizadas.

## Banco

Migração 20261007050000_document_editor_drafts.sql aplicada ao projeto vinculado. A nova tabela possui RLS e quatro políticas de acesso pelo próprio autor autenticado e habilitado como profissional, usando a mesma proteção e ordenação temporal de Exames. Rascunhos não são registros publicados.

## Validação

- TypeScript: aprovado com tsc --noEmit.
- Next production build: aprovado.
- Lint: aprovado com avisos preexistentes.
- Auditoria do Portal: sintaxe TS/TSX/CSS, autorização e contratos responsivos aprovados.
- Auditorias de cadastro profissional, vínculos de pacientes e release: aprovadas.
- Rascunhos: recuperação, ausência de gravação redundante, metadados, refresh, erro/repetição e navegação imediata testados para ambas as tabelas.
- Cache de assinatura: compartilhamento de requisições, reuso, repetição após falhas e limite testados.
- Renderização real do canvas do cabeçalho e rodapé: aprovada. Renderer institucional idêntico à .81.
- Guia farmacêutico: catálogo de 26 medicamentos, nove grupos, busca, filtros e ordenação aprovados.

A interface e o marcador de cursor ainda precisam de inspeção em navegador real; o ambiente não possui o executável de Chromium. A persistência depende de conexão e sessão válidas. Atualizar ou fechar imediatamente após inserir anexos grandes pode interromper um upload em andamento; acompanhe o indicador de rascunho salvo.

Referências técnicas de configuração: https://pnpm.io/settings e https://pnpm.io/settings/build.
