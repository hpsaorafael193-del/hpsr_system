"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, X } from "lucide-react";

type DialogKind = "alert" | "confirm" | "prompt";
type DialogRequest =
  | {
      kind: "alert";
      title: string;
      message: string;
      resolve: () => void;
    }
  | {
      kind: "confirm";
      title: string;
      message: string;
      resolve: (value: boolean) => void;
    }
  | {
      kind: "prompt";
      title: string;
      message: string;
      defaultValue?: string;
      resolve: (value: string | null) => void;
    };

type DialogApi = {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
};

const DialogContext = createContext<DialogApi | null>(null);
const EVENT_NAME = "hpsr-dialog-request";

function requestAlert(message: string, title: string) {
  return new Promise<void>((resolve) => {
    const detail: DialogRequest = { kind: "alert", message, title, resolve };
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  });
}

function requestConfirm(message: string, title: string) {
  return new Promise<boolean>((resolve) => {
    const detail: DialogRequest = { kind: "confirm", message, title, resolve };
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  });
}

function requestPrompt(message: string, title: string, defaultValue: string) {
  return new Promise<string | null>((resolve) => {
    const detail: DialogRequest = { kind: "prompt", message, title, defaultValue, resolve };
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  });
}

export async function hpsrAlert(message: string, title = "Atenção") {
  await requestAlert(message, title);
}

export async function hpsrConfirm(message: string, title = "Confirmação") {
  return requestConfirm(message, title);
}

export async function hpsrPrompt(message: string, defaultValue = "", title = "Informe os dados") {
  return requestPrompt(message, title, defaultValue);
}


export function HpsrDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [value, setValue] = useState("");

  const alert = useCallback((message: string, title = "Atenção") => new Promise<void>((resolve) => {
    setValue("");
    setDialog({ kind: "alert", title, message, resolve: () => resolve() });
  }), []);

  const confirm = useCallback((message: string, title = "Confirmação") => new Promise<boolean>((resolve) => {
    setValue("");
    setDialog({ kind: "confirm", title, message, resolve });
  }), []);

  const prompt = useCallback((message: string, defaultValue = "", title = "Informe os dados") => new Promise<string | null>((resolve) => {
    setValue(defaultValue);
    setDialog({ kind: "prompt", title, message, defaultValue, resolve });
  }), []);

  const api = useMemo(() => ({ alert, confirm, prompt }), [alert, confirm, prompt]);

  useEffect(() => {
    function handleRequest(event: Event) {
      const request = (event as CustomEvent<DialogRequest>).detail;
      setValue(request.kind === "prompt" ? request.defaultValue || "" : "");
      setDialog(request);
    }
    window.addEventListener(EVENT_NAME, handleRequest);
    return () => window.removeEventListener(EVENT_NAME, handleRequest);
  }, []);

  function close(result: boolean | string | null) {
    if (!dialog) return;
    if (dialog.kind === "alert") dialog.resolve();
    else if (dialog.kind === "confirm") dialog.resolve(Boolean(result));
    else dialog.resolve(typeof result === "string" ? result : null);
    setDialog(null);
  }

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[200000] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3">
          <button type="button" aria-label="Fechar" onClick={() => close(dialog.kind === "confirm" ? false : null)} className="fixed inset-0 bg-[#1f0805]/68 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-[22px] border border-white/55 bg-[#fcf6ee] shadow-[0_32px_100px_rgba(27,10,7,.42)]">
            <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f7eadc_55%,#f2e3d0_100%)] px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-hpsr-wine text-white">
                    {dialog.kind === "alert" ? <AlertTriangle size={20} /> : dialog.kind === "confirm" ? <HelpCircle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Hospital São Rafael</p><h2 className="mt-1 text-xl font-black text-hpsr-text">{dialog.title}</h2></div>
                </div>
                <button type="button" onClick={() => close(dialog.kind === "confirm" ? false : null)} className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-hpsr-border bg-white text-hpsr-wine"><X size={18} /></button>
              </div>
            </div>
            <div className="p-5 md:p-6">
              <p className="text-sm font-semibold leading-relaxed text-hpsr-muted">{dialog.message}</p>
              {dialog.kind === "prompt" && <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") close(value.trim()); }} className="mt-4 h-12 w-full rounded-[18px] border border-hpsr-border bg-white px-4 text-sm font-semibold text-hpsr-text outline-none focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20" />}
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                {dialog.kind !== "alert" && <button type="button" onClick={() => close(dialog.kind === "confirm" ? false : null)} className="rounded-[16px] border border-hpsr-border bg-white px-4 py-2.5 text-sm font-black text-hpsr-text">Cancelar</button>}
                <button type="button" onClick={() => close(dialog.kind === "prompt" ? value.trim() : true)} className="rounded-[16px] bg-hpsr-wine px-4 py-2.5 text-sm font-black text-white hover:bg-hpsr-wineDark">{dialog.kind === "alert" ? "Entendi" : "Confirmar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useHpsrDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useHpsrDialog deve ser usado dentro de HpsrDialogProvider.");
  return context;
}
