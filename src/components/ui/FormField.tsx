export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-hpsr-text">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-w-0 w-full rounded-[14px] border border-hpsr-border bg-white/[0.86] px-4 py-3 text-sm text-hpsr-text outline-none ring-hpsr-wineLight transition placeholder:text-zinc-400 focus:bg-white focus:ring-2";
