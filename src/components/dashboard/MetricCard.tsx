export function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="hpsr-card p-3.5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hpsr-wineLight">{label}</p>
      <p className="mt-3 text-[clamp(1.65rem,4.5vw,2.15rem)] font-bold text-hpsr-text">{value}</p>
      <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{note}</p>
    </div>
  );
}
