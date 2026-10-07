"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** High contrast overlay only while editing; never part of the report HTML. */
export function ExamEditorCaret() {
  const [position, setPosition] = useState<{ left: number; top: number; height: number } | null>(null);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const editor = document.activeElement;
      const selection = window.getSelection();
      if (!(editor instanceof HTMLElement) || !editor.matches(":is(.hpsr-exams-page, .hpsr-documents-page) .hpsr-continuous-editor") || !selection?.isCollapsed || !selection.rangeCount) {
        setPosition(null); return;
      }
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.startContainer)) { setPosition(null); return; }
      let rect: DOMRect | undefined = range.getClientRects()[0];
      let left: number | undefined = rect?.left;
      if (!rect?.height && range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
        const previous = range.cloneRange(); previous.setStart(range.startContainer, range.startOffset - 1);
        rect = previous.getClientRects()[0]; left = rect?.right;
      }
      if (!rect?.height) {
        const element = range.startContainer instanceof HTMLElement ? range.startContainer : range.startContainer.parentElement;
        rect = element?.getClientRects()[0]; left = rect?.left;
      }
      if (!rect || left === undefined) { setPosition(null); return; }
      const bounds = (editor.closest(".hpsr-exams-editor-viewport, .hpsr-documents-editor-viewport") || editor).getBoundingClientRect();
      if (rect.top < bounds.top || rect.top > bounds.bottom) { setPosition(null); return; }
      setPosition({ left, top: rect.top, height: Math.min(rect.height, parseFloat(getComputedStyle(editor).lineHeight) || 24) });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    for (const name of ["selectionchange", "input", "focusin", "focusout", "scroll"]) document.addEventListener(name, schedule, true);
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const name of ["selectionchange", "input", "focusin", "focusout", "scroll"]) document.removeEventListener(name, schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return position ? createPortal(<span aria-hidden="true" className="no-print" style={{ position: "fixed", ...position, width: 3, background: "white", mixBlendMode: "difference", pointerEvents: "none", zIndex: 100 }} />, document.body) : null;
}
