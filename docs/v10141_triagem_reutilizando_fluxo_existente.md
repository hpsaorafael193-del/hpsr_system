# v1.0.141 — Triagem reutilizando o fluxo existente

A implementação parte da v1.0.139 e desconsidera integralmente a v1.0.140.

## Estruturas reaproveitadas

- `patient_registry.follow_up`: continua sendo a classificação do paciente; `Rotina` é o padrão e os demais valores representam acompanhamento.
- `patient_registry.portal_specialties`: preserva liberações e horários antigos.
- `patient_portal_access`: recebe apenas o estado da triagem e os vínculos leves de agenda por médico/especialidade.
- `clinical_appointment_slots`: permanece como fonte única dos horários publicados.

## Alterações

- Novos cadastros realizados pelo Portal do Paciente entram como pendentes, mas continuam `Rotina` até classificação.
- O modal de pendências permite manter o paciente rotineiro ou vinculá-lo ao médico atual por especialidade.
- O filtro **Meus acompanhamentos** utiliza os vínculos do próprio médico.
- Quando há vínculo explícito, o portal mostra somente horários do médico e especialidade associados.
- Quando não há vínculo explícito, o fluxo histórico de especialidades continua sendo usado, preservando dados antigos.
- Consultas e registros clínicos deixaram de transformar automaticamente qualquer paciente em acompanhamento.

## Banco

Executar `supabase/migrations/20260731_000034_patient_triage_reuse_existing_portal.sql`.
