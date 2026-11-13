import { ClosureNotice } from "@/components/public/ClosureNotice";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardAccessGate } from "@/components/auth/DashboardAccessGate";
import { CurrentUserProfileProvider } from "@/components/auth/CurrentUserProfileProvider";
import { PatientSelectionProvider } from "@/components/patients/PatientSelectionProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAccessGate><CurrentUserProfileProvider><PatientSelectionProvider><AppLayout><ClosureNotice audience="staff" initial />{children}</AppLayout></PatientSelectionProvider></CurrentUserProfileProvider></DashboardAccessGate>;
}
