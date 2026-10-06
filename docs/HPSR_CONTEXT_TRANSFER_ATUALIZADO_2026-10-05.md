> **ADENDO PRIORITÁRIO — 05/10/2026:** Regra restaurada pelo usuário: HPSR **NUNCA** trabalha com PDF. Qualquer trecho abaixo que admita impressão, download ou armazenamento de PDF é histórico e está revogado. Somente PNG é permitido para geração e download visual. O salvamento no Supabase deve ser independente da prévia/download. A correção da candidata v1.1.11 implantou isso no fluxo Gestacional e FIV, não fez migrations nem alterou produção. A compilação da cópia corrigida não foi validada neste ambiente por falta de Node 24.21.0/pnpm 12.2.0 e dependências; build aprovado pelo usuário anteriormente se refere ao ZIP candidato anterior, não ao pacote corrigido. Veja `docs/HPSR_REGRAS_ATUAIS_2026-10-05.md`.

# HPSR SYSTEM — CONTEXTO COMPLETO PARA CONTINUIDADE EM NOVO CHAT

**Data de consolidação:** 04/10/2026. **Idioma de trabalho:** português brasileiro. **Projeto:** sistema web do Hospital São Rafael (HPSR), utilizado em ambiente de RP. Este arquivo contém especificações e contexto do **projeto do usuário**, não configurações internas do ChatGPT. A decisão mais recente do usuário prevalece sobre documentos antigos e versões rejeitadas.

> **PRIMEIRA INSTRUÇÃO PARA O NOVO CHAT:** Leia este documento, depois as regras originais anexadas, e use como ponto de partida o último ZIP **efetivamente validado**. A versão v1.1.11 existe como pacote em andamento, com testes específicos passando, mas **não foi confirmado o build completo**. Não diga que ela foi entregue/validada antes de conferir. NÃO faça modificações no código ou Supabase apenas porque está lendo este arquivo; aguarde instruções expressas.

## 1. IDENTIDADE, STACK E REPOSITÓRIO

- Nomes permitidos: Hospital São Rafael, HP São Rafael, HPSR e São Rafael. 'HP' significa Hospital. Linguagem clínica e institucional dentro da aplicação; não usar 'jogador', 'fora do RP', etc. em textos de UI.
- Next.js 14.2.23 (App Router), React 18.3.1, TypeScript, Tailwind CSS 3.4.17, Supabase Auth/Postgres/Storage/RLS, Vercel e Resend.
- Repositório informado: https://github.com/hpsaorafael193-del/hpsr_system ; domínio informado: https://www.hpn-saorafael.com.br . Caminho local do usuário, Windows: `D:\Games\RP\HP São Rafael\Projeto Site\hpsr_system-main` (pode ter mudado; confirmar se necessário).
- Supabase projeto ID: `preptbfrkvzvjizhfrns`. **O ID não é um segredo; nunca inserir nem expor chaves/tokens privados.** Conferir produção antes de toda migration. Se o conector Supabase não estiver disponível no chat novo, solicitar reconexão ou usar os arquivos exportados, jamais inventar estado live.
- Variáveis de ambiente **somente pelos nomes**, sem valores: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `PATIENT_PORTAL_CODE_SECRET`. `.env*` jamais deve ir no ZIP.
- Ferramentas para build: Node **24.21.0 Linux x64**, pnpm **12.2.0**. O pacote v1.1.11 declara `packageManager: pnpm@12.2.0` e `engines.node: 24.x`. A base v1.1.10 ainda declara pnpm 10.13.1 (decisão recente: alinhar para 12.2.0).
- Arquivos de instalação do ambiente recebidos neste chat: `node-v24.21.0-linux-x64.tar.xz`, `pnpm-12.2.0.tgz`, `pnpm-exe.linux-x64-12.2.0.tgz`, script `use-hpsr-toolchain.sh`. Em um ambiente novo, esses arquivos **precisam ser anexados/reinstalados**; não presumir persistência dos binários.
- Comandos preferenciais: `pnpm install`, `pnpm run typecheck`, `pnpm run build`; testes existentes em `tests/*.mjs` (ver ZIP). Build/checagens só podem ser declarados como aprovados se executados de verdade. Em 04/10, a instalação estava bloqueada por dependências ausentes no cache e falta de acesso ao registro; os testes `.mjs` da v1.1.11 passaram, mas isso não equivale a build.

## 2. REGRAS PRIORITÁRIAS DO USUÁRIO (INVIOLÁVEIS)

1. **Preservar o que funciona.** Mudar exclusivamente o que o usuário solicita, com mínimo impacto; investigar a causa antes de modificar. Ordem: reutilizar → adaptar → expandir → criar somente se indispensável. Não inventar funções, cargos, especialidades, botões, regras clínicas, tabelas ou redesenhos não autorizados.
2. **Analisar não é implementar.** 'Vamos elaborar', 'verifique', 'analise' e 'o que propõe' autorizam investigação/discussão, não alterações em código ou produção. 'Faça', 'implemente', 'aplique' autorizam executar somente o escopo combinado. Alterações novas precisam de nova autorização. Não transformar proposta em pacote por iniciativa própria.
3. **Decisão mais recente vence.** Não aplicar cegamente regras de documentos antigos quando decisões de setembro/outubro de 2026 as substituíram.
4. **Entregar a cada mudança um ZIP completo** `HPSR_System_vX.Y.Z.zip`, com pasta `hpsr_system/` na raiz, `package.json` e Sobre o sistema atualizados, migrations locais correspondentes e apenas arquivos necessários. Não adicionar sufixos ao nome. Remover `node_modules`, `.next`, `.git`, `.env*`, segredos, caches, logs e artefatos temporários. Validar estrutura e integridade ZIP. Sempre fornecer link real de arquivo criado/verificado; quando aplicável, colocar na Biblioteca do usuário.
5. **Supabase é a fonte oficial.** `localStorage` só para cache/preferências/sincronização entre abas/e-mail lembrado, nunca como registro clínico principal. Reutilizar tabelas, payloads, RPCs, RLS antes de criar novas. Não editar migration já aplicada; gerar migration nova quando necessário. Antes de alterar produção conferir live schema, funções, políticas e dados envolvidos; nunca apagar registros apenas para sanar problema. Testar sem contaminar produção com pacientes fictícios. Fazer auditoria e backups/rollback quando houver risco destrutivo. Preservar histórico e versões liberadas.
6. **Permissões tanto no backend quanto na UI.** Paciente nunca edita prontuário, exame, vacinação, planejamento, evolução ou observações; só visualiza conteúdo que o médico explicitamente liberou. Liberação por consulta e liberação integral **independentes**. Rascunhos internos jamais saem na API do Portal. Administração não equivale automaticamente a permissão clínica de todas as especialidades.
7. **Não gerar imagens durante implementação**, salvo pedido explícito de criação/edição. Os modelos oficiais e a logo devem vir dos arquivos do usuário/ativos do projeto, nunca ser redesenhados por IA. Capturas servem como referência visual para corrigir código.
8. **Identidade visual institucional:** creme/bege/areia, marrom escuro, vinho suave/rosé discreto; Obstetra rosa sutil, Vacinação verde-água `#83CFC1` só em detalhes, não em grandes superfícies. Pouco branco fora de folhas reais de laudos; sem modo escuro. Layout compacto, confortável, responsivo e sem vazios, scrolls involuntários ou overflow. Preservar logo oficial.
9. Não exagerar cronogramas, prometer trabalho em segundo plano ou afirmar testes, migrations ou entregas não verificados. Dar atualizações de progresso durante tarefas longas e entregar o resultado efetivo ou admitir o bloqueio.

## 3. VERSIONAMENTO E ESTADO ATUAL

- **v1.1.10:** última versão que o usuário confirmou funcionar no seu próprio computador; corrigiu erro de build da v1.1.9 em `src/lib/vaccination.ts` (comparação `group === 'crianca'` impossível após retornos antecipados). Houve confirmação explícita do usuário: 'Aí, foi, resolveu'. Versão de referência **validada pelo usuário**.
- **v1.1.11:** implementação autorizada e em andamento no momento da transferência: reformulação do acompanhamento Gestacional e FIV no Portal do Paciente. Já existe um ZIP `/mnt/data/HPSR_System_v1.1.11.zip` neste ambiente, com `package.version=1.1.11` e pnpm 12.2.0. Código e testes específicos disponíveis em `/mnt/data/hpsr_1111_work/hpsr_system/`. Arquivo do teste `portal-v1111-followup.mjs.log`: PASS para apresentação de consulta completa, resumos, snapshots privados, liberação, sintaxe e pnpm 12. Os demais testes disponíveis passaram. **NÃO foi validado o build completo**: `npm` falhou `ENOTCACHED` para `yocto-queue@0.1.0`, e pnpm tentou resolver `pnpm@12.2.0` no espelho/cache, sem sucesso. O usuário interrompeu para solicitar a transferência do contexto; verificar e concluir antes de anunciar v1.1.11 como entregue.
- A v1.1.11 **não deve** alterar outras áreas além do Portal e do alinhamento do gerenciador de pacotes; **não é a versão das cadernetas dinâmicas**. Confirmar integridade e testes, executar build se houver dependências, ajustar se encontrar falhas e entregar o ZIP completo.
- **v1.1.12 (planejada, NÃO autorizada ainda):** cadernetas de vacinação dinâmicas.
- **v1.1.13 (planejada):** exames, laudos e documentos dinâmicos, com revisão visual de Documentos se ainda pendente.
- **v1.1.14 (planejada):** otimização Supabase/Vercel, consumo, segurança e estabilidade.
- Dashboard principal: ideia antiga, adiada pelo usuário; **não priorizar**. Integração extra com Agendamento: também adiada; preservar operação atual.

## 4. HISTÓRICO RESUMIDO DAS ALTERAÇÕES IMPLEMENTADAS (CONFORME RELATOS ANTERIORES)

| Versão | Entrega / observações |
|---|---|
| v1.1.1 | Capacidade clínica corrigida: conta pacientes únicos por vínculo ativo `patient_doctor_links`, não quantidade de consultas/planos. Trigger bloqueia excesso. Vínculo encerrado libera vaga. |
| v1.1.2 | Cadastro de equipe para quem já é paciente usando a mesma identidade autenticada; perfil profissional distinto em `profiles`, vínculo paciente em `patient_accounts`, pedido à Direção; não duplicar Auth com mesmo e-mail. |
| v1.1.3 | Reorganização visual dos cartões da aba Vacinação; modelos ainda parcialmente antigos naquele momento. |
| v1.1.4 | Modelos-base Gestacional (8 consultas; parto só referência) e FIV (5 etapas; datas manuais); relatório pós-consulta, campos compartilháveis/privados; datas e estilo Obstetra. Coluna direita inicialmente errada. |
| v1.1.5/v1.1.6 | Correção final layout Obstetra: **esquerda altura natural e SEM barra de rolagem; direita mesma altura, COM rolagem interna somente nela**, sem expandir colunas; campos em tons de bege, cabeçalhos alinhados. |
| v1.1.7 | Cinco modelos visuais: infantil duas páginas, adulto masculino, adulta feminina, idoso. Infantil: UM registro e UM carimbo por faixa etária, sem dose individual ou aplicação parcial; 2 anos nas duas páginas, carimbo na primeira. COVID-19 removida dos novos modelos do RP; dados históricos preservados. |
| v1.1.8 | Vacinação gestacional removida do menu comum e transferida para Obstetra; independente de planejamento ativo; somente especialistas aprovados de Obstetrícia/Ginecologia; proteção real por trigger/RLS; registros anteriores preservados. |
| v1.1.9 | Planejamentos Gestacional e FIV dinâmicos, sem PNG permanente a cada edição; Portal lê somente dados liberados, snapshots/histórico, PNG sob demanda e impressão do navegador em PDF, compatibilidade com PNG antigo. |
| v1.1.10 | Correção de typecheck/build reportada acima. |
| v1.1.11 | **EM VALIDAÇÃO / NÃO ANUNCIADA COMO ENTREGA**, ver seção 3. |

## 5. MODELAGEM SUPABASE E PERMISSÕES IMPORTANTES

- Supabase projeto `preptbfrkvzvjizhfrns`. Principais estruturas: `auth.users`, `public.profiles` (profissional), `public.patient_accounts` (login paciente), `public.patient_registry` (cadastro oficial institucional por passaporte), `public.staff_applications` (formulário contratação), `public.staff_registration_requests` (solicitação de acesso profissional), `public.patient_doctor_links` e histórico, `public.clinical_appointment_slots`, `public.clinical_availability_series`, `public.clinical_records` (tipos `Vacina`, `CadernetaVacinal`, outros), `public.clinical_followup_plans` e `public.clinical_followup_occurrences`. Bucket `vaccination-cards` e demais buckets existentes devem ser preservados.
- Na auditoria pré-v1.1.7 havia dois registros `CadernetaVacinal` (uma infantil privada, uma masculina liberada), dois `Vacina` (gestacional liberado, masculino privado) e quatro arquivos no bucket `vaccination-cards`. **São contagens históricas; consultar produção novamente, não presumir que continuam iguais**.
- `clinical_followup_occurrences.followup_report jsonb default {}` incluído na v1.1.4, para relatório pós-consulta. Existem também `planned_text`, `evolution_text`, `conduct_text`, `medical_observation_text`, `individual_released_snapshot`, `individual_released_at`, campos de versões e caminhos legados.
- Planos possuem `planning_released_snapshot`, `portal_released_at`, versões e caminhos legados. Ausência de PNG novo não significa deixar de salvar dados no Supabase. Arquivos verdadeiros (ultrassom, assinatura, scan, anexo) permanecem no Storage.
- Capacidade clínica: `public.hpsr_clinical_capacity(doctor_id,specialty)` usa vínculos ativos exclusivos. Não alterar sem novo pedido.
- Regra de especialidade: somente perfis aprovados com especialidade real Obstetrícia/Ginecologia podem operar vacinação gestacional; ter cargo Diretor/Dev não concede especialidade clínica por si só.
- Paciente usa Portal; profissional usa login médico. Uma identidade Auth pode ter `patient_accounts` e `profiles`, mas as rotas controlam o contexto. Autorização do perfil profissional sempre por aprovação da Direção, não automática após preencher formulário.
- Crianças/responsáveis: responsável pode ter conta sem ser paciente, registrar criança; equipe/Interno valida vínculo, autorização individual por responsável; apenas médicos editam dados clínicos. 'Minhas crianças' permite trocar prontuário, agenda e documentos conforme vínculo. Cadastro infantil mínimo passaporte, nome e idade; criança pode ter vários responsáveis autorizados. Direção controla aprovações; Vice-diretor/Dev faz conferência administrativa.

## 6. OBSTETRA: PLANEJAMENTOS GESTACIONAL E FIV

- Conteúdo de referência fornecido pelo usuário em imagens `Plano Gestacional - RASCUNHO(7).png` e `Plano FIV - RASCUNHO(8).png`. Não inventar textos se imagens/ativos faltarem; pedir anexos no novo chat se necessário.
- Gestacional: oito consultas com procedimentos, exames e orientações pré-preenchidos, começando nas 12 semanas. Data inicial determina cronograma; semanas originalmente programadas às quartas. Parto é referência final, não gera nona consulta nem agendamento. Médico pode personalizar textos e datas, inclusive fazer cronograma próprio; alteração da data inicial não apaga silenciosamente dados já personalizados.
- FIV: cinco etapas iniciais, com β-hCG positivo como referência final; **sem regra semanal**, médica determina datas/intervalos. β-hCG não gera consulta automática.
- Todos os conteúdos são editáveis exclusivamente pela médica/do médico autorizado. Paciente nunca edita. Liberação do plano integral e de cada consulta/etapa são independentes. Atualização do planejado deve refletir o autorizado no Portal sem liberar rascunhos.
- **Relatório preenchido SOMENTE DEPOIS da consulta RP**, para não exigir alternância entre RP e site durante atendimento. Separar o PLANEJADO do REALIZADO. Médico registra resumo do atendimento, procedimentos realizados, exames realizados e resultados/resumos, explicações, condutas, orientações, observações para o paciente; rascunho/observações internas estritamente privados. Quando o médico liberar consulta, paciente vê o conjunto autorizado daquela consulta. Relatório não pode ser gerado como se exame programado estivesse realizado.
- Layout final v1.1.6: esquerda (= dados/definição médica) sem scroll e altura natural, direita (= conteúdo integral/lista de consultas) exatamente a mesma altura com scroll próprio **apenas na direita**. Mesmos cabeçalhos/identidade visual; campos não predominantemente brancos, tons creme/bege.

## 7. PORTAL DO PACIENTE — OBJETIVO DA v1.1.11

- Não mostrar apenas planejamento cru, um PNG ou a lista de etapas. Organizar acompanhamento Gestacional e FIV em **visão geral e consultas/etapas expansíveis**, cada uma com planejamento autorizado, **relatório pós-consulta**, exames realizados e **resumo dos resultados**, explicações médicas, observações compartilháveis, orientações e retorno/conduta, quando fornecidos. Não inventar resultados clínicos nem criar campos com conteúdo inexistente.
- Mostrar somente consultas explicitamente liberadas. Planejamento integral tem liberação própria e não libera por tabela consultas privadas. Não trazer campos do plano em edição para compor dados liberados; usar exclusivamente snapshots/representações publicadas autorizadas. Rascunhos e observações internas NUNCA na API ou payload do navegador do paciente.
- Médico pode atualizar conteúdo já liberado quando salva; página aberta do paciente pode refletir alterações conforme lógica dinâmica implementada, mantendo cópia/histórico da versão anterior quando cabível. Atualizações não significam perda de registros históricos.
- O paciente consulta/baixa em PNG os documentos liberados, nunca edita dados médicos. O responsável acessa somente prontuários de crianças com vínculo aprovado.
- O código da v1.1.11 supostamente contém essas seções, e `tests/portal-v1111-followup.mjs` passou; conferir no navegador e build, não tomar testes estáticos como validação visual.

## 8. VACINAÇÃO

- Aba Vacinação comum: **Infantil, Adulto masculino, Adulta feminina e Idoso**. Gestacional exclusivamente na Obstetra. UI bege/areia/marrom, detalhes verde-água discretos `#83CFC1`.
- Cinco artes de referência: duas páginas infantil (nascimento–2 anos; 2–12 anos), adulto masc., adulta fem., idoso, SEM LOGO inventada. Modelos devem preservar arquivo original visual aprovado com correção dos conteúdos. COVID-19 omitida de todos os novos modelos do RP (não excluir doses passadas). Influenza anual; em adultos três espaços anuais no modelo, não descrever clinicamente como série primária de três doses. Vacinas condicionais (risco) não devem virar rotina universal.
- Infantil: UMA caderneta de duas páginas; por bloco etário UM registro e UM carimbo para TODAS as vacinas da etapa. **NÃO criar interface de aplicação individual/dose parcial**. Um registro de 2 anos entre páginas; carimbo somente na primeira. Sem múltiplos mini-carimbos ou datas em branco no modelo visual. Na segunda página, faixas 9–12 anos em quatro colunas proporcionais; três linhas de observações no rodapé. Revisar conteúdo contra as referências atuais e decisões RP antes de alterar visual.
- Registro clínico e carimbos associados ao paciente/profissional, com histórico, liberação controlada; versões antigas preservadas. A migração v1.1.7 criou índice exclusivo dos novos registros infantis por etapa, não altera legado.
- Na Obstetra, vacinação gestacional pode existir SEM plano gestacional ativo; acessível por médicos aprovados de Obstetrícia/Ginecologia, protegida também em SQL/RLS. A caderneta gestacional do acervo atual incluía Hepatite B, dT, dTpa, Influenza; Portal mostra documento liberado em Prontuário/Documentos.
- Próxima etapa planejada pós-v1.1.11: cadernetas dinâmicas, sem PNG permanente a cada edição, PNG sob demanda, sem PDF, com arquivos antigos mantidos.

## 9. EXAMES, DOCUMENTOS E OUTROS MÓDULOS

- Exames: formulário esquerdo e editor direito com rolagem independente em desktop, editor de altura controlada, catálogo e modelos contextuais, anexos e histórico, folha de laudo branca, prévia sob demanda. Não voltar a layouts rejeitados. Sigilo controla Portal, não impede profissionais internos autorizados de ver exames.
- Documentos: pedido antigo para espelhar Exames com formulário à esquerda, editor à direita, rolagem independente em AMBOS, alturas equilibradas, evitar excesso de branco, cursor do editor não pode saltar para início; **status final de implementação precisa ser auditado**, não presumir pendência nem conclusão só por memória.
- Exames/laudos/outros documentos dinâmicos: pendentes para versão posterior à vacinação dinâmica; guardar dados estruturados e histórico, renderizar visual no site e gerar arquivo só ao baixar. Arquivos reais continuam no Storage.
- Agenda: manter horários publicados, confirmação por dia civil no fuso São Paulo; consulta não é exame, psicotécnico é exame. Não abrir novos trabalhos de integração automática planos/agenda, explicitamente adiado.
- Prontuário: editar só médico; visibilidade paciente depende liberação. Cadastros institucionais unificados por passaporte. Tipo sanguíneo de RP permitido A+, A-, B+, B- (conferir decisões recentes ao alterar campos); contato telefone institucional `(055) 000-000`.
- Diretoria: formulário de contratação 'Aprovado' não equivale a perfil profissional 'Aprovado' em `profiles`. Pedidos de acesso profissional ficam em `staff_registration_requests`. Estagiário de Enfermagem é o cargo básico existente; não inventar Estagiário de Medicina sem ordem. Perfis já aprovados não podem perder status por novo pedido.
- Auditoria de consumo Supabase/Vercel: reduzir polling, chamadas recorrentes, duplicações, armazenamento de imagens. Sem alterar lógica funcionando sem evidência.

## 10. PRÁTICAS DE ENTREGA NO CHAT NOVO

Quando o usuário anexar este arquivo e o ZIP do HPSR:
1. Ler as regras aqui e o documento original de 299 linhas; marcar como históricas as decisões anteriores sobre PDF; a regra atual proíbe PDF, mantendo apenas PNG sob demanda.
2. Confirmar versão pelo `package.json` DENTRO do ZIP e inspecionar código relevante, não presumir que título do arquivo é correto.
3. Se for continuar a v1.1.11, escolher conscientemente: ZIP v1.1.11 em andamento ou base validada v1.1.10, comparando mudanças antes de alterar. Não entregar versão menor por engano.
4. Disponibilizar ambiente Node 24/pnpm 12 com anexos, instalar dependências, rodar `pnpm run typecheck`, `pnpm run build`, testes existentes e testes específicos. Se bloqueado, relatar exatamente por quê; não afirmar build OK.
5. Somente executar migration se houver alteração SQL exigida pelo escopo, após checar Supabase real. Diferenciar 'migration local' de 'migration aplicada em produção'.
6. Entregar ZIP único `HPSR_System_vX.Y.Z.zip` na raiz `hpsr_system/`, notas curtas do que mudou, testes reais, migrações reais e limitações. Nunca compartilhar `.env`, token, senhas ou dumps de pacientes.

## 11. ARQUIVOS PARA TRANSFERIR COM ESTE DOCUMENTO

- **Essencial:** `HPSR_CONTEXTO_COMPLETO_NOVO_CHAT_2026-10-04.md` (este arquivo); `Regras_consolidadas_HPSR_299_linhas.md` (documento original de regras); ZIP da versão desejada (v1.1.10 validada pelo usuário ou v1.1.11 ainda em validação).
- **Complementar:** `Regras_HPSR_contexto_mais_antigo.txt` (histórico antigo, sempre subordinado a este documento e às decisões mais recentes); as cinco artes de vacinação e imagens dos planejamentos (se uma alteração exigir fidelidade visual); pacotes Node 24/pnpm 12/executável Linux se o ambiente não tiver ferramentas; script `use-hpsr-toolchain.sh` para adaptar aos novos caminhos.
- Não copiar arquivos clínicos identificáveis, senhas, chaves privadas ou credenciais para a transferência. Reutilizar o Supabase conectado após autorização e de preferência com a conta/projeto correto.

## 12. PROMPT DE INÍCIO CURTO

> Estamos continuando o HPSR System do Hospital São Rafael. Leia primeiro o arquivo CONTEXTO COMPLETO e as REGRAS CONSOLIDADAS anexas; a decisão mais recente prevalece. Preserve tudo que já funciona e nunca implemente sem minha autorização explícita. A v1.1.10 foi a última confirmada funcionando no meu PC. A v1.1.11, que reforma o acompanhamento Gestacional e FIV no Portal do Paciente com relatórios pós-consulta, exames e observações autorizadas, estava sendo implementada; existe ZIP candidato e testes estáticos passaram, mas o build completo ficou bloqueado por dependências indisponíveis. Confirme os arquivos reais antes de afirmar que a v1.1.11 está pronta. Meu ambiente exige Node 24 e pnpm 12.2.0. Nas próximas versões, sempre gere ZIP completo com hpsr_system/ na raiz, preserve Supabase/histórico/RLS e informe testes, build e migrations reais. Agora aguarde minha próxima instrução.
