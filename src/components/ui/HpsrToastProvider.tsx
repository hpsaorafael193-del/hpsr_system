"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ToastRequest = {
  title: string;
  message: string;
  duration?: number;
};

const EVENT_NAME = "hpsr-toast-request";

export function hpsrSuccess(message: string, title = "Salvo com sucesso") {
  if (typeof window === "undefined") return;
  const detail: ToastRequest = { title, message, duration: 3200 };
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function HpsrToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastRequest | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearTimer() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    function handleToast(event: Event) {
      const request = (event as CustomEvent<ToastRequest>).detail;
      clearTimer();
      setToast(request);
      timeoutRef.current = setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, request.duration ?? 3200);
    }

    window.addEventListener(EVENT_NAME, handleToast);
    return () => {
      window.removeEventListener(EVENT_NAME, handleToast);
      clearTimer();
    };
  }, []);

  return (
    <>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[210000] flex justify-center sm:inset-x-auto sm:bottom-5 sm:right-5 sm:justify-end" role="status" aria-live="polite">
          <div className="hpsr-modal-motion pointer-events-auto flex w-full max-w-[390px] items-start gap-3 rounded-[18px] border border-emerald-200/90 bg-white px-4 py-3.5 shadow-[0_18px_55px_rgba(27,10,7,.18)]">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-hpsr-text">{toast.title}</p>
              <p className="mt-0.5 text-xs font-semibold leading-relaxed text-hpsr-muted">{toast.message}</p>
            </div>
            <button type="button" onClick={() => setToast(null)} aria-label="Fechar aviso" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] text-hpsr-muted transition hover:bg-hpsr-panel hover:text-hpsr-text">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
