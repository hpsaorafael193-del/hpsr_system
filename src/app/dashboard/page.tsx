import Image from "next/image";
import Link from "next/link";
import {
  Calculator,
  CalendarDays,
  Bone,
  ClipboardList,
  FilePlus2,
  FileSearch,
  FileText,
  HeartHandshake,
  ShieldCheck,
  SquareStack,
} from "lucide-react";

const featureCards = [
  {
    icon: HeartHandshake,
    eyebrow: "Atendimento",
    title: "Humanizado",
    text: "Fluxo clínico com foco no paciente",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Processos",
    title: "Padronizados",
    text: "Documentos com identidade do hospital",
  },
  {
    icon: SquareStack,
    eyebrow: "Sistema",
    title: "Integrado",
    text: "Ferramentas principais em um painel",
  },
];

const modules = [
  {
    icon: ClipboardList,
    title: "Prontuários",
    text: "Acesso aos registros clínicos",
    href: "/dashboard/prontuarios",
  },
  {
    icon: CalendarDays,
    title: "Agenda",
    text: "Controle de atendimentos",
    href: "/dashboard/agendamento",
  },
  {
    icon: Calculator,
    title: "Calculadora",
    text: "Ferramentas de apoio clínico",
    href: "/dashboard/calculadora",
  },
  {
    icon: FileSearch,
    title: "Exames",
    text: "Emissão e gestão de exames",
    href: "/dashboard/exames",
  },
  {
    icon: FileText,
    title: "Documentos",
    text: "Documentos clínicos padronizados",
    href: "/dashboard/documentos",
  },
  {
    icon: Bone,
    title: "Traumatologia",
    text: "Avaliação e suporte traumatológico",
    href: "/dashboard/traumatologia",
  },
];

const institutionalTags = [
  "Atendimento humanizado",
  "Ambiente seguro",
  "Equipe integrada",
  "Documentação padronizada",
];

export default function DashboardHomePage() {
  return (
    <div className="hpsr-page gap-3">
      <div className="hpsr-topbar" />

      <section className="relative overflow-hidden rounded-[clamp(22px,3vw,30px)] border border-white/10">
        <Image
          src="/dashboard-banner.png"
          alt="Hospital São Rafael"
          fill
          priority
          className="object-cover object-center scale-[1.16] sm:scale-[1.08] lg:scale-100"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,7,0,0.84)_0%,rgba(103,38,20,0.66)_34%,rgba(42,7,0,0.44)_58%,rgba(42,7,0,0.70)_100%)]" />
        <div className="relative z-10 grid min-h-[clamp(220px,28vw,255px)] gap-3 px-[clamp(1rem,3vw,2rem)] py-[clamp(1.25rem,3vw,1.75rem)] lg:grid-cols-[minmax(0,1.1fr)_clamp(170px,18vw,235px)] lg:items-center">
          <div className="max-w-3xl min-w-0">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f9ead8]">
              Painel Clínico Integrado
            </span>

            <h1 className="mt-3 break-words text-[clamp(2rem,7vw,4.1rem)] font-extrabold leading-[0.98] tracking-tight text-white">
              Hospital São Rafael
            </h1>

            <p className="mt-3 max-w-2xl break-words text-[clamp(0.85rem,2.3vw,0.95rem)] leading-relaxed text-[#f7e7db]">
              Acesse rapidamente os módulos médicos, organize processos internos e mantenha o padrão visual institucional em um único ambiente.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/laudos"
                className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-[#fcf6ee] px-4 text-[13px] font-semibold text-[#2a0700]  transition"
              >
                <FilePlus2 size={15} />
                Emitir laudo
              </Link>

              <Link
                href="/dashboard/agendamento"
                className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-white/25 bg-white/10 px-4 text-[13px] font-semibold text-white transition hover:bg-white/15"
              >
                <CalendarDays size={15} />
                Abrir agenda
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex lg:justify-end">
            <div className="relative h-[clamp(150px,16vw,190px)] w-[clamp(150px,16vw,190px)] rounded-[16px] border border-white/10 bg-black/8 p-3-[2px]">
              <Image
                src="/logo-hpsr.png"
                alt="Logo São Rafael"
                fill
                className="object-contain p-3 opacity-95"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="rounded-[16px] border border-[#e8dccc] bg-white/[0.86] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#7a3b27]">
                    {card.eyebrow}
                  </p>
                  <h2 className="mt-1 break-words text-[clamp(1.25rem,3vw,1.55rem)] font-bold leading-tight text-[#2a0700]">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 text-[13px] text-[#8b624f]">{card.text}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,370px)]">
        <div className="rounded-[16px] border border-[#e8dccc] bg-white/[0.86] p-3.5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a3b27]">
                Atalhos rápidos
              </p>
              <h2 className="mt-1.5 break-words text-[clamp(1.5rem,3vw,1.95rem)] font-bold leading-tight text-[#2a0700]">
                Módulos do sistema
              </h2>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[#f4e6d2] text-[#672614]">
              <SquareStack size={18} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-[16px] border border-[#e8dccc] bg-[#fcf6ee] px-4 py-3 transition hover:bg-white"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
                    <Icon size={17} />
                  </div>
                  <h3 className="mt-4 break-words text-[clamp(1.1rem,2.5vw,1.32rem)] font-bold leading-tight text-[#2a0700]">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-[#8b624f]">{item.text}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[16px] border border-[#e8dccc] bg-[#f9f0df] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a3b27]">
            Institucional
          </p>
          <h2 className="mt-1.5 break-words text-[clamp(1.5rem,3vw,1.95rem)] font-bold leading-tight text-[#2a0700]">
            São Rafael
          </h2>
          <p className="mt-4 text-[13.5px] leading-7 text-[#6b4838]">
            Atendimento com clareza, organização e responsabilidade.
            <br />
            Cada módulo foi pensado para reduzir etapas e manter os documentos alinhados ao padrão do hospital.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {institutionalTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#e8dccc] bg-[#fcf6ee] px-3.5 py-1.5 text-[12px] font-semibold text-[#672614]"
              >
                {tag}
              </span>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
