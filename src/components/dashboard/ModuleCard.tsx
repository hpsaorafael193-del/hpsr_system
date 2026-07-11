import Link from "next/link";

export function ModuleCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
}) {
  return (
    <Link href={href} className="group hpsr-card hpsr-card-hover p-3.5">
      <div className="hpsr-icon-primary mb-4 h-8 w-8">
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-bold text-hpsr-text">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-hpsr-muted">{description}</p>
    </Link>
  );
}
