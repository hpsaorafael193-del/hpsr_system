"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Activity,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baby,
  Beaker,
  Bold,
  Brain,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Droplets,
  Dna,
  Ear,
  Eye,
  FileText,
  FlaskConical,
  Hand,
  Heart,
  HeartPulse,
  Highlighter,
  Info,
  Italic,
  List,
  ListOrdered,
  Microscope,
  Paperclip,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Scan,
  Search,
  SquareActivity,
  Stethoscope,
  Syringe,
  Table2,
  Trash2,
  Type,
  Underline,
  Upload,
  UserPlus,
  Wand2,
  Waves,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ClinicalHistoryButton } from "@/components/dashboard/ClinicalHistoryButton";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { createClient } from "@/lib/supabase";
import { registerSystemActivity } from "@/lib/administrative-storage";
import {
  createInitialAdaptiveConfiguration,
  renderAdaptiveExamReport,
  resolveAdaptiveExam,
  type AdaptiveExamConfiguration,
  type AdaptiveResolvedExam,
} from "@/data/exames/adaptive-engine";
import {
  createFinalExamDocument,
  type AutomaticAttachment,
  type RenderAttachmentFile,
  type RenderedExamDocument,
  type RenderMetadata,
} from "@/data/exames/final-renderer";
import {
  getIntelligentExamModel,
  intelligentExamModels,
  type IntelligentExamModel,
} from "@/data/exames";

type PatientDraft = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
};

type DoctorDraft = {
  name: string;
  crm: string;
};

type DoctorOption = DoctorDraft & {
  id: string;
  role: string;
  specialty: string;
  signatureStorageKey?: string;
  signatureImage?: string | null;
};

type SavedDraft = {
  patient: PatientDraft;
  doctor: DoctorDraft;
  selectedDoctorId?: string;
  selectedExamId: string;
  adaptiveConfig: AdaptiveExamConfiguration | null;
  html: string;
  protocol: string;
  attachments?: RenderAttachmentFile[];
  ui?: {
    showCatalog?: boolean;
    smartConfigOpen?: boolean;
    catalogCategory?: string;
    examSearch?: string;
    attachmentEditorOpen?: boolean;
    automaticAttachmentNotes?: string;
  };
  savedAt: string;
};

type PreviewState = {
  open: boolean;
  document: RenderedExamDocument | null;
  pageIndex: number;
};

type AppDialogAction = {
  label: string;
  variant?: "primary" | "secondary" | "danger";
  onClick: () => void;
};

type AppDialogState = {
  title: string;
  message: string;
  tone?: "info" | "warning" | "danger";
  actions: AppDialogAction[];
} | null;

const DRAFT_KEY = "hpsr-exames-continuous-editor-draft-v283";
const EDITOR_PAGE_GUIDE_HEIGHT = 920;

const emptyPatient: PatientDraft = {
  name: "",
  passport: "",
  age: "",
  bloodType: "",
};

const patientSuggestions: PatientDraft[] = [];

const categoryLabels: Record<string, string> = {
  laboratorio: "Laboratório",
  imagem: "Imagem",
  cardiologia: "Cardiologia",
  neurologia: "Neurologia",
  ginecologia: "Ginecologia",
  obstetricia: "Obstetrícia",
  pediatria: "Pediatria",
  neonatal: "Neonatal",
  oftalmologia: "Oftalmologia",
  dermatologia: "Dermatologia",
  hormonal: "Hormonal",
  genetico: "Genético",
  genetica: "Genética",
  funcional: "Funcional",
  geral: "Geral",
};

const examIconMap: Record<string, LucideIcon> = {
  "fa-vial": Beaker,
  "fa-vials": FlaskConical,
  "fa-tint": Droplets,
  "fa-droplet": Droplets,
  "fa-heartbeat": HeartPulse,
  "fa-heart": Heart,
  "fa-clock": Clock3,
  "fa-stethoscope": Stethoscope,
  "fa-running": Activity,
  "fa-dna": Dna,
  "fa-search": Search,
  "fa-skin": SquareActivity,
  "fa-allergies": Activity,
  "fa-hand": Hand,
  "fa-file-medical": FileText,
  "fa-lungs": Activity,
  "fa-baby": Baby,
  "fa-sync": RefreshCw,
  "fa-female": Heart,
  "fa-wave-square": Waves,
  "fa-x-ray": Scan,
  "fa-syringe": Syringe,
  "fa-bolt": Zap,
  "fa-flask": FlaskConical,
  "fa-chart-line": Activity,
  "fa-microscope": Microscope,
  "fa-mouth": Activity,
  "fa-ear-listen": Ear,
  "fa-cube": Scan,
  "fa-video": Eye,
  "fa-eye": Eye,
  "fa-bullseye": Eye,
  "fa-eye-low-vision": Eye,
  "fa-glasses": Eye,
  "fa-virus": Microscope,
  default: Beaker,
};

function resolveExamIcon(icon?: string): LucideIcon {
  if (!icon) return examIconMap.default;
  return examIconMap[icon] || examIconMap.default;
}

function resolvePanelIcon(title: string): LucideIcon {
  if (/paciente/i.test(title)) return FileText;
  if (/profissional|médico/i.test(title)) return Stethoscope;
  if (/motor|modo guiado/i.test(title)) return Wand2;
  if (/anexo/i.test(title)) return Paperclip;
  if (/catálogo|modelo/i.test(title)) return Table2;
  return FileText;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nowHHMM() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createProtocol() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EX-${date}-${random}`;
}

function formatDateBR(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function textFromHtml(html: string) {
  if (typeof window === "undefined")
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.replace(/\s+/g, " ").trim() || "";
}

function normalizeBlockId(id: string) {
  if (id === "achados") return "resultados";
  if (id === "medidas") return "tabelas";
  return id;
}

function extractAutomaticBlocks(html: string) {
  if (typeof window === "undefined") return new Map<string, string>();
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const blocks = new Map<string, string>();
  wrapper.querySelectorAll<HTMLElement>("[data-hpsr-block]").forEach((node) => {
    const id = normalizeBlockId(node.dataset.hpsrBlock || "");
    if (id) blocks.set(id, node.outerHTML);
  });
  return blocks;
}

function updateTableValuesOnly(currentNode: HTMLElement, generatedHtml: string) {
  const generatedWrapper = document.createElement("div");
  generatedWrapper.innerHTML = generatedHtml;
  const generatedRows = Array.from(
    generatedWrapper.querySelectorAll<HTMLTableRowElement>("tbody tr"),
  );

  const generatedByLabel = new Map<string, string[]>();
  generatedRows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"));
    const label = cells[0]?.textContent?.trim().toLowerCase();
    if (!label) return;
    generatedByLabel.set(label, cells.map((cell) => cell.innerHTML));
  });

  if (!generatedByLabel.size) return false;

  let changed = false;
  currentNode.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((row) => {
    const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"));
    const label = cells[0]?.textContent?.trim().toLowerCase();
    const nextCells = label ? generatedByLabel.get(label) : undefined;
    if (!nextCells) return;

    if (cells[1] && nextCells[1] !== undefined) {
      cells[1].innerHTML = nextCells[1];
      changed = true;
    }
    if (cells[2] && nextCells[2] !== undefined) {
      cells[2].innerHTML = nextCells[2];
      changed = true;
    }
  });

  return changed;
}

function mergeAutomaticBlocks(currentHtml: string, generatedHtml: string) {
  if (typeof window === "undefined") return generatedHtml;
  if (!currentHtml.trim()) return generatedHtml;

  const generatedBlocks = extractAutomaticBlocks(generatedHtml);
  if (!generatedBlocks.size) return currentHtml;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = currentHtml;
  let changed = false;

  wrapper.querySelectorAll<HTMLElement>("[data-hpsr-block]").forEach((node) => {
    const id = normalizeBlockId(node.dataset.hpsrBlock || "");
    const next = generatedBlocks.get(id);
    if (!next) return;

    const wasEditedByUser = node.dataset.hpsrUserEdited === "true";

    if (id === "tabelas") {
      if (updateTableValuesOnly(node, next)) changed = true;
      else if (!wasEditedByUser) {
        node.outerHTML = next;
        changed = true;
      }
      return;
    }

    if (wasEditedByUser) return;

    node.outerHTML = next;
    changed = true;
  });

  return changed ? wrapper.innerHTML : currentHtml;
}

function cleanEditorHtml(html: string) {
  return html
    .replace(/<div><br><\/div>/g, "<p><br></p>")
    .replace(/<div>/g, "<p>")
    .replace(/<\/div>/g, "</p>")
    .trim();
}

function readDraft(): SavedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: SavedDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function removeDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

function safeFileName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "exame"
  );
}



function normalizeXrayKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function resolveXrayAttachmentAsset(region: string, profileId: string) {
  const key = normalizeXrayKey(region).replace(/[^a-z0-9]+/g, "_");
  const profile = normalizeXrayKey(profileId).replace(/[^a-z0-9]+/g, "_");
  const regionFolder = key.includes("torax")
    ? "torax"
    : key.includes("coluna")
      ? "coluna"
      : key.includes("cranio")
        ? "cranio"
        : key.includes("ombro")
          ? "ombro"
          : key.includes("joelho")
            ? "joelho"
            : key.includes("perna") || key.includes("coxa") || key.includes("canela")
              ? "perna_coxa_canela"
              : key.includes("braco") || key.includes("antebraco") || key.includes("cotovelo")
                ? "braco_antebraco"
                : key === "pe" || key.includes("pe_")
                  ? "pe"
                  : "torax";

  const fileByRegion: Record<string, Record<string, string>> = {
    braco_antebraco: { normal: "braco_antebraco_normal.jpg", trauma: "braco_antebraco_trauma.jpg", fratura: "braco_antebraco_fratura_radio_ulna.jpg", luxacao: "braco_antebraco_luxacao_cotovelo_lateral_leve.jpg" },
    coluna: { normal: "coluna_normal_frontal.jpg", trauma: "coluna_trauma_frontal.jpg", fratura: "coluna_fratura_vertebral_frontal.jpg", luxacao: "coluna_luxacao_desalinhamento_frontal.jpg" },
    cranio: { normal: "cranio_normal.jpg", trauma: "cranio_trauma.jpg", fratura: "cranio_fratura_craniana.jpg", luxacao: "cranio_luxacao_temporomandibular_mandibula.jpg" },
    joelho: { normal: "joelho_normal.jpg", trauma: "joelho_trauma.jpg", fratura: "joelho_fratura_plato_tibial.jpg", luxacao: "joelho_luxacao_patelar.jpg" },
    ombro: { normal: "ombro_normal.jpg", trauma: "ombro_trauma.jpg", fratura: "ombro_fratura_umero_proximal.jpg", luxacao: "ombro_luxacao_glenoumeral.jpg" },
    pe: { normal: "pe_normal.jpg", trauma: "pe_trauma.jpg", fratura: "pe_fratura_metatarsos.jpg", luxacao: "pe_luxacao_desalinhamento.jpg" },
    perna_coxa_canela: { normal: "perna_normal.jpg", trauma: "perna_trauma.jpg", fratura: "perna_fratura_tibia_fibula.png" },
    torax: { normal: "torax_normal.jpg", trauma: "torax_trauma.jpg", fratura: "torax_fratura_multiplas_costelas.jpg" },
  };

  const requestedProfile = profile.includes("fratura")
    ? "fratura"
    : profile.includes("luxacao") || profile.includes("sublux")
      ? "luxacao"
      : profile.includes("trauma")
        ? "trauma"
        : "normal";
  const file = fileByRegion[regionFolder]?.[requestedProfile]
    || fileByRegion[regionFolder]?.trauma
    || fileByRegion[regionFolder]?.normal
    || fileByRegion.torax.normal;
  return `/anexos/raio-x/${regionFolder}/${file}`;
}

function createXrayAttachmentImage(region: string, _profileName: string, profileId: string) {
  return resolveXrayAttachmentAsset(region, profileId);
}

function resolvePsychotechnicalAttachmentAsset(profileId: string, profileName: string) {
  const profile = normalizeXrayKey(`${profileId} ${profileName}`).replace(/[^a-z0-9]+/g, "_");

  // A ordem é importante: "não apto" e "apto com ressalvas" também contêm
  // a palavra "apto". Os perfis específicos devem ser resolvidos primeiro.
  if (profile.includes("ressalv") || profile.includes("restric")) {
    return "/anexos/psicotecnico/apto-com-ressalvas.png";
  }
  if (profile.includes("inconclus") || profile.includes("indefin") || profile.includes("limitrof")) {
    return "/anexos/psicotecnico/inconclusivo.png";
  }
  if (profile.includes("nao_apto") || profile.includes("inapto") || profile.includes("alterado")) {
    return "/anexos/psicotecnico/nao-apto.png";
  }
  return "/anexos/psicotecnico/apto.png";
}

function Button({
  children,
  onClick,
  active = false,
  title,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      title={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-[12px] border px-3 text-xs font-black transition duration-150 ${active ? "border-hpsr-wine bg-hpsr-wine text-white shadow-[0_8px_18px_rgba(103,38,20,0.15)]" : "border-[#dec9b7] bg-white/90 text-hpsr-text hover:border-hpsr-wine/40 hover:bg-[#fff8f0] hover:shadow-[0_6px_16px_rgba(42,7,0,0.05)]"} ${className}`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-[#5c2416]">
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-[12px] border border-[#d8bfa9] bg-white px-3 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(42,7,0,0.03)] hover:border-[#b98f75] focus:border-hpsr-wine/55 focus:ring-2 focus:ring-hpsr-wine/10"
    />
  );
}

function SelectInput({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-[13px] border border-[#d8bfa9] bg-[linear-gradient(180deg,#ffffff_0%,#fffaf5_100%)] px-3 pr-10 text-sm font-black text-hpsr-text outline-none transition shadow-[inset_0_1px_2px_rgba(42,7,0,0.03),0_4px_12px_rgba(42,7,0,0.04)] hover:border-[#b98f75] focus:border-hpsr-wine/55 focus:ring-2 focus:ring-hpsr-wine/10"
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-hpsr-wine/70"
      />
    </div>
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
              <p className="text-xs font-semibold text-hpsr-muted">Preencha apenas os dados necessários para este exame.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-hpsr-wine text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <FieldLabel>Nome completo</FieldLabel>
            <TextInput
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
              placeholder="Nome do paciente"
            />
          </div>
          <div className="grid grid-cols-[1fr_110px] gap-2">
            <div>
              <FieldLabel>Documento / Passaporte</FieldLabel>
              <TextInput
                value={draft.passport}
                onChange={(passport) => setDraft({ ...draft, passport })}
                placeholder="Número"
              />
            </div>
            <div>
              <FieldLabel>Idade</FieldLabel>
              <TextInput
                value={draft.age}
                onChange={(age) => setDraft({ ...draft, age })}
                placeholder="Idade"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Tipo sanguíneo</FieldLabel>
            <TextInput
              value={draft.bloodType}
              onChange={(bloodType) => setDraft({ ...draft, bloodType })}
              placeholder="Ex.: B-"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e1cbb8] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-[13px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="h-10 rounded-[13px] bg-hpsr-wine px-5 text-xs font-black text-white shadow-soft hover:bg-hpsr-wineDark"
          >
            Salvar paciente
          </button>
        </div>
      </div>
    </div>
  );
}

function AppDialog({
  dialog,
  onClose,
}: {
  dialog: AppDialogState;
  onClose: () => void;
}) {
  if (!dialog) return null;
  const toneClass =
    dialog.tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : dialog.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1f0805]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[500px] overflow-hidden rounded-[22px] border border-[#d7bfa8] bg-[#fffaf4] shadow-[0_24px_70px_rgba(42,7,0,0.28)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#e1cbb8] bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-[13px] border ${toneClass}`}>
              <Info size={18} />
            </span>
            <div>
              <h3 className="text-base font-black text-hpsr-text">{dialog.title}</h3>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">{dialog.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-hpsr-wine text-white"
          >
            <X size={17} />
          </button>
        </div>
        <div className="flex flex-wrap justify-end gap-2 bg-white px-5 py-4">
          {dialog.actions.map((action) => {
            const buttonClass =
              action.variant === "primary"
                ? "bg-hpsr-wine text-white shadow-soft hover:bg-hpsr-wineDark"
                : action.variant === "danger"
                  ? "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                  : "border-hpsr-border bg-white text-hpsr-text hover:border-hpsr-wine/40";
            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={`h-10 rounded-[13px] border px-4 text-xs font-black ${buttonClass}`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export default function ExamesPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const { patients: sharedPatients, selectedPatient: sharedSelectedPatient, selectPatient: selectSharedPatient, upsertPatient: upsertSharedPatient, loading: patientsLoading } = usePatientSelection();
  const initialDoctor: DoctorDraft = {
    name: currentUserProfile.signatureName || currentUserProfile.characterName || currentUserProfile.systemName || "",
    crm: currentUserProfile.crm || "",
  };
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([{
    id: currentUserProfile.id || "current-user",
    name: initialDoctor.name,
    crm: initialDoctor.crm,
    role: currentUserProfile.signatureRole || currentUserProfile.role || "Médico",
    specialty: currentUserProfile.specialty || "Clínico Geral",
    signatureImage: currentUserProfile.signatureImage || null,
  }]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const editorHtmlRef = useRef("");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRange = useRef<Range | null>(null);

  const [patient, setPatient] = useState<PatientDraft>(emptyPatient);
  const patientOptions = sharedPatients as PatientDraft[];
  const [quickPatientOpen, setQuickPatientOpen] = useState(false);
  const [quickPatientDraft, setQuickPatientDraft] = useState<PatientDraft>(emptyPatient);

  useEffect(() => {
    if (!sharedSelectedPatient) return;
    setPatient(sharedSelectedPatient as PatientDraft);
  }, [sharedSelectedPatient]);
  const [appDialog, setAppDialog] = useState<AppDialogState>(null);
  const [attachments, setAttachments] = useState<RenderAttachmentFile[]>([]);
  const [attachmentOverrideActive, setAttachmentOverrideActive] = useState(false);
  const [automaticAttachmentRemoved, setAutomaticAttachmentRemoved] = useState(false);
  const [attachmentEditorOpen, setAttachmentEditorOpen] = useState(false);
  const [automaticAttachmentNotes, setAutomaticAttachmentNotes] = useState("");
  const [doctor, setDoctor] = useState<DoctorDraft>(initialDoctor);
  const [selectedDoctorId, setSelectedDoctorId] = useState(currentUserProfile.id || "current-user");

  useEffect(() => {
    setDoctor(initialDoctor);
    const currentOption: DoctorOption = { id: currentUserProfile.id || "current-user", name: initialDoctor.name, crm: initialDoctor.crm, role: currentUserProfile.signatureRole || currentUserProfile.role || "Médico", specialty: currentUserProfile.specialty || "Clínico Geral", signatureImage: currentUserProfile.signatureImage || null };
    const client = createClient();
    if (!client) { setAvailableDoctors([currentOption]); return; }
    void client.from("profiles").select("id,name,crm,role,specialty,signature_path").eq("access_status", "Aprovado").order("name").then(({ data }) => {
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
        };
      });
      const withoutDuplicate = options.filter((item: DoctorOption) => item.id !== currentOption.id);
      setAvailableDoctors([currentOption, ...withoutDuplicate]);
    });
  }, [currentUserProfile.id, currentUserProfile.characterName, currentUserProfile.crm, currentUserProfile.signatureName, currentUserProfile.systemName, currentUserProfile.role, currentUserProfile.specialty, currentUserProfile.signatureRole, currentUserProfile.signatureImage]);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("laboratorio");
  const [selectedExamId, setSelectedExamId] = useState<string>(
    "lab_hemograma_completo",
  );
  const [adaptiveConfig, setAdaptiveConfig] =
    useState<AdaptiveExamConfiguration | null>(null);
  const [showCatalog, setShowCatalog] = useState(true);
  const [smartConfigOpen, setSmartConfigOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState<string>("all");
  const [examSearch, setExamSearch] = useState("");
  const [examNameInput, setExamNameInput] = useState("");
  const [protocol, setProtocol] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState("Sem alterações");
  const [isConfidential, setIsConfidential] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [preview, setPreview] = useState<PreviewState>({
    open: false,
    document: null,
    pageIndex: 0,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableRows, setTableRows] = useState(4);
  const [tableCols, setTableCols] = useState(3);
  const [editorPageCount, setEditorPageCount] = useState(1);

  const categories = useMemo(() => {
    const set = new Set(intelligentExamModels.map((model) => model.categoria));
    return Array.from(set).sort((a, b) =>
      (categoryLabels[a] || a).localeCompare(categoryLabels[b] || b),
    );
  }, []);

  const examsByCategory = useMemo(
    () =>
      intelligentExamModels.filter(
        (model) => model.categoria === selectedCategory,
      ),
    [selectedCategory],
  );
  const selectedExam = useMemo(
    () =>
      getIntelligentExamModel(selectedExamId) ||
      examsByCategory[0] ||
      intelligentExamModels[0],
    [selectedExamId, examsByCategory],
  );

  const resolvedExam = useMemo<AdaptiveResolvedExam | null>(() => {
    if (!selectedExam) return null;
    return resolveAdaptiveExam(
      selectedExam,
      adaptiveConfig || createInitialAdaptiveConfiguration(selectedExam),
    );
  }, [selectedExam, adaptiveConfig]);

  const filteredCatalog = useMemo(() => {
    const query = examSearch.trim().toLowerCase();
    return [...intelligentExamModels]
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .filter((exam) => {
        const matchesCategory =
          catalogCategory === "all" ? true : exam.categoria === catalogCategory;
        if (!matchesCategory) return false;
        if (!query) return true;
        return `${exam.nome} ${exam.descricao} ${exam.categoria} ${categoryLabels[exam.categoria] || ""}`
          .toLowerCase()
          .includes(query);
      });
  }, [catalogCategory, examSearch]);

  const metadata = useMemo<RenderMetadata>(
    () => ({
      examName: selectedExam?.nome || "Exame",
      protocol,
      date: todayISO(),
      time: nowHHMM(),
      patient,
      doctor,
      signatureImage,
    }),
    [selectedExam?.nome, protocol, patient, doctor, signatureImage],
  );

  const automaticRxAttachment = useMemo<AutomaticAttachment | null>(() => {
    if (!resolvedExam) return null;
    const examName = resolvedExam.model.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!examName.includes("raio-x") && !examName.includes("radiograf")) return null;

    const region = resolvedExam.adapterValue || "Região examinada";
    const profileName = resolvedExam.profile?.name || "Perfil não definido";
    const profileId = (resolvedExam.profile?.id || "normal").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const regionKey = region.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const slug = regionKey.replace(/\s+/g, "-");

    let sections = ["Incidências", "Alinhamento", "Estruturas ósseas", "Partes moles"];
    let subtitle = `Região: ${region} · Perfil: ${profileName}`;
    let legend = "Anexo radiográfico automático gerado conforme região examinada e perfil de resultado selecionado.";

    if (regionKey.includes("torax")) {
      sections = ["Projeções PA / perfil", "Campos pulmonares", "Grade costal", "Cardiomediastino"];
    } else if (regionKey.includes("coluna")) {
      sections = ["Alinhamento sagital", "Corpos vertebrais", "Espaços discais", "Elementos posteriores"];
    } else if (regionKey.includes("joelho")) {
      sections = ["Incidências AP / perfil", "Compartimentos articulares", "Patela / fêmoro-patelar", "Partes moles"];
    } else if (regionKey.includes("pe") || regionKey.includes("tornozelo")) {
      sections = ["Incidências", "Arcos / alinhamento", "Ossos do tarso/metatarso", "Partes moles"];
    } else if (regionKey.includes("ombro")) {
      sections = ["Articulação glenoumeral", "Articulação acromioclavicular", "Clavícula / escápula", "Partes moles"];
    } else if (regionKey.includes("punho") || regionKey.includes("mao")) {
      sections = ["Incidências", "Carpo / metacarpos", "Falanges", "Partes moles"];
    }

    if (profileId.includes("fratura")) {
      sections = ["Sítio da fratura", "Traço / fragmentos", "Desvio / angulação", "Partes moles"];
      subtitle = `Fratura · ${region}`;
      legend = "Anexo radiográfico para documentação de fratura, incluindo localização, alinhamento, desvio e repercussão em partes moles.";
    } else if (profileId.includes("trauma")) {
      sections = ["Mecanismo traumático", "Corticais ósseas", "Alinhamento articular", "Edema / partes moles"];
      subtitle = `Trauma · ${region}`;
      legend = "Anexo radiográfico para avaliação pós-trauma, com foco em fratura oculta, alinhamento e alterações de partes moles.";
    } else if (profileId.includes("luxacao")) {
      sections = ["Congruência articular", "Direção do deslocamento", "Fratura associada", "Controle pós-redução"];
      subtitle = `Luxação / subluxação · ${region}`;
      legend = "Anexo radiográfico para documentar perda de congruência articular e possíveis lesões associadas.";
    } else if (profileId.includes("degenerativo")) {
      sections = ["Espaço articular", "Osteófitos", "Esclerose / geodos", "Eixo / alinhamento"];
      subtitle = `Alterações degenerativas · ${region}`;
      legend = "Anexo radiográfico para graduação e localização de alterações degenerativas do segmento avaliado.";
    } else if (profileId.includes("pos_operatorio") || profileId.includes("pos-operatorio")) {
      sections = ["Material cirúrgico", "Posicionamento", "Alinhamento", "Sinais de complicação"];
      subtitle = `Controle pós-operatório · ${region}`;
      legend = "Anexo radiográfico para controle de material cirúrgico, alinhamento e sinais de complicação pós-operatória.";
    }

    return {
      id: `anexo-rx-${slug}-${profileId}`,
      title: `Anexo radiográfico - ${region}`,
      subtitle,
      legend,
      orientation: "landscape",
      scale: "normal",
      sections,
      imageUrl: createXrayAttachmentImage(region, profileName, profileId),
      notes: automaticAttachmentNotes.trim() || undefined,
    };
  }, [resolvedExam, automaticAttachmentNotes]);

  const automaticPsychotechnicalAttachment = useMemo<AutomaticAttachment | null>(() => {
    if (!resolvedExam) return null;
    const examName = normalizeXrayKey(resolvedExam.model.nome);
    if (!examName.includes("psicotecn")) return null;

    const profileId = resolvedExam.profile?.id || "apto";
    const profileName = resolvedExam.profile?.name || "Apto";
    return {
      id: `anexo-psicotecnico-${normalizeXrayKey(profileId).replace(/[^a-z0-9]+/g, "-")}`,
      title: "Anexo cardiológico",
      subtitle: `Avaliação psicotécnica · Perfil: ${profileName}`,
      legend: "Traçado eletrocardiográfico correspondente ao perfil de resultado selecionado.",
      orientation: "landscape",
      scale: "expanded",
      sections: [],
      imageUrl: resolvePsychotechnicalAttachmentAsset(profileId, profileName),
      notes: automaticAttachmentNotes.trim() || undefined,
    };
  }, [resolvedExam, automaticAttachmentNotes]);

  const automaticAttachment = automaticRxAttachment || automaticPsychotechnicalAttachment;
  const effectiveAutomaticAttachment = automaticAttachmentRemoved || (attachmentOverrideActive && attachments.length > 0) ? null : automaticAttachment;
  const attachmentCount = attachments.length + (effectiveAutomaticAttachment ? 1 : 0);

  useEffect(() => {
    setAutomaticAttachmentRemoved(false);
    setAttachmentOverrideActive(false);
  }, [selectedExamId, adaptiveConfig?.adapterValue, adaptiveConfig?.profileId]);

  useEffect(() => {
    setSignatureImage(currentUserProfile.signatureImage || null);

    const draft = readDraft();
    if (!draft) {
      const firstExam = getIntelligentExamModel(selectedExamId);
      if (firstExam)
        setAdaptiveConfig(createInitialAdaptiveConfiguration(firstExam));
      setProtocol(createProtocol());
      return;
    }

    setPatient(draft.patient || emptyPatient);
    setDoctor(draft.doctor || initialDoctor);
    setAttachments(draft.attachments || []);
    setAttachmentEditorOpen(Boolean(draft.ui?.attachmentEditorOpen));
    setAutomaticAttachmentNotes(draft.ui?.automaticAttachmentNotes || "");
    setShowCatalog(draft.ui?.showCatalog ?? true);
    setSmartConfigOpen(Boolean(draft.ui?.smartConfigOpen));
    setCatalogCategory(draft.ui?.catalogCategory || "all");
    setExamSearch(draft.ui?.examSearch || "");
    setSelectedDoctorId(draft.selectedDoctorId === "current-user" ? (currentUserProfile.id || "current-user") : (draft.selectedDoctorId || currentUserProfile.id || "current-user"));
    setSelectedExamId(draft.selectedExamId || "lab_hemograma_completo");
    const model = getIntelligentExamModel(
      draft.selectedExamId || "lab_hemograma_completo",
    );
    if (model) {
      setSelectedCategory(model.categoria);
      setExamNameInput(model.nome);
    }
    setAdaptiveConfig(draft.adaptiveConfig);
    editorHtmlRef.current = draft.html || "";
    if (editorRef.current) editorRef.current.innerHTML = draft.html || "";
    window.requestAnimationFrame(updateEditorPageGuides);
    setProtocol(draft.protocol || createProtocol());
    setLastSavedAt(
      draft.savedAt
        ? new Date(draft.savedAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    );
    setSaveStatus(
      draft.savedAt
        ? `Salvo às ${new Date(draft.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
        : "Rascunho restaurado",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const selected = availableDoctors.find((item) => item.id === selectedDoctorId);
    if (!selected) return;

    setDoctor({ name: selected.name, crm: selected.crm });
    setSignatureImage(selected.signatureImage || null);
  }, [selectedDoctorId, availableDoctors]);

  useEffect(() => {
    if (!selectedExam) return;
    setAdaptiveConfig((current) =>
      current?.examId === selectedExam.id
        ? current
        : createInitialAdaptiveConfiguration(selectedExam),
    );
  }, [selectedExam]);

  function updateEditorPageGuides() {
    if (!editorRef.current) {
      setEditorPageCount(1);
      return;
    }
    const measuredHeight = Math.max(
      editorRef.current.scrollHeight,
      editorRef.current.getBoundingClientRect().height,
    );
    const nextCount = Math.max(1, Math.ceil(measuredHeight / EDITOR_PAGE_GUIDE_HEIGHT));
    setEditorPageCount((current) => (current === nextCount ? current : nextCount));
  }

  function setEditorContent(
    html: string,
    options: { moveCaretToEnd?: boolean } = {},
  ) {
    const clean = cleanEditorHtml(html);
    editorHtmlRef.current = clean;
    if (editorRef.current && editorRef.current.innerHTML !== clean) {
      editorRef.current.innerHTML = clean;
    }
    if (options.moveCaretToEnd) {
      lastRange.current = null;
      window.requestAnimationFrame(placeCaretAtEnd);
    }
    scheduleAutosave(clean);
    window.requestAnimationFrame(updateEditorPageGuides);
  }

  function scheduleAutosave(htmlOverride?: string) {
    setSaveStatus("Salvando...");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      const html =
        htmlOverride ?? editorRef.current?.innerHTML ?? editorHtmlRef.current;
      const savedAt = new Date().toISOString();
      saveDraft({
        patient,
        doctor,
        selectedDoctorId,
        selectedExamId: selectedExam?.id || selectedExamId,
        adaptiveConfig,
        html,
        protocol,
        attachments,
        ui: {
          showCatalog,
          smartConfigOpen,
          catalogCategory,
          examSearch,
          attachmentEditorOpen,
          automaticAttachmentNotes,
        },
        savedAt,
      });
      const time = new Date(savedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSavedAt(time);
      setSaveStatus(`Salvo às ${time}`);
    }, 1200);
  }

  function flushDraftNow() {
    const html = editorRef.current?.innerHTML ?? editorHtmlRef.current;
    const savedAt = new Date().toISOString();
    saveDraft({
      patient,
      doctor,
      selectedDoctorId,
      selectedExamId: selectedExam?.id || selectedExamId,
      adaptiveConfig,
      html,
      protocol,
      attachments,
      ui: {
        showCatalog,
        smartConfigOpen,
        catalogCategory,
        examSearch,
        attachmentEditorOpen,
        automaticAttachmentNotes,
      },
      savedAt,
    });
  }

  useEffect(() => {
    scheduleAutosave();
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, doctor, selectedDoctorId, selectedExamId, adaptiveConfig, protocol, attachments, showCatalog, smartConfigOpen, catalogCategory, examSearch, attachmentEditorOpen, automaticAttachmentNotes]);

  useEffect(() => {
    function handlePageHide() {
      flushDraftNow();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") flushDraftNow();
      if (document.visibilityState !== "visible") return;
      updateEditorPageGuides();
      if (!smartConfigOpen) {
        const draft = readDraft();
        if (draft?.ui?.smartConfigOpen) {
          setSmartConfigOpen(true);
          setShowCatalog(draft.ui.showCatalog ?? false);
          setCatalogCategory(draft.ui.catalogCategory || catalogCategory);
          setExamSearch(draft.ui.examSearch || "");
        }
      }
    }

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, doctor, selectedDoctorId, selectedExamId, adaptiveConfig, protocol, attachments, showCatalog, smartConfigOpen, catalogCategory, examSearch, attachmentEditorOpen, automaticAttachmentNotes]);

  useEffect(() => {
    updateEditorPageGuides();
    window.addEventListener("resize", updateEditorPageGuides);
    return () => window.removeEventListener("resize", updateEditorPageGuides);
  }, []);

  function rememberSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current?.contains(range.commonAncestorContainer))
      lastRange.current = range.cloneRange();
  }

  function placeCaretAtEnd() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    lastRange.current = range.cloneRange();
  }

  function restoreSelection() {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    if (
      lastRange.current &&
      editorRef.current?.contains(lastRange.current.commonAncestorContainer)
    ) {
      selection.addRange(lastRange.current);
      return;
    }
    placeCaretAtEnd();
  }

  function markCurrentAutomaticBlockAsEdited() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    const target =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;

    const block = target?.closest<HTMLElement>("[data-hpsr-block]");
    if (!block) return;
    block.dataset.hpsrUserEdited = "true";
  }

  function syncEditorFromDom() {
    markCurrentAutomaticBlockAsEdited();
    const html = cleanEditorHtml(editorRef.current?.innerHTML || "");
    editorHtmlRef.current = html;
    rememberSelection();
    scheduleAutosave(html);
    window.requestAnimationFrame(updateEditorPageGuides);
  }

  function exec(command: string, value?: string) {
    restoreSelection();
    document.execCommand(command, false, value);
    rememberSelection();
    syncEditorFromDom();
  }

  function insertHtml(html: string) {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    rememberSelection();
    syncEditorFromDom();
  }

  function insertTable(rows = tableRows, cols = tableCols) {
    const headers = Array.from(
      { length: cols },
      (_, index) => `<th>Coluna ${index + 1}</th>`,
    ).join("");
    const body = Array.from(
      { length: rows },
      () =>
        `<tr>${Array.from({ length: cols }, () => "<td>&nbsp;</td>").join("")}</tr>`,
    ).join("");
    insertHtml(
      `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table><p><br></p>`,
    );
    setTablePickerOpen(false);
  }

  function applyFormatBlock(tag: string) {
    exec("formatBlock", tag);
  }

  function selectPatient(passport: string) {
    if (!passport) {
      setPatient(emptyPatient);
      selectSharedPatient(null);
      return;
    }
    const found = patientOptions.find((item) => item.passport === passport);
    if (found) {
      setPatient(found);
      selectSharedPatient(found);
    }
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
        tone: "warning",
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
    setSignatureImage(null);
    setSelectedDoctorId(selected.id);
  }

  function changeExamName(value: string) {
    setExamNameInput(value);
    const normalized = value.trim().toLowerCase();
    if (!normalized) return;
    const match = intelligentExamModels.find(
      (exam) => exam.nome.toLowerCase() === normalized,
    ) || intelligentExamModels.find((exam) => exam.nome.toLowerCase().includes(normalized));
    if (!match) return;
    setSelectedExamId(match.id);
    setSelectedCategory(match.categoria);
    setAdaptiveConfig(createInitialAdaptiveConfiguration(match));
  }

  function changeCategory(category: string) {
    setSelectedCategory(category);
    setCatalogCategory(category);
    const first = intelligentExamModels.find(
      (exam) => exam.categoria === category,
    );
    if (first) {
      setSelectedExamId(first.id);
      setExamNameInput(first.nome);
      setAdaptiveConfig(createInitialAdaptiveConfiguration(first));
    }
  }

  function changeExam(id: string) {
    const model = getIntelligentExamModel(id);
    if (!model) return;
    setSelectedExamId(model.id);
    setSelectedCategory(model.categoria);
    setExamNameInput(model.nome);
    setAdaptiveConfig(createInitialAdaptiveConfiguration(model));
  }

  function applyModelFor(model: IntelligentExamModel) {
    const nextConfig = createInitialAdaptiveConfiguration(model);
    const resolved = resolveAdaptiveExam(model, nextConfig);
    const generated = renderAdaptiveExamReport(resolved);

    setSelectedExamId(model.id);
    setSelectedCategory(model.categoria);
    setCatalogCategory(model.categoria);
    setExamNameInput(model.nome);
    setAdaptiveConfig(nextConfig);
    setSmartConfigOpen(true);
    setShowCatalog(false);

    const currentText = textFromHtml(
      editorRef.current?.innerHTML || editorHtmlRef.current,
    );

    if (currentText.length > 8) {
      setAppDialog({
        title: "Aplicar modelo",
        message: "O editor já possui conteúdo. Escolha se deseja substituir o laudo atual ou inserir o modelo no ponto do cursor.",
        tone: "info",
        actions: [
          { label: "Cancelar", onClick: () => setAppDialog(null) },
          { label: "Inserir no cursor", onClick: () => { setAppDialog(null); insertHtml(generated); } },
          { label: "Substituir laudo", variant: "primary", onClick: () => { setAppDialog(null); setEditorContent(generated, { moveCaretToEnd: true }); } },
        ],
      });
      return;
    }

    setEditorContent(generated, { moveCaretToEnd: true });
  }

  function updateConfig(partial: Partial<AdaptiveExamConfiguration>) {
    if (!selectedExam) return;
    setAdaptiveConfig((current) => ({
      ...(current || createInitialAdaptiveConfiguration(selectedExam)),
      ...partial,
    }));
  }

  function updateVariable(key: string, value: string | boolean) {
    if (!selectedExam) return;
    setAdaptiveConfig((current) => {
      const base = current || createInitialAdaptiveConfiguration(selectedExam);
      return { ...base, variables: { ...base.variables, [key]: value } };
    });
  }

  function useModel() {
    setShowCatalog((current) => !current);
  }

  function clearSelectedModel() {
    setSmartConfigOpen(false);
    setShowCatalog(true);
    setExamSearch("");
  }

  function refreshFindings() {
    if (!resolvedExam) return;
    const generated = renderAdaptiveExamReport(resolvedExam);
    const current = editorRef.current?.innerHTML || editorHtmlRef.current;
    const merged = mergeAutomaticBlocks(current, generated);
    setEditorContent(merged, { moveCaretToEnd: true });
  }

  function clearEditor() {
    setEditorContent("", { moveCaretToEnd: true });
  }

  function clearAll() {
    setAppDialog({
      title: "Limpar exame",
      message: "Deseja limpar todo o exame atual? Essa ação remove o rascunho local e reinicia os dados da tela.",
      tone: "danger",
      actions: [
        { label: "Cancelar", onClick: () => setAppDialog(null) },
        {
          label: "Limpar tudo",
          variant: "danger",
          onClick: () => {
            setAppDialog(null);
            setPatient(emptyPatient);
            setDoctor(initialDoctor);
            setSelectedDoctorId("current-user");
            setProtocol(createProtocol());
            setEditorContent("", { moveCaretToEnd: true });
            removeDraft();
            setAttachments([]);
            setAttachmentOverrideActive(false);
            setAutomaticAttachmentRemoved(false);
            setSaveStatus("Limpo");
            setLastSavedAt("");
          },
        },
      ],
    });
  }


  function formatAttachmentSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }

  function processAttachmentFiles(files: File[], mode: "replace" | "append") {
    const readers = files.map(
      (file) =>
        new Promise<RenderAttachmentFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
              name: file.name,
              url: String(reader.result || ""),
              size: formatAttachmentSize(file.size),
            });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers)
      .then((items) => {
        if (mode === "replace") {
          setAttachments(items);
          setAttachmentOverrideActive(true);
        } else {
          setAttachments((current) => [...current, ...items]);
        }
        setSaveStatus("Salvando...");
      })
      .catch(() => {
        setAppDialog({
          title: "Não foi possível anexar",
          message: "Um dos arquivos não pôde ser lido. Tente novamente com imagem ou PDF em tamanho menor.",
          tone: "warning",
          actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
        });
      });
  }

  function addAttachmentFiles(files: FileList | null) {
    if (!files?.length) return;

    const selectedFiles = Array.from(files);
    const shouldAsk = !!automaticAttachment || attachments.length > 0;
    if (!shouldAsk) {
      processAttachmentFiles(selectedFiles, "append");
      return;
    }

    setAppDialog({
      title: "Como deseja inserir o anexo?",
      message: "Você pode substituir o anexo exibido atualmente ou adicionar o novo arquivo em uma nova página do exame.",
      actions: [
        { label: "Cancelar", onClick: () => setAppDialog(null) },
        {
          label: "Substituir atual",
          variant: "primary",
          onClick: () => {
            setAppDialog(null);
            processAttachmentFiles(selectedFiles, "replace");
          },
        },
        {
          label: "Adicionar em nova página",
          onClick: () => {
            setAppDialog(null);
            processAttachmentFiles(selectedFiles, "append");
          },
        },
      ],
    });
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const next = current.filter((item) => item.id !== id);
      if (!next.length) setAttachmentOverrideActive(false);
      return next;
    });
    setSaveStatus("Salvando...");
  }

  function buildPreviewDocument() {
    const html = cleanEditorHtml(
      editorRef.current?.innerHTML || editorHtmlRef.current,
    );
    const document = createFinalExamDocument({
      metadata,
      reportHtml: html,
      manualAttachments: attachments,
      resolvedExam,
      automaticAttachments: effectiveAutomaticAttachment ? [effectiveAutomaticAttachment] : undefined,
    });
    return document;
  }


  function openExamPreview() {
    syncEditorFromDom();
    const document = buildPreviewDocument();
    setPreviewImage(null);
    setPreview({ open: true, document, pageIndex: 0 });
  }

  async function saveExam() {
    try {
      if (!patient.passport?.trim() || !patient.name?.trim()) throw new Error("Selecione ou cadastre o paciente antes de salvar.");
      if (patient.name.trim().toLowerCase() === doctor.name.trim().toLowerCase()) throw new Error("Paciente e médico responsável não podem ser o mesmo registro.");
      syncEditorFromDom();
      const document = buildPreviewDocument();
      const savedAt = new Date().toISOString();
      const html = editorRef.current?.innerHTML || editorHtmlRef.current;

      try {
        saveDraft({
          patient,
          doctor,
          selectedDoctorId,
          selectedExamId: selectedExam?.id || selectedExamId,
          adaptiveConfig,
          html,
          protocol,
          attachments,
          savedAt,
        });
      } catch {
        // Anexos em base64 podem ultrapassar o limite do localStorage. O exame
        // continua sendo salvo no banco e a visualização não é bloqueada.
        saveDraft({
          patient,
          doctor,
          selectedDoctorId,
          selectedExamId: selectedExam?.id || selectedExamId,
          adaptiveConfig,
          html,
          protocol,
          attachments: [],
          savedAt,
        });
      }

      const client = createClient();
      if (client) {
        const recordId = `exam-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const previewImages = (await Promise.all(
          document.pages.map((_, pageIndex) => renderPreviewPage(document, pageIndex, false)),
        )).filter((item): item is string => typeof item === "string" && item.startsWith("data:image/"));
        const payload = {
          protocol,
          patient,
          doctor,
          examId: selectedExam?.id || selectedExamId,
          examName: metadata.examName,
          reportHtml: html,
          previewImage: previewImages[0] || null,
          previewImages,
          attachments: attachments.map(({ id, name, size }) => ({ id, name, size })),
          savedAt,
        };
        const { error } = await client.from("clinical_records").insert({
          id: recordId,
          patient_passport: patient.passport || null,
          record_type: "Exame",
          is_confidential: isConfidential,
          released_at: isConfidential ? null : new Date().toISOString(),
          payload,
        });
        if (error) throw error;
      }

      const time = new Date(savedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSavedAt(time);
      setSaveStatus(`Salvo às ${time}`);
      setPreviewImage(null);
      setPreview({ open: true, document, pageIndex: 0 });
      registerSystemActivity({ module: "Exames", action: "Exame salvo", description: `${metadata.examName} salvo para ${patient.name || "paciente não informado"}.`, actor: currentUserProfile.systemName, reference: currentUserProfile.passport });
    } catch (error) {
      console.error("[HPSR][Exames] Falha ao salvar ou preparar o preview:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido ao salvar o exame.";
      setSaveStatus("Falha ao salvar");
      setAppDialog({
        title: "Não foi possível salvar o exame",
        message,
        tone: "danger",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
    }
  }

  async function renderPreviewPage(
    finalDocument: RenderedExamDocument,
    pageIndex: number,
    download = false,
  ) {
    const page = finalDocument.pages[pageIndex];
    if (!page) return;

    const canvas = window.document.createElement("canvas");
    canvas.width = 794;
    canvas.height = 1123;
    const context = canvas.getContext("2d");
    if (!context) return;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
      });

    const normalizeSignatureImage = (image: HTMLImageElement) => {
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
    };

    const drawImageContain = (
      image: HTMLImageElement | HTMLCanvasElement,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      const ratio = Math.min(width / image.width, height / image.height);
      const drawWidth = image.width * ratio;
      const drawHeight = image.height * ratio;
      const drawX = x + (width - drawWidth) / 2;
      const drawY = y + (height - drawHeight) / 2;
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    };

    const drawWrappedText = (
      value: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
      maxY: number,
    ) => {
      const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
      if (!words.length) return y;
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
    };

    const htmlText = (node: Element) =>
      (node.textContent || "").replace(/\s+/g, " ").trim();

    const drawReportHtml = (html: string, x: number, y: number, width: number, maxY: number) => {
      const wrapper = window.document.createElement("div");
      wrapper.innerHTML = html || "";
      const blocks = Array.from(wrapper.children);
      context.textBaseline = "top";
      for (const block of blocks) {
        if (y > maxY - 24) break;
        const tag = block.tagName.toLowerCase();
        if (/^h[1-3]$/.test(tag)) {
          context.fillStyle = "#5b1809";
          context.font = tag === "h1" ? "700 15px Georgia" : "700 13px Georgia";
          const text = htmlText(block).toUpperCase();
          y += 6;
          y = drawWrappedText(text, x, y, width, tag === "h1" ? 19 : 17, maxY);
          context.strokeStyle = "rgba(91,24,9,0.22)";
          context.beginPath();
          context.moveTo(x, y + 2);
          context.lineTo(x + width, y + 2);
          context.stroke();
          y += 10;
          continue;
        }

        if (tag === "table") {
          const rows = Array.from(block.querySelectorAll("tr"));
          if (!rows.length) continue;
          const firstCells = Array.from(rows[0].querySelectorAll("th,td"));
          const colCount = Math.max(firstCells.length, 1);
          const colWidth = width / colCount;
          context.font = "12px Georgia";
          context.lineWidth = 1;
          for (const [rowIndex, row] of rows.entries()) {
            const cells = Array.from(row.querySelectorAll("th,td"));
            const rowHeight = Math.max(26, ...cells.map((cell) => Math.ceil(htmlText(cell).length / 22) * 14 + 12));
            if (y + rowHeight > maxY) return y;
            cells.forEach((cell, cellIndex) => {
              const cx = x + cellIndex * colWidth;
              context.fillStyle = rowIndex === 0 ? "rgba(91,24,9,0.10)" : "rgba(255,255,255,0.70)";
              context.fillRect(cx, y, colWidth, rowHeight);
              context.strokeStyle = "rgba(91,24,9,0.22)";
              context.strokeRect(cx, y, colWidth, rowHeight);
              context.fillStyle = "#4b2118";
              context.font = rowIndex === 0 ? "700 12px Georgia" : "12px Georgia";
              drawWrappedText(htmlText(cell), cx + 6, y + 7, colWidth - 12, 14, y + rowHeight - 2);
            });
            y += rowHeight;
          }
          y += 12;
          continue;
        }

        if (tag === "ul" || tag === "ol") {
          const items = Array.from(block.querySelectorAll("li"));
          context.fillStyle = "#4b2118";
          context.font = "12px Georgia";
          items.forEach((item, index) => {
            if (y > maxY - 18) return;
            context.fillText(tag === "ol" ? `${index + 1}.` : "•", x, y);
            y = drawWrappedText(htmlText(item), x + 18, y, width - 18, 16, maxY);
          });
          y += 6;
          continue;
        }

        const text = htmlText(block);
        if (!text) {
          y += 10;
          continue;
        }
        context.fillStyle = "#4b2118";
        context.font = "12px Georgia";
        y = drawWrappedText(text, x, y, width, 16, maxY) + 4;
      }
      return y;
    };

    const drawFooter = async () => {
      context.fillStyle = "rgba(255,250,244,0.98)";
      context.fillRect(42, 985, 710, 126);
      context.strokeStyle = "rgba(91,24,9,0.20)";
      context.beginPath();
      context.moveTo(42, 985);
      context.lineTo(752, 985);
      context.stroke();

      const signature = finalDocument.metadata.signatureImage
        ? await loadImage(finalDocument.metadata.signatureImage)
        : null;
      if (signature) {
        const normalizedSignature = normalizeSignatureImage(signature);
        drawImageContain(normalizedSignature as HTMLCanvasElement, 237, 993, 320, 64);
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
      context.fillText(`Dr(a). ${finalDocument.metadata.doctor.name || "Nome do médico"}`, 397, 1066);
      context.font = "9px Georgia";
      context.fillText(`CRM: ${finalDocument.metadata.doctor.crm || "000000"}`, 397, 1082);

      context.strokeStyle = "rgba(91,24,9,0.20)";
      context.beginPath();
      context.moveTo(42, 1092);
      context.lineTo(752, 1092);
      context.stroke();
      context.textAlign = "left";
      context.fillStyle = "#7a5148";
      context.font = "8.5px Georgia";
      context.fillText("Hospital São Rafael", 42, 1101);
      context.textAlign = "center";
      context.fillText(`Emitido em ${formatDateBR(finalDocument.metadata.date)} · Código interno: ${finalDocument.metadata.protocol || "-"}`, 397, 1101);
      context.textAlign = "right";
      context.fillText(`Página ${pageIndex + 1}/${finalDocument.pages.length}`, 752, 1101);
      context.textAlign = "left";
    };

    try {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const background = await loadImage("/modelo-documento-hpsr.png");
      if (background) context.drawImage(background, 0, 0, canvas.width, canvas.height);

      context.textBaseline = "top";
      context.fillStyle = "#5b1809";
      context.font = "12px Georgia";

      if (pageIndex === 0) {
        context.textAlign = "right";
        context.fillText(`Data da Emissão: ${formatDateBR(finalDocument.metadata.date)}`, 766, 39);
        context.fillStyle = "#b1adac";
        context.font = "11px Georgia";
        context.fillText(`Protocolo: ${finalDocument.metadata.protocol || "-"}`, 766, 59);
        context.textAlign = "center";
        context.fillStyle = "#5b1809";
        context.font = "700 14px Georgia";
        context.strokeStyle = "#5b1809";
        context.beginPath();
        context.roundRect(266, 113, 262, 23, 12);
        context.stroke();
        context.fillText(finalDocument.metadata.examName || "EXAME", 397, 117);
        context.strokeStyle = "#5b1809";
        context.beginPath();
        context.roundRect(28, 158, 738, 90, 16);
        context.stroke();
        context.font = "14px Georgia";
        context.fillText("IDENTIFICAÇÃO DO PACIENTE", 397, 169);
        context.textAlign = "left";
        context.font = "12px Georgia";
        context.fillText(`Nome: ${finalDocument.metadata.patient.name || "-"}`, 42, 200);
        context.fillText(`Passaporte: ${finalDocument.metadata.patient.passport || "-"}`, 361, 200);
        context.fillText(`Tipo Sanguíneo: ${finalDocument.metadata.patient.bloodType || "-"}`, 635, 200);
        context.fillText(`Idade: ${finalDocument.metadata.patient.age || "-"}`, 42, 224);
        drawReportHtml(page.reportHtml || "", 42, 283, 710, 975);
      } else if (page.type === "report") {
        drawReportHtml(page.reportHtml || "", 42, 107, 710, 975);
      } else if (page.type === "auto-attachment" && page.automaticAttachment) {
        const attachment = page.automaticAttachment;
        const image = attachment.imageUrl ? await loadImage(attachment.imageUrl) : null;
        if (image) {
          drawImageContain(image, 42, 107, 710, 860);
        } else {
          context.fillStyle = "rgba(255,255,255,0.76)";
          context.strokeStyle = "rgba(91,24,9,0.25)";
          context.beginPath();
          context.roundRect(42, 107, 710, 760, 18);
          context.fill();
          context.stroke();
          context.textAlign = "center";
          context.fillStyle = "#7a5148";
          context.font = "13px Georgia";
          context.fillText("Imagem de anexo não definida.", 397, 470);
        }
      } else if (page.type === "manual-attachments") {
        const file = page.manualAttachments?.[0];
        const image = file?.url ? await loadImage(file.url) : null;
        if (image) {
          drawImageContain(image, 42, 107, 710, 860);
        } else {
          context.fillStyle = "rgba(255,255,255,0.76)";
          context.strokeStyle = "rgba(91,24,9,0.25)";
          context.beginPath();
          context.roundRect(42, 107, 710, 760, 18);
          context.fill();
          context.stroke();
          context.textAlign = "center";
          context.fillStyle = "#7a5148";
          context.font = "13px Georgia";
          context.fillText("Este anexo não é uma imagem visualizável.", 397, 470);
        }
      }

      await drawFooter();

      const dataUrl = canvas.toDataURL("image/png");
      if (!download) {
        setPreviewImage(dataUrl);
        return dataUrl;
      }
      const link = window.document.createElement("a");
      link.download = `${safeFileName(finalDocument.metadata.examName)}_pagina_${pageIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
      return dataUrl;
    } catch (error) {
      console.error("[HPSR][Exames] Falha ao renderizar o preview PNG:", error);
      showPngError(error);
    }
  }

  function downloadCurrentPreviewPage() {
    if (!preview.document) return;
    void renderPreviewPage(preview.document, preview.pageIndex, true);
  }

  useEffect(() => {
    if (!preview.open || !preview.document) {
      setPreviewImage(null);
      return;
    }
    setPreviewImage(null);
    void renderPreviewPage(preview.document, preview.pageIndex);
    // A renderização em canvas é deliberadamente a mesma usada no PNG.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.open, preview.document, preview.pageIndex]);

  function showPngError(error?: unknown) {
    const technicalMessage = error instanceof Error ? ` Detalhe: ${error.message}` : "";
    setAppDialog({
      title: "Exportação PNG",
      message: `Não foi possível gerar o PNG desta página. Tente novamente ou use Imprimir para salvar em PDF.${technicalMessage}`,
      tone: "warning",
      actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
    });
  }

  function printPreview() {
    window.print();
  }

  return (
    <div className="hpsr-page gap-3 text-hpsr-text xl:h-[calc(100dvh-2.4rem)] xl:min-h-0 xl:overflow-hidden">
      <div className="hpsr-topbar" />

      <section className="min-h-0 grid flex-1 gap-4 overflow-hidden xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[440px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto pr-1 xl:pr-2">
          <div className="rounded-[22px] border border-[#dfd1c5] bg-white p-3.5 shadow-[0_14px_34px_rgba(42,7,0,0.055)]">
            <PageHeader
              eyebrow="Exames"
              title="Editor de laudos"
              description="Motor inteligente para criar modelos clínicos editáveis."
            />


            <div className="space-y-3">
            <Panel title="Dados do paciente">
              <div className="space-y-3">
                <div>
                  <FieldLabel>Selecionar paciente</FieldLabel>
                  <div className="grid grid-cols-[1fr_44px] gap-2">
                    <SelectInput
                      value={patient.passport}
                      onChange={selectPatient}
                    >
                      <option value="">Paciente livre...</option>
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
                    <TextInput
                      value={patient.name}
                      onChange={(name) =>
                        setPatient((current) => ({ ...current, name }))
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <FieldLabel>Passaporte</FieldLabel>
                    <TextInput
                      value={patient.passport}
                      onChange={(passport) =>
                        setPatient((current) => ({ ...current, passport }))
                      }
                      placeholder="Nº"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel>Idade</FieldLabel>
                    <TextInput
                      value={patient.age}
                      onChange={(age) =>
                        setPatient((current) => ({ ...current, age }))
                      }
                      placeholder="Idade"
                    />
                  </div>
                  <div>
                    <FieldLabel>Tipo sanguíneo</FieldLabel>
                    <TextInput
                      value={patient.bloodType}
                      onChange={(bloodType) =>
                        setPatient((current) => ({ ...current, bloodType }))
                      }
                      placeholder="Ex.: B-"
                    />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Profissional responsável">
              <div className="space-y-3">
                <div>
                  <FieldLabel>Selecionar médico</FieldLabel>
                  <SelectInput value={selectedDoctorId} onChange={selectDoctor}>
                    {availableDoctors.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.crm}
                      </option>
                    ))}
                  </SelectInput>
                </div>
                <div className="grid grid-cols-[1fr_120px] gap-2 rounded-[15px] border border-[#e0c7b0] bg-white/70 p-2.5">
                  <div>
                    <FieldLabel>Médico</FieldLabel>
                    <p className="truncate text-sm font-black text-hpsr-text">{doctor.name || "-"}</p>
                    <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">
                      {availableDoctors.find((item) => item.id === selectedDoctorId)?.specialty || "Especialidade"}
                    </p>
                  </div>
                  <div>
                    <FieldLabel>CRM</FieldLabel>
                    <p className="text-sm font-black text-hpsr-text">{doctor.crm || "-"}</p>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Catálogo de exames">
              {smartConfigOpen && !showCatalog ? (
                <div className="rounded-[18px] border border-[#d7b796] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(42,7,0,0.05)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-hpsr-wine text-white">
                        {(() => { const ExamIcon = resolveExamIcon(selectedExam?.icone); return <ExamIcon size={20} strokeWidth={2.2} />; })()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-hpsr-text">{selectedExam?.nome || "Exame selecionado"}</p>
                        <p className="text-[11px] font-semibold text-hpsr-muted">{categoryLabels[selectedExam?.categoria || selectedCategory] || selectedCategory}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedModel}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-hpsr-wine text-white shadow-soft hover:bg-hpsr-wineDark"
                      aria-label="Fechar modelo selecionado"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2 rounded-[15px] border border-[#d8c1ad] bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <Search size={15} className="text-hpsr-muted" />
                    <input
                      value={examSearch}
                      onChange={(event) => setExamSearch(event.target.value)}
                      placeholder="Buscar exame..."
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-muted">
                      Categoria dos exames
                    </label>
                    <div className="relative flex h-11 items-center rounded-[14px] border border-[#d8c1ad] bg-white shadow-[0_4px_12px_rgba(42,7,0,0.035)] transition focus-within:border-hpsr-wine/55 focus-within:ring-2 focus-within:ring-hpsr-wine/10">
                      <div className="pointer-events-none flex h-full w-10 shrink-0 items-center justify-center border-r border-[#ead9ca] text-hpsr-wine">
                        <Table2 size={15} strokeWidth={2.2} />
                      </div>
                      <select
                        value={catalogCategory}
                        onChange={(event) => setCatalogCategory(event.target.value)}
                        aria-label="Filtrar catálogo por categoria"
                        className="h-full min-w-0 flex-1 appearance-none bg-transparent px-3 pr-10 text-sm font-black text-hpsr-text outline-none"
                      >
                        <option value="all">Todas as categorias</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {categoryLabels[category] || category}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 text-hpsr-muted" />
                    </div>
                  </div>

                  <div className="max-h-[430px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      {filteredCatalog.map((exam) => {
                        const isSelected = exam.id === selectedExam?.id;
                        const ExamIcon = resolveExamIcon(exam.icone);
                        return (
                          <button
                            key={exam.id}
                            type="button"
                            onClick={() => applyModelFor(exam)}
                            aria-pressed={isSelected}
                            className={`group relative min-h-[92px] overflow-hidden rounded-[16px] border p-3 text-left transition-all duration-200 ${isSelected ? "border-hpsr-wine bg-[linear-gradient(145deg,#fff7ec_0%,#ffedda_100%)] shadow-[0_10px_22px_rgba(103,38,20,0.12)] ring-1 ring-hpsr-wine/10" : "border-[#ddc7b4] bg-white shadow-[0_4px_12px_rgba(42,7,0,0.035)] hover:-translate-y-0.5 hover:border-hpsr-wine/40 hover:bg-[#fffaf4] hover:shadow-[0_10px_20px_rgba(42,7,0,0.08)]"}`}
                          >
                            <span className={`absolute inset-y-0 left-0 w-1 transition ${isSelected ? "bg-hpsr-wine" : "bg-transparent group-hover:bg-hpsr-wine/25"}`} />
                            <div className="flex h-full items-start gap-3">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border transition ${isSelected ? "border-hpsr-wine bg-hpsr-wine text-white shadow-[0_6px_12px_rgba(103,38,20,0.18)]" : "border-[#e5d2c1] bg-[#f8ecdf] text-hpsr-wine group-hover:border-hpsr-wine/25 group-hover:bg-[#f6e5d5]"}`}>
                                <ExamIcon size={20} strokeWidth={2.15} />
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <p className="mb-1 text-[9px] font-black uppercase tracking-[0.11em] text-hpsr-muted">
                                  {categoryLabels[exam.categoria] || exam.categoria}
                                </p>
                                <p className="line-clamp-3 text-[13px] font-black leading-[1.2] text-hpsr-text">
                                  {exam.nome}
                                </p>
                              </div>
                              {isSelected && (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-hpsr-wine text-white shadow-sm" aria-label="Selecionado">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </Panel>

            {smartConfigOpen && (
              <Panel title="Modo guiado">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 rounded-[15px] border border-[#e0c7b0] bg-white/70 p-2.5">
                    <div>
                      <FieldLabel>Exame</FieldLabel>
                      <p className="text-sm font-black text-hpsr-text">{selectedExam?.nome || "-"}</p>
                    </div>
                    <div>
                      <FieldLabel>Especialidade</FieldLabel>
                      <p className="text-sm font-black text-hpsr-text">{categoryLabels[selectedExam?.categoria || selectedCategory] || selectedCategory}</p>
                    </div>
                  </div>

                  {selectedExam?.adapter.enabled && adaptiveConfig && (
                    <div>
                      <FieldLabel>{selectedExam.adapter.label}</FieldLabel>
                      <SelectInput
                        value={adaptiveConfig.adapterValue}
                        onChange={(adapterValue) => updateConfig({ adapterValue })}
                      >
                        {selectedExam.adapter.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </SelectInput>
                    </div>
                  )}

                  {!!selectedExam?.clinicalContexts.length && adaptiveConfig && (
                    <div>
                      <FieldLabel>Contexto clínico</FieldLabel>
                      <SelectInput
                        value={adaptiveConfig.clinicalContext}
                        onChange={(clinicalContext) => updateConfig({ clinicalContext })}
                      >
                        {selectedExam.clinicalContexts.map((context) => (
                          <option key={context} value={context}>{context}</option>
                        ))}
                      </SelectInput>
                    </div>
                  )}

                  {selectedExam?.adapter.secondaryOptions?.length && adaptiveConfig && (
                    <div>
                      <FieldLabel>Contraste</FieldLabel>
                      <SelectInput
                        value={String(adaptiveConfig.variables.contraste || selectedExam.adapter.secondaryOptions[0] || "")}
                        onChange={(value) => updateVariable("contraste", value)}
                      >
                        {selectedExam.adapter.secondaryOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </SelectInput>
                    </div>
                  )}

                  {!!selectedExam?.profiles.length && adaptiveConfig && (
                    <div>
                      <FieldLabel>Perfil de resultado</FieldLabel>
                      <SelectInput
                        value={adaptiveConfig.profileId}
                        onChange={(profileId) => updateConfig({ profileId })}
                      >
                        {selectedExam.profiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>{profile.name}</option>
                        ))}
                      </SelectInput>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={refreshFindings}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#d8bfa9] bg-white px-3 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40 hover:bg-[#fff8f0]"
                  >
                    <RefreshCw size={15} /> Atualizar achados
                  </button>
                </div>
              </Panel>
            )}

            <Panel title="Anexos">
              <div className="space-y-3">
                {effectiveAutomaticAttachment && (
                  <div className="rounded-[16px] border border-blue-200 bg-blue-50/90 p-3 text-blue-950 shadow-[0_8px_18px_rgba(59,130,246,0.08)]">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-blue-700 ring-1 ring-blue-200">
                        <Scan size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.06em] text-hpsr-muted">Anexo automático</p>
                            <p className="mt-1 text-sm font-black text-hpsr-text">{effectiveAutomaticAttachment?.title}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAutomaticAttachmentRemoved(true);
                              setSaveStatus("Salvando...");
                            }}
                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] border border-red-200 bg-white px-2.5 text-[10px] font-black text-red-700 transition hover:bg-red-50"
                            aria-label="Remover anexo automático"
                          >
                            <X size={13} /> Remover
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">{effectiveAutomaticAttachment?.subtitle}</p>
                        <p className="mt-2 text-[11px] font-semibold leading-relaxed text-blue-800">{effectiveAutomaticAttachment?.legend}</p>
                      </div>
                    </div>
                  </div>
                )}

                {automaticAttachmentRemoved && automaticAttachment && (
                  <div className="flex items-center justify-between gap-3 rounded-[16px] border border-amber-200 bg-amber-50/90 px-3 py-2 text-[11px] font-semibold text-amber-800">
                    <span>O anexo automático foi removido deste exame.</span>
                    <button
                      type="button"
                      onClick={() => setAutomaticAttachmentRemoved(false)}
                      className="shrink-0 rounded-[10px] border border-amber-300 bg-white px-2.5 py-1.5 text-[10px] font-black text-amber-800 hover:bg-amber-100"
                    >
                      Restaurar
                    </button>
                  </div>
                )}

                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    addAttachmentFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-[15px] border border-dashed border-[#c79f85] bg-white/80 px-3 py-3 text-xs font-black text-hpsr-text transition hover:border-hpsr-wine/50 hover:bg-[#fff8ef]"
                >
                  <Upload size={16} /> Adicionar anexo
                </button>

                <div className="rounded-[16px] border border-blue-200/80 bg-blue-50/80 px-3 py-2 text-[11px] font-semibold leading-relaxed text-hpsr-muted">
                  A página de anexo usa uma única imagem centralizada. Ao adicionar uma nova imagem manual, ela será exibida como anexo visual do exame.
                </div>

                {attachmentOverrideActive && attachments.length > 0 && (
                  <div className="rounded-[16px] border border-amber-200 bg-amber-50/90 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-800">
                    O anexo manual está substituindo o anexo automático deste exame.
                  </div>
                )}

                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between gap-3 rounded-[15px] border border-[#e0c7b0] bg-white/80 p-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f4e3cf] text-hpsr-wine">
                            <Paperclip size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-hpsr-text">{attachment.name}</p>
                            <p className="text-[11px] font-semibold text-hpsr-muted">{attachment.size}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-hpsr-border bg-white text-hpsr-text hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                          aria-label="Remover anexo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[15px] border border-[#e0c7b0] bg-white/65 px-3 py-3 text-center text-xs font-semibold text-hpsr-muted">
                    Nenhum anexo adicionado.
                  </div>
                )}
              </div>
            </Panel>
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#ded0c4] bg-white shadow-[0_18px_46px_rgba(42,7,0,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ddc6b4] bg-white px-5 py-4">
            <div>
              <h2 className="text-xl font-black tracking-[-0.01em] text-hpsr-text">
                {selectedExam?.nome || "Exame livre"}
              </h2>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-hpsr-muted">
                Editor contínuo · preview institucional apenas ao salvar
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black text-hpsr-text">
              <ClinicalHistoryButton recordType="Exame" />
              <button
                type="button"
                onClick={() => setAttachmentEditorOpen((current) => !current)}
                className="rounded-full border border-[#dec8b6] bg-white px-3 py-2 text-xs font-black text-hpsr-text shadow-[0_4px_10px_rgba(42,7,0,0.04)] transition hover:border-hpsr-wine/40 hover:bg-[#fff8ef]"
              >
                Ver anexo
              </button>
              <span className="rounded-full border border-[#dec8b6] bg-white px-3 py-2 shadow-[0_4px_10px_rgba(42,7,0,0.04)]">
                {formatDateBR(todayISO())}
              </span>
            </div>
          </div>

          <div className="border-b border-[#ece4dd] bg-[#faf8f6] px-5 py-2.5 text-xs font-semibold text-hpsr-muted">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-hpsr-wine" />
              <span>Revise resultados, referências, interpretação e conclusão antes de salvar ou imprimir o laudo.</span>
            </div>
          </div>

          <Toolbar
            exec={exec}
            insertHtml={insertHtml}
            applyFormatBlock={applyFormatBlock}
            tablePickerOpen={tablePickerOpen}
            setTablePickerOpen={setTablePickerOpen}
            tableRows={tableRows}
            setTableRows={setTableRows}
            tableCols={tableCols}
            setTableCols={setTableCols}
            insertTable={insertTable}
          />

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#f2eee9] p-4">
            <div className="mx-auto min-h-full max-w-[1040px] rounded-[18px] border border-[#ddd3ca] bg-white p-8 shadow-[0_12px_30px_rgba(42,7,0,0.07)]">
              <div className="relative">
                {editorPageCount > 1 &&
                  Array.from({ length: editorPageCount - 1 }).map((_, index) => {
                    const pageNumber = index + 2;
                    const top = (index + 1) * EDITOR_PAGE_GUIDE_HEIGHT;
                    return (
                      <div
                        key={pageNumber}
                        className="pointer-events-none absolute left-0 right-0 z-10"
                        style={{ top }}
                      >
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wine/60">
                          <span className="h-px flex-1 border-t border-dashed border-hpsr-wine/25" />
                          <span className="rounded-full border border-hpsr-wine/20 bg-[#fff7ed]/95 px-3 py-1 shadow-[0_4px_12px_rgba(42,7,0,0.05)]">
                            Conteúdo continua na página {pageNumber}
                          </span>
                          <span className="h-px flex-1 border-t border-dashed border-hpsr-wine/25" />
                        </div>
                      </div>
                    );
                  })}
                {attachmentEditorOpen && (
                  <div className="mb-6 rounded-[20px] border border-blue-200 bg-blue-50/80 p-4 shadow-[0_12px_28px_rgba(59,130,246,0.10)]">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-blue-200 pb-3">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.08em] text-blue-950">Editor de anexos</p>
                        <p className="mt-1 text-xs font-semibold text-hpsr-muted">Revise ou complemente a folha de anexo que será enviada junto ao laudo.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachmentEditorOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-hpsr-muted ring-1 ring-blue-200 hover:bg-blue-100"
                        aria-label="Fechar editor de anexos"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {effectiveAutomaticAttachment ? (
                      <div className="rounded-[18px] border border-[#d7c3b8] bg-white p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white">
                            <Scan size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-hpsr-text">{effectiveAutomaticAttachment?.title}</p>
                            <p className="mt-1 text-xs font-semibold text-hpsr-muted">{effectiveAutomaticAttachment?.subtitle}</p>
                          </div>
                        </div>
                        <div className="mt-4 rounded-[18px] border border-[#1f2937]/20 bg-[#050505] p-2">
                          {effectiveAutomaticAttachment?.imageUrl ? (
                            <img
                              src={effectiveAutomaticAttachment?.imageUrl}
                              alt={effectiveAutomaticAttachment?.title || "Anexo"}
                              className="block aspect-[4/3] w-full rounded-[14px] object-contain"
                            />
                          ) : (
                            <div className="flex aspect-[4/3] items-center justify-center rounded-[14px] border border-dashed border-white/30 text-xs font-semibold text-white/70">
                              Imagem automática não definida.
                            </div>
                          )}
                        </div>
                        <p className="mt-3 rounded-[14px] border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-hpsr-muted">
                          A página de anexo usa apenas uma imagem centralizada. O texto técnico do exame permanece no laudo principal.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-[16px] border border-blue-200 bg-white/80 px-4 py-4 text-sm font-semibold text-hpsr-muted">
                        {attachmentOverrideActive && attachments.length > 0 ? "O anexo automático foi substituído por anexo manual. Use a lista à esquerda para revisar os arquivos enviados." : "Nenhum anexo automático disponível para o exame atual. Use a área Anexos à esquerda para adicionar arquivos manualmente."}
                      </div>
                    )}
                  </div>
                )}

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncEditorFromDom}
                  onKeyUp={rememberSelection}
                  onMouseUp={rememberSelection}
                  onBlur={rememberSelection}
                  onFocus={rememberSelection}
                  className="hpsr-continuous-editor min-h-[740px] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ddc6b4] bg-[#fcfaf8] px-5 py-3.5">
            <label className="inline-flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">
              <input type="checkbox" checked={isConfidential} onChange={(event) => setIsConfidential(event.target.checked)} />
              Sigilo no Portal do Paciente
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearEditor}
                className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
              >
                <Trash2 size={15} /> Limpar editor
              </button>
              <button
                type="button"
                onClick={refreshFindings}
                className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
              >
                <RefreshCw size={15} /> Atualizar
              </button>

              <button
                type="button"
                onClick={openExamPreview}
                className="inline-flex h-10 items-center gap-2 rounded-[13px] bg-hpsr-wine px-5 text-xs font-black text-white shadow-soft hover:bg-hpsr-wineDark"
              >
                <Save size={16} /> Pré-visualizar
              </button>
            </div>
          </div>
        </main>
      </section>

      {preview.open && preview.document && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f0805]/60 p-4 backdrop-blur-md">
          <div className="flex h-[min(94dvh,980px)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-[#fffaf4] shadow-[0_24px_70px_rgba(42,7,0,0.32)]">
            <div className="flex items-center justify-between gap-3 border-b border-hpsr-border bg-white px-4 py-3">
              <div>
                <h3 className="text-lg font-black uppercase text-hpsr-text">
                  {metadata.examName}
                </h3>
                <p className="text-xs font-bold text-hpsr-muted">
                  {preview.document.pages[preview.pageIndex]?.label ||
                    "Página 1 de 1"}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPreview({ open: false, document: null, pageIndex: 0 })
                }
                className="rounded-full bg-hpsr-wine px-4 py-2 text-xs font-black text-white"
              >
                <X size={14} className="inline" /> Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[url('/exames-preview-bg.png')] bg-repeat p-6">
              <div className="mx-auto w-fit">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={`Pré-visualização fiel da página ${preview.pageIndex + 1}`}
                    className="block h-auto w-[794px] max-w-full bg-white shadow-[0_22px_70px_rgba(71,20,9,0.22)]"
                  />
                ) : (
                  <div className="flex h-[720px] w-[510px] max-w-full items-center justify-center bg-white text-sm font-bold text-hpsr-muted shadow-[0_22px_70px_rgba(71,20,9,0.22)]">
                    Gerando pré-visualização...
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hpsr-border bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={preview.pageIndex === 0}
                  onClick={() =>
                    setPreview((current) => ({
                      ...current,
                      pageIndex: Math.max(0, current.pageIndex - 1),
                    }))
                  }
                  className="h-10 rounded-[12px] border border-hpsr-border bg-white px-4 text-xs font-black disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="rounded-full bg-hpsr-wine px-4 py-2 text-xs font-black text-white">
                  {preview.pageIndex + 1}
                </span>
                <button
                  type="button"
                  disabled={
                    preview.pageIndex >= preview.document.pages.length - 1
                  }
                  onClick={() =>
                    setPreview((current) => ({
                      ...current,
                      pageIndex: Math.min(
                        (current.document?.pages.length || 1) - 1,
                        current.pageIndex + 1,
                      ),
                    }))
                  }
                  className="h-10 rounded-[12px] border border-hpsr-border bg-white px-4 text-xs font-black disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPreview({ open: false, document: null, pageIndex: 0 })
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text"
                >
                  <Eye size={15} /> Editar
                </button>
                <button
                  type="button"
                  onClick={downloadCurrentPreviewPage}
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-hpsr-wine px-4 text-xs font-black text-white"
                >
                  <Download size={15} /> Download PNG
                </button>
                <button
                  type="button"
                  onClick={saveExam}
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-hpsr-wine px-4 text-xs font-black text-white"
                >
                  <Save size={15} /> Salvar no sistema
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

      <AppDialog dialog={appDialog} onClose={() => setAppDialog(null)} />

      <style jsx global>{`
        .hpsr-continuous-editor {
          color: #2a0700;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 15px;
          line-height: 1.72;
          letter-spacing: 0.002em;
        }
        .hpsr-continuous-editor:empty:before {
          content: "Digite o laudo livremente ou use um modelo inteligente...";
          color: #a68d82;
          font-family: var(--font-hpsr), Roboto, sans-serif;
          font-weight: 700;
        }
        .hpsr-continuous-editor h1,
        .hpsr-continuous-editor h2,
        .hpsr-continuous-editor h3 {
          color: #672614;
          font-family: var(--font-hpsr), Roboto, sans-serif;
          font-weight: 900;
          line-height: 1.25;
          margin: 1rem 0 0.45rem;
        }
        .hpsr-continuous-editor h1 {
          font-size: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .hpsr-continuous-editor h2 {
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid rgba(103, 38, 20, 0.18);
          padding-bottom: 0.25rem;
        }
        .hpsr-continuous-editor h3 {
          font-size: 0.94rem;
        }
        .hpsr-continuous-editor p {
          margin: 0.65rem 0;
        }
        .hpsr-continuous-editor ul,
        .hpsr-continuous-editor ol {
          margin: 0.55rem 0 0.55rem 1.25rem;
        }
        .hpsr-continuous-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 14px;
          border-radius: 12px;
          overflow: hidden;
        }
        .hpsr-continuous-editor th {
          background: rgba(103, 38, 20, 0.1);
          color: #672614;
          font-weight: 900;
          text-align: left;
        }
        .hpsr-continuous-editor td,
        .hpsr-continuous-editor th {
          border: 1px solid rgba(103, 38, 20, 0.22);
          padding: 0.45rem 0.55rem;
          vertical-align: top;
        }
        .hpsr-continuous-editor blockquote {
          border-left: 4px solid rgba(103, 38, 20, 0.35);
          background: #fff8f0;
          margin: 0.8rem 0;
          padding: 0.55rem 0.8rem;
          color: #5d4038;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .hpsr-render-page,
          .hpsr-render-page * {
            visibility: visible;
          }
          .hpsr-render-page {
            position: fixed !important;
            inset: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const Icon = resolvePanelIcon(title);
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#e4d8ce] bg-white shadow-[0_8px_22px_rgba(42,7,0,0.04)]">
      <div className="flex items-center gap-2.5 border-b border-[#eee5dd] bg-[#fcfaf8] px-3.5 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f7e9df] text-hpsr-wine ring-1 ring-[#ead7c8]">
          <Icon size={15} strokeWidth={2.3} />
        </span>
        <h3 className="text-[12px] font-black uppercase tracking-[0.08em] text-hpsr-text">{title}</h3>
      </div>
      <div className="space-y-3 p-3.5">{children}</div>
    </section>
  );
}


function SoftBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#e2ccb9] bg-white/90 px-3 py-2 shadow-[0_6px_16px_rgba(42,7,0,0.04)]">
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8a6355]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-hpsr-text">{value || "-"}</p>
    </div>
  );
}

function Toolbar({
  exec,
  insertHtml,
  applyFormatBlock,
  tablePickerOpen,
  setTablePickerOpen,
  tableRows,
  setTableRows,
  tableCols,
  setTableCols,
  insertTable,
}: {
  exec: (command: string, value?: string) => void;
  insertHtml: (html: string) => void;
  applyFormatBlock: (tag: string) => void;
  tablePickerOpen: boolean;
  setTablePickerOpen: (value: boolean) => void;
  tableRows: number;
  setTableRows: (value: number) => void;
  tableCols: number;
  setTableCols: (value: number) => void;
  insertTable: (rows?: number, cols?: number) => void;
}) {
  function color(event: ChangeEvent<HTMLInputElement>) {
    exec("foreColor", event.target.value);
  }

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-[#d8c1ad] bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ef_100%)] px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-1 rounded-[14px] border border-[#dcc5b0] bg-white/85 p-1 shadow-[0_4px_10px_rgba(42,7,0,0.04)]">
        <Button onClick={() => exec("undo")} title="Desfazer">
          ↶
        </Button>
        <Button onClick={() => exec("redo")} title="Refazer">
          ↷
        </Button>
      </div>
      <div className="flex items-center gap-1 rounded-[14px] border border-[#dcc5b0] bg-white/85 p-1 shadow-[0_4px_10px_rgba(42,7,0,0.04)]">
        <Button onClick={() => applyFormatBlock("h1")}>
          <Type size={14} /> Título
        </Button>
        <Button onClick={() => applyFormatBlock("h2")}>Seção</Button>
        <Button onClick={() => applyFormatBlock("p")}>Texto</Button>
      </div>
      <div className="flex items-center gap-1 rounded-[14px] border border-[#dcc5b0] bg-white/85 p-1 shadow-[0_4px_10px_rgba(42,7,0,0.04)]">
        <label className="inline-flex h-9 items-center gap-2 rounded-[12px] border border-hpsr-border bg-white/85 px-2 text-xs font-black text-hpsr-text">
          <Type size={15} />
          <select
            defaultValue="3"
            onChange={(event) => exec("fontSize", event.target.value)}
            className="h-7 min-w-[96px] bg-transparent text-xs font-black text-hpsr-text outline-none"
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
      </div>
      <div className="flex items-center gap-1 rounded-[14px] border border-[#dcc5b0] bg-white/85 p-1 shadow-[0_4px_10px_rgba(42,7,0,0.04)]">
        <Button onClick={() => exec("bold")}>
          <Bold size={15} />
        </Button>
        <Button onClick={() => exec("italic")}>
          <Italic size={15} />
        </Button>
        <Button onClick={() => exec("underline")}>
          <Underline size={15} />
        </Button>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[12px] border border-hpsr-border bg-white/85 px-3 text-xs font-black text-hpsr-text">
          <Highlighter size={15} />
          <input
            type="color"
            onChange={color}
            className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>
      <div className="flex items-center gap-1 rounded-[14px] border border-[#dcc5b0] bg-white/85 p-1 shadow-[0_4px_10px_rgba(42,7,0,0.04)]">
        <Button onClick={() => exec("justifyLeft")}>
          <AlignLeft size={15} />
        </Button>
        <Button onClick={() => exec("justifyCenter")}>
          <AlignCenter size={15} />
        </Button>
        <Button onClick={() => exec("justifyRight")}>
          <AlignRight size={15} />
        </Button>
        <Button onClick={() => exec("insertUnorderedList")}>
          <List size={15} />
        </Button>
        <Button onClick={() => exec("insertOrderedList")}>
          <ListOrdered size={15} />
        </Button>
      </div>
      <div className="relative flex items-center gap-1 rounded-[13px] border border-[#d8bfa9] bg-[#fff3e3] p-1">
        <Button onClick={() => setTablePickerOpen(!tablePickerOpen)}>
          <Table2 size={15} /> Tabela <ChevronDown size={13} />
        </Button>
        {tablePickerOpen && (
          <div className="absolute left-0 top-12 z-20 w-64 rounded-[16px] border border-[#d8bfa9] bg-white p-3 shadow-soft">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.04em] text-hpsr-text">
              Inserir tabela
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-bold text-hpsr-muted">
                Linhas
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={tableRows}
                  onChange={(event) =>
                    setTableRows(Number(event.target.value) || 1)
                  }
                  className="mt-1 h-9 w-full rounded-[10px] border border-[#d8bfa9] px-2 font-black text-hpsr-text"
                />
              </label>
              <label className="text-xs font-bold text-hpsr-muted">
                Colunas
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={tableCols}
                  onChange={(event) =>
                    setTableCols(Number(event.target.value) || 1)
                  }
                  className="mt-1 h-9 w-full rounded-[10px] border border-[#d8bfa9] px-2 font-black text-hpsr-text"
                />
              </label>
            </div>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertTable(tableRows, tableCols)}
              className="mt-3 h-10 w-full rounded-[12px] bg-hpsr-wine text-xs font-black text-white"
            >
              Inserir
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 rounded-[14px] border border-[#dcc5b0] bg-white/85 p-1 shadow-[0_4px_10px_rgba(42,7,0,0.04)]">
        <Button
          onClick={() =>
            insertHtml("<blockquote>Observação: </blockquote><p><br></p>")
          }
        >
          Observação
        </Button>
        <Button
          onClick={() => insertHtml("<p><strong>Conclusão:</strong> </p>")}
        >
          Conclusão
        </Button>
      </div>
    </div>
  );
}
