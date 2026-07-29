# v0.5.82 — Agenda Clínica: rolagem, persistência e visual

- Corrigida a rolagem por mouse no painel de próximas consultas.
- Calendário e painel de consultas passam a ter a mesma altura em desktop.
- Reduzido o excesso de cabeçalhos e blocos decorativos no topo.
- Atualizações de status agora exigem confirmação do registro alterado pelo Supabase.
- A agenda é recarregada imediatamente após salvar o atendimento.
- Exclusões de consultas, horários e planejamentos validam se o banco realmente removeu ou atualizou o registro.
- Ocorrências vinculadas são removidas antes da exclusão do planejamento para evitar bloqueios por relacionamento.
