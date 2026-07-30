# Versão 1.0.118 — Correção do fluxo de horários de acompanhamento

- O portal passa a validar horários por paciente, ocorrência, médico e data planejada.
- Diferenças históricas de nomenclatura da especialidade não descartam mais vagas válidas.
- A especialidade exibida e salva na consulta vem do acompanhamento do paciente.
- A publicação atualiza as ocorrências compatíveis para `Horários disponíveis`.
- A publicação passa a confirmar os slots retornados pelo Supabase.
- Mantidos os limites de consulta e a janela de confirmação de 24 horas.
