# v1.0.114 — Médicos e horários no Portal do Paciente

- Corrigida a listagem de profissionais por especialidade com normalização de nomes equivalentes.
- Profissionais aprovados com CRM e especialidade clínica deixam de ser descartados apenas pelo texto do cargo.
- O agendamento com especialista utiliza a mesma validação da listagem.
- O painel de horários agora respeita o paciente selecionado no portal, inclusive dependentes.
- Adicionada recuperação sob demanda para sequências antigas que ainda não possuíam vagas projetadas nas datas do acompanhamento.
- A recuperação só executa quando nenhuma vaga compatível é encontrada e mantém limites baixos de leitura e escrita.
