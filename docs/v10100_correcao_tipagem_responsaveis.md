# v1.0.100 — Correção de tipagem dos responsáveis

- Corrigida a inferência de tipo da lista de passaportes dos responsáveis no cadastro do Portal do Paciente.
- `guardianPassports` e `foundGuardians` agora são explicitamente tipados como coleções de `string`.
- A alteração elimina o erro de TypeScript que interrompia o `next build` na validação de responsáveis de pacientes menores de idade.
