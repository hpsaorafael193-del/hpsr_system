# Regras fixas de ambiente — HPSR

1. Toda aba interna usa a barra fina escura no topo, no mesmo padrão institucional.
2. Não criar um container decorativo envolvendo a página inteira. Conteúdo fica diretamente no fundo da página.
3. Evitar área dentro de área: usar uma superfície principal por função e divisores/espaçamento antes de criar outro card.
4. Supabase é a fonte persistente oficial. Dados clínicos, administrativos e financeiros não usam localStorage como banco paralelo.
5. O sistema não gera PDF. Documentos visuais gerados pelo HPSR são PNG somente sob demanda; anexos de modelos não aceitam PDF.
6. Identidade profissional é o UUID do perfil. Mudança de nome deve propagar o nome de exibição aos registros vinculados sem criar um “novo médico”.
7. Diretora e Vice Diretor / Dev preservam acesso administrativo total conforme as regras de cada módulo.
