"use client";

import { brazilDate } from "@/lib/brazil-datetime";

import {
  Baby,
  Beaker,
  Calculator,
  ChevronRight,
  Download,
  FlaskConical,
  Info,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TestTube2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { StyledSelect } from "@/components/ui/StyledSelect";

type SpecialtyMode = "obstetricia" | "ginecologia" | "pediatria";

type PregnancyPlan = {
  title: string;
  week: number;
  description: string;
};

const SIMULATION_KEY = "hpsr-clinical-assistant-specialty-simulation";
const inputClass = "h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine";
const cardClass = "rounded-[18px] border border-hpsr-border bg-white";

const specialtyLabels: Record<SpecialtyMode, string> = {
  obstetricia: "Obstetrícia",
  ginecologia: "Ginecologia",
  pediatria: "Pediatria",
};

const shortPregnancyPlan: PregnancyPlan[] = [
  { title: "Início do pré-natal", week: 12, description: "Confirmação da gestação, avaliação inicial, exames básicos e planejamento do acompanhamento." },
  { title: "Desenvolvimento fetal", week: 20, description: "Avaliação do crescimento fetal, ultrassonografia morfológica e revisão dos exames iniciais." },
  { title: "Acompanhamento materno-fetal", week: 32, description: "Rastreamento metabólico, avaliação do líquido amniótico e acompanhamento do bem-estar fetal." },
  { title: "Preparação para o parto", week: 38, description: "Definição da via de parto, orientações sobre sinais de alerta e preparo para internação." },
  { title: "Parto", week: 40, description: "Avaliação final, admissão e condução obstétrica conforme indicação clínica." },
];

const longPregnancyPlan: PregnancyPlan[] = [
  { title: "Avaliação inicial", week: 12, description: "Confirmação da gestação, cálculo da data estimada e exames iniciais." },
  { title: "Crescimento fetal inicial", week: 16, description: "Revisão dos exames e avaliação inicial do crescimento fetal." },
  { title: "Avaliação anatômica", week: 20, description: "Ultrassonografia morfológica, avaliação uterina e ausculta fetal." },
  { title: "Rastreamento metabólico", week: 24, description: "Avaliação materna, glicemia, urina e acompanhamento do desenvolvimento fetal." },
  { title: "Crescimento e movimentação", week: 28, description: "Revisão de resultados, movimentação fetal e necessidade de suplementação." },
  { title: "Bem-estar fetal", week: 32, description: "Avaliação do líquido amniótico, crescimento e ultrassonografia obstétrica." },
  { title: "Planejamento do parto", week: 36, description: "Planejamento da via de parto e orientação sobre sinais de alerta." },
  { title: "Preparo para internação", week: 38, description: "Revisão dos exames finais, cardiotocografia e organização da internação." },
  { title: "Avaliação final", week: 40, description: "Liberação hospitalar e condução do parto conforme avaliação obstétrica." },
];

const ivfPlan = [
  { week: 1, title: "Avaliação inicial e início hormonal", description: "Avaliação clínica, ultrassonografia transvaginal basal, exames hormonais e sorológicos e definição do protocolo individual.", medication: "FSH e gonadotrofina conforme protocolo definido pelo ginecologista." },
  { week: 2, title: "Monitoramento e bloqueio ovulatório", description: "Contagem e crescimento folicular por ultrassonografia, exames hormonais e ajuste do estímulo.", medication: "Manutenção do estímulo e bloqueio ovulatório conforme resposta ovariana." },
  { week: 3, title: "Gatilho e punção folicular", description: "Definição do momento do gatilho, punção folicular, coleta dos óvulos e fertilização em laboratório.", medication: "Gatilho de maturação conforme prescrição e horário definido." },
  { week: 4, title: "Preparo uterino e transferência embrionária", description: "Avaliação endometrial, transferência embrionária guiada e orientações pós-procedimento.", medication: "Suporte endometrial conforme protocolo individual." },
  { week: 5, title: "BETA-hCG e confirmação", description: "Exame de sangue para avaliação do resultado e definição da continuidade do acompanhamento.", medication: "Sem medicação automática; manter apenas o que estiver prescrito." },
];

function addDays(dateValue: string, days: number) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return brazilDate(date);
}

function formatDate(dateValue: string) {
  if (!dateValue) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(`${dateValue}T12:00:00`));
}

function resolveSpecialty(profile: { specialty?: string; specialties?: string[] }): SpecialtyMode | null {
  const combined = [profile.specialty, ...(profile.specialties || [])].join(" ").toLocaleLowerCase("pt-BR");
  if (combined.includes("obstetra") || combined.includes("obstetrícia")) return "obstetricia";
  if (combined.includes("ginecologista") || combined.includes("ginecologia")) return "ginecologia";
  if (combined.includes("pediatra") || combined.includes("pediatria")) return "pediatria";
  return null;
}


function isDeveloperProfile(profile: { role?: string; systemRole?: string; accessLevel?: string }) {
  const combined = [profile.role, profile.systemRole, profile.accessLevel].join(" ").toLocaleLowerCase("pt-BR");
  return combined.includes("desenvolvedor") || combined.includes("dev") || combined.includes("total");
}

function sanitizeFilename(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}

type PlanningImageStage = { label: string; date?: string; title: string; description: string; note?: string };

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
    image.src = src;
  });
}

function triggerCanvasDownload(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 1);
  link.click();
}

function drawCenteredText(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number) {
  context.textAlign = "center";
  context.fillText(text, x + width / 2, y);
  context.textAlign = "left";
}

function drawMultilineCenteredText(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number) {
  const lines = wrapCanvasText(context, text, width);
  lines.forEach((line, index) => drawCenteredText(context, line, x, y + index * lineHeight, width));
  return lines.length;
}

function fitCanvasFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseSize: number,
  minSize = 13,
  fontFamily = "Georgia",
  fontWeight = "700",
) {
  let size = baseSize;
  while (size > minSize) {
    context.font = `${fontWeight} ${size}px ${fontFamily}`;
    if (context.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return minSize;
}

function drawSingleLineField(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  options?: { fontFamily?: string; fontWeight?: string; baseSize?: number; minSize?: number; color?: string; align?: CanvasTextAlign; baseline?: CanvasTextBaseline },
) {
  const value = (text || "").trim() || "—";
  const {
    fontFamily = '"Times New Roman", Georgia, serif',
    fontWeight = "700",
    baseSize = 42,
    minSize = 15,
    color = "#5f250f",
    align = "left",
    baseline = "top",
  } = options || {};
  const size = fitCanvasFontSize(context, value, width, baseSize, minSize, fontFamily, fontWeight);
  context.font = `${fontWeight} ${size}px ${fontFamily}`;
  context.fillStyle = color;
  context.textAlign = align;
  const previousBaseline = context.textBaseline;
  context.textBaseline = baseline;
  if (align === "center") context.fillText(value, x + width / 2, y);
  else if (align === "right") context.fillText(value, x + width, y);
  else context.fillText(value, x, y);
  context.textAlign = "left";
  context.textBaseline = previousBaseline;
}

function drawTemplatePatientIdentity(
  context: CanvasRenderingContext2D,
  patientName: string,
  passport: string,
) {
  // Limpa somente a área de identificação do paciente para não depender
  // do posicionamento dos rótulos incorporados ao arquivo de fundo.
  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(36, 188, 940, 152);

  drawSingleLineField(context, `NOME: ${(patientName || "Paciente não informado").trim()}`, 55, 216, 850, {
    fontFamily: '"Times New Roman", Georgia, serif',
    fontWeight: "700",
    baseSize: 30,
    minSize: 16,
    color: "#5f250f",
    baseline: "top",
  });

  drawSingleLineField(context, `PASSAPORTE: ${(passport || "—").trim()}`, 55, 267, 500, {
    fontFamily: '"Times New Roman", Georgia, serif',
    fontWeight: "700",
    baseSize: 20,
    minSize: 13,
    color: "#6a341f",
    baseline: "top",
  });
  context.restore();
}

function drawDateChips(context: CanvasRenderingContext2D, dates: string[], rects: Array<{ x: number; y: number; width: number; height: number }>) {
  dates.forEach((date, index) => {
    const rect = rects[index];
    if (!rect || !date || date === "—") return;
    const fontSize = fitCanvasFontSize(context, date, rect.width - 24, 20, 13, 'Arial', '800');
    context.fillStyle = '#ffffff';
    context.font = `800 ${fontSize}px Arial`;
    context.textAlign = 'center';
    const previousBaseline = context.textBaseline;
    context.textBaseline = 'top';
    const textY = rect.y + Math.round((rect.height - fontSize) / 2) - 3;
    context.fillText(date, rect.x + rect.width / 2, textY);
    context.textAlign = 'left';
    context.textBaseline = previousBaseline;
  });
}

function buildPregnancyPlanDates({
  currentWeek,
  durationDays,
  startDate,
  planType,
}: {
  currentWeek: number;
  durationDays: number;
  startDate: string;
  planType: "short" | "long";
}) {
  const safeWeek = Math.max(1, Math.min(40, currentWeek || 1));
  const remainingDays = Math.max(0, Math.ceil(durationDays * (1 - safeWeek / 40)));
  const base = planType === "short" ? shortPregnancyPlan : longPregnancyPlan;
  return base.map((item) => {
    const ratio = safeWeek >= 40 ? 0 : (item.week - safeWeek) / (40 - safeWeek);
    return {
      ...item,
      date: formatDate(addDays(startDate, Math.round(ratio * remainingDays))),
    };
  });
}

async function downloadObstetricPlanningImage({
  patientName,
  passport,
  planType,
  currentWeek,
  durationDays,
  startDate,
}: {
  patientName: string;
  passport: string;
  planType: "short" | "long";
  currentWeek: number;
  durationDays: number;
  startDate: string;
}) {
  if (typeof document === "undefined") return;
  const templateSrc = planType === "short" ? "/clinical-assistant/obstetric-short.webp" : "/clinical-assistant/obstetric-long.webp";
  const background = await loadCanvasImage(templateSrc);
  const canvas = document.createElement("canvas");
  canvas.width = background.width;
  canvas.height = background.height;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.drawImage(background, 0, 0);
  drawTemplatePatientIdentity(context, patientName, passport);

  const generatedDates = buildPregnancyPlanDates({ currentWeek, durationDays, startDate, planType }).map((item) => item.date);
  const dates = planType === "long"
    ? [...generatedDates.slice(0, 8), "Aguarde"]
    : [...generatedDates.slice(0, 4), "Aguarde"];
  const rects = planType === "short"
    ? [
        { x: 260, y: 367, width: 190, height: 54 },
        { x: 260, y: 503, width: 190, height: 54 },
        { x: 260, y: 640, width: 190, height: 54 },
        { x: 260, y: 778, width: 190, height: 54 },
        { x: 260, y: 915, width: 190, height: 54 },
      ]
    : [
        { x: 252, y: 340, width: 190, height: 48 },
        { x: 252, y: 415, width: 190, height: 48 },
        { x: 252, y: 490, width: 190, height: 48 },
        { x: 252, y: 565, width: 190, height: 48 },
        { x: 252, y: 641, width: 190, height: 48 },
        { x: 252, y: 716, width: 190, height: 48 },
        { x: 252, y: 792, width: 190, height: 48 },
        { x: 252, y: 867, width: 190, height: 48 },
        { x: 252, y: 943, width: 190, height: 48 },
      ];
  drawDateChips(context, dates, rects);

  triggerCanvasDownload(canvas, `${sanitizeFilename(patientName || passport || "paciente")}-planejamento-pre-natal.png`);
}

async function downloadIvfPlanningImage({
  patientName,
  passport,
  startDate,
  responsible,
}: {
  patientName: string;
  passport: string;
  startDate: string;
  responsible: string;
}) {
  if (typeof document === "undefined") return;
  const background = await loadCanvasImage("/clinical-assistant/ivf.webp");
  const canvas = document.createElement("canvas");
  canvas.width = background.width;
  canvas.height = background.height;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.drawImage(background, 0, 0);
  drawTemplatePatientIdentity(context, patientName, passport);

  const dates = ivfPlan.map((item) => formatDate(addDays(startDate, (item.week - 1) * 7)));
  const rects = [
    { x: 291, y: 372, width: 190, height: 54 },
    { x: 291, y: 509, width: 190, height: 54 },
    { x: 291, y: 646, width: 190, height: 54 },
    { x: 291, y: 783, width: 190, height: 54 },
    { x: 291, y: 920, width: 190, height: 54 },
  ];
  drawDateChips(context, dates, rects);

  triggerCanvasDownload(canvas, `${sanitizeFilename(patientName || passport || "paciente")}-planejamento-FIV.png`);
}

function downloadPlanningImage({
  title,
  subtitle,
  patientName,
  passport,
  summary,
  stages,
}: {
  title: string;
  subtitle: string;
  patientName: string;
  passport: string;
  summary: Array<[string, string]>;
  stages: PlanningImageStage[];
}) {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  const width = 1600;
  const margin = 84;
  const stageWidth = width - margin * 2;
  const stagePadding = 28;
  const lineHeight = 27;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.font = "500 22px Arial";
  const measured = stages.map((stage) => {
    const descriptionLines = wrapCanvasText(context, stage.description, stageWidth - stagePadding * 2 - 230);
    const noteLines = stage.note ? wrapCanvasText(context, stage.note, stageWidth - stagePadding * 2 - 230) : [];
    return { ...stage, descriptionLines, noteLines, height: Math.max(142, 92 + descriptionLines.length * lineHeight + noteLines.length * 24) };
  });
  const summaryRows = Math.ceil(summary.length / 4);
  const headerHeight = 330 + summaryRows * 110;
  const stagesHeight = measured.reduce((total, stage) => total + stage.height + 18, 0);
  canvas.width = width;
  canvas.height = Math.max(1100, headerHeight + stagesHeight + 150);

  context.fillStyle = "#fffaf4";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#6f2817";
  context.fillRect(0, 0, canvas.width, 190);
  context.fillStyle = "#ffffff";
  context.font = "700 26px Arial";
  context.fillText("HOSPITAL SÃO RAFAEL", margin, 65);
  context.font = "800 54px Arial";
  context.fillText(title, margin, 128);
  context.font = "500 23px Arial";
  context.fillText(subtitle, margin, 166);

  context.fillStyle = "#35120c";
  context.font = "800 30px Arial";
  context.fillText(patientName || "Paciente não informado", margin, 245);
  context.fillStyle = "#765d54";
  context.font = "600 22px Arial";
  context.fillText(`Passaporte: ${passport || "—"}`, margin, 282);

  const cardGap = 16;
  const columns = Math.min(4, Math.max(1, summary.length));
  const cardWidth = (stageWidth - cardGap * (columns - 1)) / columns;
  summary.forEach(([label, value], index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = margin + col * (cardWidth + cardGap);
    const y = 320 + row * 110;
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#e3c6b2";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(x, y, cardWidth, 88, 18);
    context.fill();
    context.stroke();
    context.fillStyle = "#8a4a34";
    context.font = "700 16px Arial";
    context.fillText(label.toUpperCase(), x + 20, y + 29);
    context.fillStyle = "#35120c";
    context.font = "800 23px Arial";
    context.fillText(value, x + 20, y + 62);
  });

  let y = headerHeight;
  measured.forEach((stage, index) => {
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#e3c6b2";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(margin, y, stageWidth, stage.height, 22);
    context.fill();
    context.stroke();

    context.fillStyle = "#6f2817";
    context.beginPath();
    context.arc(margin + 54, y + 54, 30, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ffffff";
    context.font = "800 20px Arial";
    context.textAlign = "center";
    context.fillText(String(index + 1), margin + 54, y + 61);
    context.textAlign = "left";

    context.fillStyle = "#8a4a34";
    context.font = "800 17px Arial";
    context.fillText(stage.label.toUpperCase(), margin + 105, y + 34);
    context.fillStyle = "#35120c";
    context.font = "800 27px Arial";
    context.fillText(stage.title, margin + 105, y + 68);
    context.fillStyle = "#765d54";
    context.font = "500 20px Arial";
    stage.descriptionLines.forEach((line, lineIndex) => context.fillText(line, margin + 105, y + 102 + lineIndex * lineHeight));
    if (stage.noteLines.length) {
      context.fillStyle = "#8a4a34";
      context.font = "700 18px Arial";
      const noteY = y + 110 + stage.descriptionLines.length * lineHeight;
      stage.noteLines.forEach((line, lineIndex) => context.fillText(line, margin + 105, noteY + lineIndex * 24));
    }
    if (stage.date) {
      context.fillStyle = "#fff1e4";
      context.beginPath();
      context.roundRect(width - margin - 190, y + 27, 160, 48, 14);
      context.fill();
      context.fillStyle = "#6f2817";
      context.font = "800 18px Arial";
      context.textAlign = "center";
      context.fillText(stage.date, width - margin - 110, y + 58);
      context.textAlign = "left";
    }
    y += stage.height + 18;
  });

  context.fillStyle = "#765d54";
  context.font = "500 18px Arial";
  context.fillText("Planejamento gerado pelo Assistente Clínico e sujeito à revisão do profissional responsável.", margin, canvas.height - 65);

  triggerCanvasDownload(canvas, `${sanitizeFilename(patientName || passport || "paciente")}-${sanitizeFilename(title)}.png`);
}

function SectionTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#f7e9dc] text-hpsr-wine">{icon}</div>
      <div>
        <h2 className="font-black text-hpsr-text">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-hpsr-muted">{hint}</span>}
    </label>
  );
}

function PatientField() {
  const { patients, selectedPassport, selectPatient, loading } = usePatientSelection();
  return (
    <Field label="Paciente">
      <StyledSelect value={selectedPassport} onChange={(event) => selectPatient(event.target.value)} searchable disabled={loading}>
        <option value="">{loading ? "Carregando pacientes..." : "Selecionar paciente"}</option>
        {patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}
      </StyledSelect>
    </Field>
  );
}

function ObstetricsTool() {
  const { selectedPatient } = usePatientSelection();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [durationDays, setDurationDays] = useState(60);
  const [startDate, setStartDate] = useState(() => brazilDate());
  const [planType, setPlanType] = useState<"short" | "long">("short");

  const result = useMemo(() => {
    const safeWeek = Math.max(1, Math.min(40, currentWeek || 1));
    const elapsedRatio = safeWeek / 40;
    const remainingDays = Math.max(0, Math.ceil(durationDays * (1 - elapsedRatio)));
    const estimatedEnd = addDays(startDate, remainingDays);
    const base = planType === "short" ? shortPregnancyPlan : longPregnancyPlan;
    const remainingPlan = base.filter((item) => item.week >= safeWeek).map((item) => {
      const relativeRatio = safeWeek >= 40 ? 0 : (item.week - safeWeek) / (40 - safeWeek);
      return { ...item, date: addDays(startDate, Math.round(relativeRatio * remainingDays)) };
    });
    return { safeWeek, remainingDays, estimatedEnd, remainingPlan, progress: Math.round(elapsedRatio * 100) };
  }, [currentWeek, durationDays, startDate, planType]);

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className={`${cardClass} p-4`}>
        <SectionTitle icon={<Baby size={19} />} title="Calculadora gestacional" description="Converte a idade gestacional para a escala de acompanhamento e gera apenas as etapas restantes." />
        <div className="mt-5 grid gap-3">
          <PatientField />
          <Field label="Semana gestacional atual" hint="Exibida somente em semanas.">
            <input className={inputClass} type="number" min={1} max={40} value={currentWeek} onChange={(e) => setCurrentWeek(Number(e.target.value))} />
          </Field>
          <Field label="Data de referência">
            <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Duração total do acompanhamento">
            <div className="relative"><input className={`${inputClass} pr-14`} type="number" min={1} max={180} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-muted">dias</span></div>
          </Field>
          <Field label="Modelo do planejamento">
            <StyledSelect value={planType} onChange={(e) => setPlanType(e.target.value as "short" | "long")}>
              <option value="short">Curto · 5 etapas</option>
              <option value="long">Longo · 9 etapas</option>
            </StyledSelect>
          </Field>
        </div>
      </section>

      <section className={`${cardClass} min-w-0 overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-hpsr-border bg-[#fffaf4] p-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Planejamento gerado</p><p className="mt-1 font-black text-hpsr-text">Pré-natal · modelo {planType === "short" ? "curto" : "longo"}</p></div>
          <button
            type="button"
            disabled={!selectedPatient}
            onClick={() => selectedPatient && downloadObstetricPlanningImage({
              patientName: selectedPatient.name,
              passport: selectedPatient.passport,
              planType,
              currentWeek,
              durationDays,
              startDate,
            })}
            className="inline-flex h-10 items-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Download size={15} /> Baixar imagem
          </button>
        </div>
        <div className="grid grid-cols-2 gap-px bg-hpsr-border md:grid-cols-4">
          {[
            ["Idade gestacional", `${result.safeWeek} semanas`],
            ["Progresso", `${result.progress}%`],
            ["Período restante", `${result.remainingDays} dias`],
            ["Conclusão estimada", formatDate(result.estimatedEnd)],
          ].map(([label, value]) => <div key={label} className="bg-[#fffaf4] p-3.5"><p className="text-[9px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{label}</p><p className="mt-1 text-sm font-black text-hpsr-text">{value}</p></div>)}
        </div>
        <div className="max-h-[530px] overflow-y-auto p-4">
          <div className="grid gap-3">
            {result.remainingPlan.map((item, index) => (
              <div key={`${item.week}-${item.title}`} className="grid gap-3 rounded-[16px] border border-hpsr-border bg-white p-3.5 md:grid-cols-[90px_minmax(0,1fr)_130px] md:items-center">
                <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Consulta {index + 1}</p><p className="mt-1 font-black text-hpsr-text">{item.week} semanas</p></div>
                <div><p className="font-black text-hpsr-text">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{item.description}</p></div>
                <div className="rounded-[12px] bg-[#fff5ea] px-3 py-2 text-center text-xs font-black text-hpsr-wine">{formatDate(item.date)}</div>
              </div>
            ))}
            {result.remainingPlan.length === 0 && <p className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-5 text-center text-sm font-semibold text-hpsr-muted">Período gestacional concluído.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function GynecologyTool() {
  const { selectedPatient } = usePatientSelection();
  const [startDate, setStartDate] = useState(() => brazilDate());
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className={`${cardClass} p-4`}>
        <SectionTitle icon={<FlaskConical size={19} />} title="Planejamento de fertilização" description="Gera o acompanhamento completo em cinco semanas, com datas editáveis e revisão profissional." />
        <div className="mt-5 grid gap-3">
          <PatientField />
          <Field label="Data de início do processo"><input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="Profissional responsável"><input className={inputClass} value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Nome do ginecologista" /></Field>
          <Field label="Observações iniciais"><textarea className="min-h-24 w-full resize-none rounded-[14px] border border-hpsr-border bg-white px-3.5 py-3 text-sm font-semibold text-hpsr-text outline-none focus:border-hpsr-wine" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condições clínicas, protocolo ou orientações iniciais" /></Field>
        </div>
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border bg-[#fffaf4] p-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Cronograma gerado</p><p className="mt-1 font-black text-hpsr-text">Cinco etapas consecutivas</p></div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-hpsr-border bg-white px-3 py-1.5 text-xs font-black text-hpsr-wine">Início: {formatDate(startDate)}</span>
            <button
              type="button"
              disabled={!selectedPatient}
              onClick={() => selectedPatient && downloadIvfPlanningImage({
                patientName: selectedPatient.name,
                passport: selectedPatient.passport,
                startDate,
                responsible,
              })}
              className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-hpsr-wine px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Download size={14} /> Baixar imagem
            </button>
          </div>
        </div>
        <div className="max-h-[560px] overflow-y-auto p-4">
          <div className="grid gap-3">
            {ivfPlan.map((item) => (
              <article key={item.week} className="grid gap-3 rounded-[16px] border border-hpsr-border p-3.5 md:grid-cols-[90px_minmax(0,1fr)_135px] md:items-start">
                <div><span className="grid h-9 w-9 place-items-center rounded-full bg-hpsr-wine text-sm font-black text-white">{item.week}</span><p className="mt-2 text-xs font-black text-hpsr-wine">{item.week}ª semana</p></div>
                <div><h3 className="font-black text-hpsr-text">{item.title}</h3><p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{item.description}</p><p className="mt-2 rounded-[10px] bg-[#fff5ea] px-3 py-2 text-xs font-semibold text-hpsr-wine"><strong>Conduta medicamentosa:</strong> {item.medication}</p></div>
                <div className="grid gap-2"><div className="rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-center text-xs font-black text-hpsr-text">{formatDate(addDays(startDate, (item.week - 1) * 7))}</div><button type="button" className="h-9 rounded-[12px] bg-hpsr-wine px-3 text-xs font-black text-white">Agendar</button></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PediatricsTool() {
  const { selectedPatient } = usePatientSelection();
  const [weight, setWeight] = useState("");
  const [doseMgKg, setDoseMgKg] = useState("");
  const [concentrationMg, setConcentrationMg] = useState("");
  const [concentrationMl, setConcentrationMl] = useState("5");
  const [frequency, setFrequency] = useState("3");
  const [maxDose, setMaxDose] = useState("");

  const calculation = useMemo(() => {
    const w = Number(weight);
    const dose = Number(doseMgKg);
    const mg = Number(concentrationMg);
    const ml = Number(concentrationMl);
    const times = Number(frequency);
    if (![w, dose, mg, ml, times].every((value) => Number.isFinite(value) && value > 0)) return null;
    const dosePerAdministration = w * dose;
    const volume = (dosePerAdministration * ml) / mg;
    const dailyDose = dosePerAdministration * times;
    const max = Number(maxDose);
    return { dosePerAdministration, volume, dailyDose, exceeds: Number.isFinite(max) && max > 0 && dosePerAdministration > max };
  }, [weight, doseMgKg, concentrationMg, concentrationMl, frequency, maxDose]);

  return (
    <div className="grid gap-4 xl:grid-cols-[410px_minmax(0,1fr)]">
      <section className={`${cardClass} p-4`}>
        <SectionTitle icon={<Calculator size={19} />} title="Calculadora de dose pediátrica" description="Calcula a conversão informada pelo pediatra. A ferramenta não escolhe medicamento, indicação ou dose de referência." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><PatientField /></div>
          <Field label="Peso atual" hint="Somente em quilogramas."><div className="relative"><input className={`${inputClass} pr-12`} type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-muted">kg</span></div></Field>
          <Field label="Dose de referência"><div className="relative"><input className={`${inputClass} pr-16`} type="number" min="0" step="0.01" value={doseMgKg} onChange={(e) => setDoseMgKg(e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-hpsr-muted">mg/kg</span></div></Field>
          <Field label="Concentração disponível"><div className="relative"><input className={`${inputClass} pr-12`} type="number" min="0" step="0.01" value={concentrationMg} onChange={(e) => setConcentrationMg(e.target.value)} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-muted">mg</span></div></Field>
          <Field label="Volume da apresentação"><div className="relative"><input className={`${inputClass} pr-12`} type="number" min="0" step="0.1" value={concentrationMl} onChange={(e) => setConcentrationMl(e.target.value)} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-muted">mL</span></div></Field>
          <Field label="Administrações por dia"><input className={inputClass} type="number" min="1" max="24" value={frequency} onChange={(e) => setFrequency(e.target.value)} /></Field>
          <Field label="Dose máxima por administração" hint="Opcional."><div className="relative"><input className={`${inputClass} pr-12`} type="number" min="0" step="0.01" value={maxDose} onChange={(e) => setMaxDose(e.target.value)} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-muted">mg</span></div></Field>
        </div>
      </section>

      <section className={`${cardClass} p-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle icon={<TestTube2 size={19} />} title="Resultado para conferência" description="A memória do cálculo permanece visível para revisão antes de qualquer registro ou prescrição." />
          <button
            type="button"
            disabled={!calculation || !selectedPatient}
            onClick={() => calculation && selectedPatient && downloadPlanningImage({
              title: "Cálculo de Dose Pediátrica",
              subtitle: "Memória de cálculo para revisão profissional · Hospital São Rafael",
              patientName: selectedPatient.name,
              passport: selectedPatient.passport,
              summary: [["Peso", `${weight} kg`], ["Dose de referência", `${doseMgKg} mg/kg`], ["Dose calculada", `${calculation.dosePerAdministration.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mg`], ["Volume", `${calculation.volume.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mL`]],
              stages: [{ label: "Resultado", title: "Dose por administração", description: `${calculation.dosePerAdministration.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mg, correspondentes a ${calculation.volume.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mL por administração. Total diário estimado: ${calculation.dailyDose.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mg.`, note: calculation.exceeds ? "Alerta: o resultado ultrapassa o limite máximo informado." : "Resultado dentro do limite máximo informado, quando aplicável." }],
            })}
            className="inline-flex h-10 items-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Download size={15} /> Baixar imagem
          </button>
        </div>
        {calculation ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["Dose por administração", `${calculation.dosePerAdministration.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mg`],
              ["Volume por administração", `${calculation.volume.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mL`],
              ["Total diário", `${calculation.dailyDose.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mg`],
            ].map(([label, value]) => <div key={label} className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{label}</p><p className="mt-2 text-xl font-black text-hpsr-text">{value}</p></div>)}
            <div className="md:col-span-3 rounded-[16px] border border-hpsr-border bg-white p-4 text-sm leading-relaxed text-hpsr-muted">
              <strong className="text-hpsr-text">Memória:</strong> {weight} kg × {doseMgKg} mg/kg = {calculation.dosePerAdministration.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mg; apresentação de {concentrationMg} mg em {concentrationMl} mL = {calculation.volume.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mL por administração.
            </div>
            {calculation.exceeds && <div className="md:col-span-3 rounded-[16px] border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">A dose calculada ultrapassa o limite máximo informado. Revise os dados antes de continuar.</div>}
          </div>
        ) : <div className="mt-5 grid min-h-[220px] place-items-center rounded-[18px] border border-dashed border-hpsr-border bg-[#fffaf4]"><div className="text-center"><Beaker className="mx-auto text-hpsr-wineLight" /><p className="mt-3 text-sm font-black text-hpsr-text">Preencha peso, dose e concentração</p><p className="mt-1 text-xs text-hpsr-muted">O cálculo será exibido automaticamente.</p></div></div>}
        <div className="mt-4 flex items-start gap-3 rounded-[15px] bg-[#f7e9dc] p-3.5 text-xs leading-relaxed text-hpsr-wine"><ShieldCheck size={17} className="shrink-0" /><p>O resultado é apoio matemático supervisionado. O pediatra continua responsável por indicação, referência, contraindicações, arredondamento e prescrição.</p></div>
      </section>
    </div>
  );
}

function RestrictedAssistantView({ role, specialty }: { role: string; specialty: string }) {
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Ferramenta clínica" title="Assistente Clínico" description="Recursos especializados de apoio supervisionado, liberados conforme a especialidade profissional." />
      <section className="overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-sm">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#fffaf4_0%,#f3e2d3_100%)] p-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-hpsr-wine text-white"><LockKeyhole size={24} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Acesso por especialidade</p>
              <h2 className="mt-2 text-2xl font-black text-hpsr-text">Nenhuma ferramenta compatível disponível</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-hpsr-muted">O Assistente Clínico reconheceu seu perfil, mas esta versão ainda não possui uma ferramenta liberada para a sua especialidade. A área continuará recebendo novos módulos clínicos nas próximas etapas do sistema.</p>
            </div>
          </div>
          <div className="rounded-[18px] border border-hpsr-border bg-white/85 p-4">
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Perfil identificado</p>
            <p className="mt-2 font-black text-hpsr-text">{role || "Cargo não informado"}</p>
            <p className="mt-1 text-sm text-hpsr-muted">{specialty || "Especialidade não informada"}</p>
          </div>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {[
            ["Obstetrícia", "Calculadora gestacional e planejamento pré-natal."],
            ["Ginecologia", "Planejamento de fertilização in vitro."],
            ["Pediatria", "Cálculo supervisionado de dose pediátrica."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-[17px] border border-hpsr-border bg-[#fffaf4] p-4 opacity-75">
              <div className="flex items-center gap-2"><LockKeyhole size={15} className="text-hpsr-wine" /><h3 className="font-black text-hpsr-text">{title}</h3></div>
              <p className="mt-2 text-xs leading-relaxed text-hpsr-muted">{description}</p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Acesso restrito</p>
            </div>
          ))}
        </div>
        <div className="mx-5 mb-5 flex items-start gap-3 rounded-[16px] border border-hpsr-border bg-white p-4 text-xs leading-relaxed text-hpsr-muted">
          <Sparkles size={17} className="shrink-0 text-hpsr-wine" />
          <p>Quando uma ferramenta compatível com sua especialidade for adicionada, ela aparecerá automaticamente nesta página. Seu cargo e suas permissões institucionais não são alterados por esta tela.</p>
        </div>
      </section>
    </div>
  );
}

export default function ClinicalAssistantPage() {
  const { profile } = useCurrentUserProfile();
  const actualSpecialty = useMemo(() => resolveSpecialty(profile), [profile]);
  const isDeveloper = useMemo(() => isDeveloperProfile(profile), [profile]);
  const [simulation, setSimulation] = useState<SpecialtyMode | "">("");

  useEffect(() => {
    if (!isDeveloper) {
      setSimulation("");
      return;
    }
    const stored = localStorage.getItem(SIMULATION_KEY) as SpecialtyMode | null;
    if (stored && stored in specialtyLabels) setSimulation(stored);
  }, [isDeveloper]);

  const activeSpecialty: SpecialtyMode | null = simulation || actualSpecialty || (isDeveloper ? "obstetricia" : null);

  function changeSimulation(value: string) {
    if (!isDeveloper) return;
    const next = value as SpecialtyMode | "";
    setSimulation(next);
    if (next) localStorage.setItem(SIMULATION_KEY, next);
    else localStorage.removeItem(SIMULATION_KEY);
  }


  if (!activeSpecialty) {
    return <RestrictedAssistantView role={profile.role} specialty={profile.specialty} />;
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Ferramenta clínica" title="Assistente Clínico" description="Ferramentas especializadas de apoio supervisionado, adaptadas à especialidade do profissional." />

      <section className="rounded-[20px] border border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-4 shadow-sm">
        <div className={`grid gap-3 ${isDeveloper ? "lg:grid-cols-[minmax(0,1fr)_390px]" : ""} lg:items-center`}>
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-hpsr-wine text-white"><Stethoscope size={20} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Especialidade ativa</p><h2 className="mt-1 text-lg font-black text-hpsr-text">{specialtyLabels[activeSpecialty]}</h2><p className="mt-1 text-xs text-hpsr-muted">Cargo real identificado: {profile.specialty || profile.role}. {simulation ? "Visualização em modo de teste." : "Ferramenta selecionada automaticamente."}</p></div>
          </div>

          {isDeveloper && (
            <div className="rounded-[16px] border border-hpsr-border bg-white p-3">
              <div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Simular especialização</p><p className="mt-0.5 text-[11px] text-hpsr-muted">A simulação permanece neste dispositivo durante os testes.</p></div>{simulation && <button type="button" onClick={() => changeSimulation("")} className="grid h-8 w-8 place-items-center rounded-[10px] border border-hpsr-border text-hpsr-wine" title="Voltar à especialidade real"><RotateCcw size={15} /></button>}</div>
              <div className="mt-2"><StyledSelect value={simulation} onChange={(e) => changeSimulation(e.target.value)}><option value="">Usar especialidade real</option><option value="obstetricia">Visualizar como Obstetra</option><option value="ginecologia">Visualizar como Ginecologista</option><option value="pediatria">Visualizar como Pediatra</option></StyledSelect></div>
            </div>
          )}
        </div>
      </section>

      {isDeveloper && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(specialtyLabels) as SpecialtyMode[]).map((specialty) => (
            <button key={specialty} type="button" onClick={() => changeSimulation(specialty)} className={`inline-flex shrink-0 items-center gap-2 rounded-[14px] border px-4 py-2.5 text-xs font-black transition ${activeSpecialty === specialty ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>
              {specialty === "obstetricia" ? <Baby size={15} /> : specialty === "ginecologia" ? <FlaskConical size={15} /> : <Calculator size={15} />}
              {specialtyLabels[specialty]}
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      )}

      {activeSpecialty === "obstetricia" && <ObstetricsTool />}
      {activeSpecialty === "ginecologia" && <GynecologyTool />}
      {activeSpecialty === "pediatria" && <PediatricsTool />}

      <div className="flex items-start gap-3 rounded-[16px] border border-hpsr-border bg-white p-3.5 text-xs leading-relaxed text-hpsr-muted">
        <Info size={17} className="shrink-0 text-hpsr-wine" />
        <p><strong className="text-hpsr-text">Revisão obrigatória:</strong> os planejamentos e cálculos devem ser conferidos pelo profissional responsável. A imagem gerada é um documento de orientação e não substitui o registro clínico institucional.</p>
      </div>
    </div>
  );
}
