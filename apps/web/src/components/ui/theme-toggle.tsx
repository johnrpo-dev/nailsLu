"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "./theme-provider";

/**
 * Ambos iconos se renderizan siempre y el CSS decide cual se ve segun
 * `data-theme`. Elegir el icono en JS provocaba un desajuste de hidratacion,
 * porque el servidor no sabe que tema fijo el script previo al primer paint.
 */
export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <Button aria-label="Cambiar tema" onClick={toggleTheme} size="icon" type="button" variant="secondary">
      <Moon aria-hidden="true" className="theme-icon-light size-4" />
      <Sun aria-hidden="true" className="theme-icon-dark size-4" />
    </Button>
  );
}
