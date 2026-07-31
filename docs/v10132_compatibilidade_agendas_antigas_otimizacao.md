# v1.0.132 — Compatibilidade com agendas antigas

## Objetivo

Preservar os horários já publicados e os dados agendados antes da mudança para o acesso por especialidade, sem voltar a exigir planejamento clínico.

## Compatibilidade

A migração `20260731_000033_legacy_schedule_specialty_compatibility.sql` incorpora ao acesso do paciente as especialidades encontradas em:

- liberações manuais já salvas no prontuário;
- planejamentos clínicos antigos;
- ocorrências antigas de acompanhamento;
- consultas registradas em `appointments`;
- horários anteriormente reservados em `clinical_appointment_slots`.

A operação de backfill é executada em lote, percorrendo cada origem uma vez e preservando as especialidades já liberadas manualmente.

## Consulta otimizada

A API do Portal do Paciente passou a usar a função `patient_portal_available_slots`, que realiza no banco o cruzamento entre especialidades do paciente e vagas disponíveis. Isso evita transferir centenas de horários não relacionados para o servidor Next.js e depois descartá-los em memória.

Na situação comum, o carregamento usa duas operações paralelas:

1. identificação do nome do paciente;
2. consulta das vagas já filtradas pelo banco.

A consulta adicional de diagnóstico só ocorre quando nenhuma vaga é retornada.

## Reserva

A validação da reserva considera tanto as liberações atuais quanto as especialidades históricas. A proteção contra concorrência permanece: a vaga só é ocupada quando ainda está com status `Disponível`.
