import { PublicHeader } from "./PublicHeader";
import { PublicSystemFooter } from "./PublicSystemFooter";

export function PublicShell({
  children,
  showHeader = true,
  patientPortal = false,
  compactTypography = true,
  showSystemFooter = true,
}: {
  children: React.ReactNode;
  showHeader?: boolean;
  patientPortal?: boolean;
  compactTypography?: boolean;
  showSystemFooter?: boolean;
}) {
  return (
    <div className={`${compactTypography && !patientPortal ? "hpsr-compact-type " : ""}min-h-screen overflow-x-hidden bg-[#fcf6ee] text-hpsr-text`}>
      {showHeader && <PublicHeader patientPortal={patientPortal} />}
      <main className="min-w-0">{children}</main>
      {showSystemFooter && <PublicSystemFooter />}
    </div>
  );
}
