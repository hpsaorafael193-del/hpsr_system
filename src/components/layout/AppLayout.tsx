"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { isSupabaseConfigured } from "@/lib/supabase";

const SIDEBAR_COLLAPSED_KEY = "hpsr-sidebar-collapsed";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    window.localStorage.removeItem("hpsr-theme");
    delete document.documentElement.dataset.hpsrTheme;
    if (isSupabaseConfigured() && window.localStorage.getItem("hpsr-supabase-cleanup-v335") !== "done") {
      [
        "hpsr-team-members",
        "hpsr-staff-applications",
        "hpsr-staff-registration-requests",
        "hpsr-public-appointments",
        "hpsr-financial-receipts",
        "hpsr-financial-plan-entries",
        "hpsr-system-activity-log",
      ].forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.setItem("hpsr-supabase-cleanup-v335", "done");
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  return (
    <div className="hpsr-dashboard-shell min-h-dvh overflow-x-hidden bg-hpsr-bg text-hpsr-text">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <MobileSidebar />

      <main
        className={cn(
          "relative min-h-dvh min-w-0 overflow-x-hidden overflow-y-auto transition-all duration-300",
          collapsed ? "lg:pl-[92px]" : "lg:pl-[292px]"
        )}
      >
        <div className="fixed right-3 top-3 z-[90] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 lg:right-5 lg:top-4">
          <UserMenu />
        </div>

        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_16%,rgba(103,38,20,0.052),transparent_24rem),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.55),transparent_24rem),radial-gradient(circle_at_52%_100%,rgba(42,7,0,0.036),transparent_30rem)]" />
        <div className="relative z-10 min-h-dvh min-w-0 overflow-visible px-[clamp(0.65rem,1.8vw,1.35rem)] pb-[clamp(0.85rem,1.45vw,1.2rem)] pt-[clamp(0.75rem,1.45vw,1.2rem)] max-lg:pt-3">
          {children}
        </div>
      </main>
    </div>
  );
}
