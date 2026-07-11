import Link from "next/link";
import { PublicLogo } from "./PublicLogo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { MedicalLoginButton } from "./MedicalLoginButton";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#fcf6ee]/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:px-5">
        <Link href="/">
          <PublicLogo compact />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <ButtonLink href="/paciente" variant="ghost">Portal do Paciente</ButtonLink>
          <ButtonLink href="/trabalhe-conosco" variant="ghost">Equipe</ButtonLink>
        </nav>

        <MedicalLoginButton className="rounded-2xl px-4 py-3 md:px-5" />
      </div>
    </header>
  );
}
