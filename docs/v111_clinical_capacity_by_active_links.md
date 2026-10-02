# v1.1.1 — Capacidade por vínculo ativo

Alteração pontual a partir da v1.1.0. `hpsr_clinical_capacity` conta exclusivamente passaportes distintos presentes em `patient_doctor_links` por médico e especialidade normalizada; consultas e acompanhamentos não ocupam novas vagas. Sem limite personalizado, permanece 5 por especialidade. Encerramento do vínculo elimina a contagem automaticamente, mantendo o histórico.

O gatilho `trg_enforce_patient_link_capacity` impede novos vínculos acima do limite e serializa cadastros concorrentes; correções do próprio vínculo não ocupam vagas extras. As RPCs existentes de capacidade do dashboard e do Portal continuam usando `hpsr_clinical_capacity`.

Alteração visual apenas dos textos explicativos do painel e da mensagem de capacidade esgotada ao vincular pacientes. Outras mudanças de Obstetra, Vacinação e documentos dinâmicos permanecem fora desta versão.
