# Otimização de egress do Supabase

A partir da versão 0.4.63, listagens não carregam o campo `payload` completo quando bastam metadados.

## Regras aplicadas

- Prontuários carrega metadados extraídos do JSON para montar a linha do tempo.
- Históricos de Exames e Documentos carregam apenas título, paciente, médico e data.
- O controle de liberação ao Portal carrega somente título e estado de sigilo.
- O Portal do Paciente recebe primeiro uma lista resumida; HTML e imagens são buscados apenas ao visualizar ou baixar um registro.
- Atualizações automáticas de 45 segundos foram removidas dos painéis públicos; atualização ocorre ao abrir, ao retornar à aba, após uma ação ou pelo botão Atualizar.
- Consultas do Portal carregam apenas os campos do `payload` usados na interface.
- Solicitação de código filtra `patient_portal_access` diretamente no banco e usa `patient_registry` como fonte institucional, sem varrer prontuários e consultas completos.

O Supabase continua sendo a fonte de verdade e o fluxo visual permanece inalterado.
