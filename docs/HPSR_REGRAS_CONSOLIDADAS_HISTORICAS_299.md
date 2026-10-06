# Regras consolidadas do HPSR System

Reuni as regras de desenvolvimento, funcionamento e aparência que estabelecemos para o Hospital São Rafael, incluindo as decisões mais recentes sobre Exames, Documentos, Agendamento e Direção.

A regra principal é que a decisão mais recente prevalece sobre uma orientação antiga. Por exemplo, o layout atual de Exames substitui as tentativas anteriores que você rejeitou. Da mesma forma, os documentos antigos do projeto servem como referência estrutural, mas não fazem a versão voltar para a 1.0.284.&#x20;

HPSR_CONTEXTO_MESTRE_NOVO_AMBIENTE_v1.0.284(1).md



A última versão que entreguei foi a 1.0.395. Os pedidos mais recentes sobre o visual de Documentos e as barras de rolagem estão registrados abaixo, mas não vou afirmar que foram implementados, porque não houve uma nova entrega confirmada depois deles.

## 1. Regra principal: não mudar o que você não pediu

Esta é a regra que deve orientar todas as próximas alterações.

- Reutilizar → adaptar → expandir → criar somente quando necessário.
- Antes de alterar um módulo, conferir como ele realmente funciona, quais componentes utiliza e de onde vêm os dados.
- Não reconstruir páginas ou fluxos inteiros quando o pedido é uma correção localizada.
- Não alterar aparência, campos, permissões, textos ou comportamentos que não façam parte da solicitação.
- Não criar botões, opções, regras clínicas, especialidades, tabelas ou funcionalidades por iniciativa própria.
- Preservar tudo que já está funcionando, inclusive compatibilidade com registros antigos.
- Quando você pedir para voltar a uma versão ou aparência anterior, recuperar a versão especificada, sem misturar elementos de versões rejeitadas.
- Evitar sucessivas correções improvisadas: investigar a causa antes de mudar o código.

Você reforçou expressamente: não tomar decisões ou liberdades sem seu pedido ou autorização.

## 2. Diferença entre analisar e implementar

Quando você disser “vamos elaborar”, “analise”, “verifique”, “investigue”, “antes de qualquer coisa” ou pedir ideias, a tarefa é discutir, diagnosticar e apresentar a solução. Não devo alterar o código nem o banco nessa etapa.

Quando disser “faça”, “corrija”, “aplique”, “implemente” ou der uma autorização equivalente, devo executar a alteração definida, em vez de ficar apenas prometendo fazê-la.

Se houver uma decisão funcional importante ainda em aberto, não devo inventar a resposta. Isso é especialmente importante em permissões, dados clínicos e alterações destrutivas.

## 3. Versionamento, ZIP e entrega

O padrão atual é:

`HPSR_System_v1.0.396.zip`

Nas versões seguintes, muda somente o número. Não acrescentar “completo”, “otimizado”, “corrigido”, “final” ou outros complementos ao nome.

As demais regras são:

- Toda alteração de código gera uma nova versão.
- Usar a última versão válida como base, salvo quando você pedir outra especificamente.
- Atualizar a versão no `package.json` e na área Sobre o sistema.
- Incluir no pacote as migrations locais correspondentes às alterações de banco.
- Entregar um único ZIP completo, otimizado sem excluir arquivos necessários ao funcionamento.
- O ZIP deve conter a pasta `hpsr_system/` na raiz, e não os arquivos do projeto soltos.
- Excluir `node_modules`, `.next`, `.git`, `.env*`, caches, logs, temporários e arquivos de build desnecessários.
- Nunca incluir chaves privadas ou segredos.
- Validar a integridade do pacote antes de entregar.
- Não afirmar que `pnpm run build`, testes de interface ou verificações TypeScript passaram quando não foram executados.

Como os links de download não funcionaram para você, a forma de entrega combinada passou a ser salvar o arquivo completo na sua Biblioteca do ChatGPT.&#x20;

Texto colado(5).txt



## 4. Supabase, segurança e preservação dos dados

O Supabase é a fonte oficial dos dados institucionais. O navegador não pode ser uma segunda fonte de prontuários, consultas, solicitações ou informações de pacientes.

As regras são:

- Reutilizar tabelas, colunas, funções, views e estruturas existentes antes de criar novas.
- Não criar tabelas paralelas para resolver um problema de interface ou sincronização.
- Não editar migrations já aplicadas. Alterações posteriores exigem uma nova migration.
- Conferir a estrutura e as funções existentes no banco real antes de alterar regras sensíveis.
- Não apagar dados para “limpar” erros ou inconsistências.
- Não criar dados falsos em produção para testar.
- Usar transações reversíveis quando o teste envolver alterações em registros reais.
- Garantir autorização no backend, não apenas escondendo botões no React.
- Preservar RLS, permissões e histórico de auditoria.
- Não permitir que o acesso administrativo a uma informação se transforme automaticamente em autorização clínica para atuar sobre ela.

Para desempenho, preferir carregamento sob demanda, atualizações localizadas e Realtime quando útil. Evitar consultas repetidas, polling desnecessário e recarregar a página inteira a cada alteração.&#x20;

HPSR_CONTEXTO_MESTRE_NOVO_AMBIENTE_v1.0.284(1).md



## 5. Padrão visual geral

O sistema deve ter uma aparência moderna, institucional, organizada e agradável para uso prolongado.

Isso significa:

- Não usar áreas inteiras de uma única cor sem necessidade.
- Equilibrar creme, rosé, vinho/vermelho suave e branco; usar verde de forma discreta em indicadores de estado.
- Preservar boa legibilidade e contraste.
- Aumentar fontes excessivamente pequenas, mas sem deixar os componentes gigantes.
- Evitar cards muito altos, espaços vazios, elementos comprimidos e áreas redundantes.
- Cada informação deve ocupar o espaço necessário, sem cortar outra.
- Botões importantes devem ser fáceis de encontrar.
- Modais e páginas devem ter rolagem previsível, sem fazer a tela inteira crescer por causa de um editor.
- Em telas pequenas, reorganizar as áreas de maneira responsiva.

Não reintroduzir o modo escuro. A identidade visual continua sendo a do Hospital São Rafael.&#x20;

Texto colado(5).txt



## 6. Exames — layout e funcionamento

O padrão atual de Exames é a referência visual para o módulo de Documentos.

Composição desejada no desktop

Formulário

Informações e catálogo

Rolagem própria

Editor

Conteúdo do exame

Rolagem própria

Anexos e histórico organizados abaixo

As regras específicas são:

- Formulário à esquerda e editor à direita no desktop.
- Em telas menores, reorganizar as áreas sem comprimir os campos.
- Rolagem independente tanto no formulário esquerdo quanto no editor.
- Evitar uma terceira rolagem desnecessária que torne a navegação confusa.
- Manter as duas áreas visualmente alinhadas, sem espaço vazio sobrando antes de anexos e histórico.
- Não deixar o editor excessivamente alto.
- Fontes e controles devem ser legíveis, sem aumentar desnecessariamente a altura total da janela.
- Informações do paciente devem ter rótulos claros para nome, passaporte, idade e tipo sanguíneo.
- O catálogo deve ter um botão expansível para selecionar as categorias.
- Manter o botão Usar modelo e o funcionamento dos modelos contextuais.
- Preservar o texto do editor ao navegar pelo catálogo ou trocar a seleção, conforme o comportamento estabelecido.
- Manter pré-visualização sob demanda, anexos, assinatura e histórico.
- Não trazer de volta uma prévia permanente nem os layouts de Exames que já foram rejeitados.
- A folha do laudo deve continuar branca, mesmo quando o restante da interface usa outras cores.

O sigilo de um exame controla sua disponibilidade no Portal do Paciente; ele não deve esconder o registro dos profissionais internos que têm autorização para consultá-lo.

## 7. Documentos — pedidos mais recentes

Você determinou que Documentos deve seguir o mesmo padrão visual atual de Exames.

Depois, fez ajustes importantes à especificação: a primeira adaptação ficou alta demais, o comportamento do scroll não agradou e você pediu explicitamente barras de rolagem nas duas áreas.

Portanto, a regra final para Documentos é:

- Formulário à esquerda e editor à direita.
- Mesmo padrão de cores, campos, cabeçalho, bordas e hierarquia visual de Exames.
- Editor com altura controlada, sem ocupar uma área exagerada.
- Barra de rolagem própria no formulário esquerdo.
- Barra de rolagem própria no editor.
- Rolagem confortável e previsível, sem conflitos com a rolagem da página.
- Fontes legíveis, mas sem aumentar excessivamente os componentes.
- Preservar os documentos, modelos, campos e funcionalidades existentes.

Também permanece a correção solicitada anteriormente para o editor de Documentos: o cursor não deve voltar ao início a cada edição, e os textos dos modelos institucionais não devem ser excessivamente simples.

Situação: considero essa a especificação vigente, mas não há uma entrega posterior à 1.0.395 confirmada nesta conversa para esses últimos ajustes de Documentos.

## 8. Pacientes e cadastros

As informações dos pacientes devem permanecer claras e consistentes em todo o sistema.

- Normalizar nomes próprios, mantendo a primeira letra de cada parte em maiúscula e o restante em minúscula, conforme a regra já implantada.
- Identificar corretamente nome, passaporte, idade e tipo sanguíneo.
- Não confundir passaporte com ID do Discord. Se um passaporte for inserido no campo do Discord, mostrar o aviso adequado.
- Aceitar o contato da cidade quando o campo permitir esse tipo de informação e salvar no local correto.
- Manter o telefone no padrão institucional `(055) 000-000`.
- Evitar cadastros duplicados do mesmo paciente.
- Fazer atualizações do cadastro refletirem nas áreas que utilizam os mesmos dados.

Tipos sanguíneos permitidos no RP: somente A+, A−, B+ e B−. Não oferecer O+, O−, AB+, AB− nem entrada livre em outros campos.

No plano de saúde, a idade não deve ser obrigatória no cadastro quando não for necessária para a modalidade. A estrutura deve respeitar o uso dos planos familiares, sem inventar novas categorias.

## 9. Médicos, especialidades e cargos

- Médicos clínicos possuem Clínico Geral como especialidade padrão.
- Residentes não possuem especialidade própria apenas por serem residentes.
- Quando o profissional adquire uma especialidade além de Clínico Geral, o perfil deve refletir essa condição.
- Diretora e vice-diretores não devem ficar sujeitos ao limite de especialidades aplicado a outros cargos.
- Não alterar o tempo de contrato de um residente ao corrigir apenas seu cargo ou perfil.
- Não duplicar registros da equipe médica em tabelas ou cadastros paralelos.
- A permissão administrativa do vice-diretor/DEV deve continuar preservada.
- Um cargo administrativo não dá automaticamente ao profissional todas as especialidades clínicas.

A seleção de especialidades deve ser organizada e não deve criar combinações implícitas que o perfil não possui.

## 10. Direção — Gerenciar médico e Formulários

A aba Direção foi reorganizada para reduzir botões redundantes.

Gerenciar médico deve abrir diretamente o conteúdo original de Editar médico. Você deixou claro que a mudança era no fluxo, não na aparência nem no funcionamento desse editor. Solicitações de cadastro/acesso e histórico dessas solicitações devem ficar disponíveis dentro do mesmo fluxo, sem uma lista intermediária obrigatória para chegar à edição.

Formulários pendentes é o acesso principal para avaliação de formulários. Dentro dele ficam os pendentes e o histórico. Não deve existir um botão externo separado e redundante para Histórico de formulários.

O modal deve seguir o padrão visual do sistema, mas ajustes de estilo não autorizam substituir seu conteúdo ou criar novas etapas.

## 11. Agendamento e solicitações clínicas

O Agendamento deve organizar consultas e exames de maneira clara, com contadores compatíveis com aquilo que a lista realmente exibe.

As regras de acesso são:

- Médicos: veem as solicitações das especialidades que possuem.
- Diretora e vice-diretores: acompanham solicitações de todas as especialidades, com as próprias especialidades apresentadas primeiro.
- A visão ampla da Direção é para acompanhamento; não permite aceitar atendimentos fora das regras clínicas.
- Solicitações já recusadas por um profissional não devem reaparecer para ele como se estivessem disponíveis para aceite.
- Pedidos sem vaga ou indisponíveis precisam ter o motivo identificado quando forem mostrados para acompanhamento.

A consulta comum, o exame e o acompanhamento devem continuar sendo fluxos distintos. Aceitar uma solicitação não deve criar automaticamente um vínculo administrativo paciente–médico.

O psicotécnico é exame, não consulta. Ele não deve consumir o limite de consultas. Solicitações de exames devem continuar acessíveis aos médicos clínicos conforme a regra específica desse fluxo.

A janela de agendamento baseada em 24 horas é calculada pelo dia civil, não por 24 horas antes do horário publicado: para uma consulta no dia 20, o prazo vai até o dia 19 às 23h59 e fecha no início do dia 20. O fuso de referência é `America/Sao_Paulo`.&#x20;

HPSR_CONTEXTO_MESTRE_NOVO_AMBIENTE_v1.0.284(1).md



## 12. Exclusão de solicitações pela Direção

A diretora e os vice-diretores podem usar o botão Excluir para retirar solicitações pendentes enviadas por engano — por exemplo, quando um paciente já está em atendimento.

Essa ação deve:

- Aparecer somente para a Direção.
- Ter o texto “Excluir”, sem complemento.
- Solicitar confirmação antes de executar.
- Verificar a autorização também no Supabase.
- Não excluir consultas confirmadas nem pedidos já vinculados a horários, acompanhamentos ou registros clínicos.
- Retirar a solicitação da fila pendente, preservando o histórico da operação.

Na implementação mais recente, a remoção foi tratada como arquivamento auditável, e não como eliminação indiscriminada do registro.

O erro de função ausente da 1.0.393 foi corrigido posteriormente. Na 1.0.395, foi acrescentado um índice para evitar o tempo limite na verificação dos registros clínicos vinculados.

## 13. Prontuário, exames clínicos e histórico

- O prontuário precisa reunir corretamente exames, documentos, vacinação e demais registros do paciente.
- Registros não podem desaparecer do prontuário quando estiverem presentes no histórico ou no banco.
- Diferenciar exames pendentes de liberação dos exames já disponíveis para visualização e download.
- Exames gerados para download devem usar o formato de imagem estabelecido, não baixar HTML por engano.
- Não gerar ou exportar PDF no HPSR; quando necessário, utilizar o formato visual já previsto, como PNG.
- A função de recusar consulta ou exame não deve inserir observações desnecessárias no prontuário.
- Exames podem ser relacionados à consulta ativa ou vinculados manualmente à consulta correta, quando aplicável.
- Registros clínicos e vínculos administrativos de agenda são coisas diferentes e não devem ser confundidos.&#x20;

  HPSR_CONTEXTO_MESTRE_NOVO_AMBIENTE_v1.0.284(1).md



## 14. Outros módulos que não podem regredir

As mudanças em Exames, Documentos ou Agendamento não autorizam alterações nos demais módulos. Permanecem as regras estabelecidas para a calculadora, convênios, relatórios, vacinação, ponto eletrônico, recrutamento e Portal do Paciente.

Entre elas estão preservar os valores da calculadora ao trocar de aba; não combinar descontos incompatíveis; organizar relatórios por categorias sem excesso de cards; manter as carteirinhas de vacinação alinhadas aos modelos fornecidos; e não fazer mudanças de um usuário recarregarem a página inteira de outros usuários.

O sistema também não deve confundir solicitação de consulta com consulta confirmada na comunicação com o paciente.&#x20;

HPSR_CONTEXTO_MESTRE_NOVO_AMBIENTE_v1.0.284(1).md



## 15. Dashboard principal

Você comentou que a Dashboard principal estava pouco útil e queria dar a ela uma função mais prática, voltada ao que precisa da atenção do profissional.

Essa mudança continua em fase de elaboração. Não devo reformular a Dashboard principal sem antes definirmos o que ela deve mostrar, para quais perfis e quais ações realmente serão úteis.

## Estado das próximas alterações

Base de referência

v1.0.395

Documentos no padrão de Exames

Pedido registrado · entrega não confirmada

Manter formulário à esquerda, editor à direita, altura mais equilibrada e rolagem própria em ambas as áreas.

Próximo pacote

`HPSR_System_v1.0.396.zip`, com `hpsr_system/` na raiz e um único arquivo completo na Biblioteca.

Dashboard principal

Elaborar antes de implementar

A regra que une todas as outras é: preservar o que já funciona e aplicar exatamente a mudança solicitada, com o menor impacto possível no restante do sistema.