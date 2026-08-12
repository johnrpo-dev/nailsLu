import { cn } from "@/shared/lib/cn";

/**
 * Logotipo tipografico de NAILS LU SPA.
 *
 * Reproduce la jerarquia del logo: el nombre en serif de alto contraste y
 * "SPA" debajo, mas pequeno y entre filetes. Cuando el PNG del logo este en
 * `public/`, este componente es el unico punto que hay que cambiar.
 */
export function BrandWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span className={cn("inline-grid justify-items-center leading-none", className)}>
      <span
        className={cn(
          "font-[family-name:var(--font-display)] font-semibold tracking-[0.14em]",
          size === "sm" ? "text-sm" : "text-lg",
        )}
      >
        NAILS LU
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 flex w-full items-center gap-2 text-[hsl(var(--muted))]",
          size === "sm" ? "text-[0.55rem]" : "text-[0.65rem]",
        )}
      >
        <span className="h-px flex-1 bg-current opacity-45" />
        <span className="font-[family-name:var(--font-display)] tracking-[0.32em]">SPA</span>
        <span className="h-px flex-1 bg-current opacity-45" />
      </span>
    </span>
  );
}
