"use client";
import { useEffect, useRef, useState } from "react";

/** Ephemeral PNG: preview and download share one URL; never persisted. */
export function useVirtualPngPreview(enabled: boolean, snapshot: unknown, pageIndex: number, render: () => Promise<Blob | null | undefined>) {
  const renderRef = useRef(render); renderRef.current = render;
  const [result, setResult] = useState<{ snapshot: unknown; pageIndex: number; url: string; error: string } | null>(null);
  useEffect(() => {
    if (!enabled) { setResult(null); return; }
    let active = true; let url = "";
    setResult(null);
    void (async () => {
      try {
        const blob = await renderRef.current();
        if (!blob) throw new Error("Não foi possível gerar a página em PNG.");
        if (!active) return;
        url = URL.createObjectURL(blob);
        setResult({ snapshot, pageIndex, url, error: "" });
      } catch (error) {
        if (active) setResult({ snapshot, pageIndex, url: "", error: error instanceof Error ? error.message : "Não foi possível gerar a página." });
      }
    })();
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [enabled, snapshot, pageIndex]);
  const current = enabled && result && result.snapshot === snapshot && result.pageIndex === pageIndex ? result : null;
  return { url: current?.url || "", error: current?.error || "" };
}
