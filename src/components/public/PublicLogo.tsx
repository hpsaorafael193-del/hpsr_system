import Image from "next/image";

export function PublicLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative h-8 w-8 overflow-hidden rounded-[14px] bg-white/70 p-1  ring-1 ring-hpsr-border/70">
          <Image src="/logo-hpsr.png" alt="Hospital São Rafael" fill className="object-contain p-1" priority />
        </div>
        <div>
          <p className="text-xl font-black leading-none tracking-wide text-hpsr-wine">SÃO RAFAEL</p>
          <p className="text-xs font-semibold text-hpsr-muted">Sandy Shores Hospital</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-52 w-52 md:h-60 md:w-60">
        <Image src="/logo-hpsr.png" alt="Hospital São Rafael" fill className="object-contain" priority />
      </div>
    </div>
  );
}
