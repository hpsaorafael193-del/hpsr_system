export const currentUserProfile = {
  id: "local-dev",
  systemName: "Dr. Luidhy",
  characterName: "Luidhy",
  passport: "0001",
  role: "Vice Diretor",
  systemRole: "Dev / Desenvolvedor do Sistema",
  accessLevel: "Total",
  department: "Hospital São Rafael",
  specialty: "Clínico Geral",
  specialties: ["Clínico Geral", "Obstetra", "Cardiologia", "Pediatra", "Nutricionista"],
  crm: "CRM-RP 193-001",
  cityPhone: "(055) 193-000",
  discordId: "1717123456789",
  email: "medico@saorafael.com",
  serviceStatus: "Em serviço",
  radioFrequency: "193",
  signatureName: "Dr. Luidhy",
  signatureRole: "Vice Diretor",
  signaturePath: null as string | null,
  signatureImage: null as string | null,
  stampText: "Hospital São Rafael · Sandy Shores",
  joinedAt: "2026-06-01",
};

export const profileHistory = [
  {
    title: "Perfil médico criado",
    description: "Cadastro interno preparado para assinatura, CRM-RP e permissões.",
    date: "Atual",
  },
  {
    title: "Acesso ao painel clínico",
    description: "Usuário habilitado para uso dos módulos da dashboard.",
    date: "Sistema",
  },
];

export const profileDocuments = [
  "Laudos",
  "Receitas",
  "Atestados",
  "Exames",
  "Prontuários",
];
