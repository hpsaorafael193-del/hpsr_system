import type { Metadata } from "next";
import "./globals.css";
import { HpsrDialogProvider } from "@/components/ui/HpsrDialogProvider";

export const metadata: Metadata = {
  title: "Hospital São Rafael - Eldorado",
  description: "Portal e painel clínico do Hospital São Rafael - Eldorado",
  icons: {
    icon: "/logo-hpsr.png",
    shortcut: "/logo-hpsr.png",
    apple: "/logo-hpsr.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body><HpsrDialogProvider>{children}</HpsrDialogProvider></body>
    </html>
  );
}
