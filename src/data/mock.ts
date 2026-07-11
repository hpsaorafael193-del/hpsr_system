export const roles = [
  "Diretora",
  "Vice Diretor",
  "Diretor Clínico",
  "Médico Cirurgião",
  "Médico Especialista",
  "Médico Clínico",
  "Residente",
  "Estagiário de Enfermagem",
];

export const specialties = [
  "Clínico Geral",
  "Obstetra",
  "Pediatra",
  "Psicóloga",
  "Psiquiatra",
  "Neurologia",
  "Oftalmologia",
  "Cardiologia",
  "Dermatologia",
  "Nutricionista",
  "Cirurgião",
  "Ginecologia",
];

export const specialtyDescriptions: Record<string, string> = {
  "Clínico Geral": "Atendimento inicial, avaliação de sintomas gerais e encaminhamentos.",
  Obstetra: "Acompanhamento gestacional, pré-natal e orientações obstétricas.",
  Pediatra: "Atendimento infantil e acompanhamento de crianças.",
  Psicóloga: "Acolhimento, escuta e acompanhamento psicológico.",
  Psiquiatra: "Avaliação e acompanhamento em saúde mental com conduta médica.",
  Neurologia: "Avaliação de sintomas neurológicos, dores e alterações sensitivas ou motoras.",
  Oftalmologia: "Avaliação da visão, olhos e queixas oftalmológicas.",
  Cardiologia: "Avaliação do coração, pressão, dores no peito e sintomas cardiovasculares.",
  Dermatologia: "Avaliação de pele, alergias, lesões e alterações dermatológicas.",
  Nutricionista: "Orientação alimentar e acompanhamento nutricional.",
  Cirurgião: "Avaliação cirúrgica, retorno pós-operatório e encaminhamentos para procedimento.",
  Ginecologia: "Atendimento ginecológico, exames preventivos e acompanhamento da saúde feminina.",
};

export const appointmentRequests: Array<{
  protocol: string; passport: string; patient: string; specialty: string; preferred: string; status: string;
}> = [];

export const staffApplications: Array<{
  protocol: string; name: string; desiredRole: string; availability: string; status: string;
}> = [];
