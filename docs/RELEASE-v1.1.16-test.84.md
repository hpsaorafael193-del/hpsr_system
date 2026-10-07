# v1.1.16-test.84

Exames passa a usar o fluxo natural da página: formulário e editor sem altura fixa ou rolagem interna. Listas limitadas e modais mantêm rolagem nativa com continuidade para a página ao atingir o limite, substituindo overscroll contain.

O ponteiro do mouse no editor agora é uma seta preta com contorno branco, 32 px e fallback para seta padrão, inclusive sobre texto formatado. O cursor de digitação de alto contraste continua presente. A regra é exclusiva do editor; laudos, prévias e PNGs preservados.

Guia farmacêutico compactado: títulos, ícones, linhas, campos e espaçamentos menores; estrutura de lista e painel de detalhes, categorias e conteúdo mantidos.

Validação: auditorias de sintaxe TS/TSX/CSS e release, TypeScript e filtros do guia farmacêutico. Inspeção de interação em navegador real ainda pendente no ambiente.
