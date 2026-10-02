import type { PlanningKind, PlanningStep } from "@/lib/obstetric-planning";

const COLORS = {
  brown: "#7d3b21",
  brownDark: "#6c301c",
  brownSoft: "#a96745",
  lightText: "#fff5ef",
};

const INTEGRAL_LAYOUTS = {
  gestacional: {
    src: "/clinical-assistant/official-gestational-integral-v2.png",
    width: 1491,
    height: 1055,
    doctor: { x: 190, y: 183, width: 675 },
    patient: { x: 292, y: 230, width: 765 },
    passport: { x: 292, y: 274, width: 730 },
    dateCenterX: 349,
    dateRows: [368, 445, 524, 603, 681, 760, 839, 918],
    textRows: [319, 397, 475, 553, 632, 711, 790, 870],
    textRowHeight: 70,
    textX: 748,
    textWidth: 700,
    finalTextY: 963,
  },
  in_vitro: {
    src: "/clinical-assistant/official-ivf-integral-v2.png",
    width: 1491,
    height: 1055,
    doctor: { x: 270, y: 202, width: 650 },
    patient: { x: 303, y: 248, width: 745 },
    passport: { x: 298, y: 286, width: 700 },
    dateCenterX: 364,
    dateRows: [398, 529, 667, 802, 932],
    textRows: [336, 468, 600, 733, 866],
    textRowHeight: 112,
    textX: 760,
    textWidth: 670,
    finalTextY: 0,
  },
} as const;

const INDIVIDUAL_LAYOUTS = {
  gestacional: {
    src: "/clinical-assistant/official-gestational-individual-v2.png",
    width: 1536,
    height: 1024,
    doctor: { x: 192, y: 178, width: 730 },
    patient: { x: 297, y: 226, width: 735 },
    passport: { x: 294, y: 265, width: 720 },
    circle: { x: 54, y: 319, radius: 34 },
    date: { x: 416, y: 320, width: 226 },
    marker: { x: 905, y: 320, width: 565 },
    planned: { x: 48, y: 438, width: 1434, height: 124 },
    evolution: { x: 48, y: 654, width: 1434, height: 116 },
    conduct: { x: 48, y: 855, width: 1434, height: 126 },
  },
  in_vitro: {
    src: "/clinical-assistant/official-ivf-individual-v2.png",
    width: 1536,
    height: 1024,
    doctor: { x: 274, y: 185, width: 625 },
    patient: { x: 310, y: 239, width: 755 },
    passport: { x: 299, y: 283, width: 730 },
    circle: { x: 57, y: 375, radius: 34 },
    date: { x: 422, y: 375, width: 224 },
    marker: { x: 930, y: 375, width: 545 },
    planned: { x: 48, y: 480, width: 1434, height: 102 },
    evolution: { x: 48, y: 663, width: 1434, height: 112 },
    conduct: { x: 48, y: 855, width: 1434, height: 112 },
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
}, doctor: string, patient: string, passport: string) {
  // "Obstetra/Ginecologista:" — mesma tipografia leve e tom quente do rótulo.
  fitText(ctx, doctor, layout.doctor.x, layout.doctor.y, layout.doctor.width,
    28, 17, 400, "#b98f7e", "Arial, sans-serif");
  // "NOME:" — mesma serifada, peso e marrom do cabeçalho aprovado.
  fitText(ctx, patient, layout.patient.x, layout.patient.y, layout.patient.width,
    44, 20, 700, "#7d3b21", "Georgia, 'Times New Roman', serif");
  // "PASSAPORTE:" — mesma cor, corpo e espaçamento aberto do rótulo.
  fitText(ctx, passport, layout.passport.x, layout.passport.y, layout.passport.width,
    26, 16, 700, "#b17b5b", "Arial, sans-serif", 2.1);
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

function drawIntegralStep(ctx: CanvasRenderingContext2D, step: PlanningStep, box: { x: number; y: number; width: number; height: number }, kind: PlanningKind) {
  const rawTitle = String(step.title || "").trim();
  const title = /^(Consulta|Etapa)\s+\d+$/i.test(rawTitle) ? "" : rawTitle;
  const body = String(step.planned_text || step.description || "").trim();
  if (!title && !body) return;
  const compact = kind === "gestacional";
  if (title) {
    drawWrappedText(ctx, title, { x: box.x, y: box.y, width: box.width, height: compact ? 22 : 28 }, { fontSize: compact ? 14 : 16, lineHeight: compact ? 17 : 20, weight: 800, maxLines: 1, maskTemplateRules: true });
  }
  if (body) {
    drawWrappedText(ctx, body, { x: box.x, y: box.y + (title ? (compact ? 19 : 24) : 0), width: box.width, height: box.height - (title ? (compact ? 19 : 24) : 0) }, { fontSize: compact ? 12.5 : 14, lineHeight: compact ? 15 : 18, weight: 500, maxLines: compact ? 3 : 5, maskTemplateRules: true });
  }
}


function drawDynamicIntegralBody(ctx: CanvasRenderingContext2D, kind: PlanningKind, steps: PlanningStep[], referenceDate: string, width: number, height: number) {
  const config = kind === "gestacional"
    ? {
        top: 314,
        bottom: 1010,
        footerHeight: 76,
        dividerPairs: [[239, 250], [461, 472], [720, 730]] as const,
        dateBox: { left: 261, right: 454 },
        marker: { left: 476, right: 719 },
        text: { left: 745, right: 1450 },
        circleX: 53,
        labelX: 102,
      }
    : {
        top: 328,
        bottom: 1010,
        footerHeight: 72,
        dividerPairs: [[237, 247], [461, 472], [724, 734]] as const,
        dateBox: { left: 258, right: 453 },
        marker: { left: 477, right: 723 },
        text: { left: 748, right: 1450 },
        circleX: 53,
        labelX: 102,
      };
  const rowsBottom = config.bottom - config.footerHeight;
  const rowCount = Math.max(1, steps.length);
  const rowHeight = (rowsBottom - config.top) / rowCount;
  const brown = COLORS.brownDark;
  const cream = "#fffaf6";
  const pale = "#f8ebe3";
  const outerLeft = 13;
  const outerRight = width - 13;

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

    const radius = Math.min(30, rowHeight * 0.3);
    ctx.fillStyle = brown;
    ctx.beginPath();
    ctx.arc(config.circleX, mid, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.lightText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(18, radius * 1.05)}px Georgia, serif`;
    ctx.fillText(String(step.number || index + 1), config.circleX, mid);

    ctx.fillStyle = brown;
    ctx.textAlign = "left";
    ctx.font = `800 ${Math.max(15, Math.min(22, rowHeight * 0.23))}px Arial, sans-serif`;
    ctx.fillText("CONSULTA", config.labelX, mid);

    const boxX = config.dateBox.left;
    const boxW = config.dateBox.right - config.dateBox.left;
    const boxH = Math.min(kind === "gestacional" ? 48 : 50, rowHeight * 0.5);
    ctx.fillStyle = "#c48d70";
    ctx.beginPath();
    ctx.roundRect(boxX, mid - boxH / 2, boxW, boxH, 9);
    ctx.fill();
    centeredText(ctx, formatDate(step.date), boxX + boxW / 2, mid, boxW - 16, Math.max(12, Math.min(18, rowHeight * 0.17)));

    centeredFitText(
      ctx,
      step.marker || (kind === "in_vitro" ? `Etapa ${index + 1}` : `Marco ${index + 1}`),
      (config.marker.left + config.marker.right) / 2,
      mid,
      config.marker.right - config.marker.left - 20,
      Math.max(14, Math.min(21, rowHeight * 0.21)),
      11,
    );

    const body = step.planned_text || step.description || "";
    const textHeight = Math.max(32, rowHeight - 20);
    drawWrappedText(
      ctx,
      body,
      { x: config.text.left, y: y + 10, width: config.text.right - config.text.left, height: textHeight },
      {
        fontSize: Math.max(11.5, Math.min(14, rowHeight * 0.15)),
        lineHeight: Math.max(15, Math.min(19, rowHeight * 0.2)),
        weight: 500,
        maxLines: Math.max(2, Math.floor((rowHeight - 18) / 16)),
        verticalAlign: "middle",
      },
    );
  });

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
  ctx.font = "800 20px Arial, sans-serif";
  ctx.fillText(kind === "gestacional" ? "Parto · data de referência" : "β-hCG · data de referência", 34, fy + config.footerHeight / 2);
  ctx.textAlign = "right";
  ctx.font = "800 21px Arial, sans-serif";
  ctx.fillText(formatDate(referenceDate), outerRight - 24, fy + config.footerHeight / 2);
  ctx.restore();
}

export async function renderIntegralPlanning({ kind, patient, passport, doctor, steps, referenceDate }: {
  kind: PlanningKind;
  patient: string;
  passport: string;
  doctor: string;
  steps: PlanningStep[];
  referenceDate: string;
}): Promise<Blob> {
  const layout = INTEGRAL_LAYOUTS[kind];
  const source = await loadImage(layout.src);
  if (source.naturalWidth !== layout.width || source.naturalHeight !== layout.height) throw new Error("As dimensões do modelo integral não correspondem ao mapeamento aprovado.");

  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível para gerar o documento.");
  ctx.drawImage(source, 0, 0);

  drawIdentity(ctx, layout, doctor, patient, passport);

  if (steps.length === layout.dateRows.length) {
    steps.forEach((step, index) => {
      centeredText(ctx, formatDate(step.date), layout.dateCenterX, layout.dateRows[index], 170, 20);
      drawIntegralStep(ctx, step, { x: layout.textX, y: layout.textRows[index], width: layout.textWidth, height: layout.textRowHeight }, kind);
    });
    if (kind === "gestacional" && referenceDate) {
      drawWrappedText(ctx, `Data prevista para o parto: ${formatDate(referenceDate)}`, { x: layout.textX, y: layout.finalTextY, width: layout.textWidth, height: 42 }, { fontSize: 14, lineHeight: 18, weight: 800, maxLines: 2 });
    }
  } else {
    drawDynamicIntegralBody(ctx, kind, steps, referenceDate, layout.width, layout.height);
  }

  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao gerar PNG integral.")), "image/png"));
}

export async function renderIndividualPlanning({ kind, patient, passport, doctor, step, evolution, observation, conduct }: {
  kind: PlanningKind;
  patient: string;
  passport: string;
  doctor: string;
  step: PlanningStep;
  evolution: string;
  observation: string;
  conduct: string;
}): Promise<Blob> {
  const layout = INDIVIDUAL_LAYOUTS[kind];
  const source = await loadImage(layout.src);
  if (source.naturalWidth !== layout.width || source.naturalHeight !== layout.height) throw new Error("As dimensões do modelo individual não correspondem ao mapeamento aprovado.");

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

  centeredText(ctx, formatDate(step.date), layout.date.x, layout.date.y, layout.date.width, 20);
  const marker = String(step.marker || "").trim();
  const title = String(step.title || "").trim();
  const markerText = kind === "in_vitro" && title && marker.toLocaleLowerCase("pt-BR") !== title.toLocaleLowerCase("pt-BR") && !/^Etapa \d+$/i.test(title)
    ? `${marker} · ${title}`
    : marker || title;
  fitText(ctx, markerText, layout.marker.x, layout.marker.y, layout.marker.width, 22, 13, 800, COLORS.brownDark);

  drawWrappedText(ctx, step.planned_text || step.description, layout.planned, { fontSize: 19, lineHeight: 25, weight: 600, maxLines: 5 });
  void observation; // observação médica permanece interna e não é impressa no PNG.
  drawWrappedText(ctx, evolution, layout.evolution, { fontSize: 18, lineHeight: 24, weight: 600, maxLines: 5 });
  drawWrappedText(ctx, conduct, layout.conduct, { fontSize: 19, lineHeight: 25, weight: 600, maxLines: 5 });

  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao gerar PNG individual.")), "image/png"));
}

/** Compatibilidade com chamadas antigas da aba Obstetra. */
export async function renderOfficialPlanning(args: Parameters<typeof renderIntegralPlanning>[0]) {
  return renderIntegralPlanning(args);
}
