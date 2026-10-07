# v1.1.16-test.90

Restauradas as regras de altura originais dos painéis: Exames usa clamp(820px, calc(68dvh + 260px), 1120px) no desktop; Documentos usa clamp(680px, calc(54dvh + 168px), 795px). Formulário e editor voltam a ocupar a área delimitada, com rolagem interna. Removidas as substituições de altura automática, flex none e overflow visible introduzidas nas versões .84/.85. O comportamento responsivo anterior permanece.

Rolagem corrigida com overscroll-behavior-y: auto nos painéis, listas e áreas roláveis das duas abas: o gesto continua para o contêiner externo ao atingir o limite, sem aumentar os painéis conforme o conteúdo. Nenhum listener captura ou cancela a roda do mouse.

Ponteiro preto com contorno branco reduzido de 32 para 22 px, com ponto de clique ajustado. Não altera o cursor de digitação nem os campos de 36 px.

Preserva assinaturas, dados/linhas do laudo, snapshot e PNG temporário idêntico à prévia, fontes do guia farmacêutico e demais ajustes anteriores.

Validação: auditoria de release e parser TS/TSX/CSS. Interação em navegador real pendente no ambiente.
