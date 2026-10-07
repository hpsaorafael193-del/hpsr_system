# v1.1.16-test.88

Guia farmacêutico com hierarquia reduzida após análise da imagem enviada: cabeçalho e nome do medicamento 18 px, título da lista 16 px, nomes e subtítulos internos 13 px, textos e referência 12 px, detalhes auxiliares 10–11 px. Dimensões, ícones e espaçamentos mantidos.

Exames e Documentos: pré-visualização mostra o PNG real gerado pelo canvas. Download usa exatamente a mesma URL/blob mostrado na prévia, sem redesenhar o arquivo e sem reconstruir páginas ou metadados no momento do download. Em Documentos, o gerador fica vinculado ao snapshot e às páginas capturados ao abrir a prévia. Em Exames, salvamento a partir da prévia usa seus metadados capturados, evitando alterar data/hora durante a visualização.

PNG exclusivamente temporário em memória. URLs revogadas ao trocar de página, fechar a prévia ou desmontar. Respostas atrasadas de páginas anteriores são descartadas. Nenhuma gravação de PNG, URL blob ou canvas em banco, Storage, localStorage ou payload de rascunho. Publicação continua usando o snapshot estruturado de dados e HTML existente.

Validação: teste de reuso do mesmo blob, ausência de geração duplicada, descarte de resposta antiga, falhas e liberação de memória. TypeScript, auditorias de release/Portal e canvas real. Build de produção aprovado. Inspeção de interação em navegador real continua pendente no ambiente.
