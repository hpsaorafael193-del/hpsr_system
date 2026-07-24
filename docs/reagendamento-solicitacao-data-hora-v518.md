# v0.5.18 — Sugestão de nova data e horário

Na Central de Solicitações, o botão Reagendar agora abre um formulário obrigatório para o médico informar nova data e novo horário, com motivo ou orientação opcional.

A sugestão é persistida no payload existente de `appointments`, usando os campos `proposedDate`, `proposedTime` e `rescheduleReason`, sem criar tabela ou coluna nova. O status passa a ser `Reagendamento solicitado`, permitindo que o paciente veja a proposta em Pendências e responda pelo fluxo já existente.
