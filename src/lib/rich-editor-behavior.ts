import type { KeyboardEvent } from "react";

export function handleRichEditorTableKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  editor: HTMLDivElement | null,
  onChanged: () => void,
) {
  if (!editor || (event.key !== "Backspace" && event.key !== "Delete")) return false;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer)) return false;

  const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? (range.startContainer as HTMLElement)
    : range.startContainer.parentElement;
  if (!startElement) return false;

  const cell = startElement.closest<HTMLElement>("td,th");
  if (cell) {
    const row = cell.closest<HTMLTableRowElement>("tr");
    const table = cell.closest<HTMLTableElement>("table");
    if (!row || !table) return false;
    const rowText = (row.textContent || "").replace(/\u00a0/g, " ").trim();
    const isEmptyRow = rowText.length === 0;
    if (!isEmptyRow) return false;

    const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
    if (bodyRows.length <= 1) return false;
    event.preventDefault();
    const fallback = row.previousElementSibling || row.nextElementSibling;
    row.remove();
    if (fallback) {
      const target = fallback.querySelector("td,th") || fallback;
      const nextRange = document.createRange();
      nextRange.selectNodeContents(target);
      nextRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    }
    onChanged();
    return true;
  }

  if (event.key === "Backspace") {
    const paragraph = startElement.closest<HTMLElement>("p,div");
    if (!paragraph || paragraph.parentElement !== editor) return false;
    const paragraphText = (paragraph.textContent || "").replace(/\u00a0/g, " ").trim();
    const isCaretAtStart = range.startOffset === 0 && paragraphText.length === 0;
    const previous = paragraph.previousElementSibling;
    if (!isCaretAtStart || previous?.tagName.toLowerCase() !== "table") return false;
    const rows = Array.from(previous.querySelectorAll("tbody tr"));
    if (rows.length <= 1) return false;
    event.preventDefault();
    rows[rows.length - 1].remove();
    onChanged();
    return true;
  }

  return false;
}
