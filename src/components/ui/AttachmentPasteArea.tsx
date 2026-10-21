"use client";

import { useEffect, useRef, useState } from "react";
import { clipboardAttachmentImages } from "@/lib/clipboard-attachments";

export function AttachmentPasteArea({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return <div
    tabIndex={0}
    aria-label="Colar imagens como anexos"
    onClick={event => event.currentTarget.focus()}
    onPaste={async event => {
      event.preventDefault();
      if (busy.current) return;
      busy.current = true;
      setMessage("Lendo imagem…");
      try {
        const files = await clipboardAttachmentImages(event.clipboardData);
        if (!mounted.current) return;
        if (files.length) { onFiles(files); setMessage(""); }
        else setMessage("Nenhuma imagem encontrada. Use ‘Copiar imagem’ e cole aqui, em vez de copiar somente o endereço.");
      } catch (error) {
        if (mounted.current) setMessage(error instanceof Error ? error.message : "Não foi possível colar a imagem.");
      } finally { busy.current = false; }
    }}
    className="cursor-pointer rounded-[12px] border border-dashed border-[#c79f85] bg-[#fff8ef] px-3 py-3 text-xs font-semibold text-hpsr-text outline-none focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wine/30"
  >
    <p className="font-black">Colar imagem como anexo</p>
    <p className="mt-1 text-hpsr-muted">Clique aqui e pressione Ctrl+V (ou ⌘V). Na internet, use “Copiar imagem”.</p>
    <p aria-live="polite" className="mt-1 text-hpsr-wine">{message}</p>
  </div>;
}
