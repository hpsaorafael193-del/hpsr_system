# Auditoria de desempenho — HPSR System 0.5.08

## Escopo

Auditoria estática do código React/Next.js, integrações Supabase, temporizadores, eventos globais, carregamento de dados e configuração de empacotamento. Nenhuma funcionalidade, regra institucional, tela, campo ou fluxo foi removido.

## Otimizações aplicadas

1. **Cliente Supabase único por aba**
   - A criação do cliente do navegador foi centralizada em uma instância reutilizável.
   - Evita reconstrução repetida de estruturas internas, autenticação e canais em chamadas sucessivas.

2. **Deduplicação da sincronização de pacientes**
   - Solicitações simultâneas de atualização de `patient_registry` agora compartilham a mesma Promise.
   - Evita consultas repetidas quando Realtime, eventos entre abas e salvamentos acontecem próximos.

3. **Contador do ponto suspenso em aba oculta**
   - O contador visual continua preciso, mas deixa de atualizar o React a cada segundo quando a aba não está visível.
   - Ao retornar à aba, o valor é recalculado pelo horário persistido em memória.

4. **Listeners do menu ativados somente quando necessário**
   - Os eventos globais de clique externo e tecla Escape existem apenas enquanto o menu do usuário está aberto.

5. **Otimização de importações do Lucide**
   - Configurado `optimizePackageImports` para reduzir o custo de empacotamento e carregamento dos ícones sem alterar os componentes.

## Pontos auditados e preservados

- Realtime do cadastro institucional de pacientes.
- Carregamento sob demanda de registros clínicos e documentos.
- Autosave dos editores.
- Atualizações por visibilidade no Portal do Paciente.
- Regras do controle de ponto e cálculo oficial no Supabase.
- Consultas, limites e seleções explícitas já aplicados às rotas.
- Interface, rotas, permissões, RLS e estrutura do banco.

## Recomendações futuras que exigem medição em ambiente implantado

- Medir Web Vitals e duração das consultas por módulo.
- Conferir índices do Supabase com `EXPLAIN ANALYZE` nas tabelas de maior volume.
- Avaliar divisão adicional dos maiores componentes somente após testes de regressão visual e funcional.
- Avaliar paginação progressiva em listas que ultrapassem o volume operacional atual.

Esses itens não foram aplicados nesta versão porque dependeriam de métricas reais, banco conectado ou alterações estruturais com maior risco de regressão.
