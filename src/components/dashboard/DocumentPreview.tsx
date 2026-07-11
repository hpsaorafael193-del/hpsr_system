export function DocumentPreview({ title = "TÍTULO DO DOCUMENTO", subtitle = "Descrição do documento" }: { title?: string; subtitle?: string }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white p-3.5">
      <div className="mx-auto aspect-[210/297] max-w-[420px] bg-white p-3.5 text-hpsr-text">
        <div className="flex items-start justify-between border-b-2 border-hpsr-wine pb-3">
          <div>
            <p className="text-lg font-semibold text-hpsr-wine">HOSPITAL SÃO RAFAEL</p>
            <p className="text-sm font-semibold text-zinc-400">SANDY SHORES</p>
          </div>
          <p className="text-sm text-zinc-400">DATA: / /</p>
        </div>
        <div className="py-6 text-center">
          <p className="text-xl font-semibold text-hpsr-wine">{title}</p>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
          <div className="col-span-2 rounded-[14px] border-2 border-[#ead5cc] py-3">NOME DO PACIENTE</div>
          <div className="rounded-2xl border-2 border-[#ead5cc] py-3">IDADE</div>
          <div className="rounded-2xl border-2 border-[#ead5cc] py-3">SANGUE</div>
        </div>
        <div className="flex h-[360px] items-center justify-center text-center text-7xl font-semibold text-hpsr-wine/5">SR</div>
        <div className="mt-auto pt-6">
          <p className="w-44 border-b-2 border-hpsr-wine pb-1 font-serif text-lg italic text-zinc-500">Assinatura</p>
          <p className="mt-2 font-bold text-hpsr-wine">Nome do médico</p>
          <p className="text-sm text-zinc-500">CRM: 000000</p>
        </div>
      </div>
    </div>
  );
}
