import { EXAM_REPORT_BODY_TOP, EXAM_SIGNED_BODY_HEIGHT, EXAM_UNSIGNED_BODY_HEIGHT, lastReportPageIndex } from "./exam-report-layout";
import { renderClinicalBody as renderV3Body } from "./clinical-body-renderer-v3";
import { renderClinicalBody as renderHistoricalBody } from "@/lib/clinical-body-renderer-v2";
import { renderClinicalBody, measureClinicalBody } from "@/lib/clinical-body-renderer";
import type { RenderedExamDocument } from "@/data/exames/final-renderer";
import { drawRichTextElement, measureRichTextElement } from "@/lib/rich-text-canvas-legacy";
import { normalizeSignatureImage, EXAM_SIGNATURE_IMAGE_WIDTH, EXAM_SIGNATURE_IMAGE_HEIGHT } from "@/lib/exam-signature-image";
function formatDateBR(value: string) { const [year,month,day] = (value || "").split("-"); return year && month && day ? `${day}/${month}/${year}` : value || "-"; }
export async function renderExamPage(
    finalDocument: RenderedExamDocument,
    pageIndex: number,
  ) {
    await document.fonts.ready;
    const expanded = finalDocument.contentRendererVersion === 4;
    const modern = expanded || finalDocument.contentRendererVersion === 3;
    const lastReportIndex = lastReportPageIndex(finalDocument.pages);
    const signedReport = pageIndex === lastReportIndex && finalDocument.pages[pageIndex]?.type === "report";
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
      if (modern) {
        context.fillStyle="#fffdf9";context.fillRect(0,0,794,1123);
        const watermark=await loadImage("/clinical/exam-v3/logo-horizontal.png");
        if(watermark){context.save();context.globalAlpha=.065;context.drawImage(watermark,0,0,watermark.width*.296,watermark.height,112,335,570,503);context.restore();}
        return;
      }
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
      if (modern) {
        const logo=await loadImage("/clinical/exam-v3/logo-horizontal.png");
        if(logo) drawImageContain(logo,42,30,322,84);
        context.fillStyle="#4b2118";context.textAlign="right";
        const title=(finalDocument.metadata.examName || "EXAME").toUpperCase();
        let size=23;context.font=`700 ${size}px Arial`;
        while(context.measureText(title).width>350 && size>12){size--;context.font=`700 ${size}px Arial`;}
        const titleLines=wrapCanvasText(context,title,350);
        titleLines.slice(0,2).forEach((line,index)=>context.fillText(line,752,53+index*18,350));
        context.font="10px Arial";context.fillText(page.type === "report" ? "Laudo de exame" : page.label,752,96,350);
        context.textAlign="left";context.font="8px Arial";
        context.fillText([finalDocument.metadata.patient.age ? `Idade: ${finalDocument.metadata.patient.age}` : "", finalDocument.metadata.patient.bloodType ? `Tipo sanguíneo: ${finalDocument.metadata.patient.bloodType}` : ""].filter(Boolean).join(" · "),42,116,710);
        context.strokeStyle="#89553c";context.lineWidth=.8;
        context.beginPath();context.moveTo(42,128);context.lineTo(752,128);context.stroke();
        context.fillStyle="#f5e7db";context.fillRect(42,145,710,58);
        const fields=[{x:54,w:326,label:"Nome do paciente",value:finalDocument.metadata.patient.name},
          {x:402,w:155,label:"Passaporte",value:finalDocument.metadata.patient.passport},
          {x:578,w:162,label:"Data do exame",value:formatDateBR(finalDocument.metadata.date)}];
        for(const field of fields){
          context.fillStyle="#542519";context.font="700 11px Arial";context.fillText(field.label,field.x,154);
          context.font="12px Arial";
          const lines=wrapCanvasText(context,field.value || "—",field.w);
          lines.slice(0,2).forEach((line,index)=>context.fillText(line,field.x,174+index*13,field.w));
        }
        if(finalDocument.metadata.time){context.font="9px Arial";context.fillText(`Horário: ${finalDocument.metadata.time}`,578,189,162);}
        context.strokeStyle="#ddc0ac";context.lineWidth=.6;
        for(const x of [390,566]){context.beginPath();context.moveTo(x,151);context.lineTo(x,197);context.stroke();}
        return;
      }
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
      if (modern) {
        const lastPage=pageIndex === finalDocument.pages.length-1;
        if(expanded ? signedReport : lastPage){
          const signature=finalDocument.metadata.signatureImage ? await loadImage(finalDocument.metadata.signatureImage) : null;
          if(finalDocument.metadata.signatureImage && !signature) throw new Error("Não foi possível carregar a assinatura preservada.");
          if(signature){const normalized=normalizeSignatureImage(signature);if(!normalized) throw new Error("Não foi possível preparar a assinatura preservada.");drawImageContain(normalized,267,964,260,50,true);}
          context.strokeStyle="#764531";context.lineWidth=.6;context.beginPath();context.moveTo(247,1018);context.lineTo(547,1018);context.stroke();
          context.fillStyle="#4b2118";context.textAlign="center";context.font="11px Arial";
          context.fillText(`Dr(a). ${finalDocument.metadata.doctor.name || "Nome do médico"}`,397,1027,650);
          context.font="9px Arial";context.fillText(`CRM: ${finalDocument.metadata.doctor.crm || "000000"}`,397,1042);
        }
        context.strokeStyle="#89553c";context.lineWidth=.8;context.beginPath();context.moveTo(42,1064);context.lineTo(752,1064);context.stroke();
        context.fillStyle="#6e4836";context.font="9px Arial";context.textAlign="left";
        context.fillText(lastPage ? "Hospital São Rafael · Documento médico" : "Hospital São Rafael · Continua na próxima página.",42,1080);
        context.textAlign="right";context.fillText(`Página ${pageIndex+1} de ${finalDocument.pages.length}`,752,1080);
        context.font="8px Arial";context.fillText(`Código: ${finalDocument.metadata.protocol || "—"}`,752,1096,350);context.textAlign="left";
        return;
      }
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
        if (expanded) renderClinicalBody(context, page.reportHtml || "", 42, EXAM_REPORT_BODY_TOP, 710, EXAM_REPORT_BODY_TOP + (signedReport ? EXAM_SIGNED_BODY_HEIGHT : EXAM_UNSIGNED_BODY_HEIGHT), "exam");
        else if (modern) renderV3Body(context, page.reportHtml || "", 42, 214, 710, 928, "exam");
        else if (finalDocument.contentRendererVersion === 2) renderHistoricalBody(context, page.reportHtml || "", 42, 214, 710, 928, "exam");
        else drawExamReportHtml(context, page.reportHtml || "", 42, 214, 710, 928);
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
  return measureClinicalBody(html, "exam");
}
