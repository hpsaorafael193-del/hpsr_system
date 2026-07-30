# v1.0.112 — Notificações médicas globais

- Adicionado indicador pulsante vermelho ao avatar do menu de perfil quando existem notificações não lidas.
- Adicionada a opção **Minhas notificações** ao menu flutuante, disponível independentemente da aba aberta.
- Criado modal compacto para solicitações direcionadas ao médico, solicitações da especialidade, acompanhamentos, reagendamentos aceitos, confirmações de horário e exames.
- As notificações são derivadas da tabela `appointments`, sem criação de tabela paralela.
- A leitura é registrada no próprio `payload` por usuário em `notificationReadBy`.
- Consultas ao Supabase são limitadas, usam somente as colunas necessárias e são atualizadas a cada 120 segundos apenas com a janela visível, além de foco/retorno à aba.
- O clique em uma notificação encaminha para a Central de Agendamentos.
