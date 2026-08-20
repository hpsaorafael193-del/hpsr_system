import type { Metadata } from "next";
import "./globals.css";
import { HpsrDialogProvider } from "@/components/ui/HpsrDialogProvider";
import { HpsrToastProvider } from "@/components/ui/HpsrToastProvider";

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
      <body><HpsrDialogProvider><HpsrToastProvider>{children}</HpsrToastProvider></HpsrDialogProvider></body>
    </html>
  );
}
