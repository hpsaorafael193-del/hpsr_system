import Image from "next/image";
import Link from "next/link";
import { BriefcaseMedical, ClipboardList, Scale } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { MedicalLoginButton } from "@/components/public/MedicalLoginButton";

export default function HomePage() {
  return (
    <PublicShell showHeader={false}>
      <section
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-[clamp(0.75rem,3vw,1.5rem)] py-[clamp(1rem,3vw,2rem)]"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(252,246,238,0.08) 0%, rgba(252,246,238,0.12) 100%), url('/home-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_34%,rgba(42,7,0,0.18)_62%,rgba(42,7,0,0.40)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,7,0,0.18)_0%,transparent_14%,transparent_86%,rgba(42,7,0,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,7,0,0.14)_0%,transparent_16%,transparent_84%,rgba(42,7,0,0.18)_100%)]" />

        <div className="relative z-10 w-full max-w-4xl min-w-0">
          <div className="mx-auto w-full max-w-[700px] rounded-[clamp(24px,5vw,34px)] border border-white/65 bg-white/28 p-[clamp(0.75rem,2.5vw,1.75rem)] shadow-[0_22px_80px_rgba(42,7,0,0.20)] backdrop-blur-[10px]">
            <div className="rounded-[clamp(22px,4vw,30px)] border border-white/50 bg-[rgba(252,246,238,0.88)] px-[clamp(1rem,3vw,1.5rem)] py-[clamp(1.25rem,4vw,2rem)] shadow-[0_14px_40px_rgba(42,7,0,0.10)]">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-[clamp(8.5rem,46vw,18rem)] w-[clamp(8.5rem,46vw,18rem)]">
                  <Image
                    src="/logo-hpsr.png"
                    alt="Hospital São Rafael"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>

                <div className="mt-[clamp(1.25rem,4vw,2rem)] grid w-full gap-3 sm:grid-cols-3">
                  <MedicalLoginButton className="min-h-12 w-full justify-center rounded-[14px] px-4 py-3 text-sm font-semibold sm:h-14" />

                  <Link
                    href="/paciente"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-semibold text-hpsr-wine shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <ClipboardList size={17} />
                    Sou paciente
                  </Link>

                  <Link
                    href="/trabalhe-conosco"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-semibold text-hpsr-wine shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <BriefcaseMedical size={17} />
                    Trabalhe Conosco
                  </Link>
                </div>

                <Link
                  href="/regimento"
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-semibold text-hpsr-wine shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <Scale size={17} />
                  Normas e Regimento
                </Link>

                <p className="mt-6 max-w-xl text-center text-sm leading-relaxed text-hpsr-muted md:text-[15px]">
                  Atendimento humanizado com clareza, organização e responsabilidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
