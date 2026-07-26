# v0.5.24 — Planejamentos em imagem e acesso por especialidade

## Exportação visual

- Obstetrícia: exporta o planejamento pré-natal em PNG com paciente, passaporte, resumo e etapas restantes.
- Ginecologia: exporta o planejamento de fertilização in vitro em PNG com as cinco etapas, datas e condutas.
- Pediatria: exporta a memória do cálculo de dose em PNG para conferência e orientação.
- A exportação é gerada localmente no navegador e não cria registro institucional automático.
- O botão permanece desabilitado enquanto nenhum paciente estiver selecionado.

## Controle por especialidade

- Obstetras visualizam somente o módulo obstétrico.
- Ginecologistas visualizam somente o módulo ginecológico.
- Pediatras visualizam somente o módulo pediátrico.
- Profissionais sem especialidade compatível recebem uma tela institucional informativa, sem acesso ao conteúdo clínico dos módulos.
- Desenvolvedores mantêm acesso total e o simulador de especialização para testes.
- A simulação não altera cargo, especialidade ou permissões no Supabase.
