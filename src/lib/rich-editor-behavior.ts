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

  // An empty paragraph is a spacer, not an instruction to delete table data.
  const paragraph = startElement.closest<HTMLElement>("p,div");
  if (paragraph && paragraph !== editor && editor.contains(paragraph)
      && !(paragraph.textContent || "").replace(/\u00a0/g, " ").trim()
      && !paragraph.querySelector("table,img,hr")) {
    const previous = paragraph.previousElementSibling;
    const next = paragraph.nextElementSibling;
    const target = event.key === "Backspace" ? previous || next : next || previous;
    if (target) {
      event.preventDefault();
      paragraph.remove();
      const caret = document.createRange();
      const anchor = target.tagName === "TABLE"
        ? (event.key === "Backspace" ? target.querySelector("tr:last-child td:last-child, tr:last-child th:last-child") : target.querySelector("td,th")) || target
        : target;
      caret.selectNodeContents(anchor);
      caret.collapse(event.key !== "Backspace");
      selection.removeAllRanges();
      selection.addRange(caret);
      onChanged();
      return true;
    }
  }

  return false;
}
