import type { RenderedExamDocument } from "@/data/exames/final-renderer";
import { drawRichTextElement, measureRichTextElement } from "@/lib/rich-text-canvas";
import { normalizeSignatureImage, EXAM_SIGNATURE_IMAGE_WIDTH, EXAM_SIGNATURE_IMAGE_HEIGHT } from "@/lib/exam-signature-image";
function formatDateBR(value: string) { const [year,month,day] = (value || "").split("-"); return year && month && day ? `${day}/${month}/${year}` : value || "-"; }
export async function renderExamPage(
    finalDocument: RenderedExamDocument,
    pageIndex: number,
  ) {
    await document.fonts.ready;
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

    const drawImageContain = (
      image: HTMLImageElement | HTMLCanvasElement,
      x: number,
      y: number,
      width: number,
      height: number,
      alignBottom = false,
    ) => {
      const ratio = Math.min(width / image.width, height / image.height);
      const drawWidth = image.width * ratio;
      const drawHeight = image.height * ratio;
      const drawX = x + (width - drawWidth) / 2;
      const drawY = y + (height - drawHeight) / (alignBottom ? 1 : 2);
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

    const drawInfoCard = (label: string, value: string, x: number, y: number, width: number, height = 42, patientInfo = false) => {
      context.fillStyle = "rgba(255,255,255,0.98)";
      context.strokeStyle = "rgba(91,24,9,0.16)";
      context.lineWidth = 1;
      context.beginPath();
      context.roundRect(x, y, width, height, 12);
      context.fill();
      context.stroke();
      context.fillStyle = "#8d665b";
      context.font = patientInfo ? "700 9px Arial" : height <= 32 ? "700 7px Arial" : "700 8px Arial";
      context.fillText(label.toUpperCase(), x + 10, y + (height <= 32 ? 4 : 8));
      context.fillStyle = "#3d1710";
      context.font = patientInfo ? (label === "Paciente" ? "600 13px Arial" : "600 12px Arial") : height <= 32 ? "700 9.5px Arial" : "700 11px Arial";
      const lines = wrapCanvasText(context, value || "-", width - 20);
      const maxLines = patientInfo ? 2 : height <= 32 ? 1 : height <= 40 ? 2 : 3;
      lines.slice(0, maxLines).forEach((line, index) => context.fillText(line, x + 10, y + (patientInfo ? 26 : height <= 32 ? 14 : 21) + index * (patientInfo ? 18 : 11), width - 20));
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

    const drawInstitutionalHeader = async () => {
      context.fillStyle = "rgba(255,255,255,0.97)";
      context.strokeStyle = "rgba(91,24,9,0.16)";
      context.beginPath();
      context.roundRect(24, 18, 742, 80, 16);
      context.fill();
      context.stroke();

      const logo = await loadImage("/logo-hpsr.png");
      if (logo) drawImageContain(logo, 36, 18, 80, 80);
      context.fillStyle = "#3d1710";
      context.font = "700 16.5px Arial";
      context.fillText("HOSPITAL SÃO RAFAEL", 128, 34);
      context.fillStyle = "#8d665b";
      context.font = "700 8.5px Arial";
      context.fillText("LAUDO DE EXAME · DOCUMENTO INSTITUCIONAL", 128, 58);

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

      drawInfoCard("Paciente", finalDocument.metadata.patient.name || "-", 42, 138, 318, 70, true);
      drawInfoCard("Passaporte", finalDocument.metadata.patient.passport || "-", 368, 138, 132, 70, true);
      drawInfoCard("Idade", finalDocument.metadata.patient.age || "-", 508, 138, 82, 70, true);
      drawInfoCard("Tipo sanguíneo", finalDocument.metadata.patient.bloodType || "-", 598, 138, 154, 70, true);
    };

    const drawFooter = async () => {
      const signature = finalDocument.metadata.signatureImage
        ? await loadImage(finalDocument.metadata.signatureImage)
        : null;
      if (finalDocument.metadata.signatureImage && !signature) throw new Error("Não foi possível carregar a assinatura preservada.");
      if (signature) {
        const normalizedSignature = normalizeSignatureImage(signature);
        if (!normalizedSignature) throw new Error("Não foi possível preparar a assinatura preservada.");
        if (normalizedSignature) drawImageContain(normalizedSignature, (794 - EXAM_SIGNATURE_IMAGE_WIDTH) / 2, 1060 - EXAM_SIGNATURE_IMAGE_HEIGHT, EXAM_SIGNATURE_IMAGE_WIDTH, EXAM_SIGNATURE_IMAGE_HEIGHT, true);
      }

      context.strokeStyle = "rgba(91,24,9,0.28)";
      context.lineWidth = 0.5;
      context.setLineDash([1, 3]);
      context.beginPath();
      context.moveTo(217, 1062);
      context.lineTo(577, 1062);
      context.stroke();
      context.setLineDash([]);
      context.lineWidth = 1;

      context.fillStyle = "#5b1809";
      context.textAlign = "center";
      context.font = "12px Arial";
      context.fillText(`Dr(a). ${finalDocument.metadata.doctor.name || "Nome do médico"}`, 397, 1070, 650);
      context.font = "9px Arial";
      context.fillText(`CRM: ${finalDocument.metadata.doctor.crm || "000000"}`, 397, 1086);

      context.strokeStyle = "rgba(91,24,9,0.08)";
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

      await drawInstitutionalHeader();

      if (page.type === "report") {
        drawExamReportHtml(context, page.reportHtml || "", 42, 214, 710, 928);
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

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("O navegador não conseguiu materializar a página em PNG.");
      return blob;
    } catch (error) {
      console.error("[HPSR][Exames] Falha ao renderizar o preview PNG:", error);
      throw error;
    }
  }


    const htmlText = (node: Element) =>
      (node.textContent || "").replace(/\s+/g, " ").trim();

export function drawExamReportHtml(context: CanvasRenderingContext2D, html: string, x: number, y: number, width: number, maxY: number) {
      const wrapper = window.document.createElement("div");
      wrapper.innerHTML = html || "";
      const blocks = Array.from(wrapper.children);
      context.textBaseline = "top";
      for (const block of blocks) {
        if (y >= maxY) break;
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
                baseFontSize: 11,
                fontFamily: "Arial, sans-serif",
                color: "#4b2118",
                bold: rowIndex === 0,
                lineHeight: 13,
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
                baseFontSize: 11,
                fontFamily: "Arial, sans-serif",
                color: "#4b2118",
                bold: rowIndex === 0,
                lineHeight: 13,
                textAlign: "center",
              });
              drawRichTextElement(context, cell, cx + 6, y + Math.max(4, (rowHeight - contentHeight) / 2), colWidth - 12, y + rowHeight - 3, {
                baseFontSize: 11,
                fontFamily: "Arial, sans-serif",
                color: "#4b2118",
                bold: rowIndex === 0,
                lineHeight: 13,
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
            context.font = "12px Arial";
            context.fillText(tag === "ol" ? `${index + 1}.` : "•", x + 2, y);
            y = drawRichTextElement(context, item, x + 18, y, width - 18, maxY, {
              baseFontSize: 12,
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
          baseFontSize: 12,
          color: "#4b2118",
          lineHeight: 16.5,
        }) + 5;
      }
      return y;
    }

export function measureExamReportHtml(html: string, width = 710): number | null {
  if (typeof document === "undefined") return null;
  const context = document.createElement("canvas").getContext("2d");
  return context ? drawExamReportHtml(context, html, 0, 0, width, Number.POSITIVE_INFINITY) : null;
}
