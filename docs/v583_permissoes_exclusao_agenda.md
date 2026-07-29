# v0.5.83 — Permissões de exclusão da Agenda Clínica

- Criada migração para permitir que Diretora, Vice Diretor, Diretor Clínico e Desenvolvedor gerenciem horários, sequências e planejamentos de todos os médicos.
- Médicos comuns permanecem limitados aos próprios registros pelo `doctor_id`.
- Exclusões agora verificam a contagem real de linhas afetadas, sem depender do retorno de representação do PostgREST.
- Mensagens diferenciam registro inexistente, registro de outro médico e migração de permissões ainda não aplicada.

## Migração obrigatória
Execute no Supabase:
`supabase/migrations/20260729_000028_schedule_manager_permissions.sql`
