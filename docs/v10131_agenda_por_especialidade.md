# v1.0.131 — Agenda por especialidade do prontuário

- Remove a dependência de planejamento clínico para exibir e reservar horários no Portal do Paciente.
- Adiciona `patient_registry.portal_specialties`, administrado no prontuário pelo botão **Agenda do portal**.
- O paciente visualiza vagas publicadas para as especialidades liberadas em seu prontuário.
- A publicação médica volta a aceitar intervalo livre de datas, sem exigir ocorrências planejadas.
- O nome do médico responsável fica destacado em cada vaga.
- Antes da reserva, o portal pergunta se o paciente realmente deseja escolher e confirmar o horário com aquele médico.
- Amplia e alinha a largura do Portal do Paciente e das orientações inferiores.

## Migração necessária

Executar `supabase/migrations/20260731_000032_patient_portal_specialties.sql` no Supabase antes de usar o novo fluxo.
