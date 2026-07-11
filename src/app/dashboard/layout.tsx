import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardAccessGate } from "@/components/auth/DashboardAccessGate";
import { CurrentUserProfileProvider } from "@/components/auth/CurrentUserProfileProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAccessGate><CurrentUserProfileProvider><AppLayout>{children}</AppLayout></CurrentUserProfileProvider></DashboardAccessGate>;
}
