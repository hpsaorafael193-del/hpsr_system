export function PageHeader({
  eyebrow,
  title,
  description,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      aria-label={`${eyebrow} — ${title}: ${description}`}
      className={`hpsr-topbar ${compact ? "!mb-2 !h-2" : ""}`}
    />
  );
}
