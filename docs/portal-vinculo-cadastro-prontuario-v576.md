# v0.5.76 — Vínculo seguro entre prontuário e Portal do Paciente

- O cadastro no Portal reutiliza o paciente existente em `patient_registry` pelo passaporte.
- Nome e demais dados institucionais já preenchidos não são substituídos pelo formulário público.
- Apenas idade, tipo sanguíneo, telefone e e-mail vazios podem ser completados.
- O vínculo em `patient_accounts` e o acesso em `patient_portal_access` são criados antes de gravar o e-mail no cadastro institucional.
- Conflitos de passaporte, e-mail ou conta agora recebem mensagens específicas.
- Em caso de falha, vínculos e registros criados durante a tentativa são revertidos para evitar cadastros parciais.
