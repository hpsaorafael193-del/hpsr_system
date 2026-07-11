import Link from "next/link";
import { cn } from "@/lib/utils";

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-[14px] px-4 py-3 text-sm font-black transition",
        variant === "primary" && "bg-hpsr-wine text-white  hover:bg-hpsr-wineDark",
        variant === "secondary" && "border border-hpsr-border bg-gradient-to-br from-[#fcf6ee] to-white text-hpsr-wine  hover:bg-white",
        variant === "ghost" && "border border-hpsr-border bg-gradient-to-br from-[#fcf6ee] to-white text-hpsr-wine  hover:bg-white"
      )}
    >
      {children}
    </Link>
  );
}
