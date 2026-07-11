import { cn } from "@/lib/utils";

const statusMap: Record<string, string> = {
  solicitado: "bg-amber-100 text-amber-800 border-amber-200",
  pendente: "bg-amber-100 text-amber-800 border-amber-200",
  "em análise": "bg-blue-100 text-blue-800 border-blue-200",
  entrevista: "bg-purple-100 text-purple-800 border-purple-200",
  confirmado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  aprovado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  recusado: "bg-rose-100 text-rose-800 border-rose-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-black capitalize", statusMap[status] ?? "bg-zinc-100 text-zinc-700 border-zinc-200")}>
      {status}
    </span>
  );
}
