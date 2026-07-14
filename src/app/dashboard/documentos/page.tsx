"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileSignature,
  FileText,
  HeartPulse,
  Italic,
  List,
  ListOrdered,
  Printer,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Send,
  Stethoscope,
  Type,
  Underline,
  UserPlus,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ClinicalHistoryButton } from "@/components/dashboard/ClinicalHistoryButton";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { createClient } from "@/lib/supabase";

type PatientDraft = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
};

type DoctorDraft = {
  name: string;
  crm: string;
  role: string;
  specialty: string;
  signatureImage?: string | null;
};

type DoctorOption = Omit<DoctorDraft, "signatureImage"> & {
  id: string;
  signatureStorageKey?: string;
  signatureImage?: string | null;
};

type DocumentCategory =
  | "atestados"
  | "receitas"
  | "declaracoes"
  | "recibos"
  | "orientacoes"
  | "encaminhamentos"
  | "solicitacoes"
  | "relatorios";

type DocumentModel = {
  id: string;
  title: string;
  category: DocumentCategory;
  subtitle: string;
  icon: LucideIcon;
  guidedFields: GuidedField[];
  render: (ctx: RenderContext) => string;
};

type GuidedField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "date" | "number";
};

type RenderContext = {
  patient: PatientDraft;
  doctor: DoctorDraft;
  values: Record<string, string>;
  today: string;
};

type SavedDocumentDraft = {
  patient: PatientDraft;
  doctor: DoctorDraft;
  selectedDoctorId?: string;
  selectedModelId: string;
  guidedValues: Record<string, string>;
  editorHtml: string;
  catalogSearch: string;
  catalogCategory: DocumentCategory | "todos";
  savedAt: string;
};

type AppDialog = {
  title: string;
  message: string;
  actions: {
    label: string;
    variant?: "primary" | "secondary";
    onClick: () => void;
  }[];
} | null;

const DRAFT_KEY = "hpsr-documentos-draft-v300";
const emptyPatient: PatientDraft = {
  name: "",
  passport: "",
  age: "",
  bloodType: "",
};

const patientSuggestions: PatientDraft[] = [];

const categoryLabels: Record<DocumentCategory | "todos", string> = {
  todos: "Todos",
  atestados: "Atestados",
  receitas: "Receitas",
  declaracoes: "Declarações",
  recibos: "Recibos",
  orientacoes: "Orientações",
  encaminhamentos: "Encaminhamentos",
  solicitacoes: "Solicitações",
  relatorios: "Relatórios",
};

function brDate(value?: string) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) return "__/__/____";
  return date.toLocaleDateString("pt-BR");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paragraph(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function field(values: Record<string, string>, key: string, fallback = "") {
  return values[key]?.trim() || fallback;
}

const documentModels: DocumentModel[] = [
  {
    id: "atestado-simples",
    title: "Atestado médico simples",
    category: "atestados",
    subtitle: "Afastamento médico com período e observações.",
    icon: FileSignature,
    guidedFields: [
      {
        key: "dias",
        label: "Dias de afastamento",
        placeholder: "Ex.: 3",
        type: "number",
      },
      { key: "inicio", label: "Início do afastamento", type: "date" },
      { key: "cid", label: "CID opcional", placeholder: "Ex.: J06.9" },
      {
        key: "motivo",
        label: "Motivo / observação",
        placeholder: "Ex.: quadro clínico avaliado em consulta",
        type: "textarea",
      },
    ],
    render: ({ patient, values, today }) => `
      <h1>ATESTADO MÉDICO</h1>
      <p>Atesto, para os devidos fins, que <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, foi avaliado(a) nesta unidade em ${today}.</p>
      <p>Recomenda-se afastamento de suas atividades por <strong>${escapeHtml(field(values, "dias", "___"))} dia(s)</strong>, a partir de <strong>${brDate(field(values, "inicio"))}</strong>, conforme avaliação médica.</p>
      ${field(values, "cid") ? `<p><strong>CID:</strong> ${escapeHtml(field(values, "cid"))}</p>` : ""}
      ${field(values, "motivo") ? `<p><strong>Observações:</strong><br />${paragraph(field(values, "motivo"))}</p>` : ""}
    `,
  },
  {
    id: "atestado-comparecimento",
    title: "Atestado de comparecimento",
    category: "atestados",
    subtitle: "Comprovação de presença em consulta/atendimento.",
    icon: Check,
    guidedFields: [
      { key: "data", label: "Data do comparecimento", type: "date" },
      {
        key: "horario",
        label: "Horário/período",
        placeholder: "Ex.: 14h às 15h30",
      },
      { key: "setor", label: "Setor", placeholder: "Ex.: Clínica médica" },
      { key: "observacoes", label: "Observações", type: "textarea" },
    ],
    render: ({ patient, values }) => `
      <h1>ATESTADO DE COMPARECIMENTO</h1>
      <p>Declaramos que <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, compareceu ao Hospital São Rafael em <strong>${brDate(field(values, "data"))}</strong>, no período de <strong>${escapeHtml(field(values, "horario", "____"))}</strong>.</p>
      <p><strong>Setor/atendimento:</strong> ${escapeHtml(field(values, "setor", "____"))}</p>
      ${field(values, "observacoes") ? `<p><strong>Observações:</strong><br />${paragraph(field(values, "observacoes"))}</p>` : ""}
    `,
  },
  {
    id: "receita-simples",
    title: "Receita simples",
    category: "receitas",
    subtitle: "Prescrição médica comum com orientações de uso.",
    icon: ClipboardList,
    guidedFields: [
      {
        key: "medicamento",
        label: "Medicamento",
        placeholder: "Nome, concentração e forma",
      },
      { key: "dose", label: "Dose", placeholder: "Ex.: 1 comprimido" },
      {
        key: "frequencia",
        label: "Frequência",
        placeholder: "Ex.: a cada 8 horas",
      },
      { key: "duracao", label: "Duração", placeholder: "Ex.: por 7 dias" },
      { key: "orientacoes", label: "Orientações adicionais", type: "textarea" },
    ],
    render: ({ values }) => `
      <h1>RECEITA MÉDICA</h1>
      <h2>Prescrição</h2>
      <table><tbody>
        <tr><th>Medicamento</th><th>Dose</th><th>Frequência</th><th>Duração</th></tr>
        <tr><td>${escapeHtml(field(values, "medicamento", "____"))}</td><td>${escapeHtml(field(values, "dose", "____"))}</td><td>${escapeHtml(field(values, "frequencia", "____"))}</td><td>${escapeHtml(field(values, "duracao", "____"))}</td></tr>
      </tbody></table>
      ${field(values, "orientacoes") ? `<p><strong>Orientações:</strong><br />${paragraph(field(values, "orientacoes"))}</p>` : "<p><strong>Orientações:</strong> seguir conforme prescrição médica.</p>"}
    `,
  },
  {
    id: "declaracao-medica",
    title: "Declaração médica",
    category: "declaracoes",
    subtitle: "Declaração livre em formato institucional.",
    icon: FileText,
    guidedFields: [
      {
        key: "finalidade",
        label: "Finalidade",
        placeholder: "Ex.: apresentação em instituição/empresa",
      },
      {
        key: "conteudo",
        label: "Texto da declaração",
        type: "textarea",
        placeholder: "Digite o conteúdo principal da declaração",
      },
    ],
    render: ({ patient, values, today }) => `
      <h1>DECLARAÇÃO MÉDICA</h1>
      <p>Declaro, para fins de <strong>${escapeHtml(field(values, "finalidade", "comprovação"))}</strong>, que <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, encontra-se registrado(a) em atendimento nesta unidade.</p>
      <p>${paragraph(field(values, "conteudo", `Documento emitido em ${today}, conforme solicitação do(a) paciente.`))}</p>
    `,
  },
  {
    id: "recibo-medico",
    title: "Recibo médico",
    category: "recibos",
    subtitle: "Recibo de atendimento ou serviço médico prestado.",
    icon: ReceiptText,
    guidedFields: [
      {
        key: "servico",
        label: "Serviço prestado",
        placeholder: "Ex.: consulta médica",
      },
      { key: "valor", label: "Valor", placeholder: "Ex.: R$ 250,00" },
      {
        key: "pagamento",
        label: "Forma de pagamento",
        placeholder: "Ex.: dinheiro, PIX, convênio",
      },
      { key: "cpf", label: "CPF/CNPJ do responsável", placeholder: "Opcional" },
    ],
    render: ({ patient, values, today }) => `
      <h1>RECIBO MÉDICO</h1>
      <p>Recebi de <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, o valor de <strong>${escapeHtml(field(values, "valor", "R$ ____"))}</strong>, referente a <strong>${escapeHtml(field(values, "servico", "serviço médico prestado"))}</strong>.</p>
      <p><strong>Forma de pagamento:</strong> ${escapeHtml(field(values, "pagamento", "____"))}</p>
      ${field(values, "cpf") ? `<p><strong>CPF/CNPJ do responsável:</strong> ${escapeHtml(field(values, "cpf"))}</p>` : ""}
      <p>Documento emitido em ${today}.</p>
    `,
  },
  {
    id: "orientacoes-pos-consulta",
    title: "Orientações pós-consulta",
    category: "orientacoes",
    subtitle: "Folha de orientação ao paciente após atendimento.",
    icon: HeartPulse,
    guidedFields: [
      { key: "cuidados", label: "Cuidados principais", type: "textarea" },
      { key: "sinais", label: "Sinais de alerta", type: "textarea" },
      {
        key: "retorno",
        label: "Retorno recomendado",
        placeholder: "Ex.: em 7 dias ou se piora",
      },
    ],
    render: ({ values }) => `
      <h1>ORIENTAÇÕES AO PACIENTE</h1>
      <h2>Cuidados principais</h2>
      <p>${paragraph(field(values, "cuidados", "Manter repouso relativo, hidratação adequada e seguir as orientações fornecidas durante o atendimento."))}</p>
      <h2>Sinais de alerta</h2>
      <p>${paragraph(field(values, "sinais", "Retornar imediatamente em caso de piora clínica, dor intensa, febre persistente, falta de ar, sangramentos ou outros sintomas importantes."))}</p>
      <p><strong>Retorno:</strong> ${escapeHtml(field(values, "retorno", "conforme orientação médica"))}</p>
    `,
  },
  {
    id: "encaminhamento-medico",
    title: "Encaminhamento médico",
    category: "encaminhamentos",
    subtitle: "Encaminhamento para especialidade, serviço ou avaliação.",
    icon: Send,
    guidedFields: [
      {
        key: "destino",
        label: "Destino/especialidade",
        placeholder: "Ex.: Cardiologia",
      },
      { key: "motivo", label: "Motivo do encaminhamento", type: "textarea" },
      {
        key: "prioridade",
        label: "Prioridade",
        placeholder: "Rotina / Prioritário / Urgente",
      },
    ],
    render: ({ patient, values }) => `
      <h1>ENCAMINHAMENTO MÉDICO</h1>
      <p>Encaminho <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, para avaliação em <strong>${escapeHtml(field(values, "destino", "____"))}</strong>.</p>
      <p><strong>Motivo:</strong><br />${paragraph(field(values, "motivo", "Avaliação complementar conforme quadro clínico."))}</p>
      <p><strong>Prioridade:</strong> ${escapeHtml(field(values, "prioridade", "Rotina"))}</p>
    `,
  },
  {
    id: "solicitacao-exame",
    title: "Solicitação de exame",
    category: "solicitacoes",
    subtitle: "Pedido de exame com justificativa clínica.",
    icon: Stethoscope,
    guidedFields: [
      { key: "exames", label: "Exames solicitados", type: "textarea" },
      { key: "hipotese", label: "Hipótese/justificativa", type: "textarea" },
      {
        key: "urgencia",
        label: "Urgência",
        placeholder: "Rotina / Prioritário / Urgente",
      },
    ],
    render: ({ patient, values }) => `
      <h1>SOLICITAÇÃO DE EXAME</h1>
      <p>Solicito os exames abaixo para <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>.</p>
      <h2>Exames solicitados</h2>
      <p>${paragraph(field(values, "exames", "____"))}</p>
      <h2>Justificativa clínica</h2>
      <p>${paragraph(field(values, "hipotese", "Avaliação complementar."))}</p>
      <p><strong>Urgência:</strong> ${escapeHtml(field(values, "urgencia", "Rotina"))}</p>
    `,
  },
  {
    id: "relatorio-medico",
    title: "Relatório médico breve",
    category: "relatorios",
    subtitle: "Relatório médico resumido para acompanhamento.",
    icon: Type,
    guidedFields: [
      { key: "quadro", label: "Quadro clínico", type: "textarea" },
      { key: "conduta", label: "Conduta", type: "textarea" },
      { key: "plano", label: "Plano / acompanhamento", type: "textarea" },
    ],
    render: ({ patient, values, today }) => `
      <h1>RELATÓRIO MÉDICO</h1>
      <p>Relatório referente ao atendimento de <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, emitido em ${today}.</p>
      <h2>Quadro clínico</h2>
      <p>${paragraph(field(values, "quadro", "____"))}</p>
      <h2>Conduta</h2>
      <p>${paragraph(field(values, "conduta", "____"))}</p>
      <h2>Plano</h2>
      <p>${paragraph(field(values, "plano", "____"))}</p>
    `,
  },
];

function safeFileName(value: string) {
  return (
    (value || "documento")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "documento"
  );
}

function normalizeEditorHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\sdata-[^=]+="[^"]*"/g, "")
    .trim();
}


function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  const iconMap: Record<string, LucideIcon> = {
    "Dados do paciente": UserPlus,
    "Profissional responsável": Stethoscope,
    "Catálogo de documentos": FileText,
    "Modo guiado": Wand2,
  };
  const Icon = iconMap[title] || FileText;
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#e4d8ce] bg-white shadow-[0_8px_22px_rgba(42,7,0,0.04)]">
      <div className="flex items-center gap-2.5 border-b border-[#eee5dd] bg-[#fcfaf8] px-3.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f7e9df] text-hpsr-wine ring-1 ring-[#ead7c8]">
          <Icon size={15} strokeWidth={2.3} />
        </span>
        <h3 className="text-[12px] font-black uppercase tracking-[0.08em] text-hpsr-text">{title}</h3>
      </div>
      <div className="p-3.5">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-hpsr-wine/70">
      {children}
    </span>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      className="h-10 w-full rounded-[13px] border border-[#d8c1ad] bg-white px-3 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wine/50 focus:ring-2 focus:ring-hpsr-wine/10"
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <select
      className="h-10 w-full rounded-[13px] border border-[#d8c1ad] bg-white px-3 text-sm font-black text-hpsr-text outline-none transition focus:border-hpsr-wine/50 focus:ring-2 focus:ring-hpsr-wine/10"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}

function PatientQuickRegisterModal({
  draft,
  setDraft,
  onCancel,
  onSave,
}: {
  draft: PatientDraft;
  setDraft: (patient: PatientDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1f0805]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[22px] border border-[#d7bfa8] bg-[#fffaf4] shadow-[0_24px_70px_rgba(42,7,0,0.28)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e1cbb8] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-[#d6c1af] bg-white text-hpsr-wine shadow-[0_6px_16px_rgba(42,7,0,0.06)]">
              <UserPlus size={18} />
            </span>
            <div>
              <h3 className="text-base font-black text-hpsr-text">Registro rápido de paciente</h3>
              <p className="text-xs font-semibold text-hpsr-muted">Preencha apenas os dados necessários para este documento.</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-hpsr-wine text-white">
            <X size={17} />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <FieldLabel>Nome completo</FieldLabel>
            <TextInput value={draft.name} onChange={(name) => setDraft({ ...draft, name })} placeholder="Nome do paciente" />
          </div>
          <div className="grid grid-cols-[1fr_110px] gap-2">
            <div>
              <FieldLabel>Documento / Passaporte</FieldLabel>
              <TextInput value={draft.passport} onChange={(passport) => setDraft({ ...draft, passport })} placeholder="Número" />
            </div>
            <div>
              <FieldLabel>Idade</FieldLabel>
              <TextInput value={draft.age} onChange={(age) => setDraft({ ...draft, age })} placeholder="Idade" />
            </div>
          </div>
          <div>
            <FieldLabel>Tipo sanguíneo</FieldLabel>
            <TextInput value={draft.bloodType} onChange={(bloodType) => setDraft({ ...draft, bloodType })} placeholder="Ex.: B-" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e1cbb8] bg-white px-5 py-4">
          <button type="button" onClick={onCancel} className="h-10 rounded-[13px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40">Cancelar</button>
          <button type="button" onClick={onSave} className="h-10 rounded-[13px] bg-hpsr-wine px-5 text-xs font-black text-white shadow-soft hover:bg-hpsr-wineDark">Salvar paciente</button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const { patients: sharedPatients, selectedPatient: sharedSelectedPatient, selectPatient: selectSharedPatient, upsertPatient: upsertSharedPatient, loading: patientsLoading } = usePatientSelection();
  const initialDoctor: DoctorDraft = {
    name: currentUserProfile.signatureName || currentUserProfile.characterName || currentUserProfile.systemName || "",
    crm: currentUserProfile.crm || "",
    role: currentUserProfile.signatureRole || currentUserProfile.role || "Médico",
    specialty: currentUserProfile.specialty || "Clínico Geral",
  };
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([{
    id: currentUserProfile.id || "current-user",
    name: initialDoctor.name,
    crm: initialDoctor.crm,
    role: initialDoctor.role,
    specialty: initialDoctor.specialty,
    signatureImage: currentUserProfile.signatureImage || null,
  }]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [patient, setPatient] = useState<PatientDraft>(emptyPatient);
  const patientOptions = sharedPatients as PatientDraft[];
  const [quickPatientOpen, setQuickPatientOpen] = useState(false);
  const [quickPatientDraft, setQuickPatientDraft] = useState<PatientDraft>(emptyPatient);

  useEffect(() => {
    if (!sharedSelectedPatient) return;
    setPatient(sharedSelectedPatient as PatientDraft);
  }, [sharedSelectedPatient]);
  const [doctor, setDoctor] = useState<DoctorDraft>(initialDoctor);
  const [selectedDoctorId, setSelectedDoctorId] = useState(currentUserProfile.id || "current-user");
  const [selectedModelId, setSelectedModelId] = useState(
    documentModels[0]?.id || "",
  );
  const [guidedValues, setGuidedValues] = useState<Record<string, string>>({});
  const [catalogCategory, setCatalogCategory] = useState<
    DocumentCategory | "todos"
  >("todos");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [editorHtml, setEditorHtml] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [saveStatus, setSaveStatus] = useState("Rascunho local");
  const [appDialog, setAppDialog] = useState<AppDialog>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isConfidential, setIsConfidential] = useState(true);

  const today = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);
  const selectedModel = useMemo(
    () =>
      documentModels.find((model) => model.id === selectedModelId) ||
      documentModels[0],
    [selectedModelId],
  );

  const filteredModels = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return documentModels.filter((model) => {
      const byCategory =
        catalogCategory === "todos" || model.category === catalogCategory;
      const bySearch =
        !query ||
        model.title.toLowerCase().includes(query) ||
        model.subtitle.toLowerCase().includes(query) ||
        categoryLabels[model.category].toLowerCase().includes(query);
      return byCategory && bySearch;
    });
  }, [catalogCategory, catalogSearch]);

  const generatedHtml = useMemo(() => {
    if (!selectedModel) return "";
    return selectedModel.render({
      patient,
      doctor,
      values: guidedValues,
      today,
    });
  }, [selectedModel, patient, doctor, guidedValues, today]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        const initial = documentModels[0].render({
          patient: emptyPatient,
          doctor: initialDoctor,
          values: {},
          today,
        });
        setEditorHtml(initial);
        window.setTimeout(() => {
          if (editorRef.current) editorRef.current.innerHTML = initial;
        }, 0);
        return;
      }
      const saved = JSON.parse(raw) as Partial<SavedDocumentDraft>;
      setPatient(saved.patient || emptyPatient);
      setDoctor(saved.doctor || initialDoctor);
      setSelectedDoctorId(saved.selectedDoctorId === "current-user" ? (currentUserProfile.id || "current-user") : (saved.selectedDoctorId || currentUserProfile.id || "current-user"));
      setSelectedModelId(saved.selectedModelId || documentModels[0].id);
      setGuidedValues(saved.guidedValues || {});
      setCatalogSearch(saved.catalogSearch || "");
      setCatalogCategory(saved.catalogCategory || "todos");
      setEditorHtml(saved.editorHtml || "");
      if (saved.savedAt) {
        setLastSavedAt(
          new Date(saved.savedAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
      window.setTimeout(() => {
        if (editorRef.current)
          editorRef.current.innerHTML = saved.editorHtml || "";
      }, 0);
    } catch {
      // mantém estado inicial se o rascunho local estiver corrompido
    }
  }, [today]);

  useEffect(() => {
    const currentOption: DoctorOption = {
      id: currentUserProfile.id || "current-user",
      name: initialDoctor.name,
      crm: initialDoctor.crm,
      role: initialDoctor.role,
      specialty: initialDoctor.specialty,
      signatureImage: currentUserProfile.signatureImage || null,
    };
    const client = createClient();
    if (!client) {
      setAvailableDoctors([currentOption]);
      return;
    }
    void client.from("profiles")
      .select("id,name,crm,role,specialty,signature_path")
      .eq("access_status", "Aprovado")
      .order("name")
      .then(({ data }) => {
        const options = (data || []).map((row: any) => {
          const signaturePath = String(row.signature_path || "").trim();
          let signatureImage: string | null = signaturePath || null;
          if (signaturePath && !signaturePath.startsWith("data:") && !/^https?:\/\//i.test(signaturePath)) {
            const { data: publicData } = client.storage.from("signatures").getPublicUrl(signaturePath);
            signatureImage = publicData.publicUrl || signaturePath;
          }
          return {
            id: row.id,
            name: row.name || "Médico",
            crm: row.crm || "—",
            role: row.role || "Médico",
            specialty: row.specialty || "Não informado",
            signatureImage,
          } as DoctorOption;
        });
        setAvailableDoctors([currentOption, ...options.filter((item) => item.id !== currentOption.id)]);
      });
  }, [currentUserProfile.id, currentUserProfile.characterName, currentUserProfile.systemName, currentUserProfile.signatureName, currentUserProfile.crm, currentUserProfile.role, currentUserProfile.signatureRole, currentUserProfile.specialty, currentUserProfile.signatureImage]);

  useEffect(() => {
    const selected = availableDoctors.find((item) => item.id === selectedDoctorId);
    if (!selected) return;

    setDoctor({
      name: selected.name,
      crm: selected.crm,
      role: selected.role,
      specialty: selected.specialty,
      signatureImage: selected.signatureImage || null,
    });
  }, [selectedDoctorId, availableDoctors]);

  useEffect(() => {
    const save = window.setTimeout(() => saveDraft(false), 500);
    return () => window.clearTimeout(save);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    patient,
    doctor,
    selectedDoctorId,
    selectedModelId,
    guidedValues,
    catalogSearch,
    catalogCategory,
    editorHtml,
  ]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") saveDraft(false);
      if (document.visibilityState === "visible") {
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (!raw) return;
          const saved = JSON.parse(raw) as Partial<SavedDocumentDraft>;
          if (
            saved.editorHtml &&
            editorRef.current &&
            editorRef.current.innerHTML.trim() === ""
          ) {
            editorRef.current.innerHTML = saved.editorHtml;
            setEditorHtml(saved.editorHtml);
          }
        } catch {
          // sem ação
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveDraft(manual = true) {
    const html = normalizeEditorHtml(
      editorRef.current?.innerHTML || editorHtml || generatedHtml,
    );
    const savedAt = new Date().toISOString();
    const draft: SavedDocumentDraft = {
      patient,
      doctor,
      selectedDoctorId,
      selectedModelId,
      guidedValues,
      editorHtml: html,
      catalogSearch,
      catalogCategory,
      savedAt,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    const time = new Date(savedAt).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastSavedAt(time);
    setSaveStatus(manual ? `Salvo às ${time}` : "Rascunho local");
  }

  function syncEditor() {
    const html = normalizeEditorHtml(editorRef.current?.innerHTML || "");
    setEditorHtml(html);
    setSaveStatus("Salvando...");
  }

  function applyModel() {
    const current = normalizeEditorHtml(editorRef.current?.innerHTML || "");
    if (current && current !== generatedHtml) {
      setAppDialog({
        title: "Aplicar modelo",
        message:
          "Isso vai substituir o texto atual do editor pelo documento gerado no Modo guiado.",
        actions: [
          {
            label: "Cancelar",
            variant: "secondary",
            onClick: () => setAppDialog(null),
          },
          {
            label: "Aplicar",
            variant: "primary",
            onClick: () => {
              if (editorRef.current)
                editorRef.current.innerHTML = generatedHtml;
              setEditorHtml(generatedHtml);
              setAppDialog(null);
              saveDraft(false);
            },
          },
        ],
      });
      return;
    }
    if (editorRef.current) editorRef.current.innerHTML = generatedHtml;
    setEditorHtml(generatedHtml);
    saveDraft(false);
  }

  function selectModel(id: string) {
    setSelectedModelId(id);
    setGuidedValues({});
    const nextModel = documentModels.find((model) => model.id === id);
    if (!nextModel) return;
    const html = nextModel.render({ patient, doctor, values: {}, today });
    if (editorRef.current) editorRef.current.innerHTML = html;
    setEditorHtml(html);
  }

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    syncEditor();
  }

  function insertList(ordered = false) {
    exec(ordered ? "insertOrderedList" : "insertUnorderedList");
  }

  function openQuickPatient() {
    setQuickPatientDraft(patient.name || patient.passport ? patient : emptyPatient);
    setQuickPatientOpen(true);
  }

  function saveQuickPatient() {
    const normalizedPatient = {
      ...quickPatientDraft,
      name: quickPatientDraft.name.trim(),
      passport: quickPatientDraft.passport.trim(),
    };
    if (!normalizedPatient.name && !normalizedPatient.passport) {
      setAppDialog({
        title: "Dados insuficientes",
        message: "Informe pelo menos o nome ou o documento do paciente para usar o registro rápido.",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
      return;
    }
    const fallbackPassport = normalizedPatient.passport || `TEMP-${Date.now().toString().slice(-5)}`;
    const nextPatient = { ...normalizedPatient, passport: fallbackPassport };
    setPatient(nextPatient);
    upsertSharedPatient(nextPatient);
    selectSharedPatient(nextPatient);
    setQuickPatientOpen(false);
  }

  function selectDoctor(id: string) {
    const selected = availableDoctors.find((item) => item.id === id);
    if (!selected) return;

    // Evita exibir a assinatura anterior durante a troca do profissional.
    setDoctor((current) => ({ ...current, signatureImage: null }));
    setSelectedDoctorId(selected.id);
  }

  function loadImage(src: string) {
    return new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function normalizeSignatureImage(image: HTMLImageElement) {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth || image.width;
      sourceCanvas.height = image.naturalHeight || image.height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return image;
      sourceContext.drawImage(image, 0, 0);
      const pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      const data = pixels.data;
      let minX = sourceCanvas.width;
      let minY = sourceCanvas.height;
      let maxX = -1;
      let maxY = -1;

      for (let y = 0; y < sourceCanvas.height; y += 1) {
        for (let x = 0; x < sourceCanvas.width; x += 1) {
          const index = (y * sourceCanvas.width + x) * 4;
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          const alpha = data[index + 3];
          if (alpha === 0) continue;
          const isNearWhite = red > 242 && green > 242 && blue > 242;
          if (isNearWhite) {
            data[index + 3] = 0;
            continue;
          }
          if (alpha > 20) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      sourceContext.putImageData(pixels, 0, 0);
      if (maxX < minX || maxY < minY) return sourceCanvas;

      const padding = Math.max(6, Math.round(Math.min(sourceCanvas.width, sourceCanvas.height) * 0.025));
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.min(sourceCanvas.width - cropX, maxX - minX + 1 + padding * 2);
      const cropHeight = Math.min(sourceCanvas.height - cropY, maxY - minY + 1 + padding * 2);
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedContext = croppedCanvas.getContext("2d");
      if (!croppedContext) return sourceCanvas;
      croppedContext.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      return croppedCanvas;
  }


  function drawSignatureContain(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const ratio = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * ratio;
    const drawHeight = image.height * ratio;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function drawWrappedText(
    context: CanvasRenderingContext2D,
    value: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxY: number,
  ) {
    const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width > maxWidth && line) {
        if (y + lineHeight > maxY) return y;
        context.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line && y + lineHeight <= maxY) {
      context.fillText(line, x, y);
      y += lineHeight;
    }
    return y;
  }

  function htmlToPlainBlocks(html: string) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    return Array.from(wrapper.children)
      .map((child) => ({
        tag: child.tagName.toLowerCase(),
        text: (child.textContent || "").replace(/\s+/g, " ").trim(),
      }))
      .filter((block) => block.text);
  }

  async function renderDocumentCanvas() {
    const html = normalizeEditorHtml(
      editorRef.current?.innerHTML || editorHtml || generatedHtml,
    );
    const canvas = document.createElement("canvas");
    canvas.width = 794;
    canvas.height = 1123;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const background = await loadImage("/modelo-documento-hpsr.png");
    if (background)
      context.drawImage(background, 0, 0, canvas.width, canvas.height);

    context.textBaseline = "top";
    context.fillStyle = "#5b1809";
    context.font = "12px Georgia";
    context.textAlign = "right";
    context.fillText(`Data da Emissão: ${today}`, 766, 39);
    context.fillStyle = "#b1adac";
    context.font = "11px Georgia";
    context.fillText("Formato principal: PNG", 766, 59);

    context.textAlign = "center";
    context.fillStyle = "#5b1809";
    context.font = "700 14px Georgia";
    context.beginPath();
    context.roundRect(238, 113, 318, 25, 12);
    context.strokeStyle = "#5b1809";
    context.stroke();
    context.fillText(
      selectedModel?.title.toUpperCase() || "DOCUMENTO MÉDICO",
      397,
      118,
    );

    context.beginPath();
    context.roundRect(28, 158, 738, 90, 16);
    context.stroke();
    context.font = "14px Georgia";
    context.fillText("IDENTIFICAÇÃO DO PACIENTE", 397, 169);
    context.textAlign = "left";
    context.font = "12px Georgia";
    context.fillText(`Nome: ${patient.name || "-"}`, 42, 200);
    context.fillText(`Passaporte: ${patient.passport || "-"}`, 361, 200);
    context.fillText(`Tipo Sanguíneo: ${patient.bloodType || "-"}`, 635, 200);
    context.fillText(`Idade: ${patient.age || "-"}`, 42, 224);

    let y = 286;
    const blocks = htmlToPlainBlocks(html);
    for (const block of blocks) {
      if (y > 950) break;
      if (/^h[1-3]$/.test(block.tag)) {
        context.fillStyle = "#5b1809";
        context.font =
          block.tag === "h1" ? "700 16px Georgia" : "700 13px Georgia";
        y += 6;
        y = drawWrappedText(
          context,
          block.text.toUpperCase(),
          42,
          y,
          710,
          block.tag === "h1" ? 20 : 17,
          960,
        );
        context.strokeStyle = "rgba(91,24,9,0.22)";
        context.beginPath();
        context.moveTo(42, y + 2);
        context.lineTo(752, y + 2);
        context.stroke();
        y += 12;
      } else {
        context.fillStyle = "#4b2118";
        context.font = "12px Georgia";
        y = drawWrappedText(context, block.text, 42, y, 710, 17, 960) + 8;
      }
    }

    context.fillStyle = "rgba(255,250,244,0.98)";
    context.fillRect(42, 985, 710, 126);
    context.strokeStyle = "rgba(91,24,9,0.20)";
    context.beginPath();
    context.moveTo(42, 985);
    context.lineTo(752, 985);
    context.stroke();

    const signatureSource = doctor.signatureImage || null;
    if (signatureSource) {
      const signature = await loadImage(signatureSource);
      if (signature) {
        const normalizedSignature = normalizeSignatureImage(signature);
        drawSignatureContain(context, normalizedSignature, 237, 990, 320, 64);
      }
    }

    context.strokeStyle = "#5b1809";
    context.setLineDash([2, 2]);
    context.beginPath();
    context.moveTo(245, 1060);
    context.lineTo(549, 1060);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#5b1809";
    context.textAlign = "center";
    context.font = "11px Georgia";
    context.fillText(`Dr(a). ${doctor.name || "Nome do médico"}`, 397, 1066);
    context.font = "9px Georgia";
    context.fillText(
      `${doctor.role || "Médico"} · CRM: ${doctor.crm || "000000"}`,
      397,
      1082,
    );
    context.fillStyle = "#7a5148";
    context.font = "8.5px Georgia";
    context.fillText(
      "Hospital São Rafael · Documento médico institucional",
      397,
      1101,
    );

    return canvas;
  }

  async function downloadPng() {
    const canvas = await renderDocumentCanvas();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        setAppDialog({
          title: "Exportação PNG",
          message: "Não foi possível gerar o PNG. Tente novamente.",
          actions: [
            {
              label: "Entendi",
              variant: "primary",
              onClick: () => setAppDialog(null),
            },
          ],
        });
        return;
      }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${safeFileName(selectedModel?.title || "documento-medico")}_${safeFileName(patient.name || "paciente")}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 500);
    }, "image/png");
  }


  async function openDocumentPreview() {
    const html = normalizeEditorHtml(editorRef.current?.innerHTML || editorHtml || generatedHtml);
    if (editorRef.current) editorRef.current.innerHTML = html;
    setEditorHtml(html);
    const canvas = await renderDocumentCanvas();
    if (!canvas) return;
    setPreviewImage(canvas.toDataURL("image/png"));
    setPreviewOpen(true);
  }

  async function saveDocument() {
    if (!patient.passport?.trim() || !patient.name?.trim()) {
      setAppDialog({ title: "Paciente obrigatório", message: "Selecione ou cadastre o paciente antes de salvar.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
      return;
    }
    if (patient.name.trim().toLowerCase() === doctor.name.trim().toLowerCase()) {
      setAppDialog({ title: "Dados inválidos", message: "Paciente e médico responsável não podem ser o mesmo registro.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
      return;
    }
    const html = normalizeEditorHtml(
      editorRef.current?.innerHTML || editorHtml || generatedHtml,
    );
    if (editorRef.current) editorRef.current.innerHTML = html;
    setEditorHtml(html);
    saveDraft(true);

    const client = createClient();
    if (client && patient.passport?.trim()) {
      const recordId = `document-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const { error } = await client.from("clinical_records").insert({
        id: recordId,
        patient_passport: patient.passport.trim(),
        record_type: "Documento",
        is_confidential: isConfidential,
        released_at: isConfidential ? null : new Date().toISOString(),
        payload: {
          documentTitle: selectedModel?.title || "Documento médico",
          documentHtml: html,
          patient,
          doctor,
          savedAt: new Date().toISOString(),
        },
      });
      if (error) {
        setAppDialog({ title: "Não foi possível salvar o documento", message: error.message, actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
        return;
      }
    }

    const canvas = await renderDocumentCanvas();
    if (!canvas) return;
    setPreviewImage(canvas.toDataURL("image/png"));
    setPreviewOpen(true);
  }

  function printDocument() {
    window.print();
  }

  const previewHtml = editorHtml || generatedHtml;

  return (
    <>
      <div className="hpsr-page gap-3 text-hpsr-text xl:h-[calc(100dvh-2.4rem)] xl:min-h-0 xl:overflow-hidden">
        <div className="hpsr-topbar" />

        <section className="min-h-0 grid flex-1 gap-4 overflow-hidden xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="min-h-0 overflow-y-auto pr-1 xl:pr-2 no-print">
            <div className="rounded-[22px] border border-[#dfd1c5] bg-white p-3.5 shadow-[0_14px_34px_rgba(42,7,0,0.055)]">
              <PageHeader
                eyebrow="Documentos"
                title="Editor de documentos"
                description="Gerador institucional com catálogo, modo guiado e editor livre."
              />

              <div className="space-y-3">
                <Panel title="Dados do paciente">
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>Selecionar paciente</FieldLabel>
                      <div className="grid grid-cols-[1fr_44px] gap-2">
                        <SelectInput
                          value={patient.passport}
                          onChange={(passport) => {
                            const match = patientOptions.find((item) => item.passport === passport);
                            if (match) {
                              setPatient(match);
                              selectSharedPatient(match);
                            } else {
                              setPatient(emptyPatient);
                              selectSharedPatient(null);
                            }
                          }}
                        >
                          <option value="">{patientsLoading ? "Carregando pacientes..." : "Paciente livre..."}</option>
                          {patientOptions.map((item) => (
                            <option key={item.passport} value={item.passport}>
                              {item.name} · {item.passport}
                            </option>
                          ))}
                        </SelectInput>
                        <button
                          type="button"
                          onClick={openQuickPatient}
                          title="Registro rápido de paciente"
                          className="flex h-10 w-11 items-center justify-center rounded-[13px] border border-[#d8bfa9] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-hpsr-text shadow-[0_4px_12px_rgba(42,7,0,0.05)] transition hover:border-hpsr-wine/40 hover:bg-white"
                        >
                          <UserPlus size={18} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_92px] gap-2">
                      <div>
                        <FieldLabel>Nome</FieldLabel>
                        <TextInput value={patient.name} onChange={(name) => setPatient({ ...patient, name })} placeholder="Nome completo" />
                      </div>
                      <div>
                        <FieldLabel>Documento</FieldLabel>
                        <TextInput value={patient.passport} onChange={(passport) => setPatient({ ...patient, passport })} placeholder="Nº" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <FieldLabel>Idade</FieldLabel>
                        <TextInput value={patient.age} onChange={(age) => setPatient({ ...patient, age })} placeholder="Idade" />
                      </div>
                      <div>
                        <FieldLabel>Tipo sanguíneo</FieldLabel>
                        <TextInput value={patient.bloodType} onChange={(bloodType) => setPatient({ ...patient, bloodType })} placeholder="Ex.: B-" />
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Profissional responsável">
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>Perfil do médico</FieldLabel>
                      <SelectInput value={selectedDoctorId} onChange={selectDoctor}>
                        {availableDoctors.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} · {item.crm}
                          </option>
                        ))}
                      </SelectInput>
                    </div>
                    <div className="rounded-[15px] border border-[#e0c7b0] bg-white/70 p-3">
                      <p className="text-sm font-black text-hpsr-text">{doctor.name || "Médico não selecionado"}</p>
                      <p className="mt-1 text-xs font-semibold text-hpsr-muted">{doctor.crm || "CRM não informado"}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[#f7e9df] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{doctor.role || "Médico"}</span>
                        <span className="rounded-full border border-[#ead7c8] bg-white px-2.5 py-1 text-[10px] font-black text-hpsr-text">{doctor.specialty || "Especialidade não informada"}</span>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Catálogo de documentos">
                  <div className="mb-3 flex items-center gap-2 rounded-[15px] border border-[#d8c1ad] bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <Search size={15} className="text-hpsr-muted" />
                    <input
                      value={catalogSearch}
                      onChange={(event) => setCatalogSearch(event.target.value)}
                      placeholder="Buscar documento..."
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                    />
                  </div>

                  <div className="mb-3">
                    <FieldLabel>Categoria dos documentos</FieldLabel>
                    <div className="relative flex h-11 items-center rounded-[14px] border border-[#d8c1ad] bg-white shadow-[0_4px_12px_rgba(42,7,0,0.035)] transition focus-within:border-hpsr-wine/55 focus-within:ring-2 focus-within:ring-hpsr-wine/10">
                      <div className="pointer-events-none flex h-full w-10 shrink-0 items-center justify-center border-r border-[#ead9ca] text-hpsr-wine">
                        <FileText size={15} strokeWidth={2.2} />
                      </div>
                      <select
                        value={catalogCategory}
                        onChange={(event) => setCatalogCategory(event.target.value as DocumentCategory | "todos")}
                        aria-label="Filtrar documentos por categoria"
                        className="h-full min-w-0 flex-1 appearance-none bg-transparent px-3 pr-10 text-sm font-black text-hpsr-text outline-none"
                      >
                        {(Object.keys(categoryLabels) as Array<DocumentCategory | "todos">).map((category) => (
                          <option key={category} value={category}>{categoryLabels[category]}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 text-hpsr-muted" />
                    </div>
                  </div>

                  <div className="max-h-[430px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      {filteredModels.map((model) => {
                        const Icon = model.icon;
                        const active = selectedModel?.id === model.id;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => selectModel(model.id)}
                            className={`group relative min-h-[94px] overflow-hidden rounded-[16px] border p-3 text-left transition-all ${active ? "border-hpsr-wine bg-[#fff5eb] shadow-[0_10px_22px_rgba(103,38,20,0.10)] ring-1 ring-hpsr-wine/10" : "border-[#e3d7cd] bg-white shadow-[0_4px_12px_rgba(42,7,0,0.035)] hover:-translate-y-0.5 hover:border-hpsr-wine/35 hover:bg-[#fdfaf7]"}`}
                          >
                            <span className={`absolute inset-y-0 left-0 w-1 ${active ? "bg-hpsr-wine" : "bg-transparent group-hover:bg-hpsr-wine/20"}`} />
                            <div className="flex items-start gap-3">
                              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border ${active ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-[#ead9cb] bg-[#f8ece3] text-hpsr-wine"}`}>
                                <Icon size={18} strokeWidth={2.3} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="line-clamp-2 text-[13px] font-black leading-[1.2] text-hpsr-text">{model.title}</span>
                                <span className="mt-1 line-clamp-2 block text-[10px] font-semibold leading-tight text-hpsr-muted">{model.subtitle}</span>
                              </span>
                              {active && <Check size={15} className="shrink-0 text-hpsr-wine" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Panel>

                <Panel title="Modo guiado">
                  <div className="mb-3 rounded-[15px] border border-[#e0c7b0] bg-white/70 p-2.5">
                    <p className="text-sm font-black text-hpsr-text">{selectedModel?.title || "Documento livre"}</p>
                    <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">Preencha os campos e aplique no editor.</p>
                  </div>
                  <div className="space-y-3">
                    {selectedModel?.guidedFields.map((item) => (
                      <label key={item.key} className="block">
                        <FieldLabel>{item.label}</FieldLabel>
                        {item.type === "textarea" ? (
                          <textarea
                            className="min-h-[90px] w-full rounded-[13px] border border-[#d8c1ad] bg-white px-3 py-2 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wine/50 focus:ring-2 focus:ring-hpsr-wine/10"
                            placeholder={item.placeholder}
                            value={guidedValues[item.key] || ""}
                            onChange={(event) => setGuidedValues({ ...guidedValues, [item.key]: event.target.value })}
                          />
                        ) : (
                          <TextInput
                            value={guidedValues[item.key] || ""}
                            type={item.type || "text"}
                            placeholder={item.placeholder}
                            onChange={(value) => setGuidedValues({ ...guidedValues, [item.key]: value })}
                          />
                        )}
                      </label>
                    ))}
                    <button type="button" onClick={applyModel} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-xs font-black text-white shadow-soft hover:bg-hpsr-wineDark">
                      <Wand2 size={16} /> Aplicar no editor
                    </button>
                  </div>
                </Panel>
              </div>
            </div>
          </aside>

          <main className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#ded0c4] bg-white shadow-[0_18px_46px_rgba(42,7,0,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ddc6b4] bg-white px-5 py-4 no-print">
              <div>
                <h2 className="text-xl font-black tracking-[-0.01em] text-hpsr-text">
                  {selectedModel?.title || "Documento livre"}
                </h2>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-hpsr-muted">
                  Editor contínuo · preview institucional ao salvar
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black text-hpsr-text">
                <ClinicalHistoryButton recordType="Documento" />
                <span className="rounded-full border border-[#dec8b6] bg-white px-3 py-2 shadow-[0_4px_10px_rgba(42,7,0,0.04)]">
                  {today}
                </span>
              </div>
            </div>

            <div className="border-b border-[#ece4dd] bg-[#faf8f6] px-5 py-2.5 text-xs font-semibold text-hpsr-muted no-print">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-hpsr-wine" />
                <span>Revise os dados do paciente, o conteúdo e a assinatura antes de salvar o documento.</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-[#e3cdbd] bg-white px-5 py-2.5 no-print">
              <label className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-text">
                <Type size={15} />
                <select
                  defaultValue="3"
                  onChange={(event) => exec("fontSize", event.target.value)}
                  className="min-w-[96px] bg-transparent text-xs font-black text-hpsr-text outline-none"
                  aria-label="Tamanho da fonte"
                  title="Tamanho da fonte"
                >
                  <option value="1">10 px</option>
                  <option value="2">12 px</option>
                  <option value="3">14 px</option>
                  <option value="4">16 px</option>
                  <option value="5">18 px</option>
                  <option value="6">24 px</option>
                  <option value="7">32 px</option>
                </select>
              </label>
              <button type="button" className="hpsr-button-soft gap-2 !py-2" onClick={() => exec("bold")}><Bold size={15} /></button>
              <button type="button" className="hpsr-button-soft gap-2 !py-2" onClick={() => exec("italic")}><Italic size={15} /></button>
              <button type="button" className="hpsr-button-soft gap-2 !py-2" onClick={() => exec("underline")}><Underline size={15} /></button>
              <button type="button" className="hpsr-button-soft gap-2 !py-2" onClick={() => insertList(false)}><List size={15} /></button>
              <button type="button" className="hpsr-button-soft gap-2 !py-2" onClick={() => insertList(true)}><ListOrdered size={15} /></button>
              <button type="button" className="hpsr-button-soft gap-2 !py-2" onClick={() => exec("justifyLeft")}><AlignLeft size={15} /></button>
              <button type="button" className="hpsr-button-soft gap-2 !py-2" onClick={() => exec("justifyCenter")}><AlignCenter size={15} /></button>
              <button type="button" className="hpsr-button-soft gap-2 !py-2" onClick={() => exec("justifyRight")}><AlignRight size={15} /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f2eee9] p-4">
              <div className="mx-auto min-h-full max-w-[1040px] rounded-[18px] border border-[#ddd3ca] bg-white p-8 shadow-[0_12px_30px_rgba(42,7,0,0.07)]">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncEditor}
                  className="hpsr-continuous-editor min-h-[740px] outline-none"
                  dangerouslySetInnerHTML={{ __html: editorHtml || generatedHtml }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ddc6b4] bg-[#fcfaf8] px-5 py-3.5 no-print">
              <label className="inline-flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">
                <input type="checkbox" checked={isConfidential} onChange={(event) => setIsConfidential(event.target.checked)} />
                Sigilo no Portal do Paciente
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editorRef.current) editorRef.current.innerHTML = "";
                    setEditorHtml("");
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
                >
                  <X size={15} /> Limpar editor
                </button>
                <button
                  type="button"
                  onClick={applyModel}
                  className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
                >
                  <RefreshCw size={15} /> Atualizar
                </button>
                <button
                  type="button"
                  onClick={openDocumentPreview}
                  className="inline-flex h-10 items-center gap-2 rounded-[13px] bg-hpsr-wine px-5 text-xs font-black text-white shadow-soft hover:bg-hpsr-wineDark"
                >
                  <Save size={16} /> Pré-visualizar
                </button>
              </div>
            </div>
          </main>
        </section>
      </div>

        <div
          className="pointer-events-none fixed -left-[9999px] top-0 h-[1123px] w-[794px] overflow-hidden"
          aria-hidden="true"
        >
          <section className="h-[1123px] w-[794px] overflow-hidden bg-white">
            <div
              ref={previewRef}
              className="relative h-[1123px] w-[794px] overflow-hidden bg-white"
            >
              <img
                src="/modelo-documento-hpsr.png"
                alt="Modelo institucional"
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
                draggable={false}
              />
              <div className="relative z-10 flex h-full flex-col px-[5.3%] pb-[3.5%] pt-[3.2%] font-serif text-[6.3px] leading-[1.45] text-[#4b2118]">
                <div className="text-right text-[6px] text-[#7a5148]">
                  <p>Data da Emissão: {today}</p>
                  <p className="text-[#b1adac]">Formato principal: PNG</p>
                </div>
                <div className="mx-auto mt-[5.5%] rounded-full border border-hpsr-wine px-4 py-1 text-center text-[7px] font-bold uppercase text-hpsr-wine">
                  {selectedModel?.title || "Documento médico"}
                </div>
                <div className="mt-[5%] rounded-[10px] border border-hpsr-wine px-3 py-2 text-[6px]">
                  <p className="mb-2 text-center text-[7px] font-bold uppercase text-hpsr-wine">
                    Identificação do paciente
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <p>
                      <strong>Nome:</strong> {patient.name || "-"}
                    </p>
                    <p>
                      <strong>Passaporte:</strong> {patient.passport || "-"}
                    </p>
                    <p>
                      <strong>Idade:</strong> {patient.age || "-"}
                    </p>
                    <p>
                      <strong>Tipo sanguíneo:</strong>{" "}
                      {patient.bloodType || "-"}
                    </p>
                  </div>
                </div>
                <div
                  className="mt-[7%] min-h-0 flex-1 overflow-hidden text-[6.4px] leading-[1.55] [&_h1]:mb-2 [&_h1]:text-[9px] [&_h1]:font-bold [&_h1]:uppercase [&_h1]:text-hpsr-wine [&_h2]:mb-1 [&_h2]:mt-2 [&_h2]:text-[7.3px] [&_h2]:font-bold [&_p]:mb-2 [&_table]:my-2 [&_table]:w-full [&_td]:border [&_td]:border-[#ead5cc] [&_td]:p-1 [&_th]:border [&_th]:border-[#ead5cc] [&_th]:bg-[#fcf6ee] [&_th]:p-1 [&_th]:text-left"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
                <footer className="mt-auto border-t border-[#ead5cc] pt-2 text-center text-[5.6px] text-[#7a5148]">
                  {doctor.signatureImage && (
                    <img
                      src={doctor.signatureImage}
                      alt="Assinatura cadastrada do médico"
                      className="mx-auto mb-1 h-[52px] w-[280px] object-contain"
                    />
                  )}
                  <div className="mx-auto mb-1 h-5 w-[45%] border-b border-dashed border-hpsr-wine" />
                  <p className="font-bold text-hpsr-wine">
                    Dr(a). {doctor.name || "Nome do médico"}
                  </p>
                  <p>
                    {doctor.role || "Médico"} · CRM: {doctor.crm || "000000"}
                  </p>
                  <p className="mt-1">
                    Hospital São Rafael · Documento médico institucional
                  </p>
                </footer>
              </div>
            </div>
          </section>
        </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f0805]/60 p-4 backdrop-blur-md no-print">
          <div className="flex h-[min(94dvh,980px)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-[#fffaf4] shadow-[0_24px_70px_rgba(42,7,0,0.32)]">
            <div className="flex items-center justify-between gap-3 border-b border-hpsr-border bg-white px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wine/65">
                  Documento salvo
                </p>
                <h3 className="text-lg font-black uppercase text-hpsr-text">
                  {selectedModel?.title || "Documento médico"}
                </h3>
                <p className="text-xs font-bold text-hpsr-muted">
                  Pré-visualização institucional · Página 1 de 1
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-hpsr-wine px-4 text-xs font-black text-white hover:bg-hpsr-wineDark"
              >
                <X size={14} /> Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[url('/exames-preview-bg.png')] bg-repeat p-6">
              <div className="mx-auto w-fit origin-top scale-[0.72] sm:scale-[0.78] md:scale-[0.86] xl:scale-100">
                <section className="h-[1123px] w-[794px] overflow-hidden bg-white shadow-[0_18px_52px_rgba(42,7,0,0.22)]">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Pré-visualização fiel do documento"
                      className="block h-[1123px] w-[794px] object-contain"
                      draggable={false}
                    />
                  ) : null}
                </section>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hpsr-border bg-white px-4 py-3">
              <p className="text-xs font-bold text-hpsr-muted">
                Confira o documento antes de baixar ou imprimir.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
                >
                  <Eye size={15} /> Editar
                </button>
                <button
                  type="button"
                  onClick={downloadPng}
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-hpsr-wine px-4 text-xs font-black text-white hover:bg-hpsr-wineDark"
                >
                  <Download size={15} /> Baixar PNG
                </button>
                <button
                  type="button"
                  onClick={printDocument}
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
                >
                  <Printer size={15} /> Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {quickPatientOpen && (
        <PatientQuickRegisterModal
          draft={quickPatientDraft}
          setDraft={setQuickPatientDraft}
          onCancel={() => setQuickPatientOpen(false)}
          onSave={saveQuickPatient}
        />
      )}

      {appDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <button
            type="button"
            className="hpsr-modal-backdrop"
            onClick={() => setAppDialog(null)}
            aria-label="Fechar"
          />
          <div className="hpsr-modal-shell max-w-md">
            <div className="hpsr-modal-header">
              <h2 className="text-lg font-bold text-hpsr-text">
                {appDialog.title}
              </h2>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-zinc-600">
                {appDialog.message}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                {appDialog.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className={
                      action.variant === "primary"
                        ? "hpsr-button-primary"
                        : "hpsr-button-soft"
                    }
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
