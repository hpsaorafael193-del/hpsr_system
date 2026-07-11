"use client";

import { Brain, Construction, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ClinicalAssistantPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ferramenta clínica"
        title="Assistente Clínico"
        description="Módulo reservado para suporte clínico supervisionado."
      />

      <section className="overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] px-5 py-6 md:px-8 md:py-8">
          <div className="flex max-w-3xl items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-hpsr-wine text-white shadow-sm">
              <Brain size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Em desenvolvimento</p>
              <h2 className="mt-2 text-2xl font-black text-hpsr-text">Este módulo ainda não está disponível</h2>
              <p className="mt-3 text-sm leading-relaxed text-hpsr-muted">
                O Assistente Clínico está sendo preparado para apoiar a equipe sem substituir avaliação, conduta ou decisão médica. Nenhuma função clínica automatizada está ativa nesta versão.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 md:p-8">
          <div className="rounded-[18px] border border-hpsr-border bg-[#fffaf4] p-4">
            <Construction className="text-hpsr-wineLight" size={20} />
            <h3 className="mt-3 font-black text-hpsr-text">Desenvolvimento controlado</h3>
            <p className="mt-2 text-sm leading-relaxed text-hpsr-muted">A lógica será liberada somente após validação dos fluxos, permissões e registros clínicos.</p>
          </div>
          <div className="rounded-[18px] border border-hpsr-border bg-[#fffaf4] p-4">
            <ShieldCheck className="text-hpsr-wineLight" size={20} />
            <h3 className="mt-3 font-black text-hpsr-text">Segurança assistencial</h3>
            <p className="mt-2 text-sm leading-relaxed text-hpsr-muted">As futuras funções deverão manter rastreabilidade e supervisão de um profissional habilitado.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
