# Versão 1.0.113 — Compatibilidade retroativa de acompanhamentos e horários

- Normaliza passaportes antigos usados em planos, ocorrências e vagas.
- Sincroniza ocorrências antigas com o médico e os dados do plano original.
- Reconhece estados antigos ainda abertos no Portal do Paciente.
- Reaproveita séries de horários já publicadas e cria somente as vagas ausentes nas datas reais dos acompanhamentos.
- Mantém a regra de encerramento 24 horas antes da consulta.
- Não cria novas tabelas e usa limites de até cinco vagas por ocorrência.

## Migração

`supabase/migrations/20260730_000031_legacy_followup_schedule_compatibility.sql`
