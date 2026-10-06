# Testes históricos v1.1.16-test.30

Estes contratos foram preservados apenas como referência histórica da interface antiga.
Eles não fazem parte da validação da linha atual porque verificam literalmente a versão
`1.1.16-test.30` e estruturas visuais que foram substituídas nas reformulações posteriores.

A validação de release atual é feita por:

- `tests/portal-audit.mjs`
- `tests/staff-registration-audit.mjs`
- `tests/release-audit.mjs`

Não promover novamente estes testes históricos a bloqueadores sem antes reescrevê-los para
os fluxos e contratos funcionais atuais.
