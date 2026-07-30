# v1.0.111 — Solicitação de acompanhamento com especialista

- Renomeado o fluxo “Acompanhamento prolongado” para “Acompanhamento com especialista”.
- Adicionado card intuitivo no Portal do Paciente para pré-registro de acompanhamento.
- O paciente seleciona especialidade e médico responsável.
- A seleção do médico é validada no servidor e limitada aos profissionais aprovados da especialidade.
- A solicitação é direcionada somente ao médico escolhido.
- Ao confirmar, o sistema cria o plano semanal e nove ocorrências planejadas, vinculadas ao médico e paciente.
- O paciente passa a receber somente os horários publicados pelo médico confirmado.
- Consultas e listagens possuem limites e índice dedicado para reduzir leitura e egress no Supabase.
