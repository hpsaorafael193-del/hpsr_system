# v0.5.17 — Promoção persistente e reinício contratual

Diagnóstico realizado diretamente sobre a versão 0.5.16.

- O botão de promoção do alerta contratual atualizava apenas o estado visual e não chamava o Supabase.
- A função administrativa existente tratava conflito somente pelo ID do registro funcional.
- Quando o mesmo passaporte já existia em `team_members` com outro ID, a função tentava inserir uma nova linha e violava `team_members_passport_key`.
- A data do novo contrato não permanecia quando a promoção não era persistida, fazendo a contagem retornar à data original após recarregar.

Correções:

- Todos os fluxos de promoção passam pela operação persistente.
- O registro funcional é localizado por ID ou passaporte e atualizado sem duplicação.
- A promoção de Estagiário de Enfermagem para Residente grava um novo `joinedAt` no fuso de São Paulo.
- O novo contrato recebe duração de 15 dias e status Ativo.
- Os dias do estágio não são reaproveitados na residência.
