# Teste de lógica — agendamento e acompanhamento

Esta entrega mantém a versão declarada **1.0.264** por solicitação do responsável do projeto. Ela é uma entrega de teste e não deve ser tratada como novo marco oficial de versão.

## Regra aplicada

- Planejamentos de acompanhamento usam datas como referência de organização, não como datas obrigatórias de consulta.
- A disponibilidade real vem dos horários publicados pelo médico.
- Quando o médico publica um período maior que um dia, a primeira data define o dia da semana da rotina e o sistema repete esse mesmo dia nas semanas seguintes dentro do período.
- Pacientes em acompanhamento veem somente horários do médico e da especialidade vinculados ao próprio acompanhamento.
- O paciente pode confirmar um horário somente enquanto a data civil de São Paulo ainda é anterior ao dia do atendimento.
- Ao chegar o próprio dia, vagas livres daquele dia deixam de aparecer e não podem mais ser confirmadas pelo Portal.
- Horários já confirmados continuam válidos normalmente quando o dia chega.
- Nova solicitação de consulta continua sendo um fluxo separado: o paciente envia o pedido e o médico combina o horário.
- Exames continuam independentes de consulta e acompanhamento.

## Persistência e concorrência

A migration `20260818_000053_followup_flexible_availability_booking.sql` adiciona uma RPC atômica para confirmar a vaga de acompanhamento, criar a consulta e vincular a ocorrência na mesma transação. A função antiga de ausência automática por passagem da data planejada é mantida apenas por compatibilidade e passa a não encerrar ocorrências com base somente nessa data.

## Observação de teste

Para testar o novo fluxo, a migration nova precisa ser aplicada no ambiente Supabase usado pelo teste.
