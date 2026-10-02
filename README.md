# HPSR System v1.1.0 — Marco de consolidação

Versão oficializada após compilação bem-sucedida da v1.0.467, com atualização do modal público **Sobre a plataforma**: apresentação institucional, desenvolvimento, tecnologias e versão. Nenhuma mudança funcional ou migration nesta edição. As migrations da aba Interno (v1.0.457), da segurança do Portal (v1.0.463) e da candidatura (v1.0.464) já foram aplicadas no Supabase.

---

## v1.0.464 — Correção do formulário de candidatura

- Permite envio da ficha pública por visitantes e pacientes autenticados, sem permitir consulta/edição direta das candidaturas.
- Validação dos campos essenciais antes do envio e recuperação de protocolo/token em caso de erro de rede após gravação.
- Migration: `supabase/migrations/20261002053000_public_staff_application_authenticated_insert.sql`.
- A função existente `consult_staff_application` continua responsável pela consulta individual protegida pelo passaporte e token.

# Histórico — v1.0.463 (auditoria e responsividade)

A auditoria de regressão e o relatório de pendências estão em `docs/1.0.463-auditoria-regressao-responsividade.md`. A migration **da v1.0.457 já foi executada manualmente no Supabase e seus objetos foram confirmados** (pode não constar no histórico da ferramenta). A migration de **segurança da v1.0.463, pendente na entrega original, foi aplicada posteriormente e confirmada no Supabase**. Os registros clínicos existentes não foram modificados. A simulação do Portal passou; build e testes visuais no site ainda dependem do ambiente com Node 24 e dependências completas.

---

> **v1.0.458** — Reformulação funcional do Portal do Paciente: seletor flutuante de mini perfis, abas por vínculo, vacinação infantil separada e central de notificações. Consulte `docs/1.0.458-portal-perfis-notificacoes.md`. A migration da v1.0.457 foi aplicada posteriormente.

# HPSR System v1.0.457

Implementação da Vacinação com os quatro modelos de cadernetas oficiais enviados (infantil, adulto, adulta, idoso); mantido o modelo Gestante existente. Registro endereçado por vacina e dose, carimbos amplos e proporcionalmente legíveis, prévia com zoom, histórico e rascunho/versão publicada separados. A interface utiliza creme/bege/marrom com pequenos destaques verde-água, conforme o padrão da Obstetra.

**Histórico de implantação v1.0.457:** a migration `supabase/migrations/20261002013000_internal_center_exclusive_roles.sql`, pendente na entrega original, foi aplicada posteriormente ao Supabase; não é necessário reaplicá-la. Não cria tabelas. As migrations do Cadastro Infantil v1.0.456 e da Vacinação v1.0.452 já foram aplicadas anteriormente em produção.

Detalhes atuais: `docs/1.0.456-cadastro-infantil-responsaveis.md`. Histórico anterior: `docs/1.0.455-otimizacao-recorrencia.md`. Histórico anterior: `docs/1.0.454-selecao-medico-simples.md`. Histórico anterior: `docs/1.0.453-ajuste-formulario-carimbos-vacinacao.md`; `docs/1.0.452-caderneta-clinical-records-carimbos.md`. A documentação da v1.0.451 é histórica e foi substituída neste ponto.


### v1.0.457 — Interno centralizado (migration aplicada posteriormente)
Nova aba Interno entre Direção e Relatório, visível somente para as contas da Diretora e do Vice-Diretor / Dev. Reutiliza as estruturas atuais para validação de vínculos, consulta e correção de nome/idade com justificativa, registro/resolução de ocorrências e histórico administrativo. Proteção do cargo Diretora vinculada à identidade exclusiva existente, conservando a proteção do cargo Vice-Diretor / Dev. A migration foi aplicada posteriormente; nenhuma nova tabela criada. Ver `docs/1.0.457-central-interno.md`.

### v1.0.456 — cadastro infantil pelos responsáveis (migration aplicada)
Contas de responsáveis independentes de prontuário, cadastro da criança pelo passaporte do RP e idade em meses ou anos, segundo responsável opcional, aprovação exclusiva da Direção e preservação dos prontuários/vínculos anteriores. A identificação dos responsáveis passa a incluir `auth.users.id`, mantendo o passaporte próprio quando houver. Sem geração de contas infantis, sem novas tabelas e sem comunicação interna entre pacientes e médicos. Ver `docs/1.0.456-cadastro-infantil-responsaveis.md`.

### v1.0.455 — otimização de recursos recorrentes (sem mudança de banco)
Consulta da fila clínica compartilhada entre o indicador lateral da agenda e o sino, evitando chamadas paralelas duplicadas; assinatura Realtime de appointments centralizada no layout. Notificações preservadas em tempo real, com coalescência de eventos e consulta periódica de segurança reduzida para 120s apenas enquanto a aba está visível. Portal do Paciente evita recarregamentos simultâneos/repetidos de acompanhamentos e registros quando a janela recupera o foco; atualização manual continua forçando nova consulta. Nenhum PNG, formulário clínico, tabela, policy, função SQL ou registro de produção modificado. Ver `docs/1.0.455-otimizacao-recorrencia.md`.

### v1.0.454 — médico simplificado no formulário de Vacinação
O campo Médico responsável exibe apenas o nome. CRM e assinatura continuam recuperados do perfil médico para registro e carimbo, sem etapas extras ou exposição no seletor. Aviso do formulário simplificado. Sem mudanças de banco, de outras telas ou dos quatro modelos oficiais.

### v1.0.453 — interface e carimbos da Vacinação
Campo de responsável infantil removido da edição/geração; os vínculos autorizados do Portal permanecem intactos. Lote interno gerado automaticamente, exibido apenas no histórico; carimbo oficial ampliado e simplificado para hospital, data, médico e CRM. Formulário organizado em etapas simples, com assinatura verde-água discreta seguindo a Obstetra. Quatro PNGs oficiais preservados. Sem alterações de banco ou APIs.

### v1.0.452 — Vacinação sem tabela adicional
A caderneta agora utiliza `clinical_records` (registros `CadernetaVacinal`); aplicar somente `supabase/migrations/20261001190000_vaccination_existing_clinical_records.sql`. Confira `docs/1.0.452-caderneta-clinical-records-carimbos.md`.
