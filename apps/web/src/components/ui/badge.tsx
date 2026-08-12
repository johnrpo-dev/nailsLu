import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.72)] px-3 py-1 text-xs font-semibold text-[hsl(var(--muted))]",
        className,
      )}
    >
      {children}
    </span>
  );
}
