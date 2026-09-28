import type { PlanningKind, PlanningStep } from "@/lib/obstetric-planning";

/** Coordenadas conferidas nos modelos oficiais definitivos (805 × 546 px). */
const LAYOUTS = {
  gestacional: {
    src: "/clinical-assistant/official-gestational-print.png",
    rows: [190.5, 229.5, 268.5, 309, 347.5, 388.5, 431, 473.5, 515],
    doctorX: 99,
    doctorY: 103,
    dateX: 139,
    dateWidth: 106,
  },
  in_vitro: {
    src: "/clinical-assistant/official-ivf-print.png",
    rows: [209.5, 281, 353, 425, 496.5],
    doctorX: 129,
    doctorY: 106,
    dateX: 139,
    dateWidth: 106,
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

/**
 * Desenha os dados variáveis sobre os próprios PNGs oficiais, sem reconstruir
 * títulos, logos, consultas, semanas ou textos clínicos.
 */
export async function renderOfficialPlanning({ kind, patient, passport, doctor, steps }: {
  kind: PlanningKind;
  patient: string;
  passport: string;
  doctor: string;
  steps: PlanningStep[];
}): Promise<Blob> {
  const layout = LAYOUTS[kind];
  const source = await loadImage(layout.src);
  if (steps.length !== layout.rows.length) throw new Error("O número de etapas não corresponde ao modelo oficial.");
  if (source.naturalWidth !== 2415 || source.naturalHeight !== 1638) throw new Error("As dimensões do modelo oficial não correspondem ao mapeamento dos campos.");

  // A base 805 × 546 foi ampliada uma única vez com Lanczos para 2415 × 1638.
  // O desenho 1:1 evita redimensionamento adicional no navegador.
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível para gerar o documento.");
  // Alias já validado: a função fit também recebe um contexto não nulo.
  const ctx: CanvasRenderingContext2D = context;
  // Desenho 1:1: a arte não passa por um segundo redimensionamento.
  ctx.drawImage(source, 0, 0);
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";

  function fit(text: string, x: number, y: number, maxWidth: number, fontSize: number, minSize: number, weight: number, color: string) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    let size = fontSize;
    do {
      ctx.font = `${weight} ${size}px Georgia, 'Times New Roman', serif`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size = Math.max(minSize, size - 0.25);
    } while (size > minSize);
    ctx.beginPath();
    ctx.rect(x, y - fontSize / 2 - 2, maxWidth, fontSize + 4);
    ctx.clip();
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // O nome do médico vem imediatamente após a especialidade já impressa,
  // com a mesma cor amostrada do texto oficial e a mesma escala de fonte.
  fit(doctor, layout.doctorX, layout.doctorY, 299 - layout.doctorX, 14.5, 10, 400, "#be9e91");
  // As duas identificações ocupam apenas os espaços existentes no cabeçalho.
  fit(patient, 150, 129, 420, 22, 13, 700, "#70341c");
  fit(passport, 150, 153, 420, 16, 11, 700, "#70341c");

  // As datas de referência finais (parto / entrega do Beta-hCG) ficam no
  // registro do plano, mas NÃO são impressas nos documentos oficiais.
  // A última linha de ambos os modelos não é um campo de data em branco.
  steps.slice(0, -1).forEach((step, index) => {
    const text = step.date.split("-").reverse().join("/");
    const fontSize = 14;
    const minSize = 12;
    let size = fontSize;
    ctx.save();
    ctx.fillStyle = "#fff7f3";
    ctx.textAlign = "center";
    do {
      ctx.font = `700 ${size}px Arial, sans-serif`;
      if (ctx.measureText(text).width <= layout.dateWidth - 9) break;
      size = Math.max(minSize, size - 0.25);
    } while (size > minSize);
    ctx.fillText(text, layout.dateX + layout.dateWidth / 2, layout.rows[index]);
    ctx.restore();
  });

  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("Falha ao gerar PNG.")), "image/png",
  ));
}
