"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { adminNavigation, mainNavigation, toolsNavigation } from "@/data/navigation";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { DeveloperCreditsModal } from "./DeveloperCreditsModal";

export function MobileSidebar() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [open, setOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const canSeeTeamAdmin =
    currentUserProfile.systemRole === "Dev / Desenvolvedor do Sistema" ||
    ["Diretora", "Vice Diretor"].includes(currentUserProfile.role);
  const visibleAdminNavigation = canSeeTeamAdmin ? adminNavigation : [];
  const visibleToolsNavigation = toolsNavigation.filter((item) => canSeeNavigationItem(item, currentUserProfile.role));
  const groups = [
    { title: "Principal", items: mainNavigation },
    { title: "Ferramentas", items: visibleToolsNavigation },
    ...(visibleAdminNavigation.length > 0 ? [{ title: "Administração", items: visibleAdminNavigation }] : []),
  ];

  return (
    <>
      <div className="sticky top-0 z-30 flex min-w-0 items-center justify-between border-b border-hpsr-border/70 bg-[#fcf6ee]/90 px-3 py-3 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir barra lateral"
            className="relative h-11 w-11 overflow-hidden rounded-xl bg-white/[0.86] p-1  ring-1 ring-hpsr-border/70 transition hover:scale-[1.02]"
          >
            <Image src="/logo-hpsr.png" alt="Hospital São Rafael" fill className="object-contain p-1" priority />
          </button>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold leading-none text-hpsr-text">São Rafael</p>
              <p className="mt-1 text-xs text-hpsr-wine">Sistema Clínico</p>
            </div>
          </Link>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <aside className="absolute left-0 top-0 h-full w-[min(86vw,360px)] overflow-y-auto bg-[linear-gradient(180deg,#672614_0%,#5d2012_46%,#2a0700_100%)] p-4 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-[#fcf6ee] p-1">
                  <Image src="/logo-hpsr.png" alt="Hospital São Rafael" fill className="object-contain p-1" priority />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold">São Rafael</p>
                  <p className="text-xs text-orange-100/70">Sistema Clínico</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-xl bg-white/10 p-3 text-white"><X size={20} /></button>
            </div>

            <nav className="space-y-6">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-100/60">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item: any) => {
                      const Icon = item.icon;
                      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                      return (
                        <div key={item.href}>
                          <Link
                            onClick={() => !hasChildren && setOpen(false)}
                            href={item.href}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-orange-50/95 hover:bg-white/10 hover:text-white"
                          >
                            <Icon size={19} />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {hasChildren && <ChevronDown size={15} />}
                          </Link>
                          {hasChildren && (
                            <div className="ml-6 mt-1 space-y-1 border-l border-white/15 pl-4">
                              {item.children.map((child: any) => (
                                <Link
                                  onClick={() => setOpen(false)}
                                  key={child.href}
                                  href={child.href}
                                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-orange-50/70 hover:bg-white/10 hover:text-white"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-orange-50/40" />
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-6 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCreditsOpen(true);
                }}
                className="w-full rounded-[16px] border border-white/10 bg-white/10 px-4 py-3 text-left text-xs font-semibold text-orange-50/90 transition hover:bg-white/15 hover:text-white"
              >
                Hospital São Rafael · Eldorado
              </button>
            </div>
          </aside>
        </div>
      )}
      <DeveloperCreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  );
}


function canSeeNavigationItem(item: any, role: string) {
  return !Array.isArray(item.hideForRoles) || !item.hideForRoles.includes(role);
}
