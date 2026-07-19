# Política de persistência e sincronização

## Fonte de verdade

Quando o Supabase estiver configurado, dados institucionais são sempre carregados e confirmados pelo banco. Um cache local jamais pode criar, restaurar, atualizar ou excluir registros no banco por conta própria.

## Cache local permitido

- rascunhos ainda não finalizados de documentos e exames;
- preferências de interface, como menu recolhido e e-mail lembrado;
- seleção temporária do paciente;
- cópia rápida da lista de pacientes apenas enquanto a leitura do Supabase está em andamento;
- imagens temporárias necessárias para evitar retrabalho durante upload.

## Regras obrigatórias

1. Um retorno válido e vazio do Supabase substitui o cache local vazio ou antigo.
2. Falha de rede pode manter um cache visível temporariamente, mas não permite sincronização reversa automática.
3. Selecionar um paciente nunca cria cadastro.
4. Cadastro e edição só atualizam a interface depois da confirmação do banco.
5. `patient_registry` é a única fonte que define quais pacientes existem.
6. Prontuários, consultas e acessos do portal apenas enriquecem pacientes existentes; não recriam pacientes excluídos.
7. Caches institucionais legados são removidos quando o Supabase está configurado.
