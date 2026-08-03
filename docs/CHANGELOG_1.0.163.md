# Versão 1.0.163

## Objetivo
Corrigir a exportação do relatório administrativo em formato XLSX que podia ser reconhecido como arquivo corrompido.

## Arquivos alterados
- `src/lib/xlsx-writer.ts`
- `package.json`
- `package-lock.json`
- `src/components/layout/DeveloperCreditsModal.tsx`

## Correções
- Remoção de caracteres de controle inválidos para XML antes de gerar células e nomes de planilhas.
- Garantia de nomes únicos para todas as abas do XLSX, inclusive seções extras com nomes repetidos.
- Estrutura do workbook reforçada para maior compatibilidade com Excel e LibreOffice.
- Revogação do URL de download adiada para evitar interrupção prematura em alguns navegadores.

## Compatibilidade
Nenhuma alteração no banco, nas consultas ou no conteúdo dos relatórios.

## Migrações
Nenhuma.

## Validações
- Compilação isolada de `xlsx-writer.ts` com TypeScript: concluída.
- Integridade ZIP interna do XLSX com `unzip -t`: aprovada.
- Abertura e leitura do XLSX com `openpyxl`: aprovada.
- Teste com caracteres de controle e nomes de abas duplicados: aprovado.
- Build completo: não executado, pois o pacote não inclui as dependências instaladas.
