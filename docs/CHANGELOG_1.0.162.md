# Versão 1.0.162

## Objetivo
Limitar visualmente as listas da Agenda Clínica a três itens visíveis, ativando rolagem interna a partir do quarto item.

## Arquivos alterados
- `src/app/dashboard/agendamento/clinica/page.tsx`
- `src/components/dashboard/DeveloperAppointmentManager.tsx`
- `src/components/dashboard/ClinicalFollowupPlanner.tsx`
- `src/components/dashboard/DoctorAvailabilityManager.tsx`
- `src/components/layout/DeveloperCreditsModal.tsx`
- `package.json`
- `package-lock.json`

## Estruturas reutilizadas
Foram preservados os painéis, filtros, consultas e componentes existentes. Apenas os limites visuais e o comportamento de rolagem foram ajustados.

## Migrações
Nenhuma.

## Compatibilidade
Nenhuma regra de agenda, agendamento, planejamento ou disponibilidade foi alterada.

## Otimizações
A página deixa de crescer proporcionalmente ao volume das listas. A rolagem passa a ocorrer dentro de cada área após três itens visíveis.

## Validações
- Revisão estática dos arquivos alterados.
- Verificação de versão nos arquivos do projeto.
- Nenhuma consulta adicional ao Supabase.
