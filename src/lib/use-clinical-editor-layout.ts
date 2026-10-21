"use client";
import { useCallback, useEffect, useRef, type RefObject } from "react";

/** Round downward so fractional CSS zoom never produces horizontal overflow. */
export function clinicalEditorFitScale(availableWidth: number, contentWidth = 710) {
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) return 1;
  return Math.min(1, Math.floor(availableWidth / contentWidth * 10000) / 10000);
}

export function useClinicalEditorLayout(editorRef: RefObject<HTMLElement>, update: () => void, fitToWidth = true) {
  const callback=useRef(update);callback.current=update;
  const timer=useRef<ReturnType<typeof setTimeout> | null>(null);
  const observer=useRef<ResizeObserver | null>(null);
  const observed=useRef<Element | null>(null);
  const schedule=useCallback(()=>{
    if(timer.current) clearTimeout(timer.current);
    timer.current=setTimeout(()=>{
      const editor=editorRef.current;const parent=editor?.parentElement;
      if(editor && parent) {
        editor.style.setProperty("zoom",String(fitToWidth ? clinicalEditorFitScale(parent.clientWidth) : 1));
        if(typeof ResizeObserver!=="undefined" && observed.current!==parent) {
          observer.current?.disconnect();observed.current=parent;
          observer.current=new ResizeObserver(schedule);observer.current.observe(parent);
        }
      }
      callback.current();
    },120);
  },[editorRef,fitToWidth]);
  useEffect(()=>{
    schedule();window.addEventListener("resize",schedule);
    let active=true;void document.fonts?.ready.then(()=>{if(active)schedule();});
    return()=>{active=false;window.removeEventListener("resize",schedule);if(timer.current)clearTimeout(timer.current);observer.current?.disconnect();};
  },[schedule]);
  return schedule;
}
