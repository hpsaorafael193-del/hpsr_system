"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { CLINICAL_BOARD_CHANGED_EVENT, invalidateClinicalBoard, loadSharedClinicalBoard } from "@/lib/clinical-board-cache";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";

const SIDEBAR_COLLAPSED_KEY = "hpsr-sidebar-collapsed";

const DeveloperCreditsModal = dynamic(
  () => import("./DeveloperCreditsModal").then((module) => module.DeveloperCreditsModal),
  { ssr: false },
);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const isTraumatologyFixedPage = pathname === "/dashboard/traumatologia";
  const refreshVisual = ["/dashboard/direcao", "/dashboard/interno", "/dashboard/financeiro", "/dashboard/calculadora", "/dashboard/traumatologia", "/dashboard/banco-de-sangue"].includes(pathname);
  const routesWithOwnTopbar = ["/dashboard", "/dashboard/prontuarios", "/dashboard/direcao", "/dashboard/interno", "/dashboard/financeiro", "/dashboard/calculadora", "/dashboard/traumatologia", "/dashboard/banco-de-sangue", "/dashboard/documentos", "/dashboard/exames", "/dashboard/convenios", "/dashboard/perfil", "/dashboard/gestao-de-leitos", "/dashboard/obstetra", "/dashboard/obstetricia", "/dashboard/vacinacao", "/dashboard/assistente-clinico", "/dashboard/parcerias", "/dashboard/agendamento", "/dashboard/equipe", "/dashboard/agendamento/pacientes", "/dashboard/agendamento/clinica" ];
  const hasPageTopbar = routesWithOwnTopbar.includes(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [hasPendingAppointmentRequest, setHasPendingAppointmentRequest] = useState(false);
  const [systemInfoOpen, setSystemInfoOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    window.localStorage.removeItem("hpsr-theme");
    delete document.documentElement.dataset.hpsrTheme;
    if (isSupabaseConfigured()) {
      // Estes dados são institucionais e vêm exclusivamente do Supabase.
      // Cópias legadas são removidas para nunca ressuscitarem registros excluídos.
      [
        "hpsr-team-members",
        "hpsr-staff-applications",
        "hpsr-staff-registration-requests",
        "hpsr-public-appointments",
        "hpsr-financial-receipts",
        "hpsr-financial-plan-entries",
        "hpsr-system-activity-log",
        "hpsr-profile-edits",
        "hpsr-service-status",
      ].forEach((key) => window.localStorage.removeItem(key));
      window.localStorage.setItem("hpsr-supabase-cleanup-v462", "done");
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !currentUserProfile.id) {
      setHasPendingAppointmentRequest(false);
      return;
    }

    const client = createClient();
    if (!client) return;
    let active = true;
    let pendingRefreshTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshPending = async () => {
      try {
        const data = await loadSharedClinicalBoard(String(currentUserProfile.id));
        if (active) setHasPendingAppointmentRequest(data.some((item) => item.can_claim === true));
      } catch (error) {
        if (active) console.warn("[HPSR] Não foi possível atualizar o indicador de solicitações.", error);
      }
    };

    let dirtyWhileHidden = false;
    const schedulePendingRefresh = () => {
      invalidateClinicalBoard();
      if (document.visibilityState !== "visible") {
        dirtyWhileHidden = true;
        return;
      }
      window.dispatchEvent(new Event(CLINICAL_BOARD_CHANGED_EVENT));
      if (pendingRefreshTimer) clearTimeout(pendingRefreshTimer);
      pendingRefreshTimer = setTimeout(() => {
        pendingRefreshTimer = null;
        void refreshPending();
      }, 900);
    };
    const refreshOnVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (dirtyWhileHidden) {
        dirtyWhileHidden = false;
        schedulePendingRefresh();
      }
    };

    void refreshPending();
    // Um único canal de appointments serve o indicador lateral e o sino.
    const channel = client
      .channel("dashboard-appointment-request-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, schedulePendingRefresh)
      .subscribe();
    document.addEventListener("visibilitychange", refreshOnVisible);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", refreshOnVisible);
      if (pendingRefreshTimer) clearTimeout(pendingRefreshTimer);
      void client.removeChannel(channel);
    };
  }, [currentUserProfile.id]);

  return (
    <div className={cn("hpsr-dashboard-shell hpsr-compact-type min-h-dvh overflow-x-hidden bg-hpsr-bg text-hpsr-text", refreshVisual && "hpsr-refreshed-panel", pathname === "/dashboard" && "hpsr-dashboard-landing")}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onOpenSystemInfo={() => setSystemInfoOpen(true)}
        hasPendingAppointmentRequest={hasPendingAppointmentRequest}
      />
      <MobileSidebar
        onOpenSystemInfo={() => setSystemInfoOpen(true)}
        hasPendingAppointmentRequest={hasPendingAppointmentRequest}
      />

      <main
        className={cn(
          "hpsr-main-scroll relative min-h-dvh min-w-0 overflow-x-hidden overflow-y-auto transition-all duration-300",
          isTraumatologyFixedPage && "xl:h-dvh xl:min-h-0 xl:overflow-y-hidden",
          collapsed ? "lg:pl-[92px]" : "lg:pl-[292px]"
        )}
      >
        <div className="fixed right-3 top-3 z-[90] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 lg:right-5 lg:top-4">
          <UserMenu />
        </div>

        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_16%,rgba(103,38,20,0.052),transparent_24rem),radial-gradient(circle_at_88%_12%,rgba(255,255,255,0.55),transparent_24rem),radial-gradient(circle_at_52%_100%,rgba(42,7,0,0.036),transparent_30rem)]" />
        <div
          className={cn(
            "relative z-10 min-h-dvh min-w-0 overflow-visible px-[clamp(0.65rem,1.8vw,1.35rem)] pb-[clamp(0.85rem,1.45vw,1.2rem)] pt-[clamp(0.75rem,1.45vw,1.2rem)] max-lg:pt-3",
            isTraumatologyFixedPage && "xl:h-dvh xl:min-h-0 xl:overflow-hidden"
          )}
        >
          {!hasPageTopbar && <div className="hpsr-topbar" aria-hidden="true" />}
          {children}
        </div>
      </main>
      {systemInfoOpen && <DeveloperCreditsModal open onClose={() => setSystemInfoOpen(false)} />}
    </div>
  );
}
