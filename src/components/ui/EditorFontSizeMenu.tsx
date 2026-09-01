"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Type } from "lucide-react";

const FONT_SIZES = [
  { value: "1", label: "10 px", preview: 10 },
  { value: "2", label: "12 px", preview: 11 },
  { value: "3", label: "14 px", preview: 12 },
  { value: "4", label: "16 px", preview: 13 },
  { value: "5", label: "18 px", preview: 14 },
  { value: "6", label: "24 px", preview: 15 },
  { value: "7", label: "32 px", preview: 16 },
];

type EditorFontSizeMenuProps = {
  onChange: (value: string) => void;
  defaultValue?: string;
};

export function EditorFontSizeMenu({ onChange, defaultValue = "3" }: EditorFontSizeMenuProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = FONT_SIZES.find((item) => item.value === value) || FONT_SIZES[2];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function choose(next: string) {
    setValue(next);
    setOpen(false);
    onChange(next);
  }

  return (
    <div ref={rootRef} className="relative w-[124px] shrink-0">
      <button
        type="button"
        aria-label="Tamanho da fonte"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Tamanho da fonte"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-9 w-full items-center rounded-[11px] border bg-white text-hpsr-text shadow-[0_2px_8px_rgba(42,7,0,0.02)] transition ${open ? "border-hpsr-wine/50 ring-2 ring-hpsr-wine/10" : "border-[#e0c7b2] hover:border-hpsr-wine/35"}`}
      >
        <span className="ml-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[#f7efe8] text-hpsr-wine">
          <Type size={13} />
        </span>
        <span className="min-w-0 flex-1 px-2 text-left text-[13px] font-black tabular-nums">{selected.label}</span>
        <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[#fff8f2] text-hpsr-muted">
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Opções de tamanho da fonte"
          className="absolute left-0 top-[43px] z-[80] w-[124px] overflow-hidden rounded-[13px] border border-[#dcc8b7] bg-white p-1.5 shadow-[0_16px_36px_rgba(55,22,10,0.18)] ring-1 ring-white"
        >
          <div className="mb-1 border-b border-[#eee4dc] px-2 pb-1.5 pt-0.5">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-muted">Tamanho</p>
          </div>
          <div className="space-y-0.5">
            {FONT_SIZES.map((item) => {
              const active = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item.value)}
                  className={`flex h-8 w-full items-center rounded-[9px] px-2 text-left transition ${active ? "bg-hpsr-wine text-white" : "text-hpsr-text hover:bg-[#fff3e9]"}`}
                >
                  <span
                    className={`flex h-5 w-6 shrink-0 items-center justify-center font-serif font-bold ${active ? "text-white/90" : "text-hpsr-wine"}`}
                    style={{ fontSize: item.preview }}
                  >
                    A
                  </span>
                  <span className="min-w-0 flex-1 pl-1 text-[12px] font-black tabular-nums">{item.label}</span>
                  {active && <Check size={13} className="shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
