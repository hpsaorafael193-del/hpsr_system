# v0.5.53 — Preservação do prontuário ao alternar abas

- O prontuário não substitui mais pacientes e registros por listas vazias quando uma sincronização retorna incompleta.
- Falhas temporárias em `patient_registry` ou `clinical_records` preservam o último estado válido exibido.
- Respostas antigas de carregamentos concorrentes são descartadas.
- Ao voltar para a aba ou janela, pacientes e registros são sincronizados novamente.
- O provedor compartilhado de pacientes também preserva o cache em respostas vazias inesperadas.
