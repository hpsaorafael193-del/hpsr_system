"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { LoginModal } from "./LoginModal";
import { cn } from "@/lib/utils";

export function MedicalLoginButton({
  children = "Acesso Médico",
  className,
  iconSize = 17,
}: {
  children?: React.ReactNode;
  className?: string;
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white  transition hover:bg-hpsr-wineDark",
          className
        )}
      >
        <LogIn size={iconSize} />
        {children}
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
