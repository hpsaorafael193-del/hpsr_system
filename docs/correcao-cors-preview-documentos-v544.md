# v0.5.44 — Correção de canvas contaminado na pré-visualização de documentos

- Imagens remotas agora são carregadas com `crossOrigin = anonymous` quando aplicável.
- A limpeza da assinatura passou a tratar `SecurityError` sem interromper a pré-visualização.
- Assinaturas externas sem permissão CORS são ignoradas em vez de contaminar o canvas.
- A geração sob demanda passou a capturar falhas de renderização, evitando promessas não tratadas no console.
- A paginação e o carregamento de uma página por vez foram preservados.
