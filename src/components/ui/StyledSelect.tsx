"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type OptionProps = {
  value?: string | number;
  disabled?: boolean;
  children?: ReactNode;
};

type StyledSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size" | "multiple"> & {
  onChange?: (event: { target: { value: string; name?: string } }) => void;
  searchable?: boolean;
  emptyText?: string;
};

type ParsedOption = {
  value: string;
  label: string;
  disabled: boolean;
};

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement(node)) return textFromNode((node.props as { children?: ReactNode }).children);
  return "";
}

function parseOptions(children: ReactNode): ParsedOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionProps>(child)) return [];
    if (child.type === "option") {
      const label = textFromNode(child.props.children).trim();
      return [{
        value: String(child.props.value ?? label),
        label,
        disabled: Boolean(child.props.disabled),
      }];
    }
    return parseOptions(child.props.children);
  });
}

export function StyledSelect({
  children,
  className,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  required,
  searchable,
  emptyText = "Nenhuma opção encontrada",
  id,
  "aria-label": ariaLabel,
  ...rest
}: StyledSelectProps) {
  const options = useMemo(() => parseOptions(children), [children]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));
  const selectedValue = String(isControlled ? value ?? "" : internalValue);
  const selectedOption = options.find((option) => option.value === selectedValue);
  const placeholderOption = options.find((option) => option.value === "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const shouldSearch = searchable ?? options.length >= 8;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return options.filter((option) => {
      if (option.value === "" && options.length > 1) return false;
      return !normalized || option.label.toLocaleLowerCase("pt-BR").includes(normalized);
    });
  }, [options, query]);

  function choose(option: ParsedOption) {
    if (option.disabled) return;
    if (!isControlled) setInternalValue(option.value);
    onChange?.({ target: { value: option.value, name } });
    setOpen(false);
    setQuery("");
  }

  function moveSelection(direction: 1 | -1) {
    const enabled = options.filter((option) => !option.disabled && option.value !== "");
    if (!enabled.length) return;
    const currentIndex = enabled.findIndex((option) => option.value === selectedValue);
    const nextIndex = currentIndex < 0
      ? direction === 1 ? 0 : enabled.length - 1
      : (currentIndex + direction + enabled.length) % enabled.length;
    choose(enabled[nextIndex]);
  }

  return (
    <div ref={rootRef} className="relative min-w-0 w-full">
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); open ? moveSelection(1) : setOpen(true); }
          if (event.key === "ArrowUp") { event.preventDefault(); open ? moveSelection(-1) : setOpen(true); }
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpen((current) => !current); }
        }}
        className={cn(
          "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[14px] border border-hpsr-border bg-white px-4 py-2.5 text-left text-sm font-semibold text-hpsr-text outline-none transition hover:border-hpsr-wineLight focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wineLight/20 disabled:cursor-not-allowed disabled:opacity-55",
          className
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selectedOption || selectedValue === "" ? "text-zinc-400" : "text-hpsr-text") }>
          {selectedOption?.label || placeholderOption?.label || "Selecione"}
        </span>
        <ChevronDown size={17} className={cn("shrink-0 text-hpsr-wine transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-[1200] mt-2 w-full min-w-[220px] overflow-hidden rounded-[16px] border border-hpsr-border bg-white shadow-[0_18px_50px_rgba(55,22,10,0.18)]">
          {shouldSearch && (
            <div className="border-b border-hpsr-border bg-[#fffaf4] p-2.5">
              <div className="flex items-center gap-2 rounded-[11px] border border-hpsr-border bg-white px-3">
                <Search size={15} className="shrink-0 text-hpsr-wineLight" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => event.stopPropagation()}
                  placeholder="Buscar opção..."
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>
          )}

          <div role="listbox" className="max-h-[280px] overflow-y-auto overscroll-contain p-1.5">
            {visibleOptions.length === 0 ? (
              <p className="px-3 py-5 text-center text-sm font-semibold text-hpsr-muted">{emptyText}</p>
            ) : visibleOptions.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-[11px] px-3 py-2.5 text-left text-sm font-semibold transition",
                    selected ? "bg-hpsr-wine text-white" : "text-hpsr-text hover:bg-[#fff3e8]",
                    option.disabled && "cursor-not-allowed opacity-45"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected && <Check size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <select
        value={selectedValue}
        onChange={() => undefined}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-px w-px opacity-0"
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
