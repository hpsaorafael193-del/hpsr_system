# Correção do desligamento persistente — v0.5.15

## Problema

A interface removia o membro apenas do estado local e apagava o registro auxiliar em `team_members`. O perfil profissional permanecia aprovado em `profiles`, que é usado para reconstruir a equipe após o carregamento. Por isso, o membro voltava depois de atualizar a página.

## Correção

Foi criada a função administrativa `admin_deactivate_team_member`, que executa o desligamento como uma operação única:

- altera `profiles.access_status` para `Desligado`;
- altera `profiles.service_status` para `Fora de serviço`;
- mantém o registro funcional em `team_members` com status `Desligado` para auditoria;
- registra motivo, data e responsável em `system_activities`;
- impede que o perfil volte à lista, que carrega somente profissionais aprovados.

A interface agora só remove o membro da lista após confirmação de sucesso do Supabase e exibe erro quando a persistência falha.
