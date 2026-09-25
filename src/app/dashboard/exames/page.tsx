"use client";

import { brazilDate, brazilIso } from "@/lib/brazil-datetime";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { EditorFontSizeMenu } from "@/components/ui/EditorFontSizeMenu";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Activity,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baby,
  Beaker,
  Bold,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Droplets,
  Dna,
  Ear,
  Eye,
  FileSignature,
  FileText,
  FlaskConical,
  Hand,
  Heart,
  HeartPulse,
  Highlighter,
  ClipboardPaste,
  Eraser,
  CaseUpper,
  CaseLower,
  Info,
  Italic,
  List,
  ListOrdered,
  Microscope,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Save,
  Scan,
  ShieldCheck,
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
  UserRound,
  Wand2,
  Waves,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { hpsrSuccess } from "@/components/ui/HpsrToastProvider";
import { ClinicalHistoryPanel } from "@/components/dashboard/ClinicalHistoryPanel";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { normalizeXrayKey, resolveXrayAttachmentAsset } from "@/lib/xray-attachment-resolver";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { createClient } from "@/lib/supabase";
import { drawRichTextElement, measureRichTextElement } from "@/lib/rich-text-canvas";
import { handleRichEditorTableKeyDown } from "@/lib/rich-editor-behavior";
import { registerSystemActivity } from "@/lib/administrative-storage";
import {
  createInitialAdaptiveConfiguration,
  nextAdaptiveGenerationSeed,
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
  resolveIntelligentExamModel,
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
  manualExamDateTime?: boolean;
  examDate?: string;
  examTime?: string;
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
  obstetricia: "Gestação",
  pediatria: "Pediatria",
  neonatal: "Recém-nascido",
  oftalmologia: "Oftalmologia",
  dermatologia: "Dermatologia",
  hormonal: "Hormônios e fertilidade",
  genetico: "Genética",
  genetica: "Genética",
  funcional: "Testes funcionais",
  psicologia_psiquiatria: "Psicotécnico",
  toxicologia: "Toxicologia",
};

const categoryIconMap: Record<string, LucideIcon> = {
  laboratorio: FlaskConical,
  imagem: Scan,
  cardiologia: HeartPulse,
  neurologia: Brain,
  ginecologia: Stethoscope,
  obstetricia: Baby,
  pediatria: Baby,
  neonatal: Baby,
  oftalmologia: Eye,
  dermatologia: Hand,
  hormonal: Droplets,
  genetico: Dna,
  genetica: Dna,
  funcional: Activity,
  psicologia_psiquiatria: Brain,
  toxicologia: Beaker,
};

const examSearchAliases: Record<string, string> = {
  lab_beta_hcg_completo: "gravidez gestação gestante beta hcg positivo negativo semanas",
  gineco_usg_monitorizacao_folicular: "fertilização fertilizacao fiv folículos foliculos ovulação ovulacao endométrio endometrio transvaginal doadora receptora",
  hormonal_painel_hormonal_completo: "fertilidade fiv ciclo menstrual hormônios hormonios",
  hormonal_amh: "fertilidade reserva ovariana fiv folículos foliculos",
  psiquiatria_psicotecnico: "porte arma pilotagem aérea aerea aptidão aptidao avaliação psicológica psicologica",
  lab_gasometria_arterial: "oxigênio oxigenio respiração respiracao sangue acidose alcalose",
  cardio_ecg: "coração coracao ritmo eletro",
  cardio_mapa_24h: "pressão pressao arterial 24 horas",
  cardio_holter_24h: "coração coracao ritmo palpitação palpitacao 24 horas",
  neuro_eeg: "cérebro cerebro atividade elétrica eletrica convulsão convulsao",
  img_us_morfologica: "gravidez bebê bebe formação formacao ultrassom",
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
  if (/informações do exame/i.test(title)) return ClipboardPaste;
  if (/paciente/i.test(title)) return UserRound;
  if (/profissional|médico|responsável|data/i.test(title)) return Stethoscope;
  if (/consulta|vínculo/i.test(title)) return Activity;
  if (/configuração|modo guiado|motor/i.test(title)) return Wand2;
  if (/exame|catálogo|modelo|escolha/i.test(title)) return Microscope;
  if (/anexo/i.test(title)) return Paperclip;
  return FileText;
}

function todayISO() {
  return brazilDate();
}

function nowHHMM() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

function brazilDateTimeIso(date: string, time: string) {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO();
  const safeTime = /^\d{2}:\d{2}$/.test(time) ? time : nowHHMM();
  return `${safeDate}T${safeTime}:00-03:00`;
}

function createProtocol() {
  const now = new Date();
  const date = brazilDate(now).replace(/-/g, "");
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

    const containsTable = Boolean(node.querySelector("table")) && /<table[\s>]/i.test(next);
    if (id === "tabelas" || containsTable) {
      // Em blocos tabulares, "Atualizar achados" deve recalcular os valores
      // mesmo quando o profissional já ajustou a estrutura/texto ao redor.
      // A atualização é feita por rótulo para não destruir a formatação manual.
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
    .replace(/<table\b([^>]*)>/gi, (_match, attrs: string) => {
      if (/\bclass\s*=/.test(attrs)) {
        const nextAttrs = attrs.replace(/\bclass=(['"])(.*?)\1/i, (_classMatch: string, quote: string, classes: string) => {
          const normalized = classes.split(/\s+/).filter(Boolean);
          if (!normalized.includes("hpsr-exam-table")) normalized.push("hpsr-exam-table");
          return `class=${quote}${normalized.join(" ")}${quote}`;
        });
        return `<table${nextAttrs}>`;
      }
      return `<table class="hpsr-exam-table"${attrs}>`;
    })
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



function createXrayAttachmentImage(region: string, _profileName: string, profileId: string) {
  return resolveXrayAttachmentAsset(region, profileId);
}


function resolvePsychotechnicalAttachmentAsset(profileId: string, profileName: string) {
  const profile = normalizeXrayKey(`${profileId} ${profileName}`).replace(/[^a-z0-9]+/g, "_");

  // A ordem é importante: "não apto" e "apto com ressalvas" também contêm
  // a palavra "apto". Os perfis específicos devem ser resolvidos primeiro.
  if (profile.includes("ressalv") || profile.includes("restric")) {
    return "/anexos/psicotecnico/apto-com-ressalvas.webp";
  }
  if (profile.includes("inconclus") || profile.includes("indefin") || profile.includes("limitrof")) {
    return "/anexos/psicotecnico/inconclusivo.webp";
  }
  if (profile.includes("nao_apto") || profile.includes("inapto") || profile.includes("alterado")) {
    return "/anexos/psicotecnico/nao-apto.webp";
  }
  return "/anexos/psicotecnico/apto.webp";
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
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border px-3 text-[14px] font-black transition duration-150 ${active ? "border-hpsr-wine bg-hpsr-wine text-white shadow-[0_8px_18px_rgba(103,38,20,0.15)]" : "border-[#dec9b7] bg-white/90 text-hpsr-text hover:border-hpsr-wine/40 hover:bg-[#fff8f0] hover:shadow-[0_6px_16px_rgba(42,7,0,0.05)]"} ${className}`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.045em] text-[#5c2416]">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-[12px] border border-[#d8bfa9] bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(42,7,0,0.03)] hover:border-[#b98f75] focus:border-hpsr-wine/55 focus:ring-2 focus:ring-hpsr-wine/10"
    />
  );
}

function SelectInput({
  id,
  value,
  onChange,
  children,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <StyledSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-[13px] border border-[#d8bfa9] bg-[linear-gradient(180deg,#ffffff_0%,#fffaf5_100%)] px-3.5 pr-10 text-sm font-black text-hpsr-text outline-none transition shadow-[inset_0_1px_2px_rgba(42,7,0,0.03),0_4px_12px_rgba(42,7,0,0.04)] hover:border-[#b98f75] focus:border-hpsr-wine/55 focus:ring-2 focus:ring-hpsr-wine/10"
      >
        {children}
      </StyledSelect>
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1f0805]/55 p-4">
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
            <SelectInput value={draft.bloodType} onChange={(bloodType) => setDraft({ ...draft, bloodType })}>
              <option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
            </SelectInput>
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
        : "border-[#e1cbb8] bg-[#fff8f2] text-hpsr-wine";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1f0805]/55 p-4">
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
    specialty: currentUserProfile.specialty || "",
    signatureImage: currentUserProfile.signatureImage || null,
  }]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const editorHtmlRef = useRef("");
  // O editor é montado à direita depois da escolha do exame. Reaplica o HTML
  // guardado caso a primeira seleção tenha ocorrido com a área ainda desmontada.
  const bindEditor = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node && node.innerHTML !== editorHtmlRef.current) {
      node.innerHTML = editorHtmlRef.current;
    }
  }, []);
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
  const [attachmentControlsOpen, setAttachmentControlsOpen] = useState(false);
  const [attachmentEditorOpen, setAttachmentEditorOpen] = useState(false);
  const [automaticAttachmentNotes, setAutomaticAttachmentNotes] = useState("");
  const [doctor, setDoctor] = useState<DoctorDraft>(initialDoctor);
  const [selectedDoctorId, setSelectedDoctorId] = useState(currentUserProfile.id || "current-user");

  useEffect(() => {
    setDoctor(initialDoctor);
    const currentOption: DoctorOption = { id: currentUserProfile.id || "current-user", name: initialDoctor.name, crm: initialDoctor.crm, role: currentUserProfile.signatureRole || currentUserProfile.role || "Médico", specialty: currentUserProfile.specialty || "", signatureImage: currentUserProfile.signatureImage || null };
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
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [examSearch, setExamSearch] = useState("");
  const [examNameInput, setExamNameInput] = useState("");
  const [protocol, setProtocol] = useState("");
  const [manualExamDateTime, setManualExamDateTime] = useState(false);
  const [examDate, setExamDate] = useState(todayISO());
  const [examTime, setExamTime] = useState(nowHHMM());
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
  const [editorPageGuideTops, setEditorPageGuideTops] = useState<number[]>([]);
  const [editorReportPageCount, setEditorReportPageCount] = useState(1);

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

  const activeExamModel = useMemo(
    () => selectedExam ? resolveIntelligentExamModel(selectedExam, adaptiveConfig?.adapterValue) : null,
    [selectedExam, adaptiveConfig?.adapterValue],
  );

  const resolvedExam = useMemo<AdaptiveResolvedExam | null>(() => {
    if (!selectedExam || !activeExamModel) return null;
    return resolveAdaptiveExam(
      activeExamModel,
      adaptiveConfig || createInitialAdaptiveConfiguration(selectedExam),
      { age: patient.age, bloodType: patient.bloodType },
    );
  }, [selectedExam, activeExamModel, adaptiveConfig, patient.age, patient.bloodType]);

  const visibleExamProfiles = useMemo(() => {
    if (!activeExamModel) return [];
    if (activeExamModel.id !== "lab_beta_hcg_completo") return activeExamModel.profiles;
    return activeExamModel.profiles.filter((profile) => profile.id === "negativo" || profile.id === "positivo");
  }, [activeExamModel]);

  const availableClinicalContexts = useMemo(() => activeExamModel?.clinicalContexts || [], [activeExamModel]);
  const showClinicalContextSelector = useMemo(() => {
    if (!activeExamModel || availableClinicalContexts.length <= 1) return false;
    if (activeExamModel.adapter.kind === "bond-type") return false;
    if (activeExamModel.variables.some((variable) => variable.id === "finalidade_avaliacao")) return false;
    if (activeExamModel.id === "gineco_usg_monitorizacao_folicular") return false;
    return true;
  }, [activeExamModel, availableClinicalContexts.length]);

  const categoryCounts = useMemo(() => {
    return intelligentExamModels.reduce<Record<string, number>>((acc, exam) => {
      acc[exam.categoria] = (acc[exam.categoria] || 0) + 1;
      return acc;
    }, {});
  }, []);

  const filteredCatalog = useMemo(() => {
    const normalizeSearch = (value: string) => value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
    const query = normalizeSearch(examSearch);
    return [...intelligentExamModels]
      .sort((a, b) => {
        const categoryCompare = (categoryLabels[a.categoria] || a.categoria).localeCompare(categoryLabels[b.categoria] || b.categoria, "pt-BR");
        return categoryCompare || a.nome.localeCompare(b.nome, "pt-BR");
      })
      .filter((exam) => {
        const matchesCategory = catalogCategory === "all" || exam.categoria === catalogCategory;
        if (!matchesCategory) return false;
        if (!query) return true;
        const aliases = examSearchAliases[exam.id] || "";
        const searchable = normalizeSearch(`${exam.nome} ${exam.descricao} ${exam.categoria} ${categoryLabels[exam.categoria] || ""} ${aliases}`);
        return query.split(/\s+/).every((term) => searchable.includes(term));
      });
  }, [catalogCategory, examSearch]);



  const selectedDoctorOption = useMemo(
    () => availableDoctors.find((item) => item.id === selectedDoctorId) || null,
    [availableDoctors, selectedDoctorId],
  );

  const hasSavedDoctorSignature = Boolean(selectedDoctorOption?.signatureImage);

  const metadata = useMemo<RenderMetadata>(
    () => ({
      examName: resolvedExam?.model.nome || selectedExam?.nome || "Exame",
      protocol,
      date: examDate,
      time: examTime,
      patient,
      doctor,
      signatureImage,
    }),
    [resolvedExam?.model.nome, selectedExam?.nome, protocol, patient, doctor, signatureImage, examDate, examTime],
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
  }, [selectedExamId, adaptiveConfig?.adapterValue, adaptiveConfig?.profileId, adaptiveConfig?.clinicalContext]);

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
    setCategoriesOpen(false);

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
    setSmartConfigOpen(Boolean(model && (draft.ui?.smartConfigOpen || draft.ui?.showCatalog === false)));
    setAdaptiveConfig(draft.adaptiveConfig || (model ? createInitialAdaptiveConfiguration(model) : null));
    editorHtmlRef.current = draft.html || "";
    if (editorRef.current) editorRef.current.innerHTML = draft.html || "";
    window.requestAnimationFrame(updateEditorPageGuides);
    setProtocol(draft.protocol || createProtocol());
    setManualExamDateTime(Boolean(draft.manualExamDateTime));
    setExamDate(draft.examDate || todayISO());
    setExamTime(draft.examTime || nowHHMM());
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
    const editor = editorRef.current;
    if (!editor) {
      setEditorPageGuideTops([]);
      return;
    }

    try {
      const previewDocument = buildPreviewDocument();
      const pages = previewDocument.pages.filter((page) => page.type === "report").map((page) => page.reportHtml || "");
      setEditorReportPageCount(Math.max(1, pages.length));
      if (pages.length <= 1) {
        setEditorPageGuideTops([]);
        return;
      }

      // Conta também <br> e parágrafos vazios. Assim, os Enters ocupam espaço
      // no mesmo fluxo que a paginação/preview, em vez de a guia acompanhar
      // somente caracteres visíveis.
      const contentUnits = (root: Node) => {
        let total = 0;
        const walker = window.document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let current = walker.nextNode();
        while (current) {
          if (current.nodeType === Node.TEXT_NODE) total += (current.textContent || "").length;
          else if ((current as Element).tagName?.toLowerCase() === "br") total += 1;
          current = walker.nextNode();
        }
        return total;
      };

      const targets: number[] = [];
      let cumulative = 0;
      pages.slice(0, -1).forEach((pageHtml) => {
        const holder = window.document.createElement("div");
        holder.innerHTML = pageHtml;
        cumulative += contentUnits(holder);
        targets.push(cumulative);
      });

      const walker = window.document.createTreeWalker(editor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      const positions: number[] = [];
      let targetIndex = 0;
      let consumed = 0;
      let node = walker.nextNode();
      const editorRect = editor.getBoundingClientRect();

      while (node && targetIndex < targets.length) {
        if (node.nodeType === Node.TEXT_NODE) {
          const value = node.textContent || "";
          while (targetIndex < targets.length && consumed + value.length >= targets[targetIndex]) {
            const offset = Math.max(0, Math.min(value.length, targets[targetIndex] - consumed));
            const range = window.document.createRange();
            range.setStart(node, offset);
            range.setEnd(node, offset);
            const rect = range.getBoundingClientRect();
            positions.push(Math.max(0, editor.offsetTop + rect.top - editorRect.top));
            targetIndex += 1;
          }
          consumed += value.length;
        } else if ((node as Element).tagName?.toLowerCase() === "br") {
          consumed += 1;
          while (targetIndex < targets.length && consumed >= targets[targetIndex]) {
            const parentRect = (node.parentElement || editor).getBoundingClientRect();
            positions.push(Math.max(0, editor.offsetTop + parentRect.bottom - editorRect.top));
            targetIndex += 1;
          }
        }
        node = walker.nextNode();
      }

      setEditorPageGuideTops((current) => {
        if (current.length === positions.length && current.every((value, index) => Math.abs(value - positions[index]) < 1)) return current;
        return positions;
      });
    } catch {
      setEditorPageGuideTops([]);
      setEditorReportPageCount(1);
    }
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
      const savedAt = brazilIso();
      saveDraft({
        patient,
        doctor,
        selectedDoctorId,
        selectedExamId: selectedExam?.id || selectedExamId,
        adaptiveConfig,
        html,
        protocol,
        manualExamDateTime,
        examDate,
        examTime,
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
    const savedAt = brazilIso();
    saveDraft({
      patient,
      doctor,
      selectedDoctorId,
      selectedExamId: selectedExam?.id || selectedExamId,
      adaptiveConfig,
      html,
      protocol,
      manualExamDateTime,
      examDate,
      examTime,
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
  }, [patient, doctor, selectedDoctorId, selectedExamId, adaptiveConfig, protocol, manualExamDateTime, examDate, examTime, attachments, showCatalog, smartConfigOpen, catalogCategory, examSearch, attachmentEditorOpen, automaticAttachmentNotes]);

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
  }, [patient, doctor, selectedDoctorId, selectedExamId, adaptiveConfig, protocol, manualExamDateTime, examDate, examTime, attachments, showCatalog, smartConfigOpen, catalogCategory, examSearch, attachmentEditorOpen, automaticAttachmentNotes]);

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

  async function pasteWithoutFormatting() {
    restoreSelection();
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      document.execCommand("insertText", false, text);
      rememberSelection();
      syncEditorFromDom();
    } catch {
      setAppDialog({
        title: "Não foi possível acessar a área de transferência",
        message: "Use Ctrl + Shift + V para colar sem formatação neste campo.",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
    }
  }

  function transformSelectionCase(mode: "upper" | "lower") {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed || !editorRef.current.contains(range.commonAncestorContainer)) return;

    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      const textNode = current as Text;
      try {
        if (range.intersectsNode(textNode)) nodes.push(textNode);
      } catch {}
      current = walker.nextNode();
    }

    nodes.forEach((node) => {
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.data.length;
      if (end <= start) return;
      const selected = node.data.slice(start, end);
      const converted = mode === "upper" ? selected.toLocaleUpperCase("pt-BR") : selected.toLocaleLowerCase("pt-BR");
      node.data = `${node.data.slice(0, start)}${converted}${node.data.slice(end)}`;
    });

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
      `<table class="hpsr-exam-table"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table><p><br></p>`,
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

  async function saveQuickPatient() {
    const normalizedPatient = {
      ...quickPatientDraft,
      name: quickPatientDraft.name.trim(),
      passport: quickPatientDraft.passport.trim(),
    };
    if (!normalizedPatient.name || !normalizedPatient.passport) {
      setAppDialog({
        title: "Dados insuficientes",
        message: "Informe o nome e o documento do paciente. O documento é necessário para sincronizar o cadastro com o Prontuário sem criar duplicidades.",
        tone: "warning",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
      return;
    }
    const nextPatient = { ...normalizedPatient, passport: normalizedPatient.passport.toUpperCase() };
    const saved = await upsertSharedPatient(nextPatient);
    if (!saved) {
      setAppDialog({
        title: "Cadastro não sincronizado",
        message: "Não foi possível salvar o paciente no Prontuário. O cadastro rápido não foi concluído para evitar um registro somente local.",
        tone: "warning",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
      return;
    }
    setPatient(nextPatient);
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
    setSmartConfigOpen(true);
    setShowCatalog(false);
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
    setSmartConfigOpen(true);
    setShowCatalog(false);
  }

  function blankExamBase(model: IntelligentExamModel) {
    return `<h1>${model.nome}</h1><p><br></p>`;
  }

  function applyModelFor(model: IntelligentExamModel) {
    const nextConfig = createInitialAdaptiveConfiguration(model);
    const applySelection = () => {
      setSelectedExamId(model.id);
      setSelectedCategory(model.categoria);
      setCatalogCategory(model.categoria);
      setCategoriesOpen(false);
      setExamNameInput(model.nome);
      setAdaptiveConfig(nextConfig);
      setSmartConfigOpen(false);
      setShowCatalog(false);
      setEditorContent(blankExamBase(model), { moveCaretToEnd: true });
    };

    const currentText = textFromHtml(editorRef.current?.innerHTML || editorHtmlRef.current).trim();
    const currentIsOnlyBase = !currentText || currentText === selectedExam?.nome;
    if (!currentIsOnlyBase && currentText.length > 8) {
      setAppDialog({
        title: "Trocar exame",
        message: "O editor atual possui conteúdo. Ao selecionar outro exame, o conteúdo será substituído pela base vazia do novo exame.",
        tone: "warning",
        actions: [
          { label: "Cancelar", onClick: () => setAppDialog(null) },
          { label: "Trocar exame", variant: "primary", onClick: () => { setAppDialog(null); applySelection(); } },
        ],
      });
      return;
    }
    applySelection();
  }

  function updateConfig(partial: Partial<AdaptiveExamConfiguration>) {
    if (!selectedExam) return;
    setAdaptiveConfig((current) => {
      const base = current || createInitialAdaptiveConfiguration(selectedExam);
      const next = { ...base, ...partial };
      const modelForSelection = resolveIntelligentExamModel(selectedExam, next.adapterValue);
      if (!modelForSelection.profiles.some((profile) => profile.id === next.profileId)) {
        const fallback = modelForSelection.profiles.find((profile) => profile.id === modelForSelection.editorModel.defaultProfileId)
          || modelForSelection.profiles.find((profile) => profile.id === "normal")
          || modelForSelection.profiles[0];
        next.profileId = fallback?.id || "";
      }
      if (modelForSelection.clinicalContexts?.length && !modelForSelection.clinicalContexts.some((context) => context === next.clinicalContext)) {
        next.clinicalContext = modelForSelection.clinicalContexts.find((context) => context === "Rotina")
          || modelForSelection.clinicalContexts[0]
          || "";
        next.variables = { ...next.variables, contexto_clinico: "" };
      }
      return next;
    });
    setSmartConfigOpen(true);
    setShowCatalog(false);
  }

  function updateClinicalContext(clinicalContext: string) {
    if (!selectedExam) return;
    setAdaptiveConfig((current) => {
      const base = current || createInitialAdaptiveConfiguration(selectedExam);
      return { ...base, clinicalContext };
    });
    setSmartConfigOpen(true);
    setShowCatalog(false);
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
    if (!selectedExam || !adaptiveConfig) return;

    const current = editorRef.current?.innerHTML || editorHtmlRef.current;
    let generationSeed = nextAdaptiveGenerationSeed(adaptiveConfig.generationSeed);
    let nextConfig: AdaptiveExamConfiguration = { ...adaptiveConfig, generationSeed };
    let merged = current;

    // Alguns resultados arredondam para o mesmo valor em uma amostragem
    // específica. Tenta poucas sementes seguintes para que um clique em
    // "Atualizar achados" produza uma atualização visível sempre que o
    // modelo possuir valores geráveis, sem tocar em campos manuais.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      nextConfig = { ...adaptiveConfig, generationSeed };
      const refreshedModel = resolveIntelligentExamModel(selectedExam, nextConfig.adapterValue);
      const refreshedExam = resolveAdaptiveExam(refreshedModel, nextConfig, { age: patient.age, bloodType: patient.bloodType });
      const generated = renderAdaptiveExamReport(refreshedExam);
      const currentText = textFromHtml(current).trim();
      const onlyBase = !currentText || currentText === selectedExam.nome;
      merged = onlyBase ? generated : mergeAutomaticBlocks(current, generated);
      if (merged !== current) break;
      generationSeed = nextAdaptiveGenerationSeed(generationSeed);
    }

    setAdaptiveConfig(nextConfig);
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


  function addTemporarySignature(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAppDialog({ title: "Assinatura inválida", message: "Selecione uma imagem PNG, JPG ou WEBP.", tone: "warning", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSignatureImage(String(reader.result || ""));
    reader.onerror = () => setAppDialog({ title: "Assinatura", message: "Não foi possível ler a imagem selecionada.", tone: "warning", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
    reader.readAsDataURL(file);
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
        // O anexo manual deve ficar visível imediatamente após o upload,
        // inclusive em exames que não possuem anexo automático.
        setAttachmentEditorOpen(true);
        setSaveStatus("Salvando...");
      })
      .catch(() => {
        setAppDialog({
          title: "Não foi possível anexar",
          message: "Um dos arquivos não pôde ser lido. Tente novamente com uma imagem em tamanho menor.",
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
    const effectiveMetadata = manualExamDateTime
      ? metadata
      : { ...metadata, date: todayISO(), time: nowHHMM() };
    const document = createFinalExamDocument({
      metadata: effectiveMetadata,
      reportHtml: html,
      manualAttachments: attachments,
      resolvedExam,
      automaticAttachments: effectiveAutomaticAttachment ? [effectiveAutomaticAttachment] : [],
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
      const savedAt = brazilIso();
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
          manualExamDateTime,
          examDate,
          examTime,
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
          manualExamDateTime,
          examDate,
          examTime,
          attachments: [],
          savedAt,
        });
      }

      const client = createClient();
      if (!client) throw new Error("Não foi possível conectar ao banco de dados.");
      {
        const recordId = `exam-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const previewImages = (await Promise.all(
          document.pages.map((_, pageIndex) => renderPreviewPage(document, pageIndex, false)),
        )).filter((item): item is string => typeof item === "string" && item.startsWith("data:image/"));
        const payload = {
          protocol,
          patient,
          doctor,
          examId: selectedExam?.id || selectedExamId,
          examName: document.metadata.examName,
          examDate: document.metadata.date,
          examTime: document.metadata.time,
          examPerformedAt: brazilDateTimeIso(document.metadata.date, document.metadata.time),
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
          released_at: isConfidential ? null : brazilIso(),
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
      registerSystemActivity({ module: "Exames", action: "Exame salvo", description: `${document.metadata.examName} salvo para ${patient.name || "paciente não informado"}.`, actor: currentUserProfile.systemName, reference: currentUserProfile.passport });
      window.dispatchEvent(new CustomEvent("hpsr:clinical-record-saved", { detail: { recordType: "Exame" } }));
      hpsrSuccess(`${document.metadata.examName} foi salvo no prontuário de ${patient.name}.`, "Exame salvo");
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
        const isRemoteImage = /^https?:\/\//i.test(src);
        if (isRemoteImage) {
          image.crossOrigin = "anonymous";
          image.referrerPolicy = "no-referrer";
        }
        image.onload = () => resolve(image);
        image.onerror = () => {
          console.warn("[HPSR][Exames] Imagem ignorada na exportação por restrição de origem:", src);
          resolve(null);
        };
        image.src = src;
      });

    const normalizeSignatureImage = (image: HTMLImageElement) => {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth || image.width;
      sourceCanvas.height = image.naturalHeight || image.height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return image;
      sourceContext.drawImage(image, 0, 0);
      let pixels: ImageData;
      try {
        pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      } catch (error) {
        console.warn("[HPSR][Exames] A assinatura não pôde ser normalizada por restrição de origem e será omitida do PNG.", error);
        return null;
      }
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

    const wrapCanvasText = (targetContext: CanvasRenderingContext2D, value: string, maxWidth: number) => {
      const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (targetContext.measureText(candidate).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const drawInfoCard = (label: string, value: string, x: number, y: number, width: number, height = 42) => {
      context.fillStyle = "rgba(255,255,255,0.98)";
      context.strokeStyle = "rgba(91,24,9,0.16)";
      context.lineWidth = 1;
      context.beginPath();
      context.roundRect(x, y, width, height, 12);
      context.fill();
      context.stroke();
      context.fillStyle = "#8d665b";
      context.font = "700 8px Arial";
      context.fillText(label.toUpperCase(), x + 10, y + 8);
      context.fillStyle = "#3d1710";
      context.font = height <= 32 ? "700 10.5px Arial" : "700 11px Arial";
      const lines = wrapCanvasText(context, value || "-", width - 20);
      const maxLines = height <= 32 ? 1 : height <= 40 ? 2 : 3;
      lines.slice(0, maxLines).forEach((line, index) => context.fillText(line, x + 10, y + 19 + index * 11));
    };

    const drawTechnicalRibbon = (label: string, x: number, y: number, width: number) => {
      context.fillStyle = "rgba(91,24,9,0.07)";
      context.strokeStyle = "rgba(91,24,9,0.13)";
      context.beginPath();
      context.roundRect(x, y, width, 22, 11);
      context.fill();
      context.stroke();
      context.fillStyle = "#5b1809";
      context.font = "700 9px Arial";
      context.textAlign = "center";
      context.fillText(label.toUpperCase(), x + width / 2, y + 7);
      context.textAlign = "left";
    };

    const drawInstitutionalPageBase = async () => {
      const headerGradient = context.createLinearGradient(0, 0, 0, 165);
      headerGradient.addColorStop(0, "#fbf6f2");
      headerGradient.addColorStop(1, "#fffdfb");
      context.fillStyle = headerGradient;
      context.fillRect(0, 0, canvas.width, 165);
      context.fillStyle = "#fffdfb";
      context.fillRect(0, 165, canvas.width, canvas.height - 165);

      const watermark = await loadImage("/logo-hpsr.png");
      if (watermark) {
        context.save();
        context.globalAlpha = 0.06;
        drawImageContain(watermark, 227, 392, 340, 340);
        context.restore();
      }
    };

    const drawInstitutionalHeader = () => {
      context.fillStyle = "rgba(255,255,255,0.97)";
      context.strokeStyle = "rgba(91,24,9,0.16)";
      context.beginPath();
      context.roundRect(24, 24, 742, 66, 16);
      context.fill();
      context.stroke();

      context.fillStyle = "#3d1710";
      context.font = "700 16.5px Arial";
      context.fillText("HOSPITAL SÃO RAFAEL", 42, 34);
      context.fillStyle = "#8d665b";
      context.font = "700 8.5px Arial";
      context.fillText("LAUDO DE EXAME · DOCUMENTO INSTITUCIONAL", 42, 58);

      drawInfoCard("Data", formatDateBR(finalDocument.metadata.date), 574, 31, 84, 25);
      drawInfoCard("Página", `${pageIndex + 1}/${finalDocument.pages.length}`, 666, 31, 86, 25);

      context.fillStyle = "rgba(91,24,9,0.065)";
      context.strokeStyle = "rgba(91,24,9,0.16)";
      context.beginPath();
      context.roundRect(42, 100, 710, 30, 12);
      context.fill();
      context.stroke();
      context.fillStyle = "#5b1809";
      context.font = "700 11.5px Arial";
      context.textAlign = "center";
      context.fillText((finalDocument.metadata.examName || "EXAME").toUpperCase(), 397, 109);
      context.textAlign = "left";

      drawInfoCard("Paciente", finalDocument.metadata.patient.name || "-", 42, 138, 318, 30);
      drawInfoCard("Passaporte", finalDocument.metadata.patient.passport || "-", 368, 138, 132, 30);
      drawInfoCard("Idade", finalDocument.metadata.patient.age || "-", 508, 138, 82, 30);
      drawInfoCard("Tipo sanguíneo", finalDocument.metadata.patient.bloodType || "-", 598, 138, 154, 30);
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
          const headingSize = tag === "h1" ? 12.5 : 11;
          const headingHeight = Math.max(tag === "h1" ? 23 : 20, measureRichTextElement(context, block, width - 24, {
            baseFontSize: headingSize,
            fontFamily: "Arial, sans-serif",
            color: "#5b1809",
            bold: true,
            lineHeight: 16,
          }) + 8);
          y += 6;
          context.fillStyle = "rgba(91,24,9,0.06)";
          context.beginPath();
          context.roundRect(x, y - 2, width, headingHeight, 11);
          context.fill();
          context.strokeStyle = "rgba(91,24,9,0.16)";
          context.beginPath();
          context.moveTo(x + 12, y + headingHeight + 2);
          context.lineTo(x + width - 12, y + headingHeight + 2);
          context.stroke();
          drawRichTextElement(context, block, x + 12, y + 4, width - 24, y + headingHeight - 2, {
            baseFontSize: headingSize,
            fontFamily: "Arial, sans-serif",
            color: "#5b1809",
            bold: true,
            lineHeight: 16,
          });
          y += headingHeight + 10;
          continue;
        }

        if (tag === "table") {
          const rows = Array.from(block.querySelectorAll("tr"));
          if (!rows.length) continue;
          const firstCells = Array.from(rows[0].querySelectorAll("th,td"));
          const colCount = Math.max(firstCells.length, 1);
          const tableWidth = Math.min(width * 0.78, 500);
          const tableX = x + (width - tableWidth) / 2;
          const colWidth = tableWidth / colCount;
          context.lineWidth = 0.9;
          for (const [rowIndex, row] of rows.entries()) {
            const cells = Array.from(row.querySelectorAll("th,td"));
            const rowHeight = Math.max(20, ...cells.map((cell) =>
              measureRichTextElement(context, cell, colWidth - 12, {
                baseFontSize: 10,
                fontFamily: "Arial, sans-serif",
                color: "#4b2118",
                bold: rowIndex === 0,
                lineHeight: 11,
                textAlign: "center",
              }) + 8,
            ));
            if (y + rowHeight > maxY) return y;
            cells.forEach((cell, cellIndex) => {
              const cx = tableX + cellIndex * colWidth;
              context.fillStyle = rowIndex === 0 ? "rgba(247,238,232,0.98)" : rowIndex % 2 === 0 ? "rgba(255,250,247,0.96)" : "rgba(255,255,255,0.98)";
              context.fillRect(cx, y, colWidth, rowHeight);
              context.strokeStyle = "rgba(91,24,9,0.18)";
              context.strokeRect(cx, y, colWidth, rowHeight);
              const contentHeight = measureRichTextElement(context, cell, colWidth - 12, {
                baseFontSize: 10,
                fontFamily: "Arial, sans-serif",
                color: "#4b2118",
                bold: rowIndex === 0,
                lineHeight: 11,
                textAlign: "center",
              });
              drawRichTextElement(context, cell, cx + 6, y + Math.max(4, (rowHeight - contentHeight) / 2), colWidth - 12, y + rowHeight - 3, {
                baseFontSize: 10,
                fontFamily: "Arial, sans-serif",
                color: "#4b2118",
                bold: rowIndex === 0,
                lineHeight: 11,
                textAlign: "center",
              });
            });
            y += rowHeight;
          }
          y += 10;
          continue;
        }

        if (tag === "ul" || tag === "ol") {
          const items = Array.from(block.querySelectorAll("li"));
          items.forEach((item, index) => {
            if (y > maxY - 18) return;
            context.fillStyle = "#4b2118";
            context.font = "11.2px Arial";
            context.fillText(tag === "ol" ? `${index + 1}.` : "•", x + 2, y);
            y = drawRichTextElement(context, item, x + 18, y, width - 18, maxY, {
              baseFontSize: 11.2,
              color: "#4b2118",
              lineHeight: 15,
            });
          });
          y += 6;
          continue;
        }

        const text = htmlText(block);
        if (!text) {
          // Um parágrafo vazio representa uma linha real do editor. Mantém a
          // mesma altura usada na medição da paginação para que Enter reflita
          // imediatamente na pré-visualização e no PNG final.
          y += tag === "p" || tag === "blockquote" || tag === "div" ? 20.5 : 8;
          continue;
        }
        y = drawRichTextElement(context, block, x, y, width, maxY, {
          baseFontSize: 11.2,
          color: "#4b2118",
          lineHeight: 15.4,
        }) + 5;
      }
      return y;
    };

    const drawFooter = async () => {
      context.fillStyle = "rgba(255,250,247,0.98)";
      context.fillRect(42, 1018, 710, 93);
      context.strokeStyle = "rgba(91,24,9,0.16)";
      context.beginPath();
      context.moveTo(42, 1018);
      context.lineTo(752, 1018);
      context.stroke();

      const signature = finalDocument.metadata.signatureImage
        ? await loadImage(finalDocument.metadata.signatureImage)
        : null;
      if (signature) {
        const normalizedSignature = normalizeSignatureImage(signature);
        if (normalizedSignature) drawImageContain(normalizedSignature, 257, 1019, 280, 48);
      } else {
        context.fillStyle = "#5b1809";
        context.textAlign = "center";
        context.font = "italic 22px Georgia";
        context.fillText(finalDocument.metadata.doctor.name || "Nome do médico", 397, 1042);
      }

      context.strokeStyle = "#5b1809";
      context.setLineDash([2, 2]);
      context.beginPath();
      context.moveTo(272, 1069);
      context.lineTo(522, 1069);
      context.stroke();
      context.setLineDash([]);

      context.fillStyle = "#5b1809";
      context.textAlign = "center";
      context.font = "700 10px Arial";
      context.fillText(`Dr(a). ${finalDocument.metadata.doctor.name || "Nome do médico"}`, 397, 1073);
      context.font = "8.5px Arial";
      context.fillText(`CRM: ${finalDocument.metadata.doctor.crm || "000000"}`, 397, 1086);

      context.strokeStyle = "rgba(91,24,9,0.14)";
      context.beginPath();
      context.moveTo(42, 1096);
      context.lineTo(752, 1096);
      context.stroke();
      context.fillStyle = "#7a5148";
      context.font = "8px Arial";
      context.textAlign = "left";
      context.fillText("Hospital São Rafael", 42, 1101);
      context.textAlign = "center";
      context.fillText(`Emitido em ${formatDateBR(finalDocument.metadata.date)} · Código: ${finalDocument.metadata.protocol || "-"}`, 397, 1101);
      context.textAlign = "right";
      context.fillText(`Página ${pageIndex + 1}/${finalDocument.pages.length}`, 752, 1101);
      context.textAlign = "left";
    };

    try {
      await drawInstitutionalPageBase();

      context.textBaseline = "top";
      context.fillStyle = "#4b2118";
      context.font = "12px Arial";

      drawInstitutionalHeader();

      if (page.type === "report") {
        drawReportHtml(page.reportHtml || "", 42, 184, 710, 1009);
      } else if (page.type === "auto-attachment" && page.automaticAttachment) {
        const attachment = page.automaticAttachment;
        const image = attachment.imageUrl ? await loadImage(attachment.imageUrl) : null;
        if (image) {
          drawImageContain(image, 42, 184, 710, 822);
        } else {
          context.fillStyle = "rgba(255,255,255,0.76)";
          context.strokeStyle = "rgba(91,24,9,0.25)";
          context.beginPath();
          context.roundRect(42, 184, 710, 768, 18);
          context.fill();
          context.stroke();
          context.textAlign = "center";
          context.fillStyle = "#7a5148";
          context.font = "13px Arial";
          context.fillText("Imagem de anexo não definida.", 397, 505);
          context.textAlign = "left";
        }
      } else if (page.type === "manual-attachments") {
        const file = page.manualAttachments?.[0];
        const image = file?.url ? await loadImage(file.url) : null;
        if (image) {
          drawImageContain(image, 42, 184, 710, 822);
        } else {
          context.fillStyle = "rgba(255,255,255,0.76)";
          context.strokeStyle = "rgba(91,24,9,0.25)";
          context.beginPath();
          context.roundRect(42, 184, 710, 768, 18);
          context.fill();
          context.stroke();
          context.textAlign = "center";
          context.fillStyle = "#7a5148";
          context.font = "13px Arial";
          context.fillText("Este anexo não é uma imagem visualizável.", 397, 505);
          context.textAlign = "left";
        }
      }

      await drawFooter();

      const dataUrl = canvas.toDataURL("image/png");
      if (!download) {
        setPreviewImage(dataUrl);
        return dataUrl;
      }
      const link = window.document.createElement("a");
      link.download = `${safeFileName(finalDocument.metadata.examName)}_${safeFileName(finalDocument.metadata.patient.name || "paciente")}_pagina_${pageIndex + 1}.png`;
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
      message: `Não foi possível gerar o PNG desta página. Tente novamente.${technicalMessage}`,
      tone: "warning",
      actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
    });
  }

  return (
    <div className="hpsr-page hpsr-exams-page gap-4 text-hpsr-text">
      <div className="hpsr-topbar" />

      <header className="flex items-center gap-4 rounded-[22px] border border-[#e4d8cf] bg-[linear-gradient(110deg,#fff3e9_0%,#f5e5df_100%)] px-5 py-4 shadow-[0_8px_25px_rgba(42,7,0,0.04)]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
          <FileText size={23} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-black uppercase tracking-[0.12em] text-hpsr-wine">Exames</p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-hpsr-text sm:text-2xl">Editor de laudos</h1>
          <p className="mt-1 text-sm font-medium leading-relaxed text-hpsr-muted">Formulário à esquerda, laudo à direita. Escolha um exame e use o modelo somente quando precisar.</p>
        </div>
      </header>

      <section className="hpsr-exams-workspace grid min-h-0 flex-1 items-start gap-4 overflow-visible xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(400px,460px)_minmax(0,1fr)]">
        <aside aria-label="Formulário do exame" className="min-w-0 space-y-4 xl:overflow-y-auto xl:overscroll-contain xl:rounded-[24px] xl:border xl:border-[#dfd6c8] xl:bg-[linear-gradient(180deg,#f8eee5_0%,#f3e2de_100%)] xl:p-2 [scrollbar-gutter:stable]">
              <Panel title="Informações do exame" description="Paciente, médico responsável e assinatura.">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <UserRound size={17} strokeWidth={2.2} className="text-hpsr-wine" />
                    <FieldLabel htmlFor="hpsr-exam-patient-select">Paciente</FieldLabel>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
                    <SelectInput id="hpsr-exam-patient-select" value={patient.passport} onChange={selectPatient}>
                      <option value="">Paciente livre...</option>
                      {patientOptions.map((item) => (
                        <option key={item.passport} value={item.passport}>
                          {item.name}
                        </option>
                      ))}
                    </SelectInput>
                    <button
                      type="button"
                      onClick={openQuickPatient}
                      title="Registro rápido de paciente"
                      aria-label="Registro rápido de paciente"
                      className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#d8bfa9] bg-white text-hpsr-wine transition hover:border-hpsr-wine/40 hover:bg-[#fff8f0]"
                    >
                      <UserPlus size={17} strokeWidth={2.2} />
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.55fr)_minmax(108px,0.8fr)]">
                      <div className="min-w-0">
                        <FieldLabel htmlFor="hpsr-exam-patient-name">Nome do paciente</FieldLabel>
                        <TextInput id="hpsr-exam-patient-name" value={patient.name} onChange={(name) => setPatient((current) => ({ ...current, name }))} placeholder="Nome completo" />
                      </div>
                      <div className="min-w-0">
                        <FieldLabel htmlFor="hpsr-exam-patient-age">Idade</FieldLabel>
                        <TextInput id="hpsr-exam-patient-age" value={patient.age} onChange={(age) => setPatient((current) => ({ ...current, age }))} placeholder="Anos" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="min-w-0">
                        <FieldLabel htmlFor="hpsr-exam-patient-passport">Passaporte</FieldLabel>
                        <TextInput id="hpsr-exam-patient-passport" value={patient.passport} onChange={(passport) => setPatient((current) => ({ ...current, passport }))} placeholder="Número" />
                      </div>
                      <div className="min-w-0">
                        <FieldLabel htmlFor="hpsr-exam-patient-blood">Tipo sanguíneo</FieldLabel>
                        <SelectInput id="hpsr-exam-patient-blood" value={patient.bloodType} onChange={(bloodType) => setPatient((current) => ({ ...current, bloodType }))}>
                          <option value="">Não informado</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option>
                        </SelectInput>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#eee5de] pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Stethoscope size={15} strokeWidth={2.2} className="text-hpsr-wine" />
                    <FieldLabel htmlFor="hpsr-exam-doctor-select">Médico responsável</FieldLabel>
                  </div>
                  <SelectInput id="hpsr-exam-doctor-select" value={selectedDoctorId} onChange={selectDoctor}>
                    {availableDoctors.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </SelectInput>
                  <div className="mt-2 text-xs font-semibold text-hpsr-muted">
                    <span className="font-black text-hpsr-text">{doctor.name || "Médico não selecionado"}</span>
                    <span className="mx-2 text-[#ccb7a7]">|</span>
                    <span>CRM {doctor.crm || "-"}</span>
                  </div>
                </div>

                <div className="border-t border-[#eee5de] pt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <FileSignature size={15} strokeWidth={2.2} className="text-hpsr-wine" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-hpsr-text">Assinatura</p>
                      <p className="text-[12px] font-semibold text-hpsr-muted">{hasSavedDoctorSignature ? "Assinatura do perfil selecionada automaticamente." : signatureImage ? "Assinatura temporária deste exame." : "Sem imagem: o sistema usa nome e CRM como assinatura gráfica."}</p>
                    </div>
                    {!hasSavedDoctorSignature && (
                      <div className="flex flex-wrap gap-2">
                        <input ref={signatureInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { addTemporarySignature(event.target.files?.[0] || null); event.target.value = ""; }} />
                        <button type="button" onClick={() => signatureInputRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-[11px] border border-hpsr-wine/20 bg-white px-3 text-[13px] font-black text-hpsr-wine"><Upload size={14} /> {signatureImage ? "Trocar" : "Adicionar"}</button>
                        {signatureImage ? <button type="button" onClick={() => setSignatureImage(null)} className="h-9 rounded-[11px] border border-hpsr-border bg-white px-3 text-[13px] font-black text-hpsr-muted">Remover</button> : null}
                      </div>
                    )}
                    {!signatureImage && !hasSavedDoctorSignature && (
                      <div className="text-center">
                        <p className="font-serif text-base italic leading-none text-[#5b1809]">{doctor.name || "Nome do médico"}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-hpsr-muted">CRM {doctor.crm || "000000"}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </Panel>

            <Panel title="Catálogo de exames" description="Pesquise ou abra a lista de categorias para escolher um exame.">
              {!showCatalog && selectedExam ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#d7b796] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(42,7,0,0.045)]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-hpsr-wine text-white">
                      {(() => { const ExamIcon = resolveExamIcon(selectedExam?.icone); return <ExamIcon size={18} strokeWidth={2.2} />; })()}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-black leading-snug text-hpsr-text">{selectedExam?.nome || "Exame selecionado"}</p>
                      <p className="text-[12px] font-semibold text-hpsr-muted">{categoryLabels[selectedExam?.categoria || selectedCategory] || selectedCategory}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <div className={`inline-flex h-10 items-center gap-2 rounded-[11px] border px-2.5 transition ${smartConfigOpen ? "border-emerald-300 bg-emerald-50" : "border-[#dfd4cb] bg-white"}`}>
                      <span className={`text-xs font-black ${smartConfigOpen ? "text-emerald-800" : "text-hpsr-text"}`}>Usar modelo</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={smartConfigOpen}
                        aria-label={smartConfigOpen ? "Desativar painel do modelo" : "Ativar painel do modelo"}
                        onClick={() => setSmartConfigOpen((current) => !current)}
                        className={`relative h-6 w-11 overflow-hidden rounded-full transition-colors duration-200 ${smartConfigOpen ? "bg-emerald-600" : "bg-[#d7cec7]"}`}
                      >
                        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-transform duration-200 ${smartConfigOpen ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedModel}
                      className="inline-flex h-10 items-center gap-2 rounded-[11px] border border-hpsr-wine/20 bg-[#fff8f1] px-3 text-xs font-black text-hpsr-wine transition hover:border-hpsr-wine/40 hover:bg-white"
                    >
                      <RefreshCw size={13} /> Trocar exame
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[12px] border border-[#ddd2c8] bg-white px-3 transition focus-within:border-hpsr-wine/45 focus-within:ring-2 focus-within:ring-hpsr-wine/10">
                      <Search size={15} className="shrink-0 text-hpsr-wine" />
                      <input
                        value={examSearch}
                        onChange={(event) => setExamSearch(event.target.value)}
                        placeholder="Buscar exame ou finalidade"
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-hpsr-muted/70"
                      />
                      {examSearch && (
                        <button
                          type="button"
                          onClick={() => setExamSearch("")}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-hpsr-muted transition hover:bg-[#f7eadf] hover:text-hpsr-wine"
                          aria-label="Limpar busca"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    <span className="shrink-0 text-[13px] font-black text-hpsr-muted">
                      {filteredCatalog.length} {filteredCatalog.length === 1 ? "exame" : "exames"}
                    </span>
                  </div>

                  <div>
                    <button
                      type="button"
                      aria-expanded={categoriesOpen}
                      aria-controls="hpsr-exam-category-options"
                      onClick={() => setCategoriesOpen((current) => !current)}
                      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2.5 text-left transition ${categoriesOpen ? "border-[#b36b61] bg-[#f9e8e2]" : "border-[#dfc9bf] bg-[#fdf3ec] hover:border-[#b98478]"}`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Microscope size={18} strokeWidth={2.1} className="shrink-0 text-hpsr-wine" />
                        <span className="min-w-0">
                          <span className="block text-[12px] font-semibold text-[#8a5147]">Categoria</span>
                          <span className="block truncate text-sm font-black text-hpsr-text">{catalogCategory === "all" ? "Todos os exames" : categoryLabels[catalogCategory] || catalogCategory}</span>
                        </span>
                      </span>
                      <ChevronDown size={18} className={`shrink-0 text-hpsr-wine transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
                    </button>
                    {categoriesOpen && (
                      <div id="hpsr-exam-category-options" role="group" aria-label="Categorias de exames" className="mt-2 max-h-[235px] space-y-1 overflow-y-auto rounded-[12px] border border-[#e4cec2] bg-[#fff8f2] p-1.5 [scrollbar-gutter:stable]">
                        {["all", ...categories].map((category) => {
                          const CategoryIcon = category === "all" ? Microscope : categoryIconMap[category] || Microscope;
                          const isActive = catalogCategory === category;
                          return (
                            <button
                              key={category}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() => { setCatalogCategory(category); setCategoriesOpen(false); }}
                              className={`flex min-h-10 w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-sm font-bold transition ${isActive ? "bg-[#f6ded6] text-[#712b23]" : "text-hpsr-text hover:bg-[#f9ece6]"}`}
                            >
                              <CategoryIcon size={17} strokeWidth={2.1} className="shrink-0" />
                              <span className="min-w-0 flex-1">{category === "all" ? "Todos os exames" : categoryLabels[category] || category}</span>
                              <span className="shrink-0 text-[12px] text-hpsr-muted">{category === "all" ? intelligentExamModels.length : categoryCounts[category] || 0}</span>
                              {isActive && <Check size={16} className="shrink-0 text-hpsr-wine" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto rounded-[14px] border border-[#e6d5c9] bg-[#f6eee8] p-2.5 pr-2 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
                    {filteredCatalog.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                        {filteredCatalog.map((exam) => {
                          const isSelected = exam.id === selectedExam?.id;
                          const ExamIcon = resolveExamIcon(exam.icone);
                          return (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => applyModelFor(exam)}
                              aria-pressed={isSelected}
                              className={`group relative min-h-[96px] w-full overflow-hidden rounded-[14px] border p-3.5 text-left transition-all duration-200 ${isSelected ? "border-hpsr-wine/70 bg-[#fff7ef] ring-1 ring-hpsr-wine/10" : "border-[#e2d8cf] bg-white hover:border-hpsr-wine/30 hover:bg-[#fffdfb]"}`}
                            >
                              <span className={`absolute inset-y-0 left-0 w-1 transition ${isSelected ? "bg-hpsr-wine" : "bg-transparent group-hover:bg-hpsr-wine/20"}`} />
                              <div className="flex items-start gap-2.5">
                                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border transition ${isSelected ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-[#e5d2c1] bg-[#f8ecdf] text-hpsr-wine"}`}>
                                  <ExamIcon size={17} strokeWidth={2.15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-[14px] font-black leading-[1.4] text-hpsr-text">{exam.nome}</p>
                                  {exam.descricao && <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-[1.5] text-hpsr-muted">{exam.descricao}</p>}
                                  <span className="mt-1.5 block text-[12px] font-bold text-[#886353]">{categoryLabels[exam.categoria] || exam.categoria}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-7 text-center">
                        <Search size={20} className="mx-auto mb-2 text-hpsr-wine/55" />
                        <p className="text-sm font-black text-hpsr-text">Nenhum exame encontrado</p>
                        <p className="mt-1 text-[13px] font-semibold text-hpsr-muted">Tente outro nome, finalidade ou categoria.</p>
                        <button type="button" onClick={() => { setExamSearch(""); setCatalogCategory("all"); }} className="mt-3 text-[13px] font-black text-hpsr-wine hover:underline">
                          Limpar filtros
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Panel>

            {!showCatalog && selectedExam && adaptiveConfig && smartConfigOpen && (
              <div className="rounded-[18px] border border-[#dfc9bf] bg-[linear-gradient(170deg,#fff9f4_0%,#f7e8e4_100%)] p-4 shadow-[0_8px_20px_rgba(82,28,20,0.045)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.07em] text-hpsr-wine">Modelo ativo</p>
                    <p className="mt-0.5 text-[13px] font-semibold text-hpsr-muted">Preencha somente o necessário e aplique ao editor.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f0e8] px-2.5 py-1 text-[12px] font-black text-[#2f634c]"><Check size={12} /> Ligado</span>
                </div>
                <div className="space-y-3">
                  {selectedExam?.adapter.enabled && selectedExam.adapter.kind !== "clinical-context" && adaptiveConfig && (
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

                  {showClinicalContextSelector && adaptiveConfig && (
                    <div>
                      <FieldLabel>Contexto / finalidade</FieldLabel>
                      <SelectInput
                        value={availableClinicalContexts.includes(adaptiveConfig.clinicalContext)
                          ? adaptiveConfig.clinicalContext
                          : (availableClinicalContexts.find((item) => item === "Rotina") || availableClinicalContexts[0] || "")}
                        onChange={updateClinicalContext}
                      >
                        {availableClinicalContexts.map((context) => (
                          <option key={context} value={context}>{context}</option>
                        ))}
                      </SelectInput>
                      <p className="mt-1.5 text-[12px] font-semibold leading-relaxed text-hpsr-muted">
                        O contexto reorganiza a leitura do exame, a prioridade dos achados e a conclusão; não é apenas uma observação no laudo.
                      </p>
                    </div>
                  )}

                  {!!visibleExamProfiles.length && adaptiveConfig && (
                    <div>
                      <FieldLabel>{activeExamModel?.id === "lab_beta_hcg_completo" ? "Resultado" : "Perfil de resultado"}</FieldLabel>
                      <SelectInput
                        value={visibleExamProfiles.some((profile) => profile.id === (resolvedExam?.profile.id || adaptiveConfig.profileId))
                          ? (resolvedExam?.profile.id || adaptiveConfig.profileId)
                          : visibleExamProfiles[0]?.id || ""}
                        onChange={(profileId) => updateConfig({ profileId })}
                      >
                        {visibleExamProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>{profile.name}</option>
                        ))}
                      </SelectInput>
                    </div>
                  )}

                  {resolvedExam?.dynamicFields.filter((field) => field.source === "variable").map((field) => (
                    <div key={field.id}>
                      <FieldLabel>{field.id === "dia_estimulacao" ? "Dia da estimulação (opcional)" : field.id === "dia_preparo_endometrial" ? "Dia do preparo (opcional)" : field.label}</FieldLabel>
                      {field.id === "foco_monitorizacao" ? (
                        <div className="grid grid-cols-2 gap-2">
                          {(field.options || ["Folículos", "Endométrio"]).map((option) => {
                            const active = String(field.value ?? "") === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateVariable(field.id, option)}
                                className={`h-10 rounded-[11px] border text-xs font-black transition ${active ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-[#d8bfa9] bg-white text-hpsr-text hover:border-hpsr-wine/35 hover:text-hpsr-wine"}`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      ) : field.tipo === "select" ? (
                        <SelectInput
                          value={String(field.value ?? "")}
                          onChange={(value) => updateVariable(field.id, value)}
                        >
                          {(field.options || []).map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </SelectInput>
                      ) : field.tipo === "boolean" ? (
                        <SelectInput
                          value={String(Boolean(field.value))}
                          onChange={(value) => updateVariable(field.id, value === "true")}
                        >
                          <option value="false">Não</option>
                          <option value="true">Sim</option>
                        </SelectInput>
                      ) : (
                        <input
                          type={field.tipo === "number" ? "number" : field.tipo === "date" ? "date" : "text"}
                          value={String(field.value ?? "")}
                          min={field.id === "idade_gestacional_referida" || field.id === "dia_estimulacao" || field.id === "dia_preparo_endometrial" ? 1 : undefined}
                          step={field.id === "idade_gestacional_referida" || field.id === "dia_estimulacao" || field.id === "dia_preparo_endometrial" ? "1" : undefined}
                          placeholder={field.id === "idade_gestacional_referida" ? "Ex.: 6" : field.id === "idade_gestacional" ? "Ex.: 28 semanas" : field.id === "contexto_clinico" ? "Ex.: dor pélvica, controle pós-trauma, investigação específica..." : field.id === "dia_estimulacao" ? "Ex.: 8" : field.id === "dia_preparo_endometrial" ? "Ex.: 10" : undefined}
                          onChange={(event) => updateVariable(field.id, event.target.value)}
                          className="h-11 w-full rounded-[12px] border border-[#d8bfa9] bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine/55 focus:ring-2 focus:ring-hpsr-wine/10"
                        />
                      )}
                      {activeExamModel?.id === "lab_beta_hcg_completo" && field.id === "idade_gestacional_referida" && (
                        <p className="mt-1.5 text-[12px] font-semibold leading-relaxed text-hpsr-muted">
                          Essa informação passa a orientar método, interpretação, conclusão e a correlação com o valor de β-hCG; ela não é usada como uma simples linha de contexto.
                        </p>
                      )}
                      {field.id === "contexto_clinico" && (
                        <p className="mt-1.5 text-[12px] font-semibold leading-relaxed text-hpsr-muted">
                          Use este campo para indicar o motivo real do exame. O motor prioriza os achados relacionados a essa informação e adapta a leitura clínica.
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={refreshFindings}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine bg-hpsr-wine px-3 text-sm font-black text-white shadow-[0_7px_16px_rgba(103,38,20,0.16)] transition hover:bg-[#7a2f1b]"
                  >
                    <Wand2 size={15} /> Aplicar modelo
                  </button>
                </div>
              </div>
            )}


            <Panel title="Anexos" description="Opcional · gerencie imagens do exame quando precisar.">
              <button
                type="button"
                aria-expanded={attachmentControlsOpen}
                onClick={() => setAttachmentControlsOpen((current) => !current)}
                className="flex h-11 w-full items-center justify-between gap-3 rounded-[12px] border border-[#decdbf] bg-[#fffaf6] px-3.5 text-left text-xs font-black text-hpsr-text transition hover:border-hpsr-wine/35 hover:bg-white"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip size={17} className="shrink-0 text-hpsr-wine" />
                  {attachmentCount ? `${attachmentCount} ${attachmentCount === 1 ? "anexo" : "anexos"} neste exame` : "Adicionar ou gerenciar anexos"}
                </span>
                <ChevronDown size={16} className={`shrink-0 text-hpsr-wine transition-transform ${attachmentControlsOpen ? "rotate-180" : ""}`} />
              </button>
              {attachmentControlsOpen && (
              <div className="space-y-3">
                {effectiveAutomaticAttachment && (
                  <div className="rounded-[16px] border border-[#e4d7ce] bg-[#fff9f5] p-3 text-hpsr-text shadow-[0_8px_18px_rgba(42,7,0,0.045)]">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-hpsr-wine ring-1 ring-[#e2cfc1]">
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
                            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] border border-red-200 bg-white px-2.5 text-[12px] font-black text-red-700 transition hover:bg-red-50"
                            aria-label="Remover anexo automático"
                          >
                            <X size={13} /> Remover
                          </button>
                        </div>
                        <p className="mt-1 text-[13px] font-semibold text-hpsr-muted">{effectiveAutomaticAttachment?.subtitle}</p>
                        <p className="mt-2 text-[13px] font-semibold leading-relaxed text-[#6f5148]">{effectiveAutomaticAttachment?.legend}</p>
                      </div>
                    </div>
                  </div>
                )}

                {automaticAttachmentRemoved && automaticAttachment && (
                  <div className="flex items-center justify-between gap-3 rounded-[16px] border border-amber-200 bg-amber-50/90 px-3 py-2 text-[13px] font-semibold text-amber-800">
                    <span>O anexo automático foi removido deste exame.</span>
                    <button
                      type="button"
                      onClick={() => setAutomaticAttachmentRemoved(false)}
                      className="shrink-0 rounded-[10px] border border-amber-300 bg-white px-2.5 py-1.5 text-[12px] font-black text-amber-800 hover:bg-amber-100"
                    >
                      Restaurar
                    </button>
                  </div>
                )}

                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
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

                <div className="rounded-[16px] border border-[#e5d8cf] bg-[#fffaf6] px-3 py-2 text-[13px] font-semibold leading-relaxed text-hpsr-muted">
                  A página de anexo usa uma única imagem centralizada. Ao adicionar uma nova imagem manual, ela será exibida como anexo visual do exame.
                </div>

                {attachmentOverrideActive && attachments.length > 0 && (
                  <div className="rounded-[16px] border border-amber-200 bg-amber-50/90 px-3 py-2 text-[13px] font-semibold leading-relaxed text-amber-800">
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
                            <p className="text-[13px] font-semibold text-hpsr-muted">{attachment.size}</p>
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
              )}
            </Panel>
        </aside>

        {(!showCatalog || Boolean(editorHtmlRef.current.trim())) ? (
        <main aria-label="Editor do exame" className="hpsr-light-editor-shell flex min-h-0 min-w-0 flex-col overflow-visible rounded-[24px] border border-[#ddd4cc] bg-[#fffaf5] shadow-[0_14px_38px_rgba(42,7,0,0.065)] ring-1 ring-white xl:overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ece5df] bg-[linear-gradient(110deg,#fff8ed_0%,#f5e9e5_100%)] px-6 py-4">
            <div>
              <h2 className="text-xl font-black tracking-[-0.01em] text-hpsr-text">
                {selectedExam?.nome || "Exame livre"}
              </h2>
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-hpsr-muted">
                Editor do exame · pré-visualização institucional sob demanda
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex min-h-9 items-center gap-2 rounded-[11px] border border-[#e2d8cf] bg-[#fbfaf9] px-2.5 text-[13px] font-bold text-hpsr-text">
                  <CalendarDays size={14} className="text-hpsr-wine" />
                  {manualExamDateTime ? (
                    <>
                      <input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} className="h-7 w-[126px] bg-transparent text-[13px] font-bold outline-none" aria-label="Data do exame" />
                      <input type="time" value={examTime} onChange={(event) => setExamTime(event.target.value)} className="h-7 w-[76px] bg-transparent text-[13px] font-bold outline-none" aria-label="Hora do exame" />
                      <button type="button" onClick={() => { setManualExamDateTime(false); setExamDate(todayISO()); setExamTime(nowHHMM()); }} className="rounded-[8px] px-2 py-1 text-[12px] font-black text-hpsr-wine hover:bg-[#f7eadf]">Usar agora</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => { setExamDate(todayISO()); setExamTime(nowHHMM()); setManualExamDateTime(true); }} className="font-black text-hpsr-text hover:text-hpsr-wine">Data atual · alterar</button>
                  )}
                </div>

                <div className="inline-flex h-9 items-center gap-1 rounded-[11px] border border-[#e2d8cf] bg-[#fbfaf9] p-1">
                  <ShieldCheck size={14} className="ml-1.5 text-hpsr-wine" />
                  <button type="button" onClick={() => setIsConfidential(true)} className={`h-7 rounded-[8px] px-2.5 text-[12px] font-black transition ${isConfidential ? "bg-hpsr-wine text-white" : "text-hpsr-muted hover:text-hpsr-wine"}`}>Sigilo</button>
                  <button type="button" onClick={() => setIsConfidential(false)} className={`h-7 rounded-[8px] px-2.5 text-[12px] font-black transition ${!isConfidential ? "bg-emerald-600 text-white" : "text-hpsr-muted hover:text-emerald-700"}`}>Portal liberado</button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black text-hpsr-text">
              <span className={`inline-flex h-10 items-center gap-2 rounded-[12px] border px-3 text-[13px] font-black ${editorReportPageCount > 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-[#e2d8cf] bg-[#fbfaf9] text-hpsr-muted"}`}>
                <FileText size={14} /> {editorReportPageCount} {editorReportPageCount === 1 ? "página" : "páginas"}
              </span>
              <button
                type="button"
                onClick={() => setAttachmentEditorOpen((current) => !current)}
                className={`inline-flex h-10 items-center gap-2 rounded-[12px] border px-3.5 text-xs font-black shadow-[0_5px_14px_rgba(42,7,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(42,7,0,0.08)] ${attachmentEditorOpen ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-wine/20 bg-[#fff8f1] text-hpsr-wine hover:border-hpsr-wine/40 hover:bg-white"}`}
              >
                <Paperclip size={15} strokeWidth={2.3} /> {attachmentEditorOpen ? "Ocultar anexo" : "Ver anexo"}
              </button>
            </div>
          </div>

          <div className="border-b border-[#eee8e2] bg-[#fbfaf9] px-6 py-2.5 text-xs font-semibold text-hpsr-muted">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-hpsr-wine" />
              <span>Revise resultados, referências, interpretação e conclusão. As linhas no editor indicam onde uma nova página começa no documento final.</span>
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
            pasteWithoutFormatting={pasteWithoutFormatting}
            transformSelectionCase={transformSelectionCase}
            rememberSelection={rememberSelection}
          />

          <div className="hpsr-exams-editor-viewport h-[clamp(510px,68dvh,760px)] flex-none overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#f3eee8_0%,#eee5e1_100%)] p-5 [scrollbar-gutter:stable]">
            <div className="mx-auto min-h-full max-w-[1100px] rounded-[20px] border border-[#dfd5ce] bg-white p-8 shadow-[0_14px_34px_rgba(42,7,0,0.055)] ring-1 ring-white">
              <div className="relative">
                {editorPageGuideTops.map((top, index) => {
                    const pageNumber = index + 2;
                    return (
                      <div
                        key={pageNumber}
                        className="pointer-events-none absolute left-0 right-0 z-10"
                        style={{ top }}
                      >
                        <div className="flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.14em] text-hpsr-wine/60">
                          <span className="h-px flex-1 border-t border-dashed border-hpsr-wine/25" />
                          <span className="rounded-full border border-hpsr-wine/20 bg-[#fff7ed]/95 px-3 py-1 shadow-[0_4px_12px_rgba(42,7,0,0.05)]">
                            Página {pageNumber} começa aqui
                          </span>
                          <span className="h-px flex-1 border-t border-dashed border-hpsr-wine/25" />
                        </div>
                      </div>
                    );
                  })}
                {attachmentEditorOpen && (
                  <div className="mb-6 rounded-[20px] border border-[#e2d3c8] bg-[#fff9f5] p-4 shadow-[0_12px_28px_rgba(42,7,0,0.06)]">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#eadbd1] pb-3">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.08em] text-hpsr-text">Editor de anexos</p>
                        <p className="mt-1 text-xs font-semibold text-hpsr-muted">Revise ou complemente a folha de anexo que será enviada junto ao laudo.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachmentEditorOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-hpsr-muted ring-1 ring-[#e2cfc1] hover:bg-[#fff4ec]"
                        aria-label="Fechar editor de anexos"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {effectiveAutomaticAttachment && (
                      <div className="rounded-[18px] border border-[#d7c3b8] bg-white p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white">
                            <Scan size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-hpsr-text">{effectiveAutomaticAttachment.title}</p>
                            <p className="mt-1 text-xs font-semibold text-hpsr-muted">{effectiveAutomaticAttachment.subtitle}</p>
                          </div>
                        </div>
                        <div className="mt-4 rounded-[18px] border border-[#1f2937]/20 bg-[#050505] p-2">
                          {effectiveAutomaticAttachment.imageUrl ? (
                            <img
                              src={effectiveAutomaticAttachment.imageUrl}
                              alt={effectiveAutomaticAttachment.title || "Anexo"}
                              className="block aspect-[4/3] w-full rounded-[14px] object-contain"
                            />
                          ) : (
                            <div className="flex aspect-[4/3] items-center justify-center rounded-[14px] border border-dashed border-white/30 text-xs font-semibold text-white/70">
                              Imagem automática não definida.
                            </div>
                          )}
                        </div>
                        <p className="mt-3 rounded-[14px] border border-[#eadbd1] bg-[#fffaf6] px-3 py-2 text-[13px] font-semibold leading-relaxed text-hpsr-muted">
                          Anexo automático do exame. O texto técnico permanece no laudo principal.
                        </p>
                      </div>
                    )}

                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {attachments.map((attachment, index) => (
                          <div key={attachment.id} className="rounded-[18px] border border-[#d7c3b8] bg-white p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[12px] font-black uppercase tracking-[0.08em] text-hpsr-muted">Anexo manual · página {index + 1}</p>
                                <p className="mt-1 truncate text-sm font-black text-hpsr-text">{attachment.name}</p>
                                <p className="mt-0.5 text-[13px] font-semibold text-hpsr-muted">{attachment.size}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(attachment.id)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-red-200 bg-white text-red-700 hover:bg-red-50"
                                aria-label={`Remover ${attachment.name}`}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="rounded-[18px] border border-[#1f2937]/20 bg-[#050505] p-2">
                              {/^data:image\//i.test(attachment.url) ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="block max-h-[420px] w-full rounded-[14px] object-contain"
                                />
                              ) : (
                                <div className="flex aspect-[4/3] items-center justify-center rounded-[14px] border border-dashed border-white/30 px-4 text-center text-xs font-semibold text-white/70">
                                  Este arquivo não possui uma imagem visualizável.
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!effectiveAutomaticAttachment && attachments.length === 0 && (
                      <div className="rounded-[16px] border border-[#e5d8cf] bg-white/80 px-4 py-4 text-sm font-semibold text-hpsr-muted">
                        Nenhum anexo disponível para o exame atual. Use a área Anexos à esquerda para adicionar uma imagem manualmente.
                      </div>
                    )}
                  </div>
                )}

                <div
                  ref={bindEditor}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={syncEditorFromDom}
                  onKeyUp={rememberSelection}
                  onMouseUp={rememberSelection}
                  onBlur={rememberSelection}
                  onFocus={() => {
                    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch {}
                    rememberSelection();
                  }}
                  onKeyDown={(event) => {
                    handleRichEditorTableKeyDown(event, editorRef.current, syncEditorFromDom);
                  }}
                  className="hpsr-continuous-editor min-h-[740px] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9e1da] bg-[#fcfbfa] px-6 py-3.5">
            <span className="text-[13px] font-semibold text-hpsr-muted">Revise o conteúdo antes de pré-visualizar.</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearEditor}
                className="inline-flex h-11 items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-text hover:border-hpsr-wine/40"
              >
                <Trash2 size={15} /> Limpar editor
              </button>

              <button
                type="button"
                onClick={openExamPreview}
                className="inline-flex h-11 items-center gap-2 rounded-[13px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-soft hover:bg-hpsr-wineDark"
              >
                <Save size={16} /> Pré-visualizar
              </button>
            </div>
          </div>
        </main>
        ) : (
          <main aria-label="Editor do exame" className="flex min-h-[540px] min-w-0 flex-col items-center justify-center rounded-[24px] border border-[#e2d8ca] bg-[linear-gradient(145deg,#fff9f0_0%,#f5e9e5_100%)] px-6 py-12 text-center shadow-[0_12px_32px_rgba(42,7,0,0.045)]">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-[19px] bg-[#f7ede5] text-hpsr-wine">
              <FileText size={30} strokeWidth={1.8} />
            </span>
            <h2 className="text-xl font-black text-hpsr-text">Seu editor começa aqui</h2>
            <p className="mt-2 max-w-[340px] text-sm font-semibold leading-relaxed text-hpsr-muted">
              Selecione um exame no catálogo à esquerda para abrir o editor. Você pode escrever livremente ou ativar Usar modelo.
            </p>
          </main>
        )}
      </section>

      <ClinicalHistoryPanel recordType="Exame" comfortable />

      {preview.open && preview.document && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f0805]/60 p-4">
          <div className="flex h-[min(94dvh,980px)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[22px] border border-[#dfd4cc] bg-[#faf7f4] shadow-[0_24px_70px_rgba(42,7,0,0.26)]">
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

            <div className="min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,#f4f0ed_0%,#ebe5e0_100%)] p-6">
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


    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const Icon = resolvePanelIcon(title);
  const isCatalog = title === "Catálogo de exames";
  const isAttachments = title === "Anexos";
  return (
    <section className={`overflow-hidden rounded-[18px] border shadow-[0_4px_14px_rgba(42,7,0,0.028)] ${isCatalog ? "border-[#dfc5bc] bg-[#fff8f3]" : isAttachments ? "border-[#e9d5bd] bg-[#fffbf4]" : "border-[#ead8c8] bg-[#fffaf4]"}`}>
      <div className={`flex items-start gap-3 border-b px-4 py-3 ${isCatalog ? "border-[#ead0c4] bg-[#f5e1d9]" : isAttachments ? "border-[#f0dfcc] bg-[#fff1e0]" : "border-[#eedbca] bg-[#f9eada]"}`}>
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-white ${isCatalog ? "bg-[linear-gradient(135deg,#8b3d31,#672614)]" : isAttachments ? "bg-[#a96d37]" : "bg-[linear-gradient(135deg,#672614,#2a0700)]"}`}>
          <Icon size={17} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-black uppercase tracking-[0.06em] text-hpsr-text">{title}</h3>
          {description && <p className="mt-1 text-[13px] font-semibold leading-relaxed text-hpsr-muted">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
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
      <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#8a6355]">{label}</p>
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
  pasteWithoutFormatting,
  transformSelectionCase,
  rememberSelection,
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
  pasteWithoutFormatting: () => Promise<void>;
  transformSelectionCase: (mode: "upper" | "lower") => void;
  rememberSelection: () => void;
}) {
  function color(event: ChangeEvent<HTMLInputElement>) {
    exec("foreColor", event.target.value);
  }

  function backgroundColor(event: ChangeEvent<HTMLInputElement>) {
    exec("hiliteColor", event.target.value);
  }

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-[#e7dfd8] bg-white/95 px-4 py-2.5 backdrop-blur-md"
      onMouseDownCapture={() => rememberSelection()}
    >
      <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
        <Button onClick={() => exec("undo")} title="Desfazer">
          ↶
        </Button>
        <Button onClick={() => exec("redo")} title="Refazer">
          ↷
        </Button>
      </div>
      <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
        <Button onClick={() => applyFormatBlock("h1")}>
          <Type size={14} /> Título
        </Button>
        <Button onClick={() => applyFormatBlock("h2")}>Seção</Button>
        <Button onClick={() => applyFormatBlock("p")}>Texto</Button>
      </div>
      <div className="flex items-center rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
        <EditorFontSizeMenu onChange={(value) => exec("fontSize", value)} />
      </div>
      <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
        <Button onClick={() => exec("bold")}>
          <Bold size={15} />
        </Button>
        <Button onClick={() => exec("italic")}>
          <Italic size={15} />
        </Button>
        <Button onClick={() => exec("underline")}>
          <Underline size={15} />
        </Button>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[12px] border border-hpsr-border bg-white/85 px-3 text-xs font-black text-hpsr-text" title="Cor da fonte">
          <Type size={15} />
          <input type="color" onChange={color} className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0" aria-label="Cor da fonte" />
        </label>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[12px] border border-hpsr-border bg-white/85 px-3 text-xs font-black text-hpsr-text" title="Cor de fundo do texto">
          <Highlighter size={15} />
          <input type="color" defaultValue="#fff2a8" onChange={backgroundColor} className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0" aria-label="Cor de fundo do texto" />
        </label>
        <Button onClick={() => exec("removeFormat")} title="Remover formatação"><Eraser size={15} /></Button>
      </div>
      <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
        <Button onClick={() => void pasteWithoutFormatting()} title="Colar sem formatação"><ClipboardPaste size={15} /></Button>
        <Button onClick={() => transformSelectionCase("upper")} title="Converter seleção para maiúsculas"><CaseUpper size={16} /></Button>
        <Button onClick={() => transformSelectionCase("lower")} title="Converter seleção para minúsculas"><CaseLower size={16} /></Button>
      </div>
      <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
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
      <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
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
