export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div
      aria-label={`${eyebrow} — ${title}: ${description}`}
      className="hpsr-topbar"
    />
  );
}
