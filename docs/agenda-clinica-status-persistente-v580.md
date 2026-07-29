# v0.5.80 — Persistência de status na Agenda Clínica

- O modal "Abrir atendimento" passou a salvar o status selecionado na tabela `appointments`.
- Adicionados os status: Agendada, Confirmada, Em atendimento, Realizada, Não compareceu e Cancelada.
- O resumo e o tipo do atendimento também passam a ser registrados no payload da consulta.
- Quando a consulta possui horário ou ocorrência vinculada, esses registros também são sincronizados.
- Consultas em atendimento continuam visíveis na agenda; consultas finalizadas deixam a visão ativa após a sincronização.
