# Versão 1.0.106 — Correção de tipagem do relatório XLSX

- Corrigida a função de normalização de texto do relatório administrativo.
- Todos os valores processados por `text()` agora são convertidos explicitamente para `string`.
- Eliminado o erro de TypeScript que tratava campos da equipe como `{}` ao montar as planilhas XLSX.
- Mantida a geração de arquivo `.xlsx` verdadeiro e sem exportações CSV.
