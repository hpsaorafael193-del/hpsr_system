import type { PlanningKind, PlanningStep } from "@/lib/obstetric-planning";

const COLORS = {
  brown: "#7d3b21",
  brownDark: "#6c301c",
  brownSoft: "#a96745",
  lightText: "#fff5ef",
};

const INTEGRAL_LAYOUTS = {
  gestacional: {
    src: "/clinical-assistant/official-gestational-integral-v3.png",
    width: 1920,
    height: 1280,
    doctor: { x: 203, y: 220, width: 705 },
    patient: { x: 213, y: 257, width: 698 },
    passport: { x: 295, y: 299, width: 616 },
    identityStyle: {
      doctor: { fontSize: 25, minSize: 15, weight: 500, color: "#7d3b21", family: "Arial, sans-serif", tracking: 0 },
      patient: { fontSize: 31, minSize: 18, weight: 700, color: "#7d3b21", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
      passport: { fontSize: 25, minSize: 15, weight: 700, color: "#7d3b21", family: "Arial, sans-serif", tracking: 1.4 },
    },
    dateCenterX: 477,
    dateWidth: 214,
    dateFontSize: 27,
    dateRows: [400, 503, 610, 712, 814, 919, 1023, 1121],
    textBoxes: [
      { x: 989, y: 352, width: 875, height: 80 },
      { x: 989, y: 458, width: 875, height: 87 },
      { x: 989, y: 572, width: 875, height: 80 },
      { x: 989, y: 678, width: 875, height: 76 },
      { x: 989, y: 780, width: 875, height: 78 },
      { x: 989, y: 884, width: 875, height: 78 },
      { x: 989, y: 988, width: 875, height: 74 },
      { x: 989, y: 1088, width: 875, height: 68 },
    ],
    referenceBox: { x: 989, y: 1190, width: 875, height: 54 },
  },
  in_vitro: {
    src: "/clinical-assistant/official-ivf-integral-v3.png",
    width: 1920,
    height: 1280,
    doctor: { x: 267, y: 236, width: 531 },
    patient: { x: 227, y: 281, width: 691 },
    passport: { x: 299, y: 329, width: 627 },
    identityStyle: {
      doctor: { fontSize: 25, minSize: 15, weight: 500, color: "#7d3b21", family: "Arial, sans-serif", tracking: 0 },
      patient: { fontSize: 31, minSize: 18, weight: 700, color: "#7d3b21", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
      passport: { fontSize: 25, minSize: 15, weight: 700, color: "#7d3b21", family: "Arial, sans-serif", tracking: 1.4 },
    },
    dateCenterX: 486,
    dateWidth: 220,
    dateFontSize: 28,
    dateRows: [463, 628, 792, 958, 1133],
    textBoxes: [
      { x: 997, y: 395, width: 860, height: 140 },
      { x: 997, y: 570, width: 860, height: 128 },
      { x: 997, y: 734, width: 860, height: 128 },
      { x: 997, y: 898, width: 860, height: 145 },
      { x: 997, y: 1078, width: 860, height: 136 },
    ],
    referenceBox: null,
  },
} as const;

const INDIVIDUAL_LAYOUTS = {
  gestacional: {
    src: "/clinical-assistant/official-gestational-individual-v3.png",
    width: 1448,
    height: 1086,
    doctor: { x: 159, y: 179, width: 495 },
    patient: { x: 132, y: 211, width: 522 },
    passport: { x: 202, y: 250, width: 477 },
    identityStyle: {
      doctor: { fontSize: 20, minSize: 12, weight: 500, color: "#9b6a55", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
      patient: { fontSize: 22, minSize: 13, weight: 600, color: "#8a4b35", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
      passport: { fontSize: 20, minSize: 12, weight: 600, color: "#9b6a55", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
    },
    circle: { x: 61, y: 311, radius: 31 },
    date: { x: 474, y: 311, width: 230 },
    marker: { x: 916, y: 311, width: 430 },
    planned: { x: 45, y: 431, width: 1357, height: 121 },
    evolution: { x: 45, y: 647, width: 1357, height: 119 },
    exams: { x: 45, y: 861, width: 1357, height: 137 },
  },
  in_vitro: {
    src: "/clinical-assistant/official-ivf-individual-v3.png",
    width: 1448,
    height: 1086,
    doctor: { x: 208, y: 180, width: 452 },
    patient: { x: 132, y: 211, width: 528 },
    passport: { x: 202, y: 250, width: 477 },
    identityStyle: {
      doctor: { fontSize: 20, minSize: 12, weight: 500, color: "#9b6a55", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
      patient: { fontSize: 22, minSize: 13, weight: 600, color: "#8a4b35", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
      passport: { fontSize: 20, minSize: 12, weight: 600, color: "#9b6a55", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
    },
    circle: { x: 61, y: 311, radius: 31 },
    date: { x: 474, y: 311, width: 230 },
    marker: { x: 916, y: 311, width: 430 },
    planned: { x: 45, y: 431, width: 1357, height: 121 },
    evolution: { x: 45, y: 647, width: 1357, height: 119 },
    exams: { x: 45, y: 861, width: 1357, height: 137 },
  },
} as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Modelo oficial não encontrado."));
    image.src = src;
  });
}

function formatDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-").reverse().join("/") : value;
}

/** Desenha o valor com a mesma família, cor e altura visual do rótulo impresso.
 * A redução de fonte só ocorre quando o conteúdo não cabe na região aprovada. */
type IdentitySlot = { x: number; y: number; width: number };
type IdentityTextStyle = { fontSize: number; minSize: number; weight: number; color: string; family: string; tracking: number };
function fitText(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number,
  fontSize: number, minSize = 13, weight = 700, color = COLORS.brownDark,
  family = "Arial, sans-serif", tracking = 0,
) {
  const safe = String(text || "").trim();
  if (!safe) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const measure = (value: string) => ctx.measureText(value).width + Math.max(0, value.length - 1) * tracking;
  let size = fontSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (measure(safe) <= maxWidth) break;
    size -= 0.5;
  }
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.beginPath();
  ctx.rect(x, y - fontSize * 0.76, maxWidth, fontSize * 1.52);
  ctx.clip();
  if (!tracking) ctx.fillText(safe, x, y);
  else {
    let cursor = x;
    for (const character of safe) {
      ctx.fillText(character, cursor, y);
      cursor += ctx.measureText(character).width + tracking;
    }
  }
  ctx.restore();
}

/** Os quatro modelos oficiais têm rótulos pintados na imagem. Apenas os
 * valores são inseridos aqui, alinhados com a linha-base de cada rótulo. */
function drawIdentity(ctx: CanvasRenderingContext2D, layout: {
  doctor: IdentitySlot; patient: IdentitySlot; passport: IdentitySlot;
  identityStyle?: { doctor: IdentityTextStyle; patient: IdentityTextStyle; passport: IdentityTextStyle };
}, doctor: string, patient: string, passport: string) {
  const defaults = {
    doctor: { fontSize: 28, minSize: 17, weight: 400, color: "#b98f7e", family: "Arial, sans-serif", tracking: 0 },
    patient: { fontSize: 44, minSize: 20, weight: 700, color: "#7d3b21", family: "Georgia, 'Times New Roman', serif", tracking: 0 },
    passport: { fontSize: 26, minSize: 16, weight: 700, color: "#b17b5b", family: "Arial, sans-serif", tracking: 2.1 },
  };
  const style = layout.identityStyle || defaults;
  fitText(ctx, doctor, layout.doctor.x, layout.doctor.y, layout.doctor.width,
    style.doctor.fontSize, style.doctor.minSize, style.doctor.weight, style.doctor.color, style.doctor.family, style.doctor.tracking);
  fitText(ctx, patient, layout.patient.x, layout.patient.y, layout.patient.width,
    style.patient.fontSize, style.patient.minSize, style.patient.weight, style.patient.color, style.patient.family, style.patient.tracking);
  fitText(ctx, passport, layout.passport.x, layout.passport.y, layout.passport.width,
    style.passport.fontSize, style.passport.minSize, style.passport.weight, style.passport.color, style.passport.family, style.passport.tracking);
}

function centeredText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, fontSize = 21, color = COLORS.lightText) {
  const safe = String(text || "").trim();
  if (!safe) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = fontSize;
  do {
    ctx.font = `800 ${size}px Arial, sans-serif`;
    if (ctx.measureText(safe).width <= maxWidth) break;
    size -= 0.5;
  } while (size > 12);
  ctx.fillText(safe, x, y);
  ctx.restore();
}

function wrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const paragraphs = String(text || "").replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      if (lines.length) lines.push("");
      continue;
    }
    let line = words.shift() || "";
    for (const word of words) {
      const candidate = `${line} ${word}`;
      if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, box: { x: number; y: number; width: number; height: number }, options?: { fontSize?: number; lineHeight?: number; weight?: number; color?: string; maxLines?: number; verticalAlign?: "top" | "middle"; maskTemplateRules?: boolean }) {
  const safe = String(text || "").trim();
  if (!safe) return;
  const requestedSize = options?.fontSize ?? 19;
  const requestedLeading = options?.lineHeight ?? Math.round(requestedSize * 1.32);
  const weight = options?.weight ?? 600;
  const color = options?.color ?? COLORS.brownDark;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let fontSize = requestedSize;
  let lineHeight = requestedLeading;
  let lines: string[] = [];
  // Textos maiores cabem sem invadir o próximo campo; só então truncamos.
  do {
    lineHeight = Math.round(requestedLeading * fontSize / requestedSize);
    ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
    lines = wrappedLines(ctx, safe, box.width);
    const limit = Math.min(options?.maxLines ?? Infinity, Math.floor(box.height / lineHeight));
    if (lines.length <= limit || fontSize <= Math.max(10, requestedSize * 0.74)) break;
    fontSize -= 0.5;
  } while (true);
  const maxLinesByHeight = Math.max(1, Math.floor(box.height / lineHeight));
  const maxLines = Math.min(options?.maxLines ?? maxLinesByHeight, maxLinesByHeight);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    let last = visible[visible.length - 1].replace(/\s+$/, "");
    while (last && ctx.measureText(`${last}…`).width > box.width) last = last.slice(0, -1);
    visible[visible.length - 1] = `${last}…`;
  }
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  const textHeight = visible.length * lineHeight;
  const startY = options?.verticalAlign === "middle" ? box.y + Math.max(0, (box.height - textHeight) / 2) : box.y;
  visible.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    if (options?.maskTemplateRules && line.trim()) {
      // Modelos integrais têm pautas decorativas. O texto ocupa o mesmo espaço
      // sem que a pauta atravesse as letras; a imagem original não é alterada.
      ctx.fillStyle = "rgba(255, 251, 247, 0.97)";
      ctx.fillRect(box.x - 3, lineY - 1, Math.min(box.width + 3, ctx.measureText(line).width + 8), fontSize + 4);
      ctx.fillStyle = color;
    }
    ctx.fillText(line, box.x, lineY);
  });
  ctx.restore();
}

function centeredFitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, fontSize: number, minSize = 11, color = COLORS.brownDark) {
  const safe = String(text || "").trim();
  if (!safe) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = fontSize;
  while (size > minSize) {
    ctx.font = `800 ${size}px Arial, sans-serif`;
    if (ctx.measureText(safe).width <= maxWidth) break;
    size -= 0.5;
  }
  ctx.fillText(safe, x, y);
  ctx.restore();
}

function insetBox(box: { x: number; y: number; width: number; height: number }, horizontal = 0, vertical = 0) {
  return {
    x: box.x + horizontal,
    y: box.y + vertical,
    width: Math.max(1, box.width - horizontal * 2),
    height: Math.max(1, box.height - vertical * 2),
  };
}

function drawIntegralStep(ctx: CanvasRenderingContext2D, step: PlanningStep, box: { x: number; y: number; width: number; height: number }, kind: PlanningKind) {
  const rawTitle = String(step.title || "").trim();
  const title = /^(Consulta|Etapa)\s+\d+$/i.test(rawTitle) ? "" : rawTitle;
  const body = String(step.planned_text || step.description || "").trim();
  if (!title && !body) return;
  const compact = kind === "gestacional";
  // O conteúdo não deve encostar nas divisórias do modelo. Esse respiro é
  // aplicado de forma idêntica em todas as linhas do integral.
  const safeBox = insetBox(box, compact ? 18 : 20, compact ? 7 : 10);
  if (title) {
    drawWrappedText(ctx, title, { x: safeBox.x, y: safeBox.y, width: safeBox.width, height: compact ? 29 : 34 }, { fontSize: compact ? 23 : 26, lineHeight: compact ? 28 : 32, weight: 800, maxLines: 1 });
  }
  if (body) {
    const titleOffset = title ? (compact ? 29 : 34) : 0;
    drawWrappedText(ctx, body, { x: safeBox.x, y: safeBox.y + titleOffset, width: safeBox.width, height: safeBox.height - titleOffset }, { fontSize: compact ? 24 : 25, lineHeight: compact ? 29 : 31, weight: 550, maxLines: compact ? 3 : 5, verticalAlign: "middle" });
  }
}

function drawDynamicIntegralBody(ctx: CanvasRenderingContext2D, kind: PlanningKind, steps: PlanningStep[], referenceDate: string, width: number, height: number) {
  const config = kind === "gestacional"
    ? {
        top: 340,
        bottom: 1264,
        footerHeight: 95,
        dividerPairs: [[333, 340], [613, 621], [952, 962]] as const,
        dateBox: { left: 354, right: 601 },
        marker: { left: 638, right: 952 },
        text: { left: 1007, right: 1847 },
        circleX: 86,
        labelX: 151,
      }
    : {
        top: 375,
        bottom: 1230,
        footerHeight: 0,
        dividerPairs: [[337, 343], [629, 637], [967, 980]] as const,
        dateBox: { left: 359, right: 614 },
        marker: { left: 637, right: 967 },
        text: { left: 1015, right: 1840 },
        circleX: 91,
        labelX: 152,
      };
  const rowsBottom = config.bottom - config.footerHeight;
  const rowCount = Math.max(1, steps.length);
  const rowHeight = (rowsBottom - config.top) / rowCount;
  const brown = COLORS.brownDark;
  const cream = "#fffaf6";
  const pale = "#f8ebe3";
  const outerLeft = 29;
  const outerRight = width - 30;

  ctx.save();
  ctx.fillStyle = cream;
  ctx.fillRect(0, config.top, width, height - config.top);
  ctx.strokeStyle = brown;
  ctx.lineWidth = 3;
  ctx.strokeRect(outerLeft, config.top, outerRight - outerLeft, config.bottom - config.top);

  config.dividerPairs.forEach(([a, b]) => {
    [a, b].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, config.top);
      ctx.lineTo(x, rowsBottom);
      ctx.stroke();
    });
  });

  steps.forEach((step, index) => {
    const y = config.top + index * rowHeight;
    const mid = y + rowHeight / 2;
    if (index > 0) {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(outerLeft, y);
      ctx.lineTo(outerRight, y);
      ctx.stroke();
    }

    ctx.fillStyle = index % 2 ? "#fffdfb" : pale;
    ctx.fillRect(config.marker.left, y, config.marker.right - config.marker.left, rowHeight);

    const radius = Math.min(39, rowHeight * 0.3);
    ctx.fillStyle = brown;
    ctx.beginPath();
    ctx.arc(config.circleX, mid, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.lightText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(23, radius * 1.05)}px Georgia, serif`;
    ctx.fillText(String(step.number || index + 1), config.circleX, mid);

    ctx.fillStyle = brown;
    ctx.textAlign = "left";
    ctx.font = `800 ${Math.max(19, Math.min(27, rowHeight * 0.23))}px Arial, sans-serif`;
    ctx.fillText("CONSULTA", config.labelX, mid);

    const boxX = config.dateBox.left;
    const boxW = config.dateBox.right - config.dateBox.left;
    const boxH = Math.min(kind === "gestacional" ? 69 : 85, rowHeight * 0.52);
    ctx.fillStyle = "#c48d70";
    ctx.beginPath();
    ctx.roundRect(boxX, mid - boxH / 2, boxW, boxH, 12);
    ctx.fill();
    centeredText(ctx, formatDate(step.date), boxX + boxW / 2, mid, boxW - 22, Math.max(17, Math.min(27, rowHeight * 0.18)));

    centeredFitText(
      ctx,
      step.marker || (kind === "in_vitro" ? `Etapa ${index + 1}` : `Marco ${index + 1}`),
      (config.marker.left + config.marker.right) / 2,
      mid,
      config.marker.right - config.marker.left - 24,
      Math.max(18, Math.min(27, rowHeight * 0.21)),
      13,
    );

    const body = step.planned_text || step.description || "";
    const textHeight = Math.max(42, rowHeight - 32);
    drawWrappedText(
      ctx,
      body,
      { x: config.text.left, y: y + 16, width: config.text.right - config.text.left, height: textHeight },
      {
        fontSize: Math.max(22, Math.min(25, rowHeight * 0.22)),
        lineHeight: Math.max(28, Math.min(33, rowHeight * 0.27)),
        weight: 550,
        maxLines: Math.max(2, Math.floor((rowHeight - 28) / 21)),
        verticalAlign: "middle",
      },
    );
  });

  if (config.footerHeight > 0) {
    const fy = rowsBottom;
    ctx.fillStyle = "#f3dfd3";
    ctx.fillRect(outerLeft, fy, outerRight - outerLeft, config.footerHeight);
    ctx.strokeStyle = brown;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(outerLeft, fy);
    ctx.lineTo(outerRight, fy);
    ctx.stroke();
    ctx.fillStyle = brown;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "800 24px Arial, sans-serif";
    ctx.fillText("Parto · data de referência", 48, fy + config.footerHeight / 2);
    ctx.textAlign = "right";
    ctx.font = "800 26px Arial, sans-serif";
    ctx.fillText(formatDate(referenceDate), outerRight - 28, fy + config.footerHeight / 2);
  }
  ctx.restore();
}

export async function renderIntegralPlanningCanvas({ kind, patient, passport, doctor, steps, referenceDate }: {
  kind: PlanningKind;
  patient: string;
  passport: string;
  doctor: string;
  steps: PlanningStep[];
  referenceDate: string;
}): Promise<HTMLCanvasElement> {
  const layout = INTEGRAL_LAYOUTS[kind];
  const source = await loadImage(layout.src);
  if (source.naturalWidth !== layout.width || source.naturalHeight !== layout.height) throw new Error("As dimensões do modelo integral não correspondem ao mapeamento aprovado.");

  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível para gerar o documento.");
  ctx.drawImage(source, 0, 0);

  drawIdentity(ctx, layout, doctor, patient, passport);

  if (steps.length === layout.dateRows.length) {
    steps.forEach((step, index) => {
      centeredText(ctx, formatDate(step.date), layout.dateCenterX, layout.dateRows[index], layout.dateWidth, layout.dateFontSize);
      drawIntegralStep(ctx, step, layout.textBoxes[index], kind);
    });
    if (kind === "gestacional" && referenceDate && layout.referenceBox) {
      drawWrappedText(
        ctx,
        `Data prevista para o parto: ${formatDate(referenceDate)}`,
        layout.referenceBox,
        { fontSize: 19, lineHeight: 24, weight: 800, maxLines: 2, verticalAlign: "middle", maskTemplateRules: true },
      );
    }
  } else {
    drawDynamicIntegralBody(ctx, kind, steps, referenceDate, layout.width, layout.height);
  }

  return canvas;
}

function canvasToPngBlob(canvas: HTMLCanvasElement, errorMessage: string) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(errorMessage)), "image/png"));
}

export async function renderIntegralPlanning(args: Parameters<typeof renderIntegralPlanningCanvas>[0]): Promise<Blob> {
  return canvasToPngBlob(await renderIntegralPlanningCanvas(args), "Falha ao gerar PNG integral.");
}

export async function renderIndividualPlanningCanvas({ kind, patient, passport, doctor, step, evolution, exams, observation }: {
  kind: PlanningKind;
  patient: string;
  passport: string;
  doctor: string;
  step: PlanningStep;
  evolution: string;
  exams: string;
  observation: string;
}): Promise<HTMLCanvasElement> {
  const layout = INDIVIDUAL_LAYOUTS[kind];
  const source = await loadImage(layout.src);
  if (source.naturalWidth !== layout.width || source.naturalHeight !== layout.height) throw new Error("As dimensões do modelo individual não correspondem ao mapeamento aprovado.");

  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível para gerar o documento individual.");
  ctx.drawImage(source, 0, 0);

  drawIdentity(ctx, layout, doctor, patient, passport);

  // O modelo aprovado exibe "1" como exemplo. A aplicação cobre apenas o
  // círculo e redesenha o número da consulta correspondente, sem alterar o cabeçalho.
  ctx.save();
  const circleGradient = ctx.createLinearGradient(
    layout.circle.x - layout.circle.radius,
    layout.circle.y - layout.circle.radius,
    layout.circle.x + layout.circle.radius,
    layout.circle.y + layout.circle.radius,
  );
  circleGradient.addColorStop(0, "#9d5633");
  circleGradient.addColorStop(1, COLORS.brownDark);
  ctx.fillStyle = circleGradient;
  ctx.beginPath();
  ctx.arc(layout.circle.x, layout.circle.y, layout.circle.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.lightText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 42px Georgia, 'Times New Roman', serif";
  ctx.fillText(String(step.number), layout.circle.x, layout.circle.y + 1);
  ctx.restore();

  centeredText(ctx, formatDate(step.date), layout.date.x, layout.date.y, layout.date.width, 21, COLORS.brownDark);
  const marker = String(step.marker || "").trim();
  const title = String(step.title || "").trim();
  const markerText = kind === "in_vitro" && title && marker.toLocaleLowerCase("pt-BR") !== title.toLocaleLowerCase("pt-BR") && !/^Etapa \d+$/i.test(title)
    ? `${marker} · ${title}`
    : marker || title;
  fitText(ctx, markerText, layout.marker.x, layout.marker.y, layout.marker.width, 21, 13, 800, COLORS.brownDark);

  const plannedBox = insetBox(layout.planned, 18, 13);
  const evolutionBox = insetBox(layout.evolution, 18, 13);
  const examsBox = insetBox(layout.exams, 18, 13);
  drawWrappedText(ctx, step.planned_text || step.description, plannedBox, { fontSize: 26, lineHeight: 31, weight: 600, maxLines: 4 });
  void observation; // observação médica interna permanece fora do PNG e do Portal.
  drawWrappedText(ctx, evolution, evolutionBox, { fontSize: 25, lineHeight: 30, weight: 600, maxLines: 4 });
  drawWrappedText(ctx, exams, examsBox, { fontSize: 25, lineHeight: 30, weight: 600, maxLines: 5 });

  return canvas;
}

export async function renderIndividualPlanning(args: Parameters<typeof renderIndividualPlanningCanvas>[0]): Promise<Blob> {
  return canvasToPngBlob(await renderIndividualPlanningCanvas(args), "Falha ao gerar PNG individual.");
}

/** Compatibilidade com chamadas antigas da aba Obstetra. */
export async function renderOfficialPlanning(args: Parameters<typeof renderIntegralPlanning>[0]) {
  return renderIntegralPlanning(args);
}
