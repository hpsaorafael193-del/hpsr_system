import type { Metadata } from "next";
import "./globals.css";
import "./dark-generated.css";
import "./theme.css";
import "./medical-login.css";
import "./patient-auth.css";
import "./responsive.css";
import { ThemeProvider, themeBootstrap } from "@/components/theme/ThemeProvider";
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body><ThemeProvider><HpsrDialogProvider><HpsrToastProvider>{children}</HpsrToastProvider></HpsrDialogProvider></ThemeProvider></body>
    </html>
  );
}
