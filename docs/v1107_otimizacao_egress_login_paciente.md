# v1.0.107 — Otimização de egress no acesso do paciente

- Revisado o fluxo normal de login do Portal do Paciente.
- Confirmado que o login carrega somente autenticação, sessão e dados mínimos de identificação.
- Removidas varreduras de até 5.000 linhas da rota alternativa de acesso direto.
- A busca de paciente agora usa filtros exatos por passaporte e retorna no máximo uma linha por tabela.
- Mantidos fallbacks para registros antigos sem cadastro em `patient_registry`, também limitados a uma linha.
- Nenhum exame, documento ou prontuário completo é carregado no momento do login; esses dados continuam sob demanda.
