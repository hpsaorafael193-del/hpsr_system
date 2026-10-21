import { textCanvasColor, backgroundCanvasColor } from "./canvas-color";
export type RichTextStyle = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  backgroundColor: string | null;
  fontSize: number;
  fontFamily: string;
};

type RichRun = RichTextStyle & { text: string };

type DrawOptions = {
  baseFontSize?: number;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right" | "justify";
};

const FONT_SIZE_MAP: Record<string, number> = { "1": 10, "2": 12, "3": 14, "4": 16, "5": 18, "6": 24, "7": 32 };

function parsePx(value: string | null | undefined) {
  const match = String(value || "").match(/(-?\d+(?:\.\d+)?)px/i);
  return match ? Number(match[1]) : null;
}

function inheritedStyle(element: Element, parent: RichTextStyle): RichTextStyle {
  const tag = element.tagName.toLowerCase();
  const html = element as HTMLElement;
  const style = html.style;
  const fontElement = tag === "font" ? (element as HTMLFontElement) : null;
  const fontWeight = String(style.fontWeight || "").toLowerCase();
  const fontStyle = String(style.fontStyle || "").toLowerCase();
  const decoration = String(style.textDecoration || style.textDecorationLine || "").toLowerCase();
  const parsedSize = parsePx(style.fontSize);
  const legacySize = fontElement?.getAttribute("size") || "";

  return {
    bold: fontWeight === "normal" || fontWeight === "400" ? false :
      parent.bold ||
      tag === "b" ||
      tag === "strong" ||
      fontWeight === "bold" ||
      (Number.parseInt(fontWeight, 10) || 0) >= 600,
    italic: fontStyle === "normal" ? false : parent.italic || tag === "i" || tag === "em" || fontStyle === "italic" || fontStyle === "oblique",
    underline: decoration === "none" ? false : parent.underline || tag === "u" || decoration.includes("underline"),
    color: textCanvasColor(style.color || fontElement?.getAttribute("color"), parent.color),
    backgroundColor: backgroundCanvasColor(style.backgroundColor, parent.backgroundColor, textCanvasColor(style.color || fontElement?.getAttribute("color"), parent.color)),
    fontSize: parsedSize || FONT_SIZE_MAP[legacySize] || parent.fontSize,
    fontFamily: style.fontFamily || parent.fontFamily,
  };
}

function collectRuns(node: Node, style: RichTextStyle, output: RichRun[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    if (text) output.push({ ...style, text });
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node as Element;
  if (element.tagName.toLowerCase() === "br") {
    output.push({ ...style, text: "\n" });
    return;
  }
  const nextStyle = inheritedStyle(element, style);
  Array.from(element.childNodes).forEach((child, index) => {
    if (child.nodeType === Node.ELEMENT_NODE && /^(P|DIV|SECTION|ARTICLE|LI)$/.test((child as Element).tagName) && index > 0 && output.length && !output[output.length-1].text.endsWith("\n")) output.push({ ...nextStyle, text: "\n" });
    collectRuns(child, nextStyle, output);
  });
}

function canvasFont(style: RichTextStyle) {
  const prefix = `${style.italic ? "italic " : ""}${style.bold ? "700 " : "400 "}`;
  return `${prefix}${style.fontSize}px ${style.fontFamily}`;
}

function splitRunTokens(run: RichRun) {
  const parts = run.text.split(/(\n|\s+)/).filter((part) => part.length > 0);
  return parts.map((text) => ({ ...run, text }));
}

type PositionedToken = RichRun & { width: number };

type Line = { tokens: PositionedToken[]; width: number; height: number };

function layoutRuns(
  context: CanvasRenderingContext2D,
  runs: RichRun[],
  maxWidth: number,
  defaultLineHeight: number,
) {
  const lines: Line[] = [];
  let line: Line = { tokens: [], width: 0, height: defaultLineHeight };

  const commit = () => {
    lines.push(line);
    line = { tokens: [], width: 0, height: defaultLineHeight };
  };

  for (const run of runs) {
    for (const token of splitRunTokens(run).flatMap(token => {
      context.font=canvasFont(token);
      if (/^\s+$/.test(token.text) || context.measureText(token.text).width<=maxWidth) return [token];
      const parts: RichRun[]=[];let text="";
      for(const char of Array.from(token.text)) {
        if(text && context.measureText(text+char).width>maxWidth){parts.push({...token,text});text="";}
        text+=char;
      }
      if(text)parts.push({...token,text});return parts;
    })) {
      if (token.text === "\n") {
        commit();
        continue;
      }
      context.font = canvasFont(token);
      const isWhitespace = /^\s+$/.test(token.text);
      const normalizedText = isWhitespace ? " " : token.text;
      const width = context.measureText(normalizedText).width;
      const tokenHeight = Math.max(defaultLineHeight, token.fontSize * 1.34);

      if (!isWhitespace && line.tokens.length && line.width + width > maxWidth) commit();
      if (isWhitespace && !line.tokens.length) continue;

      line.tokens.push({ ...token, text: normalizedText, width });
      line.width += width;
      line.height = Math.max(line.height, tokenHeight);
    }
  }
  if (line.tokens.length || !lines.length) lines.push(line);
  return lines;
}

function blockAlignment(element: Element, fallback: "left" | "center" | "right" | "justify") {
  const html = element as HTMLElement;
  const align = (html.style.textAlign || element.getAttribute("align") || "").toLowerCase();
  if (align === "center" || align === "right" || align === "left" || align === "justify") return align;
  return fallback;
}

export function measureRichTextElement(
  context: CanvasRenderingContext2D,
  element: Element,
  maxWidth: number,
  options: DrawOptions = {},
) {
  const base: RichTextStyle = {
    bold: options.bold || false,
    italic: options.italic || false,
    underline: options.underline || false,
    color: textCanvasColor(options.color, "#3f231c"),
    backgroundColor: null,
    fontSize: options.baseFontSize || 11.4,
    fontFamily: options.fontFamily || "Georgia, 'Times New Roman', serif",
  };
  const runs: RichRun[] = [];
  collectRuns(element, base, runs);
  const lines = layoutRuns(context, runs, maxWidth, options.lineHeight || 15.5);
  return lines.reduce((sum, line) => sum + line.height, 0);
}

export function drawRichTextElement(
  context: CanvasRenderingContext2D,
  element: Element,
  x: number,
  y: number,
  maxWidth: number,
  maxY: number,
  options: DrawOptions = {},
) {
  const base: RichTextStyle = {
    bold: options.bold || false,
    italic: options.italic || false,
    underline: options.underline || false,
    color: textCanvasColor(options.color, "#3f231c"),
    backgroundColor: null,
    fontSize: options.baseFontSize || 11.4,
    fontFamily: options.fontFamily || "Georgia, 'Times New Roman', serif",
  };
  const runs: RichRun[] = [];
  collectRuns(element, base, runs);
  const defaultLineHeight = options.lineHeight || 15.5;
  const lines = layoutRuns(context, runs, maxWidth, defaultLineHeight);
  const align = blockAlignment(element, options.textAlign || "left");

  context.save();
  context.textBaseline = "top";
  for (const [lineIndex, line] of lines.entries()) {
    if (y + line.height > maxY) break;
    let cursorX = x;
    if (align === "center") cursorX = x + Math.max(0, (maxWidth - line.width) / 2);
    if (align === "right") cursorX = x + Math.max(0, maxWidth - line.width);

    const spaces = line.tokens.filter(token => /^\s+$/.test(token.text)).length;
    const extraSpace = align === "justify" && lineIndex < lines.length-1 && spaces ? Math.max(0, maxWidth-line.width)/spaces : 0;
    for (const token of line.tokens) {
      context.font = canvasFont(token);
      const drawY = y + Math.max(0, (line.height - token.fontSize * 1.2) / 2);
      if (token.backgroundColor) {
        context.fillStyle = token.backgroundColor;
        context.fillRect(cursorX, y, token.width, line.height);
      }
      context.fillStyle = token.color;
      context.fillText(token.text, cursorX, drawY);
      if (token.underline && token.text.trim()) {
        const underlineY = Math.min(y + line.height - 1.5, drawY + token.fontSize + 1);
        context.strokeStyle = token.color;
        context.lineWidth = Math.max(0.7, token.fontSize / 13);
        context.beginPath();
        context.moveTo(cursorX, underlineY);
        context.lineTo(cursorX + token.width, underlineY);
        context.stroke();
      }
      cursorX += token.width + (/^\s+$/.test(token.text) ? extraSpace : 0);
    }
    y += line.height;
  }
  context.restore();
  return y;
}
