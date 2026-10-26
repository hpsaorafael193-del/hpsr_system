# Cobertura temporária de acompanhamento

Estado: implementação preparada e testada localmente; ativação no banco de produção pendente de aprovação. Versão mantida em 1.1.16-test.145.

A Diretora e o Vice Diretor / Dev poderão escolher a médica responsável, consultar os planejamentos gestacionais e FIV e registrar consultas no acompanhamento existente. O plano, seus vínculos e sua titularidade continuam com a médica original.

## Alterações propostas no banco

- Adicionar os campos opcionais `performed_by`, `performed_by_name` e `performed_at` nas consultas. Não reescrever os atendimentos antigos.
- Atribuir a autoria ao perfil autenticado e ativo; a identidade enviada pelo navegador não determina o autor.
- Manter a função de salvamento como `SECURITY INVOKER`. As permissões normais de RLS continuam sendo aplicadas.
- Autorizar uma consulta e seu plano somente durante o salvamento validado, usando contexto local da transação com os identificadores originais de médico, paciente, plano e consulta. O contexto é restaurado ao terminar.
- Permitir atualizar o registro correspondente no prontuário durante essa mesma operação, preservando quem criou o registro e o histórico anterior.
- Manter bloqueadas a gravação direta em consultas de terceiros e a cobertura por perfis comuns, inativos ou anônimos.
- Não transferir responsáveis, criar novos planejamentos, modificar vínculos das pacientes nem alterar agendamentos automaticamente.

SQL preparado: `docs/sql/reproductive-temporary-coverage.sql`.

## Comportamento da interface

O seletor administrativo é habilitado somente quando o recurso estiver disponível no banco. Antes disso, os acompanhamentos próprios continuam usando o fluxo existente. Em cobertura, o formulário de criação/alteração integral fica separado; o profissional consulta o integral e registra as consultas individuais. O documento já salvo preserva seu autor; a prévia de uma nova edição identifica o profissional que fará o registro.

## Verificação

Testes locais em PostgreSQL/PGlite 0.5.11 verificam RLS, autoria, histórico, concorrência, rollback, liberação e revogação individuais, gestacional, FIV e retomada pela médica original. Código de verificação: `docs/qa/reproductive-coverage-test145.cjs` (módulo PGlite informado por `HPSR_PGLITE_MODULE`). A produção permaneceu com 12 planejamentos e 78 consultas, sem os novos campos.
