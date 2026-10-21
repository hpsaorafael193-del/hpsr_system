import { EXAM_SECTION_GAP } from "./exam-report-layout";
import { backgroundCanvasColor, textCanvasColor } from "./canvas-color";
import { drawRichTextElement, measureRichTextElement } from "./rich-text-canvas";

export type ClinicalBodyKind = "exam" | "document";
export const CLINICAL_BODY_WIDTH = 710;
export const CLINICAL_BODY_CAPACITY = { exam: 714, document: 825 };
let measurementContext: CanvasRenderingContext2D | null = null;

/** The same layout is used for fitting and painting. Institutional chrome is separate. */
export function renderClinicalBody(context: CanvasRenderingContext2D, html: string, x: number, y: number, width: number, maxY: number, kind: ClinicalBodyKind, measureOnly = false, includeLeadingGap = false): number {
  const startY = y;
  const root = document.createElement("div");
  root.innerHTML = html;
  const font = kind === "exam" ? "Arial, sans-serif" : "Georgia, 'Times New Roman', serif";
  const base = kind === "exam" ? 12 : 11.4;
  const line = kind === "exam" ? 16.5 : 15.5;
  const paintText = (element: Element, left: number, top: number, available: number, options: Parameters<typeof drawRichTextElement>[6]) => {
    const height = measureRichTextElement(context, element, available, options);
    if (top + height > maxY + .01) throw new Error("O conteúdo ultrapassa a área útil da folha. Atualize a pré-visualização.");
    if (!measureOnly) drawRichTextElement(context, element, left, top, available, maxY, options);
    return top + height;
  };
  for (const block of Array.from(root.children) as HTMLElement[]) {
    const tag = block.tagName.toLowerCase();
    if (["div", "section", "article"].includes(tag) && Array.from(block.children).some(child => /^(P|DIV|SECTION|ARTICLE|H[1-3]|TABLE|UL|OL)$/.test(child.tagName))) {
      for (const child of Array.from(block.children) as HTMLElement[]) {
        for (const property of ["color", "background-color", "font-family", "font-size", "font-weight", "font-style", "text-align"])
          if (!child.style.getPropertyValue(property) && block.style.getPropertyValue(property)) child.style.setProperty(property, block.style.getPropertyValue(property));
      }
      y = renderClinicalBody(context, block.innerHTML, x, y, width, maxY, kind, measureOnly, includeLeadingGap || y > startY);
      continue;
    }
    if (tag === "table") {
      const rows = Array.from(block.querySelectorAll("tr"));
      const modern = kind === "exam";
      const cols = Math.max(1, ...rows.map(row => Array.from(row.children).reduce((sum, cell) => sum + Number(cell.getAttribute("colspan") || 1), 0)));
      const tableWidth = modern ? width : Math.min(width * .78, 500);
      const cellWidth = tableWidth / cols;
      const left = x + (width-tableWidth)/2;
      for (const row of rows) {
        const cells = Array.from(row.children) as HTMLElement[];
        let column = 0;
        const bounds = cells.map(cell => {
          const span = Math.min(cols-column, Math.max(1,Number(cell.getAttribute("colspan") || 1)));
          const unitWidth = (index: number) => modern && cols > 1 ? tableWidth*(index === 0 ? .36 : .64/(cols-1)) : cellWidth;
          const cellLeft = left + Array.from({length:column},(_,i)=>unitWidth(i)).reduce((a,b)=>a+b,0);
          const cellSize = Array.from({length:span},(_,i)=>unitWidth(column+i)).reduce((a,b)=>a+b,0);
          column += span;return {left:cellLeft,width:cellSize};
        });
        const group = row.hasAttribute("data-hpsr-table-group");
        const options = cells.map(cell => ({ baseFontSize: kind === "exam" ? 11 : 10, fontFamily: font, lineHeight: kind === "exam" ? 13 : 11, color: "#4b2118", bold: cell.tagName === "TH" || group, textAlign: modern && (group || cell === cells[0]) ? "left" as const : "center" as const }));
        const heights = cells.map((cell,index) => measureRichTextElement(context,cell,bounds[index].width-12,options[index]));
        const height = Math.max(modern ? 25 : 20, ...heights.map(value => value+8));
        if (y+height > maxY+.01) throw new Error("Uma linha de tabela não cabe na folha. Divida o texto dessa linha em linhas menores ou reduza a fonte.");
        cells.forEach((cell,index) => {
          if (!measureOnly) {
            const background = backgroundCanvasColor(cell.style.backgroundColor || (row as HTMLElement).style.backgroundColor || block.style.backgroundColor || (modern && group ? "#f4e5d8" : ""));
            if (background) { context.fillStyle=background; context.fillRect(bounds[index].left,y,bounds[index].width,height); }
            context.strokeStyle="rgba(91,24,9,.18)"; context.lineWidth=.9;
            if (modern) { context.beginPath();context.moveTo(bounds[index].left,y+height);context.lineTo(bounds[index].left+bounds[index].width,y+height);context.stroke(); }
            else context.strokeRect(bounds[index].left,y,bounds[index].width,height);
          }
          paintText(cell,bounds[index].left+6,y+Math.max(4,(height-heights[index])/2),bounds[index].width-12,options[index]);
        });
        y+=height;
      }
      y+=10;
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(block.children).filter(child=>child.tagName === "LI");
      let number = Number(block.getAttribute("start") || 1);
      for (const item of items) {
        if (item.hasAttribute("value")) number=Number(item.getAttribute("value"));
        if (!measureOnly) { context.font=`${base}px ${font}`; context.fillStyle=textCanvasColor(block.style.color, "#4b2118"); context.fillText(tag === "ol" ? `${number}.` : "•",x+2,y); }
        y=paintText(item,x+24,y,width-24,{baseFontSize:base,fontFamily:font,lineHeight:line,color:textCanvasColor(block.style.color, "#4b2118")});
        number++;
      }
      y+=6;
      continue;
    }
    if (tag === "hr") { if (!measureOnly) { context.beginPath();context.moveTo(x,y+4);context.lineTo(x+width,y+4);context.stroke(); } y+=10;continue; }
    const heading=/^h[1-3]$/.test(tag);
    if (heading && kind === "exam" && (includeLeadingGap || y > startY)) y += EXAM_SECTION_GAP;
    // A source-owned decoration survives snapshots; ordinary/custom headings stay neutral.
    if (heading && kind !== "exam" && block.hasAttribute("data-hpsr-section-heading") && !measureOnly) {
      const height = measureRichTextElement(context, block, width, {baseFontSize:11.5,fontFamily:"Arial, sans-serif",lineHeight:16,bold:true,color:"#4b2118"});
      context.fillStyle="#f8f1eb";context.fillRect(x,y,width,height);
      context.fillStyle="#d9b9a4";context.fillRect(x,y+height-1,width,1);
    }
    const size=heading ? (kind === "exam" ? (tag === "h1" ? 17 : 15) : (tag === "h1" ? 13 : 11.5)) : base;
    if (heading && kind === "exam") {
      const height = measureRichTextElement(context, block, width,{baseFontSize:size,fontFamily:"Arial, sans-serif",lineHeight:20,bold:true});
      if (!measureOnly) { context.strokeStyle="#a07863";context.lineWidth=.6;context.beginPath();context.moveTo(x,y+height);context.lineTo(x+width,y+height);context.stroke(); }
    }
    const panel = kind === "exam" && block.hasAttribute("data-hpsr-narrative-panel");
    if (panel) {
      const options={baseFontSize:base,fontFamily:font,lineHeight:line,color:"#4b2118"};
      const height=measureRichTextElement(context,block,width-20,options);
      if (!measureOnly) {context.fillStyle="#f7ebe0";context.fillRect(x,y,width,height+16);}
      y=paintText(block,x+10,y+8,width-20,options)+13;
      continue;
    }
    y=paintText(block,x,y,width,{baseFontSize:size,fontFamily:heading ? "Arial, sans-serif" : font,lineHeight:heading ? (kind === "exam" ? 20 : 16) : line,bold:heading,color:"#4b2118"})+(heading ? 6 : 5);
  }
  return y;
}

export function measureClinicalBody(html: string, kind: ClinicalBodyKind): number | null {
  if (typeof document === "undefined") return null;
  measurementContext ||= document.createElement("canvas").getContext("2d");
  return measurementContext ? renderClinicalBody(measurementContext,html,0,0,CLINICAL_BODY_WIDTH,Infinity,kind,true) : null;
}
