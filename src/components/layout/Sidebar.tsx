"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Code2, Menu } from "lucide-react";
import { adminNavigation, mainNavigation, toolsNavigation } from "@/data/navigation";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { cn } from "@/lib/utils";
import { DeveloperCreditsModal } from "./DeveloperCreditsModal";

export function Sidebar({ collapsed, onToggle, hasPendingAppointmentRequest = false }: { collapsed: boolean; onToggle: () => void; hasPendingAppointmentRequest?: boolean }) {
  const pathname = usePathname();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const canSeeTeamAdmin =
    currentUserProfile.systemRole === "Diretor Técnico / Dev" ||
    ["Diretora", "Vice Diretor"].includes(currentUserProfile.role);
  const visibleAdminNavigation = canSeeTeamAdmin ? adminNavigation : [];
  const visibleToolsNavigation = toolsNavigation.filter((item) => canSeeNavigationItem(item, currentUserProfile.role));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/12 bg-[linear-gradient(180deg,#6f2b17_0%,#4a160c_54%,#260600_100%)] text-white transition-all duration-300 lg:flex",
        collapsed ? "w-[92px]" : "w-[292px]"
      )}
    >
      <div className={cn("flex items-center px-3", collapsed ? "h-24 justify-center" : "h-[96px] justify-between gap-3")}>
        <Link href="/dashboard" className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "flex-1")}>
          {collapsed ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-[#fffaf4] p-0.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
              <Image src="/logo-hpsr.png" alt="Hospital São Rafael" fill className="object-contain p-0.5 scale-[1.12]" priority />
            </div>
          ) : (
            <div className="relative h-[64px] w-full max-w-[218px] shrink-0 overflow-hidden rounded-[16px] bg-[#fffaf4] px-2 py-0.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
              <Image src="/logo-sao-rafael-horizontal.png" alt="Hospital São Rafael" fill className="object-contain p-1" priority />
            </div>
          )}
        </Link>
        {!collapsed && (
          <button onClick={onToggle} className="rounded-[16px] p-3 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Recolher menu">
            <Menu size={20} />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={onToggle} className="mx-auto mb-4 rounded-[16px] p-3 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Expandir menu">
          <Menu size={20} />
        </button>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        <SidebarGroup title="Principal" items={mainNavigation} collapsed={collapsed} pathname={pathname} hasPendingAppointmentRequest={hasPendingAppointmentRequest} />
        <SidebarGroup title="Ferramentas" items={visibleToolsNavigation} collapsed={collapsed} pathname={pathname} />
        {visibleAdminNavigation.length > 0 && (
          <SidebarGroup title="Administração" items={visibleAdminNavigation} collapsed={collapsed} pathname={pathname} />
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setCreditsOpen(true)}
          title="Sobre o sistema"
          className={cn(
            "w-full rounded-[16px] border border-white/10 bg-white/10 text-orange-50/85 transition hover:border-white/20 hover:bg-white/15 hover:text-white",
            collapsed ? "flex h-11 items-center justify-center" : "px-4 py-3 text-left text-xs leading-relaxed"
          )}
        >
          {collapsed ? <Code2 size={18} /> : "Hospital São Rafael · Eldorado"}
        </button>
      </div>
      <DeveloperCreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </aside>
  );
}

function SidebarGroup({
  title,
  items,
  collapsed,
  pathname,
  hasPendingAppointmentRequest = false,
}: {
  title: string;
  items: any[];
  collapsed: boolean;
  pathname: string;
  hasPendingAppointmentRequest?: boolean;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-100/60">
          {title}
        </p>
      )}

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const active = pathname === item.href || (hasChildren && pathname.startsWith(item.href + "/"));
          const showChildren = hasChildren && active && !collapsed;
          const notifyPending = item.href === "/dashboard/agendamento" && hasPendingAppointmentRequest;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-[#fffaf4] text-hpsr-wine"
                    : "text-orange-50/90 hover:bg-white/10 hover:text-white",
                  collapsed && "justify-center",
                  notifyPending && !active && "border border-red-300/35 bg-red-500/10 shadow-[0_0_18px_rgba(239,68,68,0.22)] animate-[pulse_2.4s_ease-in-out_infinite]"
                )}
              >
                <span className="relative shrink-0"><Icon size={19} />{notifyPending && <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full border border-white/80 bg-red-500 shadow-[0_0_9px_rgba(239,68,68,0.85)]" />}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {hasChildren && <ChevronDown size={15} className={cn("transition", showChildren && "rotate-180")} />}
                  </>
                )}
              </Link>

              {showChildren && (
                <div className="ml-6 mt-2 space-y-1 border-l border-white/15 pl-4">
                  {item.children.map((child: any) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm transition",
                          childActive ? "bg-white/20 text-white" : "text-orange-50/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", childActive ? "bg-white" : "bg-orange-50/40")} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function canSeeNavigationItem(item: any, role: string) {
  return !Array.isArray(item.hideForRoles) || !item.hideForRoles.includes(role);
}
