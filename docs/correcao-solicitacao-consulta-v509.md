# Correção da rota de solicitação de consulta — 0.5.09

## Problema encontrado

A solicitação era gravada em `appointments`, porém a tela administrativa de Agendamentos carregava os dados somente ao abrir a página e ainda aplicava um filtro de especialidade baseado em um perfil estático. Isso podia ocultar solicitações válidas e impedia que uma nova solicitação aparecesse enquanto a tela já estivesse aberta.

## Correções

- sincronização Realtime para alterações em `appointments`;
- atualização silenciosa ao retornar para a aba;
- normalização dos diferentes estados pendentes;
- remoção do filtro estático de especialidade na lista de solicitações pendentes;
- preservação das regras existentes para consultas já aceitas e agenda clínica.
