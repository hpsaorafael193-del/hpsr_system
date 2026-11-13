"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { FileText, Heart, X } from "lucide-react";
import { useHospitalClosure } from "./ClosureState";
import { CLOSURE_EVENT, showClosureNotice } from "@/lib/hospital-closure";

export function ClosureNotice({ audience = "public", initial = false }: { audience?: "public" | "patient" | "staff"; initial?: boolean }) {
  const active = useHospitalClosure();
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const open = () => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); };
    if (active === false) dialog.current?.close();
    if (initial && active) open();
    window.addEventListener(CLOSURE_EVENT, open);
    return () => window.removeEventListener(CLOSURE_EVENT, open);
  }, [initial, active]);
  const staff = audience === "staff";
  return <dialog ref={dialog} aria-labelledby={title} className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-[900px] overflow-auto rounded-[22px] border border-[#b89680] bg-[#f9e6d5] p-0 text-[#31171a] shadow-2xl backdrop:bg-[#220b11]/90">
    <div className="relative h-[clamp(110px,25vw,205px)] bg-[#15151b] bg-cover bg-center" style={{backgroundImage:"url('/hospital-sao-rafael-banner.webp')"}}>
      <button type="button" aria-label="Fechar aviso" onClick={() => dialog.current?.close()} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white"><X size={21}/></button>
    </div>
    <div className="px-[clamp(1rem,4vw,2rem)] py-5">
      <p className="text-xs font-extrabold uppercase tracking-widest text-[#693b25]">Hospital São Rafael · Norte</p>
      <h2 id={title} className="mb-4 mt-2 text-[clamp(1.45rem,4vw,2.35rem)] font-black leading-tight">Estamos encerrando nossas atividades</h2>
      <div className="space-y-3 text-sm leading-relaxed sm:text-base">
      {staff ? <>
        <p>A área médica permanece disponível como arquivo. Você pode consultar os prontuários a que tem acesso e liberar pelo prontuário exames pendentes que já foram salvos.</p>
        <p>Novos agendamentos, consultas, acompanhamentos, exames, documentos e vacinas não serão registrados.</p>
      </> : <>
        <p>Após quase dois anos de história, estamos encerrando nossas atividades à frente do Hospital São Rafael do Norte. Durante esse tempo, nos dedicamos de coração a cada atendimento, consulta e história que tivemos a oportunidade de acompanhar.</p>
        <p>Quem tem acompanhamento em andamento ou procedimento pendente será orientado sobre a continuidade no <strong>Hospital do Sul</strong>.</p>
        <div className="flex gap-3 rounded-xl bg-[#f2d4bc] p-3"><FileText className="mt-1 shrink-0 text-[#713f26]" size={20}/><div><p className="font-black">Sobre a decisão</p><p>O Norte sempre foi muito especial para a Dra. Anny. A decisão de entregar o hospital foi difícil e veio de circunstâncias que tornaram inviável continuar.</p></div></div>
        <p>O <strong>Portal do Paciente</strong> continua disponível para consultar e baixar exames e documentos liberados. Não recebemos novos pedidos, formulários ou candidaturas.</p>
        <div className="flex items-center gap-4 text-[#713f26]" aria-hidden="true"><span className="h-px flex-1 bg-current"/><Heart size={20}/><span className="h-px flex-1 bg-current"/></div>
        <p>A <strong>Dra. Anny e o Dr. Luidhy</strong> agradecem o carinho, a confiança e o respeito de vocês. Vamos guardar com carinho os momentos que tivemos a oportunidade de viver juntos.</p>
      </>}
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        {audience === "public" && <Link href="/paciente" onClick={() => dialog.current?.close()} className="rounded-xl border border-[#9a6851] px-4 py-2.5 text-sm font-bold">Portal do Paciente</Link>}
        <button type="button" onClick={() => dialog.current?.close()} className="rounded-xl bg-[#713f26] px-5 py-2.5 text-sm font-bold text-white">Entendi</button>
      </div>
    </div>
  </dialog>;
}

// Keeps the normal page intact when the switch is off. Old direct links
// show the same notice without opening a new request form while closed.
export function ClosureEntry({children}: {children: React.ReactNode}) {
  const active = useHospitalClosure();
  if (active === null) return <p className="p-6" role="status">Verificando disponibilidade…</p>;
  if (!active) return <>{children}</>;
  return <main className="mx-auto max-w-xl px-6 py-16">
    <ClosureNotice initial />
    <h1 className="text-2xl font-bold">Atividades em encerramento</h1>
    <p className="mt-4">O Hospital São Rafael do Norte não recebe novas solicitações. O portal continua disponível para consulta e download.</p>
    <div className="mt-5 flex flex-wrap gap-4">
      <Link href="/paciente" className="font-bold underline">Portal do Paciente</Link>
      <button type="button" onClick={showClosureNotice} className="font-bold underline">Ler comunicado</button>
    </div>
  </main>;
}
