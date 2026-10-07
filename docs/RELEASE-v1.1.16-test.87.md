# v1.1.16-test.87

Correção de escopo: área reservada da assinatura de Exames restaurada para 540 × 100 px. Somente a imagem é desenhada dentro dela em 360 × 68 px, centralizada e alinhada à base, tanto na prévia quanto no PNG. Constantes separadas impedem que uma alteração de escala da imagem redimensione a área do rodapé.

Documentos: área de 280 × 48 px preservada com imagem de 240 × 42 px dentro dela, centralizada na base. Nenhuma mudança em linhas, nome, CRM, data, contadores de página ou capacidade do corpo do laudo. Guia farmacêutico e campos da .86 mantidos.

Validação: TypeScript, auditoria de release, sintaxe TS/TSX/CSS, contratos de assinatura/paginação e renderização real do canvas de Exames. Os limites existentes usam capacidade de 714 px, corpo iniciando em 214 px e terminando em 928 px, antes do rodapé em 936 px. Não se afirma alinhamento visual perfeito do editor em navegador sem essa inspeção; ela continua pendente no ambiente.
