"use client";

import { AlertCircle, Check, KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { changePassword } from "../services/account-api";
import { useAdminSession } from "./admin-session-provider";

const MINIMO = 10;

export function AccountManager() {
  const { user, usingDefaultPassword, markPasswordChanged } = useAdminSession();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [tocado, setTocado] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const { showToast } = useToast();

  const problemas: string[] = [];
  if (nueva && nueva.length < MINIMO) problemas.push(`Debe tener al menos ${MINIMO} caracteres.`);
  if (repetida && nueva !== repetida) problemas.push("Las dos contraseñas no coinciden.");
  const listo = actual && nueva.length >= MINIMO && nueva === repetida;

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTocado(true);
    setError("");
    if (!listo) return;

    setGuardando(true);
    try {
      await changePassword(actual, nueva);
      markPasswordChanged();
      setActual("");
      setNueva("");
      setRepetida("");
      setTocado(false);
      showToast({
        title: "Contraseña actualizada",
        description: "Úsala la próxima vez que entres al panel.",
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "No pudimos cambiar la contraseña.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-black tracking-tight">Tu cuenta</h1>
      <p className="mt-1 text-sm text-[hsl(var(--muted))]">
        Entras como <strong className="text-[hsl(var(--foreground))]">{user?.email}</strong>
      </p>

      {usingDefaultPassword ? (
        <div className="mt-5 grid gap-2 rounded-3xl border border-[hsl(var(--danger)/0.4)] bg-[hsl(var(--danger)/0.08)] p-5">
          <p className="flex items-start gap-2 font-bold">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[hsl(var(--danger))]" />
            Estás usando la contraseña de ejemplo
          </p>
          <p className="max-w-prose text-sm leading-6 text-[hsl(var(--muted))]">
            Viene en el código del proyecto, que es público: cualquiera que lo lea puede entrar a este
            panel y ver los datos de tus clientas. Cámbiala ahora.
          </p>
        </div>
      ) : null}

      <form className="mt-5 grid max-w-md gap-4 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] p-5" noValidate onSubmit={enviar}>
        <h2 className="text-lg font-black tracking-tight">Cambiar contraseña</h2>

        <label className="grid gap-2 text-sm font-bold text-[hsl(var(--muted))]" htmlFor="actual">
          Contraseña actual
          <input
            autoComplete="current-password"
            className={campo}
            id="actual"
            onChange={(e) => setActual(e.target.value)}
            type="password"
            value={actual}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[hsl(var(--muted))]" htmlFor="nueva">
          Contraseña nueva
          <input
            autoComplete="new-password"
            className={campo}
            id="nueva"
            onChange={(e) => setNueva(e.target.value)}
            type="password"
            value={nueva}
          />
          <span className="text-xs font-normal">
            Mínimo {MINIMO} caracteres. Una frase que recuerdes es más segura que una palabra con
            símbolos.
          </span>
        </label>

        <label className="grid gap-2 text-sm font-bold text-[hsl(var(--muted))]" htmlFor="repetida">
          Repite la nueva
          <input
            autoComplete="new-password"
            className={campo}
            id="repetida"
            onChange={(e) => setRepetida(e.target.value)}
            type="password"
            value={repetida}
          />
        </label>

        {tocado && problemas.length ? (
          <ul className="grid gap-1" role="alert">
            {problemas.map((p) => (
              <li className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--danger))]" key={p}>
                <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p className="flex items-start gap-2 rounded-2xl bg-[hsl(var(--danger)/0.08)] p-3 text-sm font-semibold text-[hsl(var(--danger))]" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <Button disabled={guardando} size="lg" type="submit">
          {guardando ? <Check aria-hidden="true" className="size-4" /> : <KeyRound aria-hidden="true" className="size-4" />}
          {guardando ? "Guardando..." : "Cambiar contraseña"}
        </Button>
      </form>
    </section>
  );
}

const campo = cn(
  "focus-ring w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.58)]",
  "px-4 py-3 text-base font-normal text-[hsl(var(--foreground))]",
);
