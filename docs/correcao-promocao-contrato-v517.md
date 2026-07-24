# v0.5.17 — Promoção persistente e reinício do contrato

- A promoção acionada pelo alerta contratual agora é salva no Supabase antes de atualizar a interface.
- `profiles.role` e `team_members.hospital_role/payload` são atualizados na mesma operação administrativa.
- Ao promover Estagiário de Enfermagem para Residente, o início do contrato é redefinido para a data atual de São Paulo e a duração para 15 dias.
- A contagem usa a data do contrato atual e não a data original de entrada no sistema.
- Alterações de cargo pelo modal administrativo usam a mesma regra.
