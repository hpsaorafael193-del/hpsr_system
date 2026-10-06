import { PublicShell } from "@/components/public/PublicShell";
import { PatientAccessPanel } from "@/components/public/PatientAccessPanel";

export default function PatientPortalPage() {
  return (
    <PublicShell patientPortal>
      <main className="hpsr-patient-page min-h-[calc(100dvh-64px)] overflow-x-hidden bg-[linear-gradient(180deg,#eee3d7_0px,#f5efe7_88px,#f5efe7_100%)] text-hpsr-text">
        <PatientAccessPanel />
      </main>
    </PublicShell>
  );
}
