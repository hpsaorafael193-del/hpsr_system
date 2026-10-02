"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Eye, Loader2, Minus, Plus, RefreshCw, Search, ShieldCheck, Syringe, Trash2, UserRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { hpsrSuccess } from "@/components/ui/HpsrToastProvider";
import { createClient } from "@/lib/supabase";
import { brazilDate, brazilIso } from "@/lib/brazil-datetime";
import {
  assignApplicationsToSlots,
  cardVaccineOptions,
  findVaccinationSlot,
  generateVaccinationLot,
  getVaccinationCardDefinition,
  suggestVaccinationGroup,
  type AdultCardVariant,
  type VaccinationApplication,
  type VaccinationGroup,
  type VaccinationIdentityField,
} from "@/lib/vaccination";

const inputClass = "hpsr-vaccination-input min-h-[44px] w-full rounded-[13px] border border-hpsr-border bg-[#fffcf8] px-3 text-sm font-semibold text-hpsr-text outline-none transition focus:border-[#83cfc1] focus:ring-2 focus:ring-[#83cfc1]/20";


type DoctorOption = {
  id: string;
  name: string;
  crm: string;
  signatureImage: string | null;
};

function formatDate(value: string) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

function parseVaccineRow(row: any): VaccinationApplication | null {
  const payload = row?.payload || {};
  const vaccine = payload?.vaccine || {};
  const doctor = payload?.doctor || {};
  const patient = payload?.patient || {};
  if (!vaccine?.name) return null;
  return {
    id: String(row.id),
    patientPassport: String(row.patient_passport || patient.passport || ""),
    patientName: String(patient.name || payload.patientName || "Paciente"),
    group: (vaccine.group || "adulto") as VaccinationGroup,
    adultVariant: vaccine.adultVariant as AdultCardVariant | undefined,
    vaccine: String(vaccine.name || ""),
    dose: String(vaccine.dose || ""),
    date: String(vaccine.date || ""),
    lot: String(vaccine.lot || ""),
    doctorName: String(doctor.name || payload.doctorName || "Médico responsável"),
    doctorCrm: String(doctor.crm || payload.doctorCrm || "—"),
    signatureImage: doctor.signatureImage || null,
    createdAt: String(row.created_at || ""),
    createdBy: String(row.created_by || ""),
  slotId: String(vaccine.slotId || ""),
  observations: String(payload.observations || ""),
  };
}

type SavedVaccinationCard = {
  id: string;
  card_model: string;
  observations: string;
  published_path: string | null;
  draft_path: string | null;
  version: number;
  updated_at: string;
  payload: Record<string, any>;
};

function parseSavedCard(row: any): SavedVaccinationCard | null {
  const payload = row?.payload || {};
  if (!payload.cardModel) return null;
  return {
    id: String(row.id), card_model: String(payload.cardModel),
    observations: String(payload.observations || ''),
    published_path: payload.publishedPath || null,
    draft_path: payload.draftPath || null,
    version: Number(payload.version) || 1,
    updated_at: String(row.updated_at || ''), payload,
  };
}

type VaccinationCardRenderArgs = {
  canvas: HTMLCanvasElement;
  group: VaccinationGroup;
  adultVariant: AdultCardVariant;
  applications: VaccinationApplication[];
  patientName: string;
  passport: string;
  birthDate: string;
  doctorName: string;
  observations: string;
  page: number;
};

const canvasImageCache = new Map<string, Promise<HTMLImageElement>>();

function loadCanvasImage(src: string) {
  const cached = canvasImageCache.get(src);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => {
      canvasImageCache.delete(src);
      reject(new Error(`Não foi possível carregar a imagem: ${src}`));
    };
    image.src = src;
  });
  canvasImageCache.set(src, pending);
  return pending;
}

async function renderVaccinationCard({
  canvas,
  group,
  adultVariant,
  applications,
  patientName,
  passport,
  birthDate,
  doctorName,
  observations,
  page,
}: VaccinationCardRenderArgs) {
  const definition = getVaccinationCardDefinition(group, adultVariant);
  const pageApps = definition.official ? applications : applications.slice(page * definition.slots.length, (page + 1) * definition.slots.length);
  const assigned = assignApplicationsToSlots(pageApps, definition);
  const template = await loadCanvasImage(definition.template);

  canvas.width = definition.width;
  canvas.height = definition.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
  const brown = "#5a260f";
  const blue = "#1d58a7";
  const px = (percent: number, axis: "x" | "y") => percent / 100 * (axis === "x" ? canvas.width : canvas.height);
  const writeFitted = (value: string, x: number, y: number, maxWidth: number, preferredSize: number, minimumSize: number, color = brown, weight = "700") => {
    const content = value || "";
    if (!content) return;
    let size = preferredSize;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    while (size > minimumSize) {
      ctx.font = `${weight} ${size}px ${definition.official ? "Georgia, serif" : "Arial, sans-serif"}`;
      if (ctx.measureText(content).width <= maxWidth) break;
      size -= 1;
    }
    ctx.font = `${weight} ${size}px ${definition.official ? "Georgia, serif" : "Arial, sans-serif"}`;
    let rendered = content;
    if (ctx.measureText(rendered).width > maxWidth) {
      while (rendered.length > 1 && ctx.measureText(`${rendered}…`).width > maxWidth) rendered = rendered.slice(0, -1);
      rendered = `${rendered}…`;
    }
    ctx.fillText(rendered, x, y);
  };
  const writeCenteredFitted = (value: string, centerX: number, y: number, maxWidth: number, preferredSize: number, minimumSize: number, color = blue, weight = "800") => {
    const content = value || "";
    if (!content) return;
    let size = preferredSize;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    while (size > minimumSize) {
      ctx.font = `${weight} ${size}px ${definition.official ? "Georgia, serif" : "Arial, sans-serif"}`;
      if (ctx.measureText(content).width <= maxWidth) break;
      size -= 1;
    }
    ctx.font = `${weight} ${size}px ${definition.official ? "Georgia, serif" : "Arial, sans-serif"}`;
    let rendered = content;
    if (ctx.measureText(rendered).width > maxWidth) {
      while (rendered.length > 1 && ctx.measureText(`${rendered}…`).width > maxWidth) rendered = rendered.slice(0, -1);
      rendered = `${rendered}…`;
    }
    ctx.fillText(rendered, centerX, y);
  };

  const writeIdentityField = (value: string, field: VaccinationIdentityField) => {
    const content = value || "";
    if (!content) return;
    const startX = px(field.startX, "x");
    const endX = px(field.endX, "x");
    const availableWidth = Math.max(1, endX - startX);
    const color = field.color || brown;
    const weight = field.weight || "700";
    const minimum = field.minFontSize || Math.max(9, Math.round(field.fontSize * .65));
    let size = field.fontSize;

    ctx.textAlign = "left";
    ctx.fillStyle = color;
    while (size > minimum) {
      ctx.font = `${weight} ${size}px ${definition.official ? "Georgia, serif" : "Arial, sans-serif"}`;
      if (ctx.measureText(content).width <= availableWidth) break;
      size -= 1;
    }
    ctx.font = `${weight} ${size}px ${definition.official ? "Georgia, serif" : "Arial, sans-serif"}`;
    let rendered = content;
    if (ctx.measureText(rendered).width > availableWidth) {
      while (rendered.length > 1 && ctx.measureText(`${rendered}…`).width > availableWidth) rendered = rendered.slice(0, -1);
      rendered = `${rendered}…`;
    }

    if (field.mode === "line" && typeof field.lineY === "number") {
      ctx.textBaseline = "alphabetic";
      const baselineY = px(field.lineY, "y") - Math.max(2, size * .12);
      ctx.fillText(rendered, startX, baselineY);
      return;
    }

    const top = px(field.top || 0, "y");
    const bottom = px(field.bottom || field.top || 0, "y");
    ctx.textBaseline = "middle";
    ctx.fillText(rendered, startX, top + Math.max(1, bottom - top) / 2);
  };

  writeIdentityField(patientName, definition.identity.name);
  writeIdentityField(passport, definition.identity.passport);
  if (definition.identity.doctor) writeIdentityField(doctorName, definition.identity.doctor);
  if (definition.identity.birthDate) writeIdentityField(formatDate(birthDate), definition.identity.birthDate);

  const logo = await loadCanvasImage("/logo-hpsr.png").catch(() => null);
  for (const slot of definition.slots) {
    const app = assigned.get(slot.id);
    if (!app) continue;
    const x = px(slot.left, "x");
    const y = px(slot.top, "y");
    const w = px(slot.width, "x");
    const h = px(slot.height, "y");

    // Carimbo retangular amplo, centralizado no espaço branco impresso.
    // Coordenadas oficiais não dependem da ordem do histórico.
    if (definition.official) {
      // Aproveita quase toda a caixa impressa, com pequena margem de segurança.
      const stampW = Math.max(1, w - Math.max(5, w * .05));
      const stampH = Math.max(1, h - Math.max(4, h * .08));
      const stampX = x + (w - stampW) / 2;
      const stampY = y + (h - stampH) / 2;
      ctx.save();
      ctx.fillStyle = "rgba(239,246,251,.56)";
      ctx.strokeStyle = "#285884";
      ctx.lineWidth = Math.max(1, Math.min(2.4, stampH * .032));
      ctx.beginPath();
      ctx.roundRect(stampX + 1, stampY + 1, Math.max(1, stampW - 2), Math.max(1, stampH - 2), Math.min(6, stampH * .09));
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#224c77";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      const centerX = stampX + stampW / 2;
      const usableWidth = stampW * .92;
      const compact = stampH < 65;
      // Quatro linhas apenas: hospital, data, médico e CRM.
      // Distribuição relativa mantém todas as letras dentro das caixas menores.
      const stampRows = [
        { label: "HOSPITAL SÃO RAFAEL", size: Math.min(16, Math.max(8, stampH * .18)), pos: .15 },
        { label: formatDate(app.date), size: Math.min(24, Math.max(12, stampH * .28)), pos: .38 },
        { label: app.doctorName, size: Math.min(19, Math.max(9, stampH * .21)), pos: .63 },
        { label: `CRM ${app.doctorCrm}`, size: Math.min(17, Math.max(9, stampH * .19)), pos: .86 },
      ];
      // Mantém as letras proporcionais: nomes longos são ajustados/truncados,
      // nunca comprimidos horizontalmente pelo parâmetro maxWidth do Canvas.
      ctx.beginPath();
      ctx.rect(stampX + 3, stampY + 2, Math.max(1, stampW - 6), Math.max(1, stampH - 4));
      ctx.clip();
      for (const row of stampRows) {
        const smallest = compact ? 7 : 9;
        let fontSize = row.size;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        while (fontSize > smallest && ctx.measureText(row.label).width > usableWidth) {
          fontSize = Math.max(smallest, fontSize - 1);
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        }
        let label = row.label;
        if (ctx.measureText(label).width > usableWidth) {
          while (label.length > 1 && ctx.measureText(`${label}…`).width > usableWidth) label = label.slice(0, -1);
          label += "…";
        }
        ctx.fillText(label, centerX, stampY + stampH * row.pos);
      }
      ctx.restore();
      continue;
    }

    if (group === "adulto" || group === "idoso") {
      const vx = x + w * .21;
      const fieldWidth = w * .74;
      const primarySize = Math.max(11, w * .035);
      writeFitted(app.vaccine, vx, y + h * .04, fieldWidth, primarySize, 9, brown, "800");
      writeFitted(app.dose, vx, y + h * .18, fieldWidth, primarySize, 9, brown, "700");
      writeFitted(formatDate(app.date), vx, y + h * .32, fieldWidth, primarySize, 9, brown, "700");
      writeFitted(app.lot || "—", vx, y + h * .46, fieldWidth, primarySize, 9, brown, "700");
    } else if (group === "crianca" && slot.contentLayout) {
      const layout = slot.contentLayout;
      const textX = x + w * (layout.left / 100);
      const textWidth = w * (layout.width / 100);
      const startY = y + h * (layout.top / 100);
      const gap = h * (layout.lineGap / 100);
      const compactSlot = h < w * .78;
      const preferred = compactSlot ? Math.max(11, Math.min(15, w * .061)) : Math.max(11, Math.min(15, w * .059));
      const secondary = Math.max(9, preferred - 1);
      writeFitted(app.vaccine, textX, startY, textWidth, preferred, 8, brown, "800");
      writeFitted(app.dose, textX, startY + gap, textWidth, secondary, 8, brown, "700");
      writeFitted(formatDate(app.date), textX, startY + gap * 2, textWidth, secondary, 8, brown, "700");
      writeFitted(`Lote ${app.lot || "—"}`, textX, startY + gap * 3, textWidth, Math.max(8, secondary - 1), 7, brown, "700");
    } else if (group === "gestante" && slot.contentLayout) {
      // O modelo obstetra já contém o nome da vacina e o número/tipo da dose.
      // Cada slot possui seu próprio mapa para que data e lote fiquem alinhados
      // ao espaço correspondente, sem invadir o marcador impresso da dose.
      const layout = slot.contentLayout;
      const textX = x + w * (layout.left / 100);
      const textWidth = w * (layout.width / 100);
      const startY = y + h * (layout.top / 100);
      const gap = h * (layout.lineGap / 100);
      writeFitted(formatDate(app.date), textX, startY, textWidth, Math.max(12, w * .038), 9, brown, "800");
      if (app.lot) writeFitted(`Lote ${app.lot}`, textX, startY + gap, textWidth, Math.max(10, w * .031), 8, brown, "700");
    }

    const configuredStamp = (group === "crianca" || group === "gestante") ? slot.stampLayout : undefined;
    const radius = configuredStamp
      ? Math.min(w, h) * (configuredStamp.radius / 100)
      : Math.min(w, h) * ((slot.stampScale || 1) < 1 ? .195 : .218);
    const cx = configuredStamp ? x + w * (configuredStamp.centerX / 100) : x + w - radius * 1.25;
    const cy = configuredStamp ? y + h * (configuredStamp.centerY / 100) : y + h - radius * 1.25;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-3 * Math.PI / 180);
    const childStampPalette = ["#0ea5e9", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#22c55e", "#6366f1", "#eab308"];
    const childStampIndex = group === "crianca" ? Math.max(0, Number(slot.id.replace(/\D/g, "")) - 1) : 0;
    const stampColor = group === "crianca" ? childStampPalette[childStampIndex % childStampPalette.length] : blue;
    if (group === "crianca") {
      ctx.globalAlpha = .82;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.03, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = stampColor;
    ctx.fillStyle = stampColor;
    ctx.globalAlpha = .9;
    ctx.lineWidth = Math.max(3, radius * .075);
    ctx.setLineDash([radius * .18, radius * .055]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (logo) {
      ctx.globalAlpha = .72;
      ctx.drawImage(logo, -radius * .31, -radius * .56, radius * .62, radius * .62);
    }
    ctx.globalAlpha = .88;
    const doctorPreferred = Math.max(group === "crianca" ? 7 : 8, radius * (group === "crianca" ? .22 : .20));
    const crmPreferred = Math.max(group === "crianca" ? 7 : 8, radius * (group === "crianca" ? .20 : .18));
    writeCenteredFitted(app.doctorName, 0, radius * .10, radius * 1.72, doctorPreferred, group === "crianca" ? 6 : 7, stampColor, "900");
    writeCenteredFitted(`CRM ${app.doctorCrm}`, 0, radius * .70, radius * 1.68, crmPreferred, group === "crianca" ? 6 : 7, stampColor, "900");
    if (app.signatureImage) {
      const signature = await loadCanvasImage(app.signatureImage).catch(() => null);
      if (signature) {
        ctx.globalAlpha = .78;
        ctx.drawImage(signature, -radius * .68, radius * .22, radius * 1.36, radius * .42);
      }
    }
    ctx.restore();
  }
  if (definition.notes && observations.trim()) {
    const notes = definition.notes;
    const words = observations.replace(/\s+/g, " ").trim().split(" ");
    ctx.save();
    ctx.fillStyle = brown;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${notes.fontSize}px Georgia, serif`;
    const lines: string[] = [];
    for (const word of words) {
      const current = lines[lines.length - 1] || "";
      if (current && ctx.measureText(`${current} ${word}`).width <= notes.width) lines[lines.length - 1] = `${current} ${word}`;
      else if (lines.length < notes.maxLines) lines.push(word);
      else {
        let last = lines[lines.length - 1];
        while (last && ctx.measureText(`${last}…`).width > notes.width) last = last.slice(0, -1);
        lines[lines.length - 1] = `${last}…`;
        break;
      }
    }
    lines.forEach((line, index) => ctx.fillText(line, notes.x, notes.y + index * notes.lineHeight, notes.width));
    ctx.restore();
  }
}

function getPreviewMetrics(
  group: VaccinationGroup,
  adultVariant: AdultCardVariant,
  zoom: number,
  viewport?: { width: number; height: number },
) {
  const definition = getVaccinationCardDefinition(group, adultVariant);

  if (viewport && viewport.width > 0 && viewport.height > 0) {
    const fitScale = Math.min(viewport.width / definition.width, viewport.height / definition.height);
    const scaled = Math.max(0.1, fitScale * (zoom / 100));
    return {
      previewWidth: Math.round(definition.width * scaled),
      previewHeight: Math.round(definition.height * scaled),
    };
  }

  const basePreviewHeight = group === "crianca" ? 650 : 560;
  const previewHeight = Math.round(basePreviewHeight * (zoom / 100));
  const previewWidth = Math.round(previewHeight * (definition.width / definition.height));
  return { previewWidth, previewHeight };
}

function CardPreview({
  group,
  adultVariant,
  applications,
  patientName,
  passport,
  birthDate,
  doctorName,
  observations,
  page,
  zoom,
  viewport,
}: {
  group: VaccinationGroup;
  adultVariant: AdultCardVariant;
  applications: VaccinationApplication[];
  patientName: string;
  passport: string;
  birthDate: string;
  doctorName: string;
  observations: string;
  page: number;
  zoom: number;
  viewport?: { width: number; height: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderVersionRef = useRef(0);
  const { previewWidth, previewHeight } = getPreviewMetrics(group, adultVariant, zoom, viewport);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderVersion = ++renderVersionRef.current;
    const offscreen = document.createElement("canvas");
    void renderVaccinationCard({ canvas: offscreen, group, adultVariant, applications, patientName, passport, birthDate, doctorName, observations, page })
      .then(() => {
        if (renderVersionRef.current !== renderVersion) return;
        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreen, 0, 0);
      })
      .catch(() => {
        // A falha de prévia não deve quebrar a página; o export mantém tratamento próprio.
      });
  }, [group, adultVariant, applications, patientName, passport, birthDate, doctorName, observations, page]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Pré-visualização da caderneta de vacinação"
      className="shrink-0 rounded-[16px] border border-hpsr-border bg-white shadow-soft"
      style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
    />
  );
}

export default function VaccinationPage() {
  const { patients, loading: patientsLoading, selectedPatient, selectedPassport, selectPatient, upsertPatient } = usePatientSelection();
  const { profile } = useCurrentUserProfile();
  const [patientName, setPatientName] = useState("");
  const [patientPassport, setPatientPassport] = useState("");
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [group, setGroup] = useState<VaccinationGroup>("adulto");
  const [adultVariant, setAdultVariant] = useState<AdultCardVariant>("masculino");
  const [vaccine, setVaccine] = useState("");
  const [dose, setDose] = useState("1ª dose");
  const [date, setDate] = useState(() => brazilDate());
  const [lot, setLot] = useState(() => generateVaccinationLot());
  const [history, setHistory] = useState<VaccinationApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [page, setPage] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(100);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const [previewViewport, setPreviewViewport] = useState({ width: 0, height: 0 });
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [observations, setObservations] = useState("");
  const [cardRecords, setCardRecords] = useState<SavedVaccinationCard[]>([]);
  const upsertLocalCard = (card: SavedVaccinationCard) => setCardRecords((current) => [card, ...current.filter((item) => item.id !== card.id)]);
  const [publishing, setPublishing] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  useEffect(() => {
    if (!selectedPatient) return;
    setPatientName(selectedPatient.name);
    setPatientPassport(selectedPatient.passport);
    if (selectedPatient.birthDate) setBirthDate(selectedPatient.birthDate);
  }, [selectedPatient?.passport, selectedPatient?.birthDate]);

  useEffect(() => {
    setPreviewZoom(100);
  }, [group]);

  useEffect(() => {
    const currentDoctor: DoctorOption = {
      id: profile.id || "current-user",
      name: profile.characterName || profile.signatureName || "Médico",
      crm: profile.crm || "—",
      signatureImage: profile.signatureImage || null,
    };
    setSelectedDoctorId((current) => !current || current === "current-user" ? currentDoctor.id : current);
    const client = createClient();
    if (!client) { setAvailableDoctors([currentDoctor]); return; }
    void client.from("profiles").select("id,name,crm,signature_path,role").eq("access_status", "Aprovado").order("name").then(({ data }) => {
      const options: DoctorOption[] = (data || []).filter((row: any) => /médic|medic|cirurg|diretor|diretora/i.test(String(row.role || ""))).map((row: any) => {
        const signaturePath = String(row.signature_path || "").trim();
        let signatureImage: string | null = signaturePath || null;
        if (signaturePath && !signaturePath.startsWith("data:") && !/^https?:\/\//i.test(signaturePath)) {
          const { data: publicData } = client.storage.from("signatures").getPublicUrl(signaturePath);
          signatureImage = publicData.publicUrl || signaturePath;
        }
        return { id: String(row.id), name: String(row.name || "Médico"), crm: String(row.crm || "—"), signatureImage };
      });
      setAvailableDoctors([currentDoctor, ...options.filter((item) => item.id !== currentDoctor.id)]);
    });
  }, [profile.id, profile.characterName, profile.signatureName, profile.crm, profile.signatureImage]);

  const selectedDoctor = useMemo(
    () => availableDoctors.find((doctor) => doctor.id === selectedDoctorId) || availableDoctors[0] || null,
    [availableDoctors, selectedDoctorId],
  );

  const filteredPatients = useMemo(() => {
    const query = patientName.trim().toLocaleLowerCase("pt-BR");
    if (!query) return patients;
    return patients.filter((patient) => `${patient.name} ${patient.passport}`.toLocaleLowerCase("pt-BR").includes(query));
  }, [patients, patientName]);

  function choosePatient(patient: (typeof patients)[number]) {
    setPatientName(patient.name);
    setPatientPassport(patient.passport);
    setPatientPickerOpen(false);
    selectPatient(patient.passport);
  }

  function handlePatientEntry(value: string) {
    setPatientName(value);
    setPatientPickerOpen(true);
    const exact = patients.find((patient) => patient.name.toLocaleLowerCase("pt-BR") === value.trim().toLocaleLowerCase("pt-BR"));
    if (exact) {
      setPatientPassport(exact.passport);
      selectPatient(exact.passport);
      return;
    }
    if (selectedPatient && value !== selectedPatient.name) {
      selectPatient(null);
      setPatientPassport("");
      setBirthDate("");
      setHistory([]);
      setCardRecords([]);
      setObservations("");
    }
  }

  function handlePassportEntry(value: string) {
    const normalized = value.toUpperCase();
    setPatientPassport(normalized);
    const exact = patients.find((patient) => patient.passport === normalized);
    if (exact) {
      setPatientName(exact.name);
      selectPatient(exact.passport);
      return;
    }
    if (selectedPatient && normalized !== selectedPatient.passport) {
      selectPatient(null);
      setBirthDate("");
      setHistory([]);
      setCardRecords([]);
      setObservations("");
    }
  }

  async function loadHistory(passport = selectedPassport) {
    if (!passport) { setHistory([]); return; }
    const client = createClient();
    if (!client) return;
    setLoading(true);
    try {
    const [recordsResult, registryResult, cardsResult] = await Promise.all([
      client.from("clinical_records").select("id,patient_passport,payload,created_at,created_by").eq("patient_passport", passport).eq("record_type", "Vacina").order("created_at", { ascending: true }),
      client.from("patient_registry").select("age,birth_date,sex").eq("passport", passport).maybeSingle(),
      client.from("clinical_records").select("id,payload,updated_at").eq("patient_passport", passport).eq("record_type", "CadernetaVacinal").order("updated_at", { ascending: false }),
    ]);
    if (recordsResult.error) await hpsrAlert(recordsResult.error.message, "Não foi possível carregar o histórico vacinal");
    const parsedHistory = (recordsResult.data || []).map(parseVaccineRow).filter(Boolean) as VaccinationApplication[];
    setHistory(parsedHistory);
    if (cardsResult.error) throw new Error(`Falha ao consultar a caderneta: ${cardsResult.error.message}`);
    const savedCards = (cardsResult.data || []).map(parseSavedCard).filter(Boolean) as SavedVaccinationCard[];
    const existingCard = savedCards[0] || null;
    setCardRecords(savedCards);
    setObservations(existingCard?.observations || "");
    const registryPatient = registryResult.data as any;
    const registryBirthDate = String(registryPatient?.birth_date || "");
    setBirthDate(registryBirthDate);

    // A escolha persistida na caderneta prevalece sobre o último atendimento.
    const latestApplication = parsedHistory.length ? parsedHistory[parsedHistory.length - 1] : null;
    if (existingCard) {
      if (existingCard.card_model.startsWith("adulto-")) {
        setGroup("adulto");
        setAdultVariant(existingCard.card_model === "adulto-feminino" ? "feminino" : "masculino");
      } else setGroup(existingCard.card_model as VaccinationGroup);
    } else if (latestApplication) {
      setGroup(latestApplication.group);
      if (latestApplication.group === "adulto") setAdultVariant(latestApplication.adultVariant || "masculino");
    } else {
      const inferredBirthYear = Number(registryBirthDate.slice(0, 4));
      const birthMonth = Number(registryBirthDate.slice(5, 7));
      const currentDate = brazilDate();
      const ageFromDate = inferredBirthYear ? Number(currentDate.slice(0, 4)) - inferredBirthYear
        - (Number(currentDate.slice(5, 7)) < birthMonth || (Number(currentDate.slice(5, 7)) === birthMonth && currentDate.slice(8, 10) < registryBirthDate.slice(8, 10)) ? 1 : 0) : NaN;
      const registeredAge = String(registryPatient?.age || (Number.isFinite(ageFromDate) ? ageFromDate : ""));
      setGroup(registeredAge ? suggestVaccinationGroup(registeredAge) : "adulto");
      setAdultVariant(/^(f|feminino|mulher)$/i.test(String(registryPatient?.sex || "").trim()) ? "feminino" : "masculino");
    }
    } catch (error) {
      await hpsrAlert(error instanceof Error ? error.message : "Falha de conexão ao consultar a vacinação.", "Histórico indisponível");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadHistory(); }, [selectedPassport]);

  const groupHistory = useMemo(() => history.filter((item) => item.group === group && (
    group !== "adulto" || !item.adultVariant || item.adultVariant === adultVariant
  )), [history, group, adultVariant]);
  const def = getVaccinationCardDefinition(group, adultVariant);
  const vaccineOptions = useMemo(() => cardVaccineOptions(group, adultVariant), [group, adultVariant]);
  const activeAssignments = useMemo(() => assignApplicationsToSlots(groupHistory, def), [groupHistory, group, adultVariant]);
  const selectedVaccine = vaccineOptions.find((option) => option.name === vaccine);
  const modelKey = group === "adulto" ? `adulto-${adultVariant}` : group;
  const displayedCard = cardRecords.find((card) => card.card_model === modelKey) || null;
  const nextDose = (name: string) => {
    const option = vaccineOptions.find((item) => item.name === name);
    return option?.doses.find((candidate) => {
      const slot = findVaccinationSlot(def, name, candidate);
      return slot && !activeAssignments.has(slot.id);
    }) || option?.doses[0] || "1ª dose";
  };
  useEffect(() => {
    if (!vaccineOptions.some((option) => option.name === vaccine)) {
      setVaccine(vaccineOptions[0]?.name || "");
      return;
    }
    const slot = findVaccinationSlot(def, vaccine, dose);
    const suggested = nextDose(vaccine);
    if ((!selectedVaccine?.doses.includes(dose) || (slot && activeAssignments.has(slot.id))) && dose !== suggested) {
      setDose(suggested);
    }
  }, [group, adultVariant, vaccine, dose, vaccineOptions, activeAssignments]);
  const pageCount = group === "gestante" ? Math.max(1, Math.ceil(groupHistory.length / def.slots.length)) : 1;
  useEffect(() => setPage(0), [group, adultVariant, selectedPassport]);

  useEffect(() => {
    const node = previewViewportRef.current;
    if (!node) return;

    const updatePreviewViewport = () => {
      const styles = window.getComputedStyle(node);
      const paddingX = Number.parseFloat(styles.paddingLeft || "0") + Number.parseFloat(styles.paddingRight || "0");
      const paddingY = Number.parseFloat(styles.paddingTop || "0") + Number.parseFloat(styles.paddingBottom || "0");
      setPreviewViewport({
        width: Math.max(0, node.clientWidth - paddingX),
        height: Math.max(0, node.clientHeight - paddingY),
      });
    };

    updatePreviewViewport();
    const observer = new ResizeObserver(updatePreviewViewport);
    observer.observe(node);
    return () => observer.disconnect();
  }, [group, patientName, patientPassport]);

  const previewMetrics = getPreviewMetrics(group, adultVariant, previewZoom, previewViewport);

  // A mesma tabela do prontuário armazena doses (Vacina) e documento (CadernetaVacinal).
  // A caderneta tem liberação independente; editar o rascunho nunca publica dados novos.
  async function saveCardMetadata(passport: string, doctor: DoctorOption) {
    const client = createClient();
    if (!client || !profile.id) throw new Error("É preciso acessar com um perfil médico autenticado.");
    if (!patients.some((item) => item.passport === passport)) {
      const saved = await upsertPatient({ name: patientName.trim(), passport,
        age: "", bloodType: "", cityPhone: "", email: "" });
      if (!saved) throw new Error("Não foi possível cadastrar o paciente antes de criar a caderneta.");
    }
    const now = brazilIso();
    let previous = displayedCard;
    if (!previous) {
      // Outra sessão pode ter criado o documento; não inserir uma segunda caderneta.
      const { data: existing, error } = await client.from("clinical_records")
        .select("id,payload,updated_at").eq("record_type", "CadernetaVacinal")
        .eq("patient_passport", passport).eq("payload->>cardModel", modelKey).maybeSingle();
      if (error) throw new Error(error.message);
      previous = parseSavedCard(existing);
    }
    const payload = {
      ...(previous?.payload || {}),
      title: `Caderneta de vacinação · ${modelKey}`,
      cardModel: modelKey,
      patient: { name: patientName.trim(), passport },
      doctor: { id: doctor.id, name: doctor.name, crm: doctor.crm },
      doctorName: doctor.name,
      observations: observations.trim(),
      version: previous ? previous.version + 1 : 1,
    };
    const request = previous
      ? client.from("clinical_records").update({ payload, updated_at: now })
        .eq("id", previous.id).eq("record_type", "CadernetaVacinal")
        .eq("patient_passport", passport).eq("payload->>version", String(previous.version))
        .select("id,payload,updated_at").maybeSingle()
      : client.from("clinical_records").insert({ id: crypto.randomUUID(), patient_passport: passport,
          record_type: "CadernetaVacinal", payload, created_by: profile.id,
          is_confidential: true, released_at: null, created_at: now, updated_at: now })
        .select("id,payload,updated_at").single();
    const { data, error } = await request;
    if (error || !data) throw new Error(error?.code === "23505" || (!error && !data)
      ? "A caderneta foi atualizada em outra sessão. Recarregue o histórico e tente novamente."
      : (error?.message || "Não foi possível salvar a caderneta."));
    const card = parseSavedCard(data);
    if (!card) throw new Error("Formato de caderneta inválido no prontuário.");
    upsertLocalCard(card);
    return card;
  }

  async function updateCardFields(card: SavedVaccinationCard, patch: Record<string, unknown>, published?: boolean) {
    const client = createClient();
    if (!client || !profile.id) throw new Error("Supabase indisponível.");
    const now = brazilIso();
    const payload = { ...card.payload, ...patch, version: card.version + 1 };
    const update: Record<string, unknown> = { payload, updated_at: now };
    if (published === true) Object.assign(update, { is_confidential: false, released_at: now, released_by: profile.id });
    if (published === false) Object.assign(update, { is_confidential: true, released_at: null, released_by: null });
    const { data, error } = await client.from("clinical_records").update(update)
      .eq("id", card.id).eq("record_type", "CadernetaVacinal")
      .eq("payload->>version", String(card.version))
      .select("id,payload,updated_at").maybeSingle();
    if (error || !data) throw new Error(error?.message || "Esta caderneta mudou em outra sessão. Recarregue o histórico e tente novamente.");
    const saved = parseSavedCard(data);
    if (!saved) throw new Error("Formato de caderneta inválido.");
    upsertLocalCard(saved);
    return saved;
  }

  async function storeCardImage(cardId: string, applications: VaccinationApplication[], purpose: "draft" | "publish", doctor: DoctorOption) {
    const client = createClient();
    if (!client) throw new Error("Supabase indisponível.");
    const canvas = document.createElement("canvas");
    await renderVaccinationCard({ canvas, group, adultVariant, applications, patientName: patientName.trim(),
      passport: patientPassport.trim().toUpperCase(), birthDate, doctorName: doctor.name,
      observations, page: 0 });
    const image = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao gerar a caderneta.")), "image/png"));
    const path = `${cardId}/${purpose}-${crypto.randomUUID()}.png`;
    const { error } = await client.storage.from("vaccination-cards").upload(path, image, { contentType: "image/png", upsert: false });
    if (error) throw new Error(error.message);
    return path;
  }

  async function updateObservations() {
    if (!patientName.trim() || !patientPassport.trim() || !selectedDoctor) return void hpsrAlert("Informe nome, passaporte e médico.", "Caderneta incompleta");
    setPublishing(true);
    try {
      const card = await saveCardMetadata(patientPassport.trim().toUpperCase(), selectedDoctor);
      const path = await storeCardImage(card.id, groupHistory, "draft", selectedDoctor);
      await updateCardFields(card, { draftPath: path });
      hpsrSuccess("Observações e caderneta atualizadas. A versão do paciente não foi alterada.", "Rascunho salvo");
    } catch (error) {
      await hpsrAlert(error instanceof Error ? error.message : "Falha ao salvar.", "Caderneta não atualizada");
    } finally { setPublishing(false); }
  }

  async function publishCard() {
    if (!patientPassport.trim() || !selectedDoctor || !groupHistory.length) return void hpsrAlert("Selecione um paciente com doses registradas.", "Caderneta incompleta");
    const confirmed = await hpsrConfirm("Liberar a versão atual desta caderneta para visualização do paciente ou responsável autorizado?", "Liberar caderneta");
    if (!confirmed) return;
    setPublishing(true);
    try {
      const card = await saveCardMetadata(patientPassport.trim().toUpperCase(), selectedDoctor);
      const path = await storeCardImage(card.id, groupHistory, "publish", selectedDoctor);
      await updateCardFields(card, { publishedPath: path }, true);
      hpsrSuccess("Caderneta liberada no Portal do Paciente.", "Liberação concluída");
    } catch (error) {
      await hpsrAlert(error instanceof Error ? error.message : "Não foi possível liberar a caderneta.", "Liberação não concluída");
    } finally { setPublishing(false); }
  }

  async function revokeCard() {
    if (!displayedCard?.published_path) return;
    if (!await hpsrConfirm("Recolher a visualização desta caderneta no Portal do Paciente?", "Recolher caderneta")) return;
    try {
      await updateCardFields(displayedCard, { publishedPath: null }, false);
      hpsrSuccess("A caderneta não está mais visível no Portal do Paciente.", "Caderneta recolhida");
    } catch (error) {
      await hpsrAlert(error instanceof Error ? error.message : "Não foi possível recolher.", "Não foi possível recolher");
    }
  }

  async function saveApplication() {
    const normalizedName = patientName.trim();
    const normalizedPassport = patientPassport.trim().toUpperCase();
    if (!normalizedName || !normalizedPassport) return void hpsrAlert("Informe nome e passaporte do paciente.", "Paciente obrigatório");
    if (group === "crianca" && !birthDate) return void hpsrAlert("Informe a data de nascimento da criança.", "Data de nascimento obrigatória");
    if (!vaccine.trim() || !dose || !date) return void hpsrAlert("Informe vacina, dose e data da aplicação.", "Preenchimento incompleto");
    if (!selectedDoctor) return void hpsrAlert("Selecione o médico responsável pela aplicação.", "Médico obrigatório");
    if (!selectedDoctor.crm || selectedDoctor.crm === "—") return void hpsrAlert("O médico responsável precisa ter CRM cadastrado para gerar o carimbo.", "CRM obrigatório");
    const targetSlot = findVaccinationSlot(def, vaccine, dose);
    if (!targetSlot) return void hpsrAlert("Escolha uma vacina e dose disponíveis no modelo selecionado.", "Espaço não encontrado");
    if (activeAssignments.has(targetSlot.id)) return void hpsrAlert("Esta dose já está registrada nesta caderneta. Selecione a próxima dose disponível.", "Dose já registrada");

    const resolvedLot = lot.trim() || generateVaccinationLot();
    const client = createClient();
    if (!client) return;
    setSaving(true);
    try {
    const registrySaved = await upsertPatient({
      name: normalizedName,
      passport: normalizedPassport,
      age: selectedPatient?.passport === normalizedPassport ? selectedPatient.age : "",
      bloodType: selectedPatient?.passport === normalizedPassport ? selectedPatient.bloodType : "",
      cityPhone: selectedPatient?.passport === normalizedPassport ? selectedPatient.cityPhone : "",
      email: selectedPatient?.passport === normalizedPassport ? selectedPatient.email : "",
    });
    if (!registrySaved) {
      setSaving(false);
      return void hpsrAlert("Não foi possível criar ou atualizar o cadastro mínimo do paciente no prontuário.", "Paciente não salvo");
    }
    if (birthDate) {
      const { error: birthDateError } = await client.from("patient_registry").update({ birth_date: birthDate }).eq("passport", normalizedPassport);
      if (birthDateError) {
        setSaving(false);
        return void hpsrAlert(birthDateError.message, "Não foi possível salvar a data de nascimento");
      }
    }

    // Aplicação é o dado clínico principal. Um problema com o PNG não pode perder a dose.
    const id = crypto.randomUUID();
    const now = brazilIso();
    const payload = {
      title: `Vacinação · ${vaccine.trim()} · ${dose}`,
      summary: `${vaccine.trim()} · ${dose} · ${formatDate(date)}`,
      patient: { name: normalizedName, passport: normalizedPassport, birthDate },
      patientName: normalizedName,
      patientPassport: normalizedPassport,
      vaccine: { name: vaccine.trim(), dose, date, lot: resolvedLot, slotId: targetSlot.id, group, adultVariant: group === "adulto" ? adultVariant : undefined },
      vaccinationCardId: displayedCard?.id || null,
      observations: observations.trim(),
      doctor: { name: selectedDoctor.name, crm: selectedDoctor.crm, signatureImage: selectedDoctor.signatureImage },
      doctorName: selectedDoctor.name,
      doctorCrm: selectedDoctor.crm,
      cardModel: group === "adulto" ? `adulto-${adultVariant}` : group,
      releasedToPatient: false,
    };
    const { error } = await client.from("clinical_records").insert({
      id,
      patient_passport: normalizedPassport,
      record_type: "Vacina",
      payload,
      created_by: profile.id || null,
      is_confidential: true,
      released_at: null,
      created_at: now,
      updated_at: now,
    });
    if (error) {
      setSaving(false);
      return void hpsrAlert(error.code === "23505" ? "Esta dose já foi registrada para esta caderneta." : error.message, "Não foi possível registrar a vacina");
    }
    setLot(generateVaccinationLot());
    selectPatient(normalizedPassport);
    const updatedApplications = [...groupHistory, {
      id, patientPassport: normalizedPassport, patientName: normalizedName, group,
      adultVariant, vaccine: vaccine.trim(), dose, date, lot: resolvedLot,
      doctorName: selectedDoctor.name, doctorCrm: selectedDoctor.crm,
      signatureImage: selectedDoctor.signatureImage, createdAt: now, createdBy: profile.id, slotId: targetSlot.id,
    } as VaccinationApplication];
    try {
      const savedCard = await saveCardMetadata(normalizedPassport, selectedDoctor);
      const path = await storeCardImage(savedCard.id, updatedApplications, "draft", selectedDoctor);
      await updateCardFields(savedCard, { draftPath: path });
    } catch (imageError) {
      await hpsrAlert(`A dose foi salva no histórico. A caderneta continua disponível na prévia; para persistir o PNG, use “Criar / atualizar caderneta”: ${imageError instanceof Error ? imageError.message : "erro desconhecido"}`, "Dose registrada; PNG pendente");
    }
    const updatedAssigned = assignApplicationsToSlots(updatedApplications, def);
    const available = vaccineOptions.find((option) => option.name === vaccine)?.doses.find((candidate) => {
      const slot = findVaccinationSlot(def, vaccine, candidate);
      return slot && !updatedAssigned.has(slot.id);
    });
    await loadHistory(normalizedPassport);
    if (available) setDose(available);
    setSaving(false);
    hpsrSuccess(`${vaccine.trim()} (${dose}) foi registrada para ${normalizedName}. A liberação ao paciente é independente.`, "Vacina registrada");
    } catch (unexpectedError) {
      await hpsrAlert(unexpectedError instanceof Error ? unexpectedError.message : "Falha de conexão ao registrar a vacina.", "Registro não concluído");
    } finally { setSaving(false); }
  }

  async function removeApplication(item: VaccinationApplication) {
    const confirmed = await hpsrConfirm(`Excluir o registro de ${item.vaccine} (${item.dose})?`, "Excluir aplicação");
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    const { error } = await client.from("clinical_records").delete().eq("id", item.id).eq("record_type", "Vacina");
    if (error) return void hpsrAlert(error.message, "Não foi possível excluir");
    await loadHistory(item.patientPassport);
  }

  async function exportCard() {
    const normalizedName = patientName.trim();
    const normalizedPassport = patientPassport.trim().toUpperCase();
    if (!normalizedName || !normalizedPassport) return void hpsrAlert("Informe nome e passaporte do paciente antes de gerar a caderneta.", "Paciente obrigatório");
    if (group === "crianca" && !birthDate) return void hpsrAlert("Informe a data de nascimento da criança antes de gerar a caderneta.", "Data de nascimento obrigatória");
    try {
      const canvas = document.createElement("canvas");
      await renderVaccinationCard({
        canvas,
        group,
        adultVariant,
        applications: groupHistory,
        patientName: normalizedName,
        passport: normalizedPassport,
        birthDate,
              doctorName: selectedDoctor?.name || "",
        observations,
        page,
      });
      const anchor = document.createElement("a");
      const safeName = normalizedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      anchor.download = `caderneta-vacinacao-${safeName || normalizedPassport}-p${page + 1}.png`;
      anchor.href = canvas.toDataURL("image/png", 1);
      anchor.click();
    } catch (error) {
      await hpsrAlert(error instanceof Error ? error.message : "Não foi possível gerar a imagem.", "Falha ao gerar PNG");
    }
  }

  return (
    <div className="hpsr-page hpsr-vaccination-page gap-3" data-vaccine-group={group}>
      <PageHeader eyebrow="Vacinação" title="Vacinação" description="Registro de aplicações, histórico e caderneta automática por paciente." />

      <div className="grid items-stretch gap-3 2xl:grid-cols-[470px_minmax(0,1fr)]">
        <aside className="space-y-3 2xl:h-full">
          <section className="hpsr-vaccination-panel rounded-[18px] border border-[#d8c8b6] bg-[#f1e9df] p-4 shadow-soft">
            <div className="hpsr-vaccination-section-title flex items-center gap-2"><Syringe size={18} className="text-hpsr-wine"/><h2 className="font-black text-hpsr-text">Registrar vacina</h2></div>
            <div className="mt-4 space-y-3">
              <h3 className="hpsr-vaccination-field-heading">Paciente e modelo</h3>
              <div className="relative">
                <label className="block text-xs font-black text-hpsr-muted">Paciente</label>
                <div className="relative mt-1">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hpsr-muted" />
                  <input
                    value={patientName}
                    onFocus={() => setPatientPickerOpen(true)}
                    onBlur={() => window.setTimeout(() => setPatientPickerOpen(false), 120)}
                    onChange={(e) => handlePatientEntry(e.target.value)}
                    className={`${inputClass} pl-9 pr-10`}
                    placeholder={patientsLoading ? "Carregando pacientes..." : "Busque ou digite um paciente"}
                    autoComplete="off"
                  />
                  {selectedPassport && patientName.trim() && (
                    <span className="pointer-events-none absolute right-3 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={12}/></span>
                  )}
                </div>
                {patientPickerOpen && !patientsLoading && (
                  <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden hpsr-vaccination-picker rounded-[15px] border border-hpsr-border bg-white shadow-[0_18px_45px_rgba(84,42,25,.16)]">
                    <div className="flex items-center justify-between gap-3 border-b border-hpsr-border/70 bg-[#fffaf5] px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wine">Pacientes do prontuário</p>
                      <span className="rounded-full border border-hpsr-border bg-white px-2 py-0.5 text-[9px] font-black text-hpsr-muted">{filteredPatients.length}/{patients.length}</span>
                    </div>
                    <div className="max-h-[310px] overflow-y-auto p-1.5">
                      {filteredPatients.length ? filteredPatients.map((patient) => {
                        const active = patient.passport === selectedPassport;
                        return (
                          <button
                            key={patient.passport}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => choosePatient(patient)}
                            data-vaccine-active={active}
                            className={`hpsr-vaccination-patient-choice flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition ${active ? "bg-[#f7ebe3] text-hpsr-wine" : "text-hpsr-text hover:bg-[#fff8f3]"}`}
                          >
                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${active ? "bg-hpsr-wine text-white" : "bg-[#f5eee7] text-hpsr-wine"}`}><UserRound size={16}/></span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-black">{patient.name}</span>
                              <span className="mt-0.5 block truncate text-[11px] font-semibold text-hpsr-muted">Passaporte {patient.passport}{patient.age ? ` · ${patient.age} anos` : ""}{patient.sex ? ` · ${patient.sex}` : ""}</span>
                            </span>
                            {active && <Check size={15} className="shrink-0"/>}
                          </button>
                        );
                      }) : (
                        <div className="px-3 py-4 text-center">
                          <p className="text-xs font-bold text-hpsr-text">Nenhum paciente encontrado</p>
                          <p className="mt-1 text-[10px] font-semibold text-hpsr-muted">Continue digitando para usar este nome como novo paciente.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <span className="mt-1.5 block text-[10px] font-semibold leading-relaxed text-hpsr-muted">Selecione alguém do prontuário ou continue digitando para um paciente novo.</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="block text-xs font-black text-hpsr-muted">Passaporte
                  <input value={patientPassport} onChange={(e) => handlePassportEntry(e.target.value)} className={`${inputClass} mt-1`} placeholder="Digite o passaporte" />
                </label>
                {(group === "crianca" || def.identity.birthDate) && <label className="block text-xs font-black text-hpsr-muted">Data de nascimento
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={`${inputClass} mt-1`} />
                </label>}
              </div>
              <p className="hpsr-vaccination-tip rounded-[12px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-[10px] font-semibold leading-relaxed text-hpsr-muted">Se o passaporte ainda não existir no prontuário, o cadastro mínimo do paciente será criado automaticamente quando a vacina for registrada.</p>
              <div className={`grid gap-2 ${group === "adulto" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                <label className="block text-xs font-black text-hpsr-muted">Grupo da caderneta
                  <StyledSelect value={group} onChange={(e) => { const next = e.target.value as VaccinationGroup; setGroup(next); const nextKey = next === "adulto" ? `adulto-${adultVariant}` : next; setObservations(cardRecords.find((card) => card.card_model === nextKey)?.observations || ""); }} className={`${inputClass} mt-1`}>
                    <option value="adulto">Adulto</option><option value="crianca">Criança</option><option value="gestante">Gestante</option><option value="idoso">Idoso</option>
                  </StyledSelect>
                </label>
                {group === "adulto" && <label className="block text-xs font-black text-hpsr-muted">Modelo adulto
                  <StyledSelect value={adultVariant} onChange={(e) => { const next = e.target.value as AdultCardVariant; setAdultVariant(next); setObservations(cardRecords.find((card) => card.card_model === `adulto-${next}`)?.observations || ""); }} className={`${inputClass} mt-1`}><option value="masculino">Masculino</option><option value="feminino">Feminino</option></StyledSelect>
                </label>}
              </div>
              <h3 className="hpsr-vaccination-field-heading">Aplicação</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs font-black text-hpsr-muted">Vacina
                  <StyledSelect value={vaccine} onChange={(e) => { setVaccine(e.target.value); setDose(nextDose(e.target.value)); }} className={`${inputClass} mt-1`}>
                    {vaccineOptions.map((option) => <option key={option.name} value={option.name}>{option.name}</option>)}
                  </StyledSelect>
                </label>
                <label className="block text-xs font-black text-hpsr-muted">Dose
                  <StyledSelect value={dose} onChange={(e) => setDose(e.target.value)} className={`${inputClass} mt-1`}>
                    {(selectedVaccine?.doses || []).map((item) => {
                      const slot = findVaccinationSlot(def, vaccine, item);
                      const occupied = Boolean(slot && activeAssignments.has(slot.id));
                      return <option key={item} value={item} disabled={occupied}>{item}{occupied ? " — já aplicada" : ""}</option>;
                    })}
                  </StyledSelect>
                  <span className="mt-1 block text-[10px] font-semibold leading-relaxed text-hpsr-muted">As doses já registradas ficam indisponíveis. O sistema sugere o próximo espaço livre da vacina.</span>
                </label>
              </div>
              <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block text-xs font-black text-hpsr-muted">Data da aplicação<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} mt-1`} /></label>
                <p className="hpsr-vaccination-lot-notice flex min-h-[44px] items-center gap-2 rounded-[12px] border px-3 py-2 text-[11px] font-semibold leading-snug"><Check size={15} className="shrink-0"/>Lote gerado automaticamente e registrado no histórico.</p>
              </div>
              <label className="block text-xs font-black text-hpsr-muted">Médico responsável <span className="font-medium text-hpsr-muted">(perfil logado por padrão)</span>
                <StyledSelect value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} className={`${inputClass} mt-1`}>
                  {availableDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
                </StyledSelect>
              </label>
              <h3 className="hpsr-vaccination-field-heading">Documento e observações</h3>
              <label className="block text-xs font-black text-hpsr-muted">Observações da caderneta
                <textarea value={observations} onChange={(e) => setObservations(e.target.value.slice(0, 1200))} rows={3}
                  placeholder="Anotações clínicas pertinentes (opcional)" className={`${inputClass} mt-1 min-h-[82px] resize-y py-2`} />
                <span className="mt-1 block text-[10px] font-semibold text-hpsr-muted">Registradas somente por médico; aparecem no campo do modelo conforme o espaço disponível.</span>
              </label>
              <button type="button" onClick={() => void updateObservations()} disabled={publishing || saving || !patientPassport.trim()} className="hpsr-vaccination-outline-action w-full rounded-[12px] border px-3 py-2 text-xs font-black disabled:opacity-50">Criar / atualizar caderneta</button>
              <div className="hpsr-vaccination-stamp-note flex items-start gap-2 rounded-[12px] border border-[#b7d9d3] bg-[#f3f2eb] p-3 text-xs font-semibold leading-relaxed text-[#42685f]"><ShieldCheck size={17} className="mt-0.5 shrink-0"/><span>O carimbo é preenchido automaticamente com os dados do perfil de <strong>{selectedDoctor?.name || "médico selecionado"}</strong> e aplicado no espaço correto da dose.</span></div>
              <button type="button" onClick={() => void saveApplication()} disabled={saving || publishing || !patientName.trim() || !patientPassport.trim() || Boolean(findVaccinationSlot(def, vaccine, dose) && activeAssignments.has(findVaccinationSlot(def, vaccine, dose)!.id))} className="flex min-h-[46px] w-full items-center justify-center gap-2 hpsr-vaccination-primary-action rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin"/> : <Syringe size={16}/>}Registrar e aplicar na caderneta</button>
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-3 2xl:flex 2xl:h-full 2xl:min-h-0 2xl:flex-col 2xl:space-y-0 2xl:gap-3">
          <section className="hpsr-vaccination-panel rounded-[20px] border border-[#d8c8b6] bg-[#f1e9df] p-4 shadow-soft print:border-0 print:p-0 print:shadow-none 2xl:flex 2xl:min-h-0 2xl:flex-1 2xl:flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <div className="hpsr-vaccination-section-title"><h2 className="font-black text-hpsr-text">Caderneta gerada</h2><p className="text-xs font-semibold text-hpsr-muted">O histórico é a fonte de verdade; a caderneta é montada automaticamente.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                {pageCount > 1 && <span className="text-xs font-black text-hpsr-muted">Página {page + 1}/{pageCount}</span>}
                <div className="inline-flex items-center rounded-[12px] border border-hpsr-border bg-[#fffaf4] p-1" aria-label="Zoom da pré-visualização">
                  <button type="button" onClick={() => setPreviewZoom((value) => Math.max(65, value - 8))} className="grid h-7 w-7 place-items-center rounded-[8px] text-hpsr-wine hover:bg-white" title="Diminuir prévia"><Minus size={14}/></button>
                  <button type="button" onClick={() => setPreviewZoom(100)} className="min-w-[48px] px-1 text-[11px] font-black text-hpsr-muted" title="Restaurar tamanho compacto">{previewZoom}%</button>
                  <button type="button" onClick={() => setPreviewZoom((value) => Math.min(140, value + 8))} className="grid h-7 w-7 place-items-center rounded-[8px] text-hpsr-wine hover:bg-white" title="Aumentar prévia"><Plus size={14}/></button>
                </div>
                <button onClick={() => void loadHistory()} className="rounded-[12px] border border-hpsr-border bg-white p-2 text-hpsr-wine"><RefreshCw size={16}/></button>
                <button type="button" onClick={() => setPreviewExpanded(true)} className="hpsr-vaccination-outline-action inline-flex items-center gap-1.5 rounded-[12px] border px-3 py-2 text-xs font-black"><Eye size={15}/>Ampliar</button>
                <button type="button" onClick={() => void publishCard()} disabled={publishing || saving || !groupHistory.length} className="hpsr-vaccination-outline-action inline-flex items-center gap-1.5 rounded-[12px] border px-3 py-2 text-xs font-black disabled:opacity-50"><ShieldCheck size={15}/>Liberar ao paciente</button>
                {displayedCard?.published_path && <button type="button" onClick={() => void revokeCard()} disabled={publishing || saving} className="rounded-[12px] border border-[#dec6b8] bg-[#faf4ed] px-3 py-2 text-xs font-black text-[#7b4a37]">Recolher</button>}
                <button onClick={exportCard} disabled={!patientName.trim() || !patientPassport.trim()} className="inline-flex items-center gap-2 hpsr-vaccination-primary-action rounded-[12px] bg-hpsr-wine px-3 py-2 text-xs font-black text-white disabled:opacity-50"><Download size={15}/>Baixar PNG</button>
              </div>
            </div>
            <p className="mb-2 text-[11px] font-semibold text-hpsr-muted print:hidden">{displayedCard?.published_path ? "Há uma versão liberada no Portal do Paciente. Novas aplicações e observações ficam em rascunho até uma nova liberação." : "Caderneta interna: o paciente verá somente após liberação médica."}</p>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              {patientName.trim() && patientPassport.trim() ? (
                <div
                  ref={previewViewportRef}
                  className={`w-full overflow-auto hpsr-vaccination-preview rounded-[17px] border border-hpsr-border/70 bg-gradient-to-b from-[#fbf8f4] to-[#f5eee7] p-3 ${group === "crianca" ? "h-[390px] 2xl:h-full" : "h-[340px] 2xl:h-full"}`}
                >
                  <div className="grid min-h-full place-items-center justify-items-center">
                    <CardPreview group={group} adultVariant={adultVariant} applications={groupHistory} patientName={patientName.trim()} passport={patientPassport.trim().toUpperCase()} birthDate={birthDate} doctorName={selectedDoctor?.name || ""} observations={observations} page={page} zoom={previewZoom} viewport={previewViewport} />
                  </div>
                </div>
              ) : <div ref={previewViewportRef} className={`grid w-full place-items-center hpsr-vaccination-preview rounded-[17px] border border-dashed border-hpsr-border bg-gradient-to-b from-[#fffaf5] to-[#f8f1ea] px-6 text-center text-sm font-bold text-hpsr-muted ${group === "crianca" ? "h-[390px] 2xl:h-full" : "h-[340px] 2xl:h-full"}`}>Informe nome e passaporte para gerar a caderneta.</div>}
            </div>
            {pageCount > 1 && <div className="mt-3 flex justify-center gap-2 print:hidden"><button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="rounded-[10px] border border-hpsr-border px-3 py-2 text-xs font-black disabled:opacity-40">Anterior</button><button disabled={page>=pageCount-1} onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))} className="rounded-[10px] border border-hpsr-border px-3 py-2 text-xs font-black disabled:opacity-40">Próxima</button></div>}
          </section>

          <section className="hpsr-vaccination-panel flex h-[190px] flex-col rounded-[20px] border border-[#d8c8b6] bg-[#f1e9df] p-4 shadow-soft print:hidden 2xl:shrink-0">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="hpsr-vaccination-section-title"><h2 className="font-black text-hpsr-text">Histórico de vacinação</h2><p className="mt-0.5 text-[10px] font-semibold text-hpsr-muted">Registros do paciente selecionado</p></div>
              <span className="hpsr-vaccination-history-count rounded-full border border-hpsr-border bg-[#fff8f3] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{history.length} {history.length === 1 ? "registro" : "registros"}</span>
            </div>
            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {loading ? <div className="grid place-items-center py-8"><Loader2 className="animate-spin text-hpsr-wine"/></div> : history.length ? history.slice().reverse().map((item) => {
                const canDelete = profile.accessLevel === "Total";
                return <article key={item.id} className="flex flex-col gap-2 hpsr-vaccination-history-item rounded-[13px] border border-[#d8c4b0] bg-[#f3e7da] px-3 py-2.5 transition hover:border-hpsr-wine/20 hover:bg-[#f8efe5] sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-black text-hpsr-text">{item.vaccine} · {item.dose}</p><p className="mt-0.5 break-words text-[11px] font-semibold text-hpsr-muted">{formatDate(item.date)}{item.lot ? ` · Lote ${item.lot}` : ""} · {item.doctorName} · CRM {item.doctorCrm}</p></div>{canDelete && <button onClick={() => void removeApplication(item)} className="inline-flex shrink-0 items-center justify-center gap-1 rounded-[10px] border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-black text-rose-700 transition hover:bg-rose-100"><Trash2 size={13}/>Excluir</button>}</article>;
              }) : <p className="rounded-[14px] border border-dashed border-[#d6c0a9] bg-[#eee0d0] p-4 text-center text-sm font-semibold text-hpsr-muted">Nenhuma vacina registrada para este paciente.</p>}
            </div>
          </section>
        </main>
      </div>
      {previewExpanded && (
        <div className="hpsr-modal-tone fixed inset-0 z-[120] flex items-center justify-center bg-[#251a18]/80 p-3" role="dialog" aria-modal="true" aria-label="Caderneta ampliada" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewExpanded(false); }}>
          <div className="flex max-h-[96dvh] w-full max-w-[1500px] flex-col rounded-[18px] border border-[#d7c7b5] bg-[#f2e9df] p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between"><h3 className="font-black text-hpsr-text">Caderneta de vacinação · Prévia ampliada</h3><button type="button" onClick={() => setPreviewExpanded(false)} className="rounded-[9px] border border-[#b6d9d1] bg-[#fffcf8] px-3 py-2 text-xs font-black text-[#42685f]">Fechar</button></div>
            <div className="min-h-0 flex-1 overflow-auto rounded-[12px] bg-[#e9e0d6] p-3">
              <CardPreview group={group} adultVariant={adultVariant} applications={groupHistory} patientName={patientName.trim()} passport={patientPassport.trim().toUpperCase()} birthDate={birthDate} doctorName={selectedDoctor?.name || ""} observations={observations} page={page} zoom={135} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
