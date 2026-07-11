import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardAccessGate } from "@/components/auth/DashboardAccessGate";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAccessGate><AppLayout>{children}</AppLayout></DashboardAccessGate>;
}
