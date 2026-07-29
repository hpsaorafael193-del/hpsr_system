# v1.0.99 — Horário preferencial na solicitação de consulta

- Adicionado campo opcional de horário preferencial no Portal do Paciente.
- O horário é validado e salvo no payload da solicitação.
- O paciente visualiza o horário informado nos próprios cards.
- A Central de Agendamentos e a Agenda Clínica passam a priorizar o horário específico quando presente.
- O período continua obrigatório para manter uma alternativa ampla caso o horário não esteja disponível.
