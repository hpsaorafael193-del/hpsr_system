import type { Metadata } from "next";
import "./globals.css";
import { HpsrDialogProvider } from "@/components/ui/HpsrDialogProvider";

export const metadata: Metadata = {
  title: "HPSR — Sistema Clínico",
  description: "Portal e painel clínico do Hospital São Rafael RP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body><HpsrDialogProvider>{children}</HpsrDialogProvider></body>
    </html>
  );
}
