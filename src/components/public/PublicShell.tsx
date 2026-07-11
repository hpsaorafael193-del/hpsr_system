import { PublicHeader } from "./PublicHeader";

export function PublicShell({ children, showHeader = true }: { children: React.ReactNode; showHeader?: boolean }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf6ee] text-hpsr-text">
      {showHeader && <PublicHeader />}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
