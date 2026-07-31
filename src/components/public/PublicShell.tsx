import { PublicHeader } from "./PublicHeader";

export function PublicShell({ children, showHeader = true, patientPortal = false, compactTypography = true }: { children: React.ReactNode; showHeader?: boolean; patientPortal?: boolean; compactTypography?: boolean }) {
  return (
    <div className={`${compactTypography && !patientPortal ? "hpsr-compact-type " : ""}min-h-screen overflow-x-hidden bg-[#fcf6ee] text-hpsr-text`}>
      {showHeader && <PublicHeader patientPortal={patientPortal} />}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
