/** Canvas cannot resolve CSS inheritance, theme variables or unsupported colors.
 * Validate independently so rejected assignments never reuse a previous paint. */
let probe: CanvasRenderingContext2D | null = null;
const colors = new Map<string, string | null>();

export function concreteCanvasColor(value: string | null | undefined): string | null {
  const text = String(value || "").trim();
  if (!text || /^(?:inherit|initial|unset|revert(?:-layer)?|currentcolor)$/i.test(text) || /\bvar\s*\(/i.test(text)) return null;
  if (colors.has(text)) return colors.get(text) || null;
  if (typeof document === "undefined") return null;
  probe ||= document.createElement("canvas").getContext("2d");
  if (!probe) return null;
  probe.fillStyle = "#010203";
  probe.fillStyle = text;
  const first = String(probe.fillStyle);
  probe.fillStyle = "#040506";
  probe.fillStyle = text;
  const result = first === String(probe.fillStyle) ? first : null;
  if (colors.size >= 256) colors.clear();
  colors.set(text, result);
  return result;
}

export function textCanvasColor(value: string | null | undefined, fallback: string): string {
  return concreteCanvasColor(value) || concreteCanvasColor(fallback) || "#4b2118";
}

export function backgroundCanvasColor(value: string | null | undefined, parent: string | null = null, textColor = "#4b2118"): string | null {
  const text = String(value || "").trim();
  if (!text || /^inherit$/i.test(text)) return parent;
  if (/^(?:initial|unset|revert(?:-layer)?|transparent)$/i.test(text) || /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/i.test(text)) return null;
  if (/^currentcolor$/i.test(text)) return textCanvasColor(textColor, "#4b2118");
  return concreteCanvasColor(text);
}
