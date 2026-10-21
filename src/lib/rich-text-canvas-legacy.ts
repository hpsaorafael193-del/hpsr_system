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
  textAlign?: "left" | "center" | "right";
};

const FONT_SIZE_MAP: Record<string, number> = {
  "1": 8.5,
  "2": 10,
  "3": 11.4,
  "4": 13,
  "5": 15,
  "6": 19,
  "7": 24,
};

function cssColor(value: string | null | undefined, fallback: string) {
  const trimmed = String(value || "").trim();
  return trimmed && trimmed !== "transparent" && trimmed !== "rgba(0, 0, 0, 0)" ? trimmed : fallback;
}

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
    bold:
      parent.bold ||
      tag === "b" ||
      tag === "strong" ||
      fontWeight === "bold" ||
      (Number.parseInt(fontWeight, 10) || 0) >= 600,
    italic: parent.italic || tag === "i" || tag === "em" || fontStyle === "italic" || fontStyle === "oblique",
    underline: parent.underline || tag === "u" || decoration.includes("underline"),
    color: cssColor(style.color || fontElement?.getAttribute("color"), parent.color),
    backgroundColor: cssColor(style.backgroundColor, parent.backgroundColor || "transparent") === "transparent"
      ? parent.backgroundColor
      : cssColor(style.backgroundColor, parent.backgroundColor || "transparent"),
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
  Array.from(element.childNodes).forEach((child) => collectRuns(child, nextStyle, output));
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
    for (const token of splitRunTokens(run)) {
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

function blockAlignment(element: Element, fallback: "left" | "center" | "right") {
  const html = element as HTMLElement;
  const align = (html.style.textAlign || element.getAttribute("align") || "").toLowerCase();
  if (align === "center" || align === "right" || align === "left") return align;
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
    color: options.color || "#3f231c",
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
    color: options.color || "#3f231c",
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
  for (const line of lines) {
    if (y + line.height > maxY) break;
    let cursorX = x;
    if (align === "center") cursorX = x + Math.max(0, (maxWidth - line.width) / 2);
    if (align === "right") cursorX = x + Math.max(0, maxWidth - line.width);

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
      cursorX += token.width;
    }
    y += line.height;
  }
  context.restore();
  return y;
}
