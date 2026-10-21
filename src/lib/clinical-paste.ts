/** Clipboard HTML retains text formatting, never the source site's backgrounds. */
export function normalizeClinicalPasteHtml(html: string): string {
  const root = document.createElement("div");
  root.innerHTML = html;
  root.querySelectorAll("script,style,link,meta,iframe,object,embed,svg,canvas,img,input,button,textarea,select").forEach(node => node.remove());
  const allowedStyles = new Set(["color", "font-size", "font-family", "font-weight", "font-style", "text-decoration", "text-decoration-line", "text-align", "vertical-align"]);
  const allowedTags = new Set(["P", "DIV", "SPAN", "BR", "B", "STRONG", "I", "EM", "U", "S", "SUB", "SUP", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TD", "TH", "BLOCKQUOTE", "FONT", "A", "HR"]);
  for (const element of Array.from(root.querySelectorAll("*")) as HTMLElement[]) {
    // MARK carries a browser-defined background even without an inline style.
    if (element.tagName === "MARK") {
      const span = document.createElement("span");
      span.style.cssText = element.style.cssText;
      span.append(...Array.from(element.childNodes));
      element.replaceWith(span);
    }
  }
  for (const element of Array.from(root.querySelectorAll("*")) as HTMLElement[]) {
    for (const property of Array.from(element.style)) if (!allowedStyles.has(property)) element.style.removeProperty(property);
    for (const name of ["color", "font-size", "font-family"]) {
      const value = element.style.getPropertyValue(name);
      if (/^(?:inherit|initial|unset|revert(?:-layer)?|currentcolor)$/i.test(value) || /\bvar\s*\(/i.test(value)) element.style.removeProperty(name);
    }
    for (const attribute of Array.from(element.attributes)) {
      if (!["style", "colspan", "rowspan", "align", "start", "value", "size", "color", "href"].includes(attribute.name)) element.removeAttribute(attribute.name);
    }
    if (element.hasAttribute("href") && !/^(?:https?:|mailto:|#)/i.test(element.getAttribute("href") || "")) element.removeAttribute("href");
    if (!allowedTags.has(element.tagName)) element.replaceWith(...Array.from(element.childNodes));
    else if (element.tagName === "TABLE") element.classList.add("hpsr-exam-table");
  }
  return root.innerHTML;
}
