import type { DocumentRenderSnapshot } from "@/lib/clinical-render-snapshot";
import { drawRichTextElement, measureRichTextElement } from "@/lib/rich-text-canvas";
  function loadImage(src: string) {
    return new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      const isRemote = /^https?:\/\//i.test(src);
      if (isRemote) image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function normalizeSignatureImage(image: HTMLImageElement): HTMLCanvasElement | null {
    try {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth || image.width;
      sourceCanvas.height = image.naturalHeight || image.height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return null;
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
    } catch (error) {
      if (error instanceof DOMException && error.name === "SecurityError") {
        console.warn("[HPSR][Documentos] Assinatura externa ignorada por restrição CORS.");
        return null;
      }
      console.warn("[HPSR][Documentos] Não foi possível preparar a assinatura para o documento.", error);
      return null;
    }
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

  function wrapCanvasText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
    const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawInfoCard(
    context: CanvasRenderingContext2D,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number,
    height = 40,
  ) {
    context.fillStyle = "rgba(255,250,244,0.98)";
    context.strokeStyle = "rgba(91,24,9,0.16)";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(x, y, width, height, 10);
    context.fill();
    context.stroke();
    context.fillStyle = "#8d5f54";
    context.font = "700 8px Arial";
    context.fillText(label.toUpperCase(), x + 10, y + 8);
    context.fillStyle = "#421910";
    context.font = height <= 32 ? "700 10.5px Georgia" : "700 11px Georgia";
    const lines = wrapCanvasText(context, value || "-", width - 20);
    const maxLines = height <= 32 ? 1 : height <= 40 ? 2 : 3;
    lines.slice(0, maxLines).forEach((line, index) => context.fillText(line, x + 10, y + 18 + index * 11));
  }

  function drawTechnicalRibbon(
    context: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    width: number,
  ) {
    context.fillStyle = "rgba(91,24,9,0.07)";
    context.beginPath();
    context.roundRect(x, y, width, 20, 10);
    context.fill();
    context.fillStyle = "#5b1809";
    context.font = "700 9px Arial";
    context.textAlign = "center";
    context.fillText(label.toUpperCase(), x + width / 2, y + 6);
    context.textAlign = "left";
  }

  function drawDocumentHtml(
    context: CanvasRenderingContext2D,
    html: string,
    x: number,
    y: number,
    width: number,
    maxY: number,
  ) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html || "";
    const blocks = Array.from(wrapper.children);
    context.textBaseline = "top";
    for (const block of blocks) {
      if (y > maxY - 24) break;
      const tag = block.tagName.toLowerCase();
      const htmlText = (block.textContent || "").replace(/\s+/g, " ").trim();

      if (/^h[1-3]$/.test(tag)) {
        const headingSize = tag === "h1" ? 13 : 11.5;
        const headingHeight = Math.max(21, measureRichTextElement(context, block, width - 24, {
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
        context.strokeStyle = "rgba(91,24,9,0.18)";
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
              fontFamily: rowIndex === 0 ? "Arial, sans-serif" : "Georgia, 'Times New Roman', serif",
              color: "#412017",
              bold: rowIndex === 0,
              lineHeight: 11,
              textAlign: "center",
            }) + 8,
          ));
          if (y + rowHeight > maxY) return y;
          cells.forEach((cell, cellIndex) => {
            const cx = tableX + cellIndex * colWidth;
            context.fillStyle = rowIndex === 0 ? "rgba(91,24,9,0.11)" : rowIndex % 2 === 0 ? "rgba(255,250,244,0.92)" : "rgba(255,255,255,0.98)";
            context.fillRect(cx, y, colWidth, rowHeight);
            context.strokeStyle = "rgba(91,24,9,0.22)";
            context.strokeRect(cx, y, colWidth, rowHeight);
            const contentHeight = measureRichTextElement(context, cell, colWidth - 12, {
              baseFontSize: 10,
              fontFamily: rowIndex === 0 ? "Arial, sans-serif" : "Georgia, 'Times New Roman', serif",
              color: "#412017",
              bold: rowIndex === 0,
              lineHeight: 11,
              textAlign: "center",
            });
            drawRichTextElement(context, cell, cx + 6, y + Math.max(4, (rowHeight - contentHeight) / 2), colWidth - 12, y + rowHeight - 3, {
              baseFontSize: 10,
              fontFamily: rowIndex === 0 ? "Arial, sans-serif" : "Georgia, 'Times New Roman', serif",
              color: "#412017",
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
          context.font = "11.2px Georgia";
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

      if (!htmlText) {
        y += tag === "p" || tag === "blockquote" || tag === "div" ? 20.5 : 8;
        continue;
      }
      y = drawRichTextElement(context, block, x, y, width, maxY, {
        baseFontSize: 11.4,
        color: "#3f231c",
        lineHeight: 15.5,
      }) + 5;
    }
    return y;
  }

export async function renderSavedDocumentCanvas(snapshot: DocumentRenderSnapshot, pageIndex: number) {
    await document.fonts.ready;
    const pageHtml = snapshot.pages[pageIndex] || "";
    const totalPages = snapshot.pages.length;
    const { patient, doctor, date: today, title } = snapshot.metadata;
    const selectedModel = { title };
    const html = pageHtml;
    const canvas = document.createElement("canvas");
    canvas.width = 794;
    canvas.height = 1123;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#fffdfb";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const logo = await loadImage("/logo-hpsr.png");
    if (logo) {
      context.save();
      context.globalAlpha = 0.06;
      const watermarkSize = 340;
      const ratio = Math.min(watermarkSize / logo.width, watermarkSize / logo.height);
      const drawWidth = logo.width * ratio;
      const drawHeight = logo.height * ratio;
      context.drawImage(logo, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
      context.restore();
    }

    context.textBaseline = "top";
    context.fillStyle = "rgba(255,255,255,0.96)";
    context.strokeStyle = "rgba(91,24,9,0.16)";
    context.beginPath();
    context.roundRect(24, 24, 742, 66, 16);
    context.fill();
    context.stroke();

    if (logo) {
      const ratio = Math.min(40 / logo.width, 40 / logo.height);
      context.drawImage(logo, 38, 36, logo.width * ratio, logo.height * ratio);
    }
    context.fillStyle = "#3d1710";
    context.font = "700 16.5px Arial";
    context.fillText("HOSPITAL SÃO RAFAEL", 92, 34);
    context.fillStyle = "#8d665b";
    context.font = "700 8.5px Arial";
    context.fillText("DOCUMENTO MÉDICO · HOSPITAL SÃO RAFAEL", 92, 58);

    drawInfoCard(context, "Data", today, 574, 31, 84, 25);
    drawInfoCard(context, "Página", `${pageIndex + 1}/${totalPages}`, 666, 31, 86, 25);

    context.fillStyle = "rgba(91,24,9,0.065)";
    context.strokeStyle = "rgba(91,24,9,0.16)";
    context.beginPath();
    context.roundRect(42, 100, 710, 30, 12);
    context.fill();
    context.stroke();
    context.textAlign = "center";
    context.fillStyle = "#5b1809";
    context.font = "700 11.5px Arial";
    context.fillText((selectedModel?.title || "DOCUMENTO MÉDICO").toUpperCase(), 397, 109);
    context.textAlign = "left";

    drawInfoCard(context, "Paciente", patient.name || "-", 42, 138, 318, 30);
    drawInfoCard(context, "Passaporte", patient.passport || "-", 368, 138, 132, 30);
    drawInfoCard(context, "Idade", patient.age || "-", 508, 138, 82, 30);
    drawInfoCard(context, "Tipo sanguíneo", patient.bloodType || "-", 598, 138, 154, 30);

    let y = 184;
    y = drawDocumentHtml(context, html, 42, y, 710, 1009);

    context.fillStyle = "rgba(255,250,247,0.98)";
    context.fillRect(42, 1018, 710, 93);
    context.strokeStyle = "rgba(91,24,9,0.20)";
    context.beginPath();
    context.moveTo(42, 1018);
    context.lineTo(752, 1018);
    context.stroke();

    const signatureSource = doctor.signatureImage || null;
    if (signatureSource) {
      const signature = await loadImage(signatureSource);
      if (!signature) throw new Error("Não foi possível carregar a assinatura preservada.");
      if (signature) {
        const normalizedSignature = normalizeSignatureImage(signature);
        if (!normalizedSignature) throw new Error("Não foi possível preparar a assinatura preservada.");
        if (normalizedSignature) drawSignatureContain(context, normalizedSignature, 297, 1032, 200, 35);
      }
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
    context.fillText(`Dr(a). ${doctor.name || "Nome do médico"}`, 397, 1073);
    context.font = "8.5px Arial";
    context.fillText(
      `${doctor.role || "Médico"} · CRM: ${doctor.crm || "000000"}`,
      397,
      1086,
    );
    context.fillStyle = "#7a5148";
    context.font = "8px Arial";
    context.textAlign = "left";
    context.fillText("Hospital São Rafael", 42, 1101);
    context.textAlign = "center";
    context.fillText("Documento médico institucional", 397, 1101);
    context.textAlign = "right";
    context.fillText(`Página ${pageIndex + 1}/${totalPages}`, 752, 1101);
    context.textAlign = "left";

    return canvas;
  }


export function measureDocumentReportHtml(html: string): number | null {
  if (typeof document === "undefined") return null;
  const context = document.createElement("canvas").getContext("2d");
  return context ? drawDocumentHtml(context, html, 0, 0, 710, Number.POSITIVE_INFINITY) : null;
}
