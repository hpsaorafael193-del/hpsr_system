# REGRA ATUAL — HPSR SYSTEM — 05/10/2026

**Prioridade:** este documento substitui qualquer orientação histórica divergente, inclusive a autorização de impressão ou salvamento em PDF mencionada nos documentos de v1.1.9 e v1.1.11 anteriores.

1. **O sistema não trabalha com PDF.** Nenhum novo gerador, botão, download, impressão direcionada, endpoint nem exportação de PDF será implementado. O formato visual de geração e download dos documentos HPSR é **PNG**. Preservar arquivos históricos e dados existentes sem conversão destrutiva.
2. **Salvar e baixar são ações independentes.** Planejamentos integrais, consultas individuais, laudos e cadernetas devem salvar dados estruturados no Supabase sem exigir geração/prévia/upload/download de PNG. Visualização no sistema e download PNG são opções separadas. Não criar PNG permanente a cada edição.
3. **Liberação médica independente por escopo.** Plano integral e cada consulta/FIV individual devem manter seus próprios snapshots publicados; rascunhos médicos, anotações internas e relatórios não liberados jamais chegam ao paciente.
4. **Referências:** Gestacional tem exatamente oito consultas de referência e a previsão de parto no final, fora da contagem e sem agendamento. O modelo FIV contém cinco etapas e a previsão do β-hCG, sem regra semanal. Os registros históricos divergentes não podem ser apagados automaticamente.
5. **Preservação e validação:** não declarar gravação ou liberação bem-sucedida antes de confirmar a linha persistida no Supabase; em falha parcial, informar estado e permitir recuperação sem criar registros duplicados. Jamais automatizar exclusão de consultas clínicas ou histórico liberado.
6. Esta regra vale para todos os módulos e prevalece sobre qualquer regra anterior que mencione PDF. Identificadores e metadados legados de modelos que contenham a palavra PDF não autorizam reativar geração ou exportação. Modernização do catálogo de Exames permanece reservada à rodada própria, sem modificar exames existentes nesta rodada corretiva.

**Esta rodada v1.1.11:** mudança de aplicação somente em Gestacional e FIV; outras áreas e anexos históricos foram preservados. Não houve mudanças SQL nem alteração de produção.
