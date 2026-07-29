# v0.5.78 — Gerenciamento de consultas e horários pelo desenvolvedor

- Adicionada uma área exclusiva para o perfil de desenvolvedor na Agenda Clínica.
- O desenvolvedor pode visualizar planejamentos clínicos de todos os profissionais.
- É possível excluir um planejamento, uma sequência publicada inteira ou um horário individual.
- Horários ocupados também podem ser removidos mediante confirmação.
- Ao excluir uma reserva, o vínculo com `appointments` e `clinical_followup_occurrences` é desfeito para evitar registros incompletos.
- A pessoa que criou o planejamento ou a sequência continua com os controles normais já existentes.
