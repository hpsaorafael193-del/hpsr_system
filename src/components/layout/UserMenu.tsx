"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Circle, LogOut, UserRound } from "lucide-react";
import { currentUserProfile } from "@/data/current-user-profile";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(currentUserProfile.serviceStatus);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const storedStatus = localStorage.getItem("hpsr-service-status");
    if (storedStatus) setServiceStatus(storedStatus);

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleLogout() {
    localStorage.setItem("hpsr-service-status", "Fora de serviço");
    localStorage.removeItem("hpsr-demo-session");
    localStorage.removeItem("hpsr-local-auth-session");
    setServiceStatus("Fora de serviço");
    setOpen(false);
    router.push("/");
  }

  const isInService = serviceStatus === "Em serviço";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-w-0 items-center gap-2 rounded-[14px] border border-hpsr-border bg-white/[0.86] px-2.5 py-2 transition hover:bg-white"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#672614,#74321e,#a67a5f)] text-white">
          <UserRound size={18} />
        </div>

        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate text-xs font-semibold text-hpsr-text">{currentUserProfile.systemName}</p>
          <p className="truncate text-[11px] text-hpsr-muted">{currentUserProfile.role}</p>
        </div>

        <span
          className={cn(
            "hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold md:inline-flex",
            isInService ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
          )}
        >
          <Circle
            size={7}
            className={cn(
              isInService ? "fill-emerald-500 text-emerald-500" : "fill-zinc-400 text-zinc-400"
            )}
          />
          {serviceStatus}
        </span>

        <ChevronDown size={16} className={cn("text-hpsr-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[45] w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-[18px] border border-hpsr-border bg-[#fffaf5]/95"
        >
          <div className="border-b border-hpsr-border bg-[#fcf6ee] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e,#a67a5f)] text-white">
                <UserRound size={19} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-hpsr-text">{currentUserProfile.systemName}</p>
                <p className="mt-0.5 truncate text-xs text-hpsr-muted">{currentUserProfile.role}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <span className="rounded-2xl border border-hpsr-border bg-white px-3 py-2 font-semibold text-hpsr-wine">
                Passaporte {currentUserProfile.passport}
              </span>
              <span
                className={cn(
                  "rounded-2xl border px-3 py-2 font-semibold",
                  isInService
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-zinc-100 text-zinc-600"
                )}
              >
                {serviceStatus}
              </span>
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/dashboard/perfil"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-[14px] px-4 py-3 text-xs font-semibold text-hpsr-text transition hover:bg-[#f7f2ea]"
            >
              <UserRound size={18} className="text-hpsr-wine" />
              Ver perfil completo
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-xs font-semibold text-hpsr-wine transition hover:bg-[#f7f2ea]"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
