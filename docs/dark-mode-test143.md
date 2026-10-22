# Modo escuro — alterações na base 143

Implementado no código local, sem publicação e sem alteração da versão.

- Preferência claro/escuro no menu do perfil, ao lado de Ver perfil completo; quebra em duas linhas em telas estreitas.
- Menu pessoal com cabeçalho mais espaçoso, cantos suaves, sombra discreta e rolagem quando necessário. Mantidas as ações existentes de ponto, notificações e saída.
- Inicialização do tema antes da primeira pintura; preferência no navegador, sincronização entre guias e tolerância a armazenamento bloqueado. Nenhuma consulta ao banco.
- Paleta nativa de preto quente, marrom discreto e cobre. Sem extensão, filtros de inversão ou varredura do DOM em tempo de execução.
- O gerador compila regras de cor da interface existente para uma camada escura; mantém geometrias e exclui .hpsr-render-page e data-hpsr-document. Novas telas com cores especiais podem exigir ajustes semânticos próprios.
- theme.css contém ajustes finais de paleta, controles, cursor, seleção e menu. dark-generated.css é gerado; alterar o gerador ou theme.css, não o arquivo gerado.
- prebuild e predev regeneram a paleta. Também disponível npm run theme:generate.

Verificação: build Next.js de produção e TypeScript aprovados; node tests/theme-test143.cjs aprovado (preferência inicial, armazenamento negado, regras restritas a cores e proteção das folhas, controle do perfil e versão).

Limitação: a revisão visual de todas as abas em navegador e a comparação real de PNGs ainda precisam ser realizadas. O navegador automatizado não estava instalado e seu download não foi concluído neste ambiente. A exclusão CSS foi validada estruturalmente, não por comparação de pixels. As cadernetas são desenhadas em canvas com cores explícitas; esse renderizador não foi modificado.

Entrega de desenvolvimento: patch aplicado sobre HPSR_System_v1.1.16-test.143.zip (arquivo salvo em 21/10/2026). Na pasta hpsr_system dessa mesma base, aplicar com git apply HPSR_Modo_Dark_test143.patch; rodar npm run theme:generate, npm run typecheck e npm run build. Não usar outra base sem revisar conflitos. Esta entrega não inclui nem substitui as otimizações de salvamento ainda pendentes de recuperação.

## Revisão de cores após teste do usuário

- Retirados degradês decorativos do tema escuro e fundos em vinho convertidos em preto quente. Gráficos com gradientes informativos em estilo inline mantêm suas cores.
- Adicionadas adaptações às folhas CSS Modules (relatórios, guia farmacêutico, perfil, capacidade e consultas do planejamento), que não estavam cobertas pelo primeiro gerador.
- Preservadas bordas saturadas de status; cartões de gesso receberam identificação explícita de estado e bordas/faixas verde, amarelo, vermelho e cinza.
- O ponto de notificação do agendamento permanece vermelho.
- Contornos de botões reforçados. Categorias do guia mantêm cores próprias em tons escuros; fundos do guia passam a seguir a paleta quase preta.
- Os testes de regressão incluem fundos sem degradês, bordas semânticas, cobertura dos módulos e ponto vermelho. Revisão interativa no navegador continua pendente.

## Equilíbrio do castanho

Restauradas exceções explícitas de identidade no modo escuro: menu lateral com degradê castanho moderado, degradê original sobre a imagem do hospital na página inicial, ícones e botões primários castanhos. Painéis de trabalho, campos, relatórios e guia conservam a separação escura. Permanecem as cores dos estados dos gessos e da notificação. Não houve mudança da versão nem inclusão das otimizações reservadas à 144.

## Preservação do acabamento visual

A revisão mais recente substitui a remoção generalizada de degradês: o gerador conserva suas funções, direções, paradas e transparências, adaptando somente as cores. Sombras, medidas e estados permanecem. Cores escuras ganham níveis diferentes para manter profundidade. Foi retirado o reforço global de bordas dos botões; contornos decorativos ficaram discretos, sem afetar a identificação das cores dos gessos, a notificação vermelha ou o foco de teclado. O degradê original da imagem do hospital continua protegido.
