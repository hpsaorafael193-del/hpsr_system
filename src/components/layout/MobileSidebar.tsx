"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { adminNavigation, mainNavigation, toolsNavigation } from "@/data/navigation";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { canAccessObstetra } from "@/lib/obstetra-access";
import { isFullAccessAdministrativeRole } from "@/lib/staff-specialties";

export function MobileSidebar({ onOpenSystemInfo, hasPendingAppointmentRequest = false }: { onOpenSystemInfo: () => void; hasPendingAppointmentRequest?: boolean }) {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const canSeeTeamAdmin =
    currentUserProfile.systemRole === "Administrador do Sistema" ||
    isFullAccessAdministrativeRole(currentUserProfile.role) ||
    currentUserProfile.role === "Vice Diretor";
  const visibleAdminNavigation = canSeeTeamAdmin ? adminNavigation.filter((item) => !item.internalOnly || ["Diretora", "Vice Diretor / Dev"].includes(currentUserProfile.role)) : [];
  const visibleToolsNavigation = toolsNavigation.filter((item) =>
    canSeeNavigationItem(item, currentUserProfile.role) &&
    (item.href !== "/dashboard/obstetra" || canAccessObstetra(currentUserProfile.role, currentUserProfile.specialty))
  );
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
        <div className="fixed inset-0 z-[100] lg:hidden">
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
              <button aria-label="Fechar barra lateral" onClick={() => setOpen(false)} className="rounded-xl bg-white/10 p-3 text-white"><X size={20} /></button>
            </div>

            <nav className="space-y-6">
              {groups.map((group) => (
                <div key={group.title} className="border-b border-white/10 pb-4 last:border-b-0">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-100/60">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item: any) => {
                      const Icon = item.icon;
                      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                      const notifyPending = item.href === "/dashboard/agendamento" && hasPendingAppointmentRequest;
                      const active = pathname === item.href || (hasChildren && pathname.startsWith(item.href + "/"));
                      return (
                        <div key={item.href}>
                          <Link
                            onClick={() => !hasChildren && setOpen(false)}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${active ? "border-[#e4d2c1] bg-[#fffaf4] text-hpsr-wine shadow-[inset_4px_0_0_#98523b]" : "border-transparent text-orange-50/95 hover:border-white/15 hover:bg-white/10 hover:text-white"} ${notifyPending ? "border border-red-300/30 bg-red-500/10 shadow-[0_0_16px_rgba(239,68,68,0.2)]" : ""}`}
                          >
                            <span className="relative shrink-0"><Icon size={19} />{notifyPending && <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border border-white/80 bg-red-500 shadow-[0_0_9px_rgba(239,68,68,0.85)]" />}</span>
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
                                  aria-current={pathname === child.href ? "page" : undefined}
                                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f0c9a8] ${pathname === child.href ? "bg-white/20 font-bold text-white ring-1 ring-white/25" : "text-orange-50/80 hover:bg-white/10 hover:text-white"}`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${pathname === child.href ? "bg-white" : "bg-orange-50/40"}`} />
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
                  onOpenSystemInfo();
                }}
                className="w-full rounded-[16px] border border-white/10 bg-white/10 px-4 py-3 text-left text-xs font-semibold text-orange-50/90 transition hover:bg-white/15 hover:text-white"
              >
                Hospital São Rafael · Eldorado
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}


function canSeeNavigationItem(item: any, role: string) {
  return !Array.isArray(item.hideForRoles) || !item.hideForRoles.includes(role);
}
