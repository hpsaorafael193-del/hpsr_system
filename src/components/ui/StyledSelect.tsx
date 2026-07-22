"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
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

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
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
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldSearch = searchable ?? options.length >= 8;

  useEffect(() => setMounted(true), []);

  function updateMenuPosition() {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const gap = 8;
    const safeMargin = 12;
    const preferredHeight = shouldSearch ? 360 : 300;
    const availableBelow = viewportHeight - rect.bottom - gap - safeMargin;
    const availableAbove = rect.top - gap - safeMargin;
    const placement = availableBelow >= 180 || availableBelow >= availableAbove ? "bottom" : "top";
    const availableSpace = placement === "bottom" ? availableBelow : availableAbove;
    const maxHeight = Math.max(140, Math.min(preferredHeight, availableSpace));
    const width = Math.min(Math.max(rect.width, 220), viewportWidth - safeMargin * 2);
    const left = Math.min(Math.max(safeMargin, rect.left), viewportWidth - width - safeMargin);
    const top = placement === "bottom" ? rect.bottom + gap : rect.top - gap;

    setMenuPosition({ top, left, width, maxHeight, placement });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();

    const handleViewportChange = () => updateMenuPosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, shouldSearch]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
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

  const menu = open && menuPosition ? (
    <div
      ref={menuRef}
      className="fixed z-[99999] overflow-hidden rounded-[16px] border border-hpsr-border bg-white shadow-[0_22px_60px_rgba(55,22,10,0.24)]"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
        width: menuPosition.width,
        maxHeight: menuPosition.maxHeight,
        transform: menuPosition.placement === "top" ? "translateY(-100%)" : undefined,
      }}
    >
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

      <div
        role="listbox"
        className="overflow-y-auto overscroll-contain p-1.5"
        style={{ maxHeight: shouldSearch ? menuPosition.maxHeight - 62 : menuPosition.maxHeight }}
      >
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
  ) : null;

  return (
    <div ref={rootRef} className={cn("relative z-0 min-w-0 w-full overflow-visible", open && "z-[80]")}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        ref={buttonRef}
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
          "relative isolate flex min-h-[46px] w-full min-w-0 items-center justify-between gap-3 overflow-visible rounded-[14px] border border-hpsr-border bg-white px-4 py-2.5 text-left text-sm font-semibold text-hpsr-text outline-none transition hover:border-hpsr-wineLight focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wineLight/20 disabled:cursor-not-allowed disabled:opacity-55",
          className
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selectedOption || selectedValue === "" ? "text-zinc-400" : "text-hpsr-text") }>
          {selectedOption?.label || placeholderOption?.label || "Selecione"}
        </span>
        <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#fff7ef] text-hpsr-wine"><ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} /></span>
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}

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
