export function PageHeader({
  eyebrow,
  title,
  description,
  compact = false,
  schedule = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  compact?: boolean;
  schedule?: boolean;
}) {
  return (
    <div
      aria-label={`${eyebrow} — ${title}: ${description}`}
      className={`hpsr-topbar ${schedule ? "hpsr-schedule-topbar" : ""} ${compact ? "!mb-2 !h-2" : ""}`}
    />
  );
}
