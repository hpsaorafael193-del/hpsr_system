import {
  Baby,
  Bed,
  Bone,
  Calculator,
  CalendarDays,
  ClipboardList,
  Droplets,
  FileSearch,
  FileText,
  Handshake,
  HeartHandshake,
  Home,
  Landmark,
  WalletCards,
  Pill,
  Stethoscope,
  Users,
} from "lucide-react";

export const mainNavigation = [
  { label: "Principal", href: "/dashboard", icon: Home },
  { label: "Prontuários", href: "/dashboard/prontuarios", icon: ClipboardList },
  {
    label: "Agendamentos",
    href: "/dashboard/agendamento",
    icon: CalendarDays,
    children: [
      { label: "Agenda Clínica", href: "/dashboard/agendamento/clinica" },
      { label: "Agenda de Procedimentos", href: "/dashboard/agendamento/cirurgias" },
    ],
  },
  { label: "Convênios", href: "/dashboard/convenios", icon: Handshake },
  { label: "Parcerias", href: "/dashboard/parcerias", icon: HeartHandshake },
  { label: "Guia Farmacêutico", href: "/dashboard/guia-farmaceutico", icon: Pill },
];

export const toolsNavigation = [
  { label: "Calculadora", href: "/dashboard/calculadora", icon: Calculator },
  { label: "Exames", href: "/dashboard/exames", icon: FileSearch },
  { label: "Documentos", href: "/dashboard/documentos", icon: FileText },
  { label: "Traumatologia", href: "/dashboard/traumatologia", icon: Bone },
  { label: "Banco de Sangue", href: "/dashboard/banco-de-sangue", icon: Droplets },
  { label: "Obstetra", href: "/dashboard/obstetra", icon: Baby },
  { label: "Gestão de Leitos", href: "/dashboard/gestao-de-leitos", icon: Bed },
  { label: "Financeiro", href: "/dashboard/financeiro", icon: WalletCards },
];

export const adminNavigation = [
  { label: "Direção", href: "/dashboard/equipe", icon: Users },
  { label: "Relatório", href: "/dashboard/direcao", icon: Landmark },
];

export const publicCards = [
  {
    title: "Equipe Médica",
    description: "Acesso restrito para profissionais do Hospital São Rafael.",
    href: "#acesso-medico",
    cta: "Entrar no sistema",
    icon: Stethoscope,
  },
  {
    title: "Agendar Consulta",
    description: "Cadastre o paciente e solicite atendimento por especialidade.",
    href: "/agendar",
    cta: "Agendar agora",
    icon: CalendarDays,
  },
  {
    title: "Trabalhe Conosco",
    description: "Envie sua candidatura para atuar no hospital no RP.",
    href: "/trabalhe-conosco",
    cta: "Candidatar-se",
    icon: Users,
  },
];
