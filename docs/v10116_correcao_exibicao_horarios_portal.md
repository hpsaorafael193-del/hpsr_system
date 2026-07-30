# v1.0.116 — Correção da exibição de horários no Portal do Paciente

- Removido o pré-filtro rígido de horários por `doctor_id` antes do cruzamento com o acompanhamento.
- Mantida a validação segura pelo médico do plano, nome normalizado, especialidade e data planejada.
- Recuperação de sequências antigas agora também reconhece o médico pelo nome quando o identificador legado divergir.
- Mantidos limites de 250 horários, 80 sequências e 40 ocorrências para evitar leituras excessivas no Supabase.
- Adicionado diagnóstico simples no estado vazio do Portal do Paciente.
