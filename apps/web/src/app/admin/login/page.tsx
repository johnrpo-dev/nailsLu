"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/features/admin-auth/components/admin-session-provider";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";

export default function AdminLoginPage() {
  const { login } = useAdminSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/admin/bookings");
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 401
          ? "Correo o contraseña incorrectos."
          : caught instanceof ApiError
            ? caught.message
            : "No pudimos iniciar sesión.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form
        className="glass-panel grid w-[min(400px,100%)] gap-5 rounded-[2rem] p-6"
        noValidate
        onSubmit={submit}
      >
        <div>
          <p className="text-xs font-bold uppercase text-[hsl(var(--muted))]">NAILS LU SPA</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Panel de administración</h1>
        </div>

        <label className="grid gap-2 text-sm font-bold text-[hsl(var(--muted))]" htmlFor="email">
          Correo
          <input
            autoComplete="username"
            className={inputClass}
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@spa.local"
            type="email"
            value={email}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[hsl(var(--muted))]" htmlFor="password">
          Contraseña
          <input
            autoComplete="current-password"
            className={inputClass}
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <p
            className="flex items-start gap-2 rounded-2xl bg-[hsl(var(--danger)/0.08)] p-3 text-sm font-semibold text-[hsl(var(--danger))]"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <Button disabled={submitting || !email || !password} size="lg" type="submit">
          <LogIn aria-hidden="true" className="size-4" />
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </main>
  );
}

const inputClass = cn(
  "focus-ring w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.58)]",
  "px-4 py-3 text-[hsl(var(--foreground))]",
);
