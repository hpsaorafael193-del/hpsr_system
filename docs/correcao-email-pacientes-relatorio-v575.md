# v0.5.75 — Correção de e-mails indevidos em pacientes e relatórios

- O cadastro de paciente realizado pelo prontuário passa a gravar explicitamente `email: null`.
- O relatório administrativo não confia mais diretamente no campo `patient_registry.email`.
- Um e-mail somente é exibido na aba de pacientes do relatório quando está vinculado ao mesmo passaporte em `patient_accounts` ou `patient_portal_access`.
- Endereços técnicos de acesso direto no padrão `portal-direto+...@hpsr.local` não são exibidos como e-mail do paciente.
- E-mails legítimos já vinculados ao Portal do Paciente continuam sendo apresentados.
